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

// ─── Text Extraction ────────────────────────────────────────────────

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as string) as {
    getDocument: (src: { data: Uint8Array }) => { promise: Promise<{
      numPages: number;
      getPage: (n: number) => Promise<{
        getTextContent: () => Promise<{ items: Array<{ str: string }> }>;
      }>;
    }> };
  };
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(' '));
  }
  return pages.join('\n');
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

function extractText(buffer: Buffer, contentType: string): Promise<string> {
  if (contentType === 'application/pdf') return extractTextFromPdf(buffer);
  if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      contentType === 'application/msword') return extractTextFromDocx(buffer);
  // Plain text / markdown / JSON — direct UTF-8
  return Promise.resolve(buffer.toString('utf-8'));
}

// ─── Chunking ───────────────────────────────────────────────────────

function chunkText(content: string, maxChunkSize = 1500, overlap = 100): string[] {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
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

// ─── SQL helpers ────────────────────────────────────────────────────

async function ensureKnowledgeTables(client: { query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[]; rowCount: number }> }): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS knowledge_sources (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      title TEXT NOT NULL,
      source_url TEXT,
      chunk_count INTEGER NOT NULL,
      embed_model TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await client.query(`
    CREATE TABLE IF NOT EXISTS knowledge_chunks (
      id TEXT PRIMARY KEY,
      uid TEXT NOT NULL,
      source_id TEXT NOT NULL REFERENCES knowledge_sources(id),
      text TEXT NOT NULL,
      source_title TEXT NOT NULL,
      source_url TEXT,
      embedding JSONB NOT NULL,
      embed_model TEXT NOT NULL
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_kc_uid ON knowledge_chunks(uid)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_ks_uid ON knowledge_sources(uid)`);
}

async function readKnowledgeFromSql(uid: string): Promise<KnowledgeChunk[]> {
  const { getCachedSqlConfig, createSqlClient } = await import('../sqlClient.js');
  const config = await getCachedSqlConfig(uid);
  if (!config) return [];
  const client = createSqlClient(config);
  try {
    const { rows } = await client.query(
      `SELECT id, text, source_id, source_title, source_url, embedding, embed_model FROM knowledge_chunks WHERE uid = $1`,
      [uid],
    );
    return (rows as Array<{ id: string; text: string; source_id: string; source_title: string; source_url: string | null; embedding: number[]; embed_model: string }>).map(r => ({
      id: r.id,
      text: r.text,
      sourceId: r.source_id,
      sourceTitle: r.source_title,
      sourceUrl: r.source_url,
      embedding: typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding,
      embedModel: r.embed_model,
    }));
  } catch {
    return [];
  }
}

// Read chunks from Storage first, fall back to SQL
async function readAllChunks(uid: string): Promise<KnowledgeChunk[]> {
  const storageChunks = await readKnowledgeBase(uid);
  if (storageChunks.length > 0) return storageChunks;
  return readKnowledgeFromSql(uid);
}

// ─── Shared ingest logic ────────────────────────────────────────────

