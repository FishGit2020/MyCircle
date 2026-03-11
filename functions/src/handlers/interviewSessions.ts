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
}

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

    if (path === 'save' && req.method === 'POST') {
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

async function handleSave(uid: string, req: Request, res: Response) {
  const body = req.body as SessionPayload;
  if (!body.sessionId || !Array.isArray(body.messages)) {
    res.status(400).json({ error: 'Invalid request: sessionId and messages required' });
    return;
  }

  const { sessionId, question, document, messages } = body;
  const storagePath = `users/${uid}/interview-sessions/${sessionId}.json`;
  const now = new Date().toISOString();

  const sessionData = JSON.stringify({
    question: question || '',
    document: document || '',
    messages,
    createdAt: now,
    updatedAt: now,
  });

  const file = bucket.file(storagePath);
  await file.save(Buffer.from(sessionData, 'utf-8'), {
    contentType: 'application/json',
    metadata: { metadata: { uid } },
  });

  const questionPreview = (question || '').slice(0, 100);
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
