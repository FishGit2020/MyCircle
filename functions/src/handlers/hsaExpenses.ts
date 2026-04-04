import { onRequest } from 'firebase-functions/v2/https';
import type { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { z } from 'zod';
import { ALLOWED_ORIGINS, verifyAuthToken, uploadToStorage } from './shared.js';

const uploadSchema = z.object({
  expenseId: z.string().min(1),
  fileBase64: z.string().min(1),
  fileName: z.string().min(1),
  contentType: z.enum(['image/jpeg', 'image/png', 'application/pdf']),
});

const deleteReceiptSchema = z.object({
  expenseId: z.string().min(1),
});

export const hsaExpenses = onRequest(
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

    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const path = req.path.replace(/^\/hsa-expenses/, '');

    if (path === '/upload-receipt') {
      const parsed = uploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
        return;
      }
      const { expenseId, fileBase64, fileName, contentType } = parsed.data;

      // Verify expense exists and belongs to user
      const db = getFirestore();
      const expenseRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}`);
      const expenseDoc = await expenseRef.get();
      if (!expenseDoc.exists) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(413).json({ error: 'File too large (max 5MB)' });
        return;
      }

      const bucket = getStorage().bucket();
      const storagePath = `users/${uid}/hsa-receipts/${expenseId}/${fileName}`;
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, buffer, contentType);

      await expenseRef.update({
        receiptUrl: downloadUrl,
        receiptStoragePath: storagePath,
        receiptContentType: contentType,
      });

      res.status(200).json({ receiptUrl: downloadUrl, receiptContentType: contentType });
    } else if (path === '/delete-receipt') {
      const parsed = deleteReceiptSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid input', details: parsed.error.issues });
        return;
      }
      const { expenseId } = parsed.data;

      const db = getFirestore();
      const expenseRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}`);
      const expenseDoc = await expenseRef.get();
      if (!expenseDoc.exists) {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }

      const data = expenseDoc.data()!;
      if (data.receiptStoragePath) {
        try {
          const bucket = getStorage().bucket();
          await bucket.file(data.receiptStoragePath).delete();
        } catch {
          // File may already be deleted
        }
      }

      await expenseRef.update({
        receiptUrl: null,
        receiptStoragePath: null,
        receiptContentType: null,
      });

      res.status(200).json({ ok: true });
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
);