async function ingestContent(
  uid: string,
  title: string,
  content: string,
  sourceUrl: string | null,
  endpointId: string | undefined,
  embedModel: string,
): Promise<{ sourceId: string; title: string; chunkCount: number }> {
  if (!title.trim()) throw new GraphQLError('Title is required', { extensions: { code: 'BAD_USER_INPUT' } });
  if (title.length > 200) throw new GraphQLError('Title must be 200 characters or less', { extensions: { code: 'BAD_USER_INPUT' } });
  if (!content.trim() || content.trim().length < 50) throw new GraphQLError('Content must be at least 50 characters', { extensions: { code: 'BAD_USER_INPUT' } });
  if (!embedModel.trim()) throw new GraphQLError('Embedding model is required', { extensions: { code: 'BAD_USER_INPUT' } });

  const endpoint = await getUserOllamaEndpoint(uid, endpointId);
  if (!endpoint) throw new GraphQLError('No AI endpoint configured. Please add an Ollama endpoint in Settings.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });

  const textChunks = chunkText(content);
  const embeddings: number[][] = [];
  for (const chunk of textChunks) {
    embeddings.push(await embedText(endpoint, embedModel, chunk));
  }

  const db = getFirestore();
  const sourceRef = db.collection('users').doc(uid).collection('knowledgeMeta').doc();
  const sourceId = sourceRef.id;

  const newChunks: KnowledgeChunk[] = textChunks.map((text, i) => ({
    id: `${sourceId}-${i}`,
    text,
    sourceId,
    sourceTitle: title.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    embedding: embeddings[i],
    embedModel,
  }));

  const existingChunks = await readKnowledgeBase(uid);
  await writeKnowledgeBase(uid, [...existingChunks, ...newChunks]);

  await sourceRef.set({
    title: title.trim(),
    sourceUrl: sourceUrl?.trim() || null,
    chunkCount: newChunks.length,
    embedModel,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { sourceId, title: title.trim(), chunkCount: newChunks.length };
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
        throw new GraphQLError('Question cannot be empty', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const endpoint = await getUserOllamaEndpoint(uid, endpointId || undefined);
      if (!endpoint) {
        throw new GraphQLError('No AI endpoint configured. Please add an Ollama endpoint in Settings.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      // Read from Storage first, fall back to SQL
      const chunks = await readAllChunks(uid);
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
    // 1. Ingest plain text
    ingestKnowledgeDoc: async (
      _: unknown,
      { title, content, sourceUrl, endpointId, embedModel }: {
        title: string; content: string; sourceUrl?: string | null;
        endpointId?: string | null; embedModel: string;
      },
      context: ResolverContext,
    ) => {
      const uid = requireAuth(context);
      return ingestContent(uid, title, content, sourceUrl ?? null, endpointId || undefined, embedModel);
    },

    // 2. Ingest uploaded file (PDF/DOCX/TXT via base64)
    ingestKnowledgeFile: async (
      _: unknown,
      { fileName, fileBase64, contentType, endpointId, embedModel }: {
        fileName: string; fileBase64: string; contentType: string;
        endpointId?: string | null; embedModel: string;
      },
      context: ResolverContext,
    ) => {
      const uid = requireAuth(context);

      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        throw new GraphQLError('File must be under 5MB', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const content = await extractText(buffer, contentType);
      const title = fileName.replace(/\.[^.]+$/, ''); // strip extension for title
      return ingestContent(uid, title, content, null, endpointId || undefined, embedModel);
    },

    // 3. Ingest from Cloud Files
    ingestCloudFile: async (
      _: unknown,
      { fileId, endpointId, embedModel }: { fileId: string; endpointId?: string | null; embedModel: string },
      context: ResolverContext,
    ) => {
      const uid = requireAuth(context);
      const db = getFirestore();

      // Fetch file metadata from Firestore
      const fileDoc = await db.collection('users').doc(uid).collection('files').doc(fileId).get();
      if (!fileDoc.exists) throw new GraphQLError('File not found', { extensions: { code: 'NOT_FOUND' } });

      const fileData = fileDoc.data()!;
      const storagePath = fileData.storagePath as string;
      const fileName = fileData.fileName as string;
      const contentType = fileData.contentType as string;

      // Download from Storage
      const bucket = getStorage().bucket();
      const storageFile = bucket.file(storagePath);
      const [exists] = await storageFile.exists();
      if (!exists) throw new GraphQLError('File not found in storage', { extensions: { code: 'NOT_FOUND' } });

      const [buffer] = await storageFile.download();
      if (buffer.length > 10 * 1024 * 1024) {
        throw new GraphQLError('File must be under 10MB for knowledge base ingestion', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const content = await extractText(buffer, contentType);
      const title = fileName.replace(/\.[^.]+$/, '');
      return ingestContent(uid, title, content, null, endpointId || undefined, embedModel);
    },

    // 4. Dump knowledge base to SQL (copy for analytics, keep Storage)
    dumpKnowledgeToSql: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const { getCachedSqlConfig, createSqlClient } = await import('../sqlClient.js');

      const config = await getCachedSqlConfig(uid);
      if (!config) throw new GraphQLError('SQL connection not configured. Set up SQL Analytics first.', { extensions: { code: 'BAD_USER_INPUT' } });
      const client = createSqlClient(config);

      await ensureKnowledgeTables(client);

      // Read sources from Firestore
      const db = getFirestore();
      const sourcesSnap = await db.collection('users').doc(uid).collection('knowledgeMeta').get();
      for (const doc of sourcesSnap.docs) {
        const d = doc.data();
        await client.query(
          `INSERT INTO knowledge_sources (id, uid, title, source_url, chunk_count, embed_model, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [doc.id, uid, d.title, d.sourceUrl || null, d.chunkCount, d.embedModel, toTimestampString(d.createdAt)],
        );
      }

      // Read chunks from Storage and insert
      const chunks = await readKnowledgeBase(uid);
      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO knowledge_chunks (id, uid, source_id, text, source_title, source_url, embedding, embed_model)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
          [chunk.id, uid, chunk.sourceId, chunk.text, chunk.sourceTitle, chunk.sourceUrl, JSON.stringify(chunk.embedding), chunk.embedModel],
        );
      }

      return true;
    },

    // 5. Offload knowledge base to SQL (move to SQL, delete from Storage)
    offloadKnowledgeToSql: async (_: unknown, __: unknown, context: ResolverContext) => {
      const uid = requireAuth(context);
      const { getCachedSqlConfig, createSqlClient } = await import('../sqlClient.js');

      const config = await getCachedSqlConfig(uid);
      if (!config) throw new GraphQLError('SQL connection not configured. Set up SQL Analytics first.', { extensions: { code: 'BAD_USER_INPUT' } });
      const client = createSqlClient(config);

      await ensureKnowledgeTables(client);

      // Read sources from Firestore
      const db = getFirestore();
      const sourcesSnap = await db.collection('users').doc(uid).collection('knowledgeMeta').get();
      for (const doc of sourcesSnap.docs) {
        const d = doc.data();
        await client.query(
          `INSERT INTO knowledge_sources (id, uid, title, source_url, chunk_count, embed_model, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
          [doc.id, uid, d.title, d.sourceUrl || null, d.chunkCount, d.embedModel, toTimestampString(d.createdAt)],
        );
      }

      // Read chunks from Storage and insert to SQL
      const chunks = await readKnowledgeBase(uid);
      for (const chunk of chunks) {
        await client.query(
          `INSERT INTO knowledge_chunks (id, uid, source_id, text, source_title, source_url, embedding, embed_model)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING`,
          [chunk.id, uid, chunk.sourceId, chunk.text, chunk.sourceTitle, chunk.sourceUrl, JSON.stringify(chunk.embedding), chunk.embedModel],
        );
      }

      // Delete Storage file to free space
      if (chunks.length > 0) {
        const bucket = getStorage().bucket();
        const file = bucket.file(KB_PATH(uid));
        const [exists] = await file.exists();
        if (exists) await file.delete();
      }

      return true;
    },
  };
}
