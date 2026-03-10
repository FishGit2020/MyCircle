import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import type { Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken, uploadToStorage, getStorageDownloadUrl } from './shared.js';

const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const cloudFileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileBase64: z.string().min(1),
  contentType: z.string().min(1),
});

const cloudFileShareSchema = z.object({
  fileId: z.string().min(1),
});

const cloudFileDeleteSchema = z.object({
  fileId: z.string().min(1),
});

export const cloudFiles = onRequest(
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

    // Rate limit: 20 req/min per IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(clientIp, 20, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const path = req.path.replace(/^\/cloud-files\/?/, '').replace(/^\/+/, '');

    if (path === 'upload' && req.method === 'POST') {
      const parsed = cloudFileUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileName, fileBase64, contentType } = parsed.data;

      if (!ALLOWED_FILE_TYPES.has(contentType)) {
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'File too large (max 5MB)' });
        return;
      }

      try {
        const bucket = getStorage().bucket();
        const fileId = crypto.randomUUID();
        const filePath = `users/${uid}/files/${fileId}/${fileName}`;
        const { downloadUrl } = await uploadToStorage(bucket, filePath, buffer, contentType, {
          cacheControl: 'public, max-age=31536000',
        });

        const dbAdmin = getFirestore();
        await dbAdmin.doc(`users/${uid}/files/${fileId}`).set({
          fileName,
          contentType,
          size: buffer.length,
          downloadUrl,
          storagePath: filePath,
          isDeleted: false,
          uploadedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Cloud file uploaded', { uid, fileId, fileName });
        res.status(200).json({ fileId, downloadUrl });
      } catch (err: any) {
        logger.error('Cloud file upload error', { uid, error: err.message });
        res.status(500).json({ error: 'Upload failed' });
      }

    } else if (path === 'share' && req.method === 'POST') {
      const parsed = cloudFileShareSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const fileDoc = await dbAdmin.doc(`users/${uid}/files/${fileId}`).get();
        if (!fileDoc.exists) {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        const fileData = fileDoc.data()!;

        // Copy storage object to shared-files path
        const bucket = getStorage().bucket();
        const srcFile = bucket.file(fileData.storagePath);
        const destPath = `shared-files/${fileId}/${fileData.fileName}`;
        await srcFile.copy(bucket.file(destPath));
        const { downloadUrl: sharedDownloadUrl } = await getStorageDownloadUrl(bucket, destPath);

        // Get user display name
        const userRecord = await getAuth().getUser(uid);
        const displayName = userRecord.displayName || userRecord.email || 'Anonymous';

        await dbAdmin.doc(`sharedFiles/${fileId}`).set({
          fileName: fileData.fileName,
          contentType: fileData.contentType,
          size: fileData.size,
          downloadUrl: sharedDownloadUrl,
          storagePath: destPath,
          sharedBy: { uid, displayName },
          sharedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Cloud file shared', { uid, fileId });
        res.status(200).json({ ok: true, downloadUrl: sharedDownloadUrl });
      } catch (err: any) {
        logger.error('Cloud file share error', { uid, error: err.message });
        res.status(500).json({ error: 'Share failed' });
      }

    } else if (path === 'delete' && req.method === 'POST') {
      const parsed = cloudFileDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const fileDoc = await dbAdmin.doc(`users/${uid}/files/${fileId}`).get();
        if (!fileDoc.exists) {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        const fileData = fileDoc.data()!;

        const bucket = getStorage().bucket();
        try {
          await bucket.file(fileData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        await dbAdmin.doc(`users/${uid}/files/${fileId}`).delete();

        logger.info('Cloud file deleted', { uid, fileId });
        res.status(200).json({ ok: true });
      } catch (err: any) {
        logger.error('Cloud file delete error', { uid, error: err.message });
        res.status(500).json({ error: 'Delete failed' });
      }

    } else if (path === 'delete-shared' && req.method === 'POST') {
      const parsed = cloudFileDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const sharedDoc = await dbAdmin.doc(`sharedFiles/${fileId}`).get();
        if (!sharedDoc.exists) {
          res.status(404).json({ error: 'Shared file not found' });
          return;
        }
        const sharedData = sharedDoc.data()!;

        // Only the original sharer can delete
        if (sharedData.sharedBy?.uid !== uid) {
          res.status(403).json({ error: 'Only the original sharer can delete this file' });
          return;
        }

        const bucket = getStorage().bucket();
        try {
          await bucket.file(sharedData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        await dbAdmin.doc(`sharedFiles/${fileId}`).delete();

        logger.info('Shared file deleted', { uid, fileId });
        res.status(200).json({ ok: true });
      } catch (err: any) {
        logger.error('Shared file delete error', { uid, error: err.message });
        res.status(500).json({ error: 'Delete failed' });
      }

    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
);
