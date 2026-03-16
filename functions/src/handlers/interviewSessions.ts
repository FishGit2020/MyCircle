import { onRequest } from 'firebase-functions/v2/https';
import type { Request, Response } from 'express';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken } from './shared.js';

const db = getFirestore();
const bucket = getStorage().bucket();

interface SessionPayload {
  sessionId: string;
  question: string;
  document: string;
  messages: Array<{ id: string; role: string; content: string; timestamp: number }>;
  sessionName?: string;
  interviewState?: Record<string, unknown>;
  scores?: Array<Record<string, unknown>>;
  config?: Record<string, unknown>;
}

interface BankQuestion {
  id: string;
  chapter: string;
  chapterSlug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  tags: string[];
}

interface QuestionBankData {
  chapters: string[];
  questions: BankQuestion[];
}

// In-memory cache for question bank
let questionBankCache: { data: string; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const interviewSessions = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    if (checkRateLimit(clientIp, 30, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const path = req.path.replace(/^\/interview-api\/?/, '').replace(/^\/+/, '');

    if (path === 'question-bank' && req.method === 'GET') {
      await handleQuestionBank(res);
      return;
    }

    if (path === 'questions' && req.method === 'GET') {
      await handleQuestionBank(res);
    } else if (path === 'questions' && req.method === 'POST') {
      await handleCreateQuestion(req, res);
    } else if (path.startsWith('questions/') && req.method === 'PUT') {
      const questionId = path.replace('questions/', '');
      await handleUpdateQuestion(questionId, req, res);
    } else if (path.startsWith('questions/') && req.method === 'DELETE') {
      const questionId = path.replace('questions/', '');
      await handleDeleteQuestion(questionId, res);
    } else if (path === 'save' && req.method === 'POST') {
      await handleSave(uid, req, res);
    } else if (path === 'sessions' && req.method === 'GET') {
      await handleList(uid, res);
    } else if (path.startsWith('load/') && req.method === 'GET') {
      const sessionId = path.replace('load/', '');
      await handleLoad(uid, sessionId, res);
    } else if (path.startsWith('delete/') && req.method === 'DELETE') {
      const sessionId = path.replace('delete/', '');
      await handleDelete(uid, sessionId, res);
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  },
);

async function handleQuestionBank(res: Response) {
  try {
    const now = Date.now();
    if (questionBankCache && now - questionBankCache.fetchedAt < CACHE_TTL_MS) {
      res.set('Content-Type', 'application/json');
      res.send(questionBankCache.data);
      return;
    }

    const file = bucket.file('question-bank/questions.json');
    const [exists] = await file.exists();
    if (!exists) {
      res.status(404).json({ error: 'Question bank not found' });
      return;
    }

    const [contents] = await file.download();
    const data = contents.toString('utf-8');
    questionBankCache = { data, fetchedAt: now };
    res.set('Content-Type', 'application/json');
    res.send(data);
  } catch {
    res.status(500).json({ error: 'Failed to load question bank' });
  }
}

async function loadQuestionBankFromStorage(): Promise<QuestionBankData> {
  const file = bucket.file('question-bank/questions.json');
  const [contents] = await file.download();
  return JSON.parse(contents.toString('utf-8')) as QuestionBankData;
}

async function saveQuestionBankToStorage(data: QuestionBankData): Promise<void> {
  const file = bucket.file('question-bank/questions.json');
  await file.save(Buffer.from(JSON.stringify(data, null, 2), 'utf-8'), {
    contentType: 'application/json',
  });
  // Invalidate cache so next GET fetches fresh data
  questionBankCache = null;
}

async function handleCreateQuestion(req: Request, res: Response) {
  try {
    const body = req.body as Partial<BankQuestion>;
    if (!body.chapter || !body.chapterSlug || !body.difficulty || !body.title || !body.description) {
      res.status(400).json({ error: 'Missing required fields: chapter, chapterSlug, difficulty, title, description' });
      return;
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(body.difficulty)) {
      res.status(400).json({ error: 'Invalid difficulty. Must be easy, medium, or hard' });
      return;
    }

    const bankData = await loadQuestionBankFromStorage();
    const newQuestion: BankQuestion = {
      id: `${body.chapterSlug}-${body.difficulty}-${Date.now()}`,
      chapter: body.chapter,
      chapterSlug: body.chapterSlug,
      difficulty: body.difficulty,
      title: body.title,
      description: body.description,
      tags: body.tags ?? [],
    };

    bankData.questions.push(newQuestion);

    // Add chapter to chapters list if not present
    if (!bankData.chapters.includes(newQuestion.chapter)) {
      bankData.chapters.push(newQuestion.chapter);
    }

    await saveQuestionBankToStorage(bankData);
    res.json({ question: newQuestion });
  } catch {
    res.status(500).json({ error: 'Failed to create question' });
  }
}

async function handleUpdateQuestion(questionId: string, req: Request, res: Response) {
  try {
    if (!questionId) {
      res.status(400).json({ error: 'Question ID required' });
      return;
    }

    const updates = req.body as Partial<BankQuestion>;
    const bankData = await loadQuestionBankFromStorage();
    const index = bankData.questions.findIndex((q) => q.id === questionId);

    if (index === -1) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // Merge updates
    const existing = bankData.questions[index];
    const updated: BankQuestion = {
      ...existing,
      ...(updates.chapter !== undefined ? { chapter: updates.chapter } : {}),
      ...(updates.chapterSlug !== undefined ? { chapterSlug: updates.chapterSlug } : {}),
      ...(updates.difficulty !== undefined ? { difficulty: updates.difficulty } : {}),
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
    };

    if (updated.difficulty && !['easy', 'medium', 'hard'].includes(updated.difficulty)) {
      res.status(400).json({ error: 'Invalid difficulty. Must be easy, medium, or hard' });
      return;
    }

    bankData.questions[index] = updated;
    await saveQuestionBankToStorage(bankData);
    res.json({ question: updated });
  } catch {
    res.status(500).json({ error: 'Failed to update question' });
  }
}

async function handleDeleteQuestion(questionId: string, res: Response) {
  try {
    if (!questionId) {
      res.status(400).json({ error: 'Question ID required' });
      return;
    }

    const bankData = await loadQuestionBankFromStorage();
    const before = bankData.questions.length;
    bankData.questions = bankData.questions.filter((q) => q.id !== questionId);

    if (bankData.questions.length === before) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    await saveQuestionBankToStorage(bankData);
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete question' });
  }
}

async function handleSave(uid: string, req: Request, res: Response) {
  const body = req.body as SessionPayload;
  if (!body.sessionId || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request: sessionId and messages required' });
    return;
  }

  const { sessionId, question, document, messages, sessionName, interviewState, scores, config } = body;
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

  const file = bucket.file(storagePath);
  await file.save(Buffer.from(sessionData, 'utf-8'), {
    contentType: 'application/json',
    metadata: { metadata: { uid } },
  });

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

  res.json({ ok: true, sessionId });
}

async function handleList(uid: string, res: Response) {
  const snap = await db
    .collection('users')
    .doc(uid)
    .collection('interviewSessions')
    .orderBy('updatedAt', 'desc')
    .limit(20)
    .get();

  const sessions = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      questionPreview: data.questionPreview || '',
      messageCount: data.messageCount || 0,
      updatedAt: data.updatedAt?.toMillis() || null,
      createdAt: data.createdAt?.toMillis() || null,
    };
  });

  res.json({ sessions });
}

async function handleLoad(uid: string, sessionId: string, res: Response) {
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const storagePath = `users/${uid}/interview-sessions/${sessionId}.json`;
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  const [contents] = await file.download();
  const session = JSON.parse(contents.toString('utf-8'));
  res.json({ session: { id: sessionId, ...session } });
}

async function handleDelete(uid: string, sessionId: string, res: Response) {
  if (!sessionId) {
    res.status(400).json({ error: 'Session ID required' });
    return;
  }

  const storagePath = `users/${uid}/interview-sessions/${sessionId}.json`;
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (exists) {
    await file.delete();
  }

  await db
    .collection('users')
    .doc(uid)
    .collection('interviewSessions')
    .doc(sessionId)
    .delete();

  res.json({ ok: true });
}
