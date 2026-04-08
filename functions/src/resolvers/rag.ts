import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';
import { getUserOllamaEndpoint } from '../aiChatHelpers.js';
import type { OllamaEndpoint } from '../aiChatHelpers.js';

interface ResolverContext {
  uid: string | null;
}

interface KnowledgeChunk {
  id: string;
  text: string;
  sourceId: string;
  sourceTitle: string;
  sourceUrl: string | null;
  embedding: number[];
  embedModel: string;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

function toTimestampString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'object' && val !== null && 'toMillis' in val) {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

// ─── Chunking ───────────────────────────────────────────────────────

function chunkText(content: string, maxChunkSize = 1500, overlap = 100): string[] {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    // If a single paragraph exceeds max, split at sentence boundaries
    if (para.length > maxChunkSize) {
      if (current.trim()) {
        chunks.push(current.trim());
        current = '';
      }
      const sentences = para.match(/[^.!?]+[.!?]+\s*/g) || [para];
      let sentenceBuffer = '';
      for (const sentence of sentences) {
        if (sentenceBuffer.length + sentence.length > maxChunkSize && sentenceBuffer.trim()) {
          chunks.push(sentenceBuffer.trim());
          // Overlap: take the last `overlap` chars
          sentenceBuffer = sentenceBuffer.slice(-overlap) + sentence;
        } else {
          sentenceBuffer += sentence;
        }
      }
      if (sentenceBuffer.trim()) {
        current = sentenceBuffer;
      }
      continue;
    }

    const candidate = current ? current + '\n\n' + para : para;
    if (candidate.length > maxChunkSize && current.trim()) {
      chunks.push(current.trim());
      // Overlap: take the last `overlap` chars from previous chunk
      const overlapText = current.slice(-overlap);
      current = overlapText + '\n\n' + para;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks.length > 0 ? chunks : [content.trim()];
}

// ─── Embedding ──────────────────────────────────────────────────────

async function embedText(endpoint: OllamaEndpoint, model: string, text: string): Promise<number[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (endpoint.cfAccessClientId) headers['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
  if (endpoint.cfAccessClientSecret) headers['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;

  const response = await fetch(`${endpoint.url}/api/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, prompt: text }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new GraphQLError(`Embedding request failed: ${response.status} ${errorText}`, {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  const data = await response.json() as { embedding: number[] };
  if (!data.embedding || !Array.isArray(data.embedding)) {
    throw new GraphQLError('Invalid embedding response from endpoint', {
      extensions: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  return data.embedding;
}

// ─── Similarity ─────────────────────────────────────────────────────

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

// ─── Storage helpers ────────────────────────────────────────────────

const KB_PATH = (uid: string) => `users/${uid}/knowledge-base.json`;

async function readKnowledgeBase(uid: string): Promise<KnowledgeChunk[]> {
  const bucket = getStorage().bucket();
  const file = bucket.file(KB_PATH(uid));
  const [exists] = await file.exists();
  if (!exists) return [];

  const [buffer] = await file.download();
  try {
    const parsed = JSON.parse(buffer.toString('utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeKnowledgeBase(uid: string, chunks: KnowledgeChunk[]): Promise<void> {
  const bucket = getStorage().bucket();
  const file = bucket.file(KB_PATH(uid));
  const data = JSON.stringify(chunks);
  await file.save(Buffer.from(data, 'utf-8'), {
    contentType: 'application/json',
    metadata: { cacheControl: 'no-cache' },
  });
}

// ─── Query Resolvers ────────────────────────────────────────────────

export function createRagQueryResolvers() {
  return {
    knowledgeSources: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const db = getFirestore();
      const snap = await db.collection('users').doc(uid).collection('knowledgeMeta')
        .orderBy('createdAt', 'desc').get();

      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.title,
          sourceUrl: d.sourceUrl || null,
          chunkCount: d.chunkCount,
          embedModel: d.embedModel,
          createdAt: toTimestampString(d.createdAt),
        };
      });
    },

    ragSearch: async (
      _: unknown,
      { question, endpointId, embedModel, topK }: { question: string; endpointId?: string | null; embedModel: string; topK?: number | null },
      context: ResolverContext,
    ) => {
      const uid = requireAuth(context);
      const k = topK && topK > 0 ? topK : 5;

      if (!question.trim()) {
        throw new GraphQLError('Question cannot be empty', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const endpoint = await getUserOllamaEndpoint(uid, endpointId || undefined);
      if (!endpoint) {
        throw new GraphQLError('No AI endpoint configured. Please add an Ollama endpoint in Settings.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      const chunks = await readKnowledgeBase(uid);
      if (chunks.length === 0) return [];

      const questionEmbedding = await embedText(endpoint, embedModel, question);

      const scored = chunks.map(chunk => ({
        id: chunk.id,
        text: chunk.text,
        sourceTitle: chunk.sourceTitle,
        sourceUrl: chunk.sourceUrl,
        score: dotProduct(questionEmbedding, chunk.embedding),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, k);
    },
  };
}

// ─── Mutation Resolvers ─────────────────────────────────────────────

export function createRagMutationResolvers() {
  return {
    ingestKnowledgeDoc: async (
      _: unknown,
      { title, content, sourceUrl, endpointId, embedModel }: {
        title: string;
        content: string;
        sourceUrl?: string | null;
        endpointId?: string | null;
        embedModel: string;
      },
      context: ResolverContext,
    ) => {
      const uid = requireAuth(context);

      // Validate input
      if (!title.trim()) {
        throw new GraphQLError('Title is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (title.length > 200) {
        throw new GraphQLError('Title must be 200 characters or less', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!content.trim() || content.trim().length < 50) {
        throw new GraphQLError('Content must be at least 50 characters', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!embedModel.trim()) {
        throw new GraphQLError('Embedding model is required', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const endpoint = await getUserOllamaEndpoint(uid, endpointId || undefined);
      if (!endpoint) {
        throw new GraphQLError('No AI endpoint configured. Please add an Ollama endpoint in Settings.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      // Chunk the text
      const textChunks = chunkText(content);

      // Embed all chunks
      const embeddings: number[][] = [];
      for (const chunk of textChunks) {
        const embedding = await embedText(endpoint, embedModel, chunk);
        embeddings.push(embedding);
      }

      // Generate a source ID
      const db = getFirestore();
      const sourceRef = db.collection('users').doc(uid).collection('knowledgeMeta').doc();
      const sourceId = sourceRef.id;

      // Build chunk objects
      const newChunks: KnowledgeChunk[] = textChunks.map((text, i) => ({
        id: `${sourceId}-${i}`,
        text,
        sourceId,
        sourceTitle: title.trim(),
        sourceUrl: sourceUrl?.trim() || null,
        embedding: embeddings[i],
        embedModel,
      }));

      // Read existing chunks and append atomically
      const existingChunks = await readKnowledgeBase(uid);
      const allChunks = [...existingChunks, ...newChunks];
      await writeKnowledgeBase(uid, allChunks);

      // Write metadata to Firestore
      await sourceRef.set({
        title: title.trim(),
        sourceUrl: sourceUrl?.trim() || null,
        chunkCount: newChunks.length,
        embedModel,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        sourceId,
        title: title.trim(),
        chunkCount: newChunks.length,
      };
    },
  };
}
