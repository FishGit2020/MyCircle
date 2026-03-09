import { onRequest } from 'firebase-functions/v2/https';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Request, Response } from 'express';
import { ALLOWED_ORIGINS } from './shared.js';

const STORAGE_PATH = 'worship-songs.json';

async function getAllSongsFromFirestore(): Promise<Record<string, unknown>[]> {
  const db = getFirestore();
  const snap = await db.collection('worshipSongs').orderBy('createdAt', 'desc').get();
  return snap.docs
    .filter(d => !d.data().isDeleted)
    .map(d => {
      const data = d.data();
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      const serialize = (v: unknown): unknown => {
        if (v && typeof v === 'object' && 'toMillis' in v) {
          return new Date((v as { toMillis(): number }).toMillis()).toISOString();
        }
        return v;
      };
      return Object.fromEntries(
        Object.entries({ id: d.id, ...data }).map(([k, v]) => [k, serialize(v)]),
      );
    });
}

async function regenerateStorageJson(): Promise<void> {
  const songs = await getAllSongsFromFirestore();
  const bucket = getStorage().bucket();
  const json = JSON.stringify({ songs, generatedAt: new Date().toISOString() });
  await bucket.file(STORAGE_PATH).save(Buffer.from(json, 'utf-8'), {
    metadata: {
      contentType: 'application/json',
      cacheControl: 'public, max-age=300',
    },
  });
  logger.info(`worship-songs.json regenerated (${songs.length} songs)`);
}

/** HTTP endpoint — serves worship songs from Storage JSON (falls back to Firestore) */
export const worshipSongsApi = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    if (req.method !== 'GET') {
      res.status(405).end();
      return;
    }

    const path = req.path.replace(/^\/worship-songs-api\/?/, '').replace(/^\/+/, '');

    if (path === 'list') {
      try {
        const bucket = getStorage().bucket();
        const file = bucket.file(STORAGE_PATH);
        const [exists] = await file.exists();
        if (exists) {
          const [content] = await file.download();
          const data = JSON.parse(content.toString('utf-8'));
          res.set('Content-Type', 'application/json');
          res.set('Cache-Control', 'public, max-age=300');
          res.json(data.songs || []);
          return;
        }
      } catch (err) {
        logger.warn('Failed to read worship-songs.json from Storage, falling back to Firestore:', err);
      }

      // Fallback: read directly from Firestore and also regenerate Storage JSON
      try {
        const songs = await getAllSongsFromFirestore();
        regenerateStorageJson().catch(e => logger.error('Background JSON regen failed:', e));
        res.json(songs);
      } catch (err) {
        logger.error('Failed to fetch worship songs from Firestore:', err);
        res.status(500).json({ error: 'Failed to fetch worship songs' });
      }
      return;
    }

    res.status(404).end();
  },
);

/** Firestore trigger — regenerates Storage JSON whenever a worship song is written */
export const syncWorshipSongsToStorage = onDocumentWritten(
  {
    document: 'worshipSongs/{songId}',
    region: 'us-central1',
  },
  async () => {
    try {
      await regenerateStorageJson();
    } catch (err) {
      logger.error('Failed to sync worship songs to Storage:', err);
    }
  },
);
