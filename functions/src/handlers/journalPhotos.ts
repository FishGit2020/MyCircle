import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getStorage } from 'firebase-admin/storage';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken, uploadToStorage } from './shared.js';

const journalPhotoUploadSchema = z.object({
  imageBase64: z.string().min(1),
  childId: z.string().nullable().optional(),
  caption: z.string().max(200).nullable().optional(),
  photoDate: z.string().nullable().optional(),
});

// ─── Journal Photo Upload — Firebase Storage upload via Cloud Function ───
export const journalPhotoUpload = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Require auth
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 20 req/min per IP
    const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || 'unknown';
    if (checkRateLimit(clientIp, 20, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const parsed = journalPhotoUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
      return;
    }

    const { imageBase64, childId, caption, photoDate } = parsed.data;

    const buffer = Buffer.from(imageBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(413).json({ error: 'Image too large (max 5MB)' });
      return;
    }

    try {
      const photoId = randomUUID();
      const storagePath = `users/${uid}/journal-photos/${photoId}.jpg`;
      const bucket = getStorage().bucket();
      const { downloadUrl: photoUrl } = await uploadToStorage(bucket, storagePath, buffer, 'image/jpeg', {
        cacheControl: 'public, max-age=31536000',
      });

      // Determine photoDate: user-provided or current date
      const resolvedPhotoDate =
        photoDate && /^\d{4}-\d{2}-\d{2}/.test(photoDate)
          ? photoDate.substring(0, 10)
          : new Date().toISOString().substring(0, 10);

      logger.info('Journal photo uploaded', { uid, photoId, childId: childId ?? null });
      res.status(200).json({
        photoUrl,
        storagePath,
        photoId,
        photoDate: resolvedPhotoDate,
        caption: caption ?? null,
        childId: childId ?? null,
      });
    } catch (err: unknown) {
      logger.error('Journal photo upload error', { uid, error: (err as Error).message });
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);
