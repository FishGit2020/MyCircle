import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken, uploadToStorage } from './shared.js';

const babyPhotoUploadSchema = z.object({
  stageId: z.number().int().min(1).max(10),
  imageBase64: z.string().min(1),
  caption: z.string().max(500).optional(),
});

// ─── Baby Photos — Firebase Storage upload/delete via Cloud Function ───
export const babyPhotos = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    // Require auth
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 10 req/min per IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(clientIp, 10, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const path = req.path.replace(/^\/baby-photos\/?/, '').replace(/^\/+/, '');

    if (path === 'upload' && req.method === 'POST') {
      const parsed = babyPhotoUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { stageId, imageBase64, caption } = parsed.data;

      // Decode base64 to buffer
      const buffer = Buffer.from(imageBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Image too large (max 5MB)' });
        return;
      }

      try {
        const photoId = crypto.randomUUID();
        const bucket = getStorage().bucket();
        const filePath = `users/${uid}/baby-photos/${stageId}/${photoId}.jpg`;
        const { downloadUrl: photoUrl } = await uploadToStorage(bucket, filePath, buffer, 'image/jpeg', {
          cacheControl: 'public, max-age=31536000',
        });

        // Write metadata to Firestore subcollection
        const db = getFirestore();
        await db.doc(`users/${uid}/babyMilestones/${stageId}/photos/${photoId}`).set({
          photoUrl,
          caption: caption || null,
          uploadedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Baby photo uploaded', { uid, stageId, photoId });
        res.status(200).json({ photoUrl, photoId });
      } catch (err: any) {
        logger.error('Baby photo upload error', { uid, stageId, error: err.message });
        res.status(500).json({ error: 'Upload failed' });
      }

    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
);
