import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';

interface ResolverContext {
  uid: string | null;
}

interface BankQuestion {
  id: string;
  chapter: string;
  chapterSlug: string;
  difficulty: string;
  title: string;
  description: string;
  tags: string[];
}

interface QuestionBankData {
  chapters: string[];
  questions: BankQuestion[];
}

// In-memory cache for question bank
let questionBankCache: { data: QuestionBankData; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

async function loadQuestionBankFromStorage(): Promise<QuestionBankData> {
  const bucket = getStorage().bucket();
  const file = bucket.file('question-bank/questions.json');
  const [contents] = await file.download();
  return JSON.parse(contents.toString('utf-8')) as QuestionBankData;
}

async function saveQuestionBankToStorage(data: QuestionBankData): Promise<void> {
  const bucket = getStorage().bucket();
  const file = bucket.file('question-bank/questions.json');
  await file.save(Buffer.from(JSON.stringify(data, null, 2), 'utf-8'), {
    contentType: 'application/json',
  });
  questionBankCache = null;
}

export function createInterviewSessionResolvers() {
  return {
    Query: {
      questionBank: async () => {
        const now = Date.now();
        if (questionBankCache && now - questionBankCache.fetchedAt < CACHE_TTL_MS) {
          return questionBankCache.data;
        }

        const bucket = getStorage().bucket();
        const file = bucket.file('question-bank/questions.json');
        const [exists] = await file.exists();
        if (!exists) {
          return { chapters: [], questions: [] };
        }

        const [contents] = await file.download();
        const data = JSON.parse(contents.toString('utf-8')) as QuestionBankData;
        questionBankCache = { data, fetchedAt: now };
        return data;
      },

      interviewSessions: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection('users')
          .doc(uid)
          .collection('interviewSessions')
          .orderBy('updatedAt', 'desc')
          .limit(20)
          .get();

        return snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            questionPreview: data.questionPreview || '',
            messageCount: data.messageCount || 0,
            mode: data.mode || null,
            updatedAt: data.updatedAt?.toMillis()
              ? new Date(data.updatedAt.toMillis()).toISOString()
              : null,
            createdAt: data.createdAt?.toMillis()
              ? new Date(data.createdAt.toMillis()).toISOString()
              : null,
          };
        });
      },

      interviewSession: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const storagePath = `users/${uid}/interview-sessions/${id}.json`;
        const bucket = getStorage().bucket();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (!exists) return null;

        const [contents] = await file.download();
        const session = JSON.parse(contents.toString('utf-8'));
        return {
          id,
          question: session.question || '',
          document: session.document || '',
          messages: session.messages || [],
          sessionName: session.sessionName || null,
          interviewState: session.interviewState || null,
          scores: session.scores || null,
          config: session.config || null,
          createdAt: session.createdAt || new Date().toISOString(),
          updatedAt: session.updatedAt || new Date().toISOString(),
        };
      },
    },

    Mutation: {
      createInterviewQuestion: async (
        _: unknown,
        { input }: { input: Omit<BankQuestion, 'id'> },
        context: ResolverContext,
      ) => {
        requireAuth(context);

        const validDifficulties = ['easy', 'medium', 'hard'];
        if (!validDifficulties.includes(input.difficulty)) {
          throw new GraphQLError('Invalid difficulty. Must be easy, medium, or hard', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        const bankData = await loadQuestionBankFromStorage();
        const newQuestion: BankQuestion = {
          id: `${input.chapterSlug}-${input.difficulty}-${Date.now()}`,
          chapter: input.chapter,
          chapterSlug: input.chapterSlug,
          difficulty: input.difficulty,
          title: input.title,
          description: input.description,
          tags: input.tags ?? [],
        };

        bankData.questions.push(newQuestion);
        if (!bankData.chapters.includes(newQuestion.chapter)) {
          bankData.chapters.push(newQuestion.chapter);
        }

        await saveQuestionBankToStorage(bankData);
        return newQuestion;
      },

      updateInterviewQuestion: async (
        _: unknown,
        { id, input }: { id: string; input: Partial<BankQuestion> },
        context: ResolverContext,
      ) => {
        requireAuth(context);

        const bankData = await loadQuestionBankFromStorage();
        const index = bankData.questions.findIndex((q) => q.id === id);
        if (index === -1) {
          throw new GraphQLError('Question not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        const existing = bankData.questions[index];
        const updated: BankQuestion = {
          ...existing,
          ...(input.chapter !== undefined ? { chapter: input.chapter } : {}),
          ...(input.chapterSlug !== undefined ? { chapterSlug: input.chapterSlug } : {}),
          ...(input.difficulty !== undefined ? { difficulty: input.difficulty } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.description !== undefined ? { description: input.description } : {}),
          ...(input.tags !== undefined ? { tags: input.tags } : {}),
        };

        if (updated.difficulty && !['easy', 'medium', 'hard'].includes(updated.difficulty)) {
          throw new GraphQLError('Invalid difficulty. Must be easy, medium, or hard', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        bankData.questions[index] = updated;
        await saveQuestionBankToStorage(bankData);
        return updated;
      },

      deleteInterviewQuestion: async (
        _: unknown,
        { id }: { id: string },
        context: ResolverContext,
      ) => {
        requireAuth(context);

        const bankData = await loadQuestionBankFromStorage();
        const before = bankData.questions.length;
        bankData.questions = bankData.questions.filter((q) => q.id !== id);

        if (bankData.questions.length === before) {
          throw new GraphQLError('Question not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }

        await saveQuestionBankToStorage(bankData);
        return true;
      },

      saveInterviewSession: async (
        _: unknown,
        { input }: {
          input: {
            sessionId: string;
            question: string;
            document: string;
            messages: Array<{ id: string; role: string; content: string; timestamp: number }>;
            sessionName?: string;
            interviewState?: Record<string, unknown>;
            scores?: Array<Record<string, unknown>>;
            config?: Record<string, unknown>;
          };
        },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const { sessionId, question, document, messages, sessionName, interviewState, scores, config } = input;
        const storagePath = `users/${uid}/interview-sessions/${sessionId}.json`;
        const now = new Date().toISOString();

        const sessionData = JSON.stringify({
          question: question || '',
          document: document || '',
          messages,
          ...(interviewState ? { interviewState } : {}),
          ...(scores ? { scores } : {}),
          ...(config ? { config } : {}),
          createdAt: now,
          updatedAt: now,
        });

        const bucket = getStorage().bucket();
        const file = bucket.file(storagePath);
        await file.save(Buffer.from(sessionData, 'utf-8'), {
          contentType: 'application/json',
          metadata: { metadata: { uid } },
        });

        const db = getFirestore();
        const questionPreview = sessionName || (question || '').slice(0, 100);
        await db
          .collection('users')
          .doc(uid)
          .collection('interviewSessions')
          .doc(sessionId)
          .set(
            {
              questionPreview,
              messageCount: messages.length,
              storageRef: storagePath,
              mode: config?.mode || 'custom',
              updatedAt: FieldValue.serverTimestamp(),
              createdAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );

        return {
          id: sessionId,
          question: question || '',
          document: document || '',
          messages,
          sessionName: sessionName || null,
          interviewState: interviewState || null,
          scores: scores || null,
          config: config || null,
          createdAt: now,
          updatedAt: now,
        };
      },

      deleteInterviewSession: async (
        _: unknown,
        { id }: { id: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);

        const storagePath = `users/${uid}/interview-sessions/${id}.json`;
        const bucket = getStorage().bucket();
        const file = bucket.file(storagePath);
        const [exists] = await file.exists();
        if (exists) {
          await file.delete();
        }

        const db = getFirestore();
        await db
          .collection('users')
          .doc(uid)
          .collection('interviewSessions')
          .doc(id)
          .delete();

        return true;
      },
    },
  };
}
