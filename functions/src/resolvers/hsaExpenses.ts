import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';
import { uploadToStorage } from '../handlers/shared.js';

interface ResolverContext {
  uid: string | null;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.uid;
}

function toIso(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toMillis === 'function') return new Date(val.toMillis()).toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function toIsoOrNull(val: any): string | null {
  if (!val) return null;
  if (typeof val.toMillis === 'function') return new Date(val.toMillis()).toISOString();
  if (typeof val === 'string') return val;
  return null;
}

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'application/pdf'];
const MAX_BYTES = 5 * 1024 * 1024;

interface ReceiptDoc {
  storagePath: string;
  url: string;
  contentType: string;
  fileName: string;
  uploadedAt: Timestamp | string;
  trashedAt: Timestamp | string | null;
}

function formatReceiptDoc(id: string, data: ReceiptDoc) {
  return {
    id,
    url: data.url,
    contentType: data.contentType,
    fileName: data.fileName,
    uploadedAt: toIso(data.uploadedAt),
    trashedAt: toIsoOrNull(data.trashedAt),
  };
}

/**
 * Lazy-migrate a legacy single receipt stored on the expense doc into the receipts subcollection.
 */
async function migrateLegacyReceipt(
  uid: string,
  expenseId: string,
  expenseData: Record<string, any>,
): Promise<void> {
  if (!expenseData.receiptUrl) return;
  const db = getFirestore();
  const receiptsRef = db.collection(`users/${uid}/hsaExpenses/${expenseId}/receipts`);
  const existing = await receiptsRef.limit(1).get();
  if (!existing.empty) return; // Already migrated

  const newDoc = receiptsRef.doc();
  await newDoc.set({
    storagePath: expenseData.receiptStoragePath ?? '',
    url: expenseData.receiptUrl,
    contentType: expenseData.receiptContentType ?? 'application/octet-stream',
    fileName: 'receipt',
    uploadedAt: expenseData.updatedAt ?? FieldValue.serverTimestamp(),
    trashedAt: null,
  });

  // Clear legacy fields from expense doc
  await db.doc(`users/${uid}/hsaExpenses/${expenseId}`).update({
    receiptUrl: FieldValue.delete(),
    receiptStoragePath: FieldValue.delete(),
    receiptContentType: FieldValue.delete(),
  });
}

async function getReceiptsForExpense(uid: string, expenseId: string, expenseData: Record<string, any>) {
  await migrateLegacyReceipt(uid, expenseId, expenseData);
  const db = getFirestore();
  const snap = await db
    .collection(`users/${uid}/hsaExpenses/${expenseId}/receipts`)
    .orderBy('uploadedAt', 'asc')
    .get();
  return snap.docs.map(d => formatReceiptDoc(d.id, d.data() as ReceiptDoc));
}

function formatExpense(id: string, data: Record<string, any>, receipts: ReturnType<typeof formatReceiptDoc>[]) {
  return {
    id,
    provider: data.provider ?? '',
    dateOfService: data.dateOfService ?? '',
    amountCents: data.amountCents ?? 0,
    category: data.category ?? 'OTHER',
    description: data.description ?? null,
    status: data.status ?? 'PENDING',
    receipts,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function createHsaExpenseResolvers() {
  return {
    Query: {
      hsaExpenses: async (_: any, __: any, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`users/${uid}/hsaExpenses`)
          .orderBy('dateOfService', 'desc')
          .get();

        return Promise.all(
          snap.docs.map(async d => {
            const data = d.data();
            const receipts = await getReceiptsForExpense(uid, d.id, data);
            return formatExpense(d.id, data, receipts);
          }),
        );
      },
    },
    Mutation: {
      addHsaExpense: async (_: any, { input }: { input: any }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const now = FieldValue.serverTimestamp();
        const docRef = db.collection(`users/${uid}/hsaExpenses`).doc();
        const docData = {
          provider: input.provider,
          dateOfService: input.dateOfService,
          amountCents: input.amountCents,
          category: input.category,
          description: input.description ?? null,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        };
        await docRef.set(docData);
        return formatExpense(
          docRef.id,
          { ...docData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          [],
        );
      },

      updateHsaExpense: async (_: any, { id, input }: { id: string; input: any }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const docRef = db.doc(`users/${uid}/hsaExpenses/${id}`);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new GraphQLError('Expense not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
        if (input.provider !== undefined) updates.provider = input.provider;
        if (input.dateOfService !== undefined) updates.dateOfService = input.dateOfService;
        if (input.amountCents !== undefined) updates.amountCents = input.amountCents;
        if (input.category !== undefined) updates.category = input.category;
        if (input.description !== undefined) updates.description = input.description;
        await docRef.update(updates);
        const updated = (await docRef.get()).data()!;
        const receipts = await getReceiptsForExpense(uid, id, updated);
        return formatExpense(id, updated, receipts);
      },

      deleteHsaExpense: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const docRef = db.doc(`users/${uid}/hsaExpenses/${id}`);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new GraphQLError('Expense not found', { extensions: { code: 'NOT_FOUND' } });
        }

        const bucket = getStorage().bucket();

        // Delete all receipts (active + trashed) from Storage and subcollection
        const receiptsSnap = await db.collection(`users/${uid}/hsaExpenses/${id}/receipts`).get();
        await Promise.all(
          receiptsSnap.docs.map(async receiptDoc => {
            const data = receiptDoc.data() as ReceiptDoc;
            if (data.storagePath) {
              try {
                await bucket.file(data.storagePath).delete();
              } catch {
                // May already be deleted
              }
            }
            await receiptDoc.ref.delete();
          }),
        );

        // Handle legacy receipt field still on expense doc (race between migration and delete)
        const expenseData = doc.data()!;
        if (expenseData.receiptStoragePath) {
          try {
            await bucket.file(expenseData.receiptStoragePath).delete();
          } catch {
            // May already be deleted
          }
        }

        await docRef.delete();
        return true;
      },

      markHsaExpenseReimbursed: async (
        _: any,
        { id, reimbursed }: { id: string; reimbursed: boolean },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const docRef = db.doc(`users/${uid}/hsaExpenses/${id}`);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new GraphQLError('Expense not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const newStatus = reimbursed ? 'REIMBURSED' : 'PENDING';
        await docRef.update({ status: newStatus, updatedAt: FieldValue.serverTimestamp() });
        const updated = (await docRef.get()).data()!;
        const receipts = await getReceiptsForExpense(uid, id, updated);
        return formatExpense(id, updated, receipts);
      },

      uploadHsaReceipt: async (
        _: any,
        {
          expenseId,
          fileBase64,
          fileName,
          contentType,
        }: { expenseId: string; fileBase64: string; fileName: string; contentType: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);

        if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
          throw new GraphQLError('Invalid file type', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        const db = getFirestore();
        const expenseRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}`);
        const expenseDoc = await expenseRef.get();
        if (!expenseDoc.exists) {
          throw new GraphQLError('Expense not found', { extensions: { code: 'NOT_FOUND' } });
        }

        const buffer = Buffer.from(fileBase64, 'base64');
        if (buffer.byteLength > MAX_BYTES) {
          throw new GraphQLError('File too large (max 5 MB)', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        const receiptDocRef = db.collection(`users/${uid}/hsaExpenses/${expenseId}/receipts`).doc();
        const ext = fileName.includes('.') ? fileName.split('.').pop()! : 'bin';
        const storagePath = `users/${uid}/hsa-receipts/${expenseId}/${receiptDocRef.id}.${ext}`;

        const bucket = getStorage().bucket();
        const { downloadUrl: url } = await uploadToStorage(bucket, storagePath, buffer, contentType);

        await receiptDocRef.set({
          storagePath,
          url,
          contentType,
          fileName,
          uploadedAt: FieldValue.serverTimestamp(),
          trashedAt: null,
        });

        await expenseRef.update({ updatedAt: FieldValue.serverTimestamp() });

        return {
          id: receiptDocRef.id,
          url,
          contentType,
          fileName,
          uploadedAt: new Date().toISOString(),
          trashedAt: null,
        };
      },

      trashHsaReceipt: async (
        _: any,
        { expenseId, receiptId }: { expenseId: string; receiptId: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const receiptRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}/receipts/${receiptId}`);
        const receiptDoc = await receiptRef.get();
        if (!receiptDoc.exists) {
          throw new GraphQLError('Receipt not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await receiptRef.update({ trashedAt: FieldValue.serverTimestamp() });
        const updated = (await receiptRef.get()).data() as ReceiptDoc;
        return formatReceiptDoc(receiptId, updated);
      },

      restoreHsaReceipt: async (
        _: any,
        { expenseId, receiptId }: { expenseId: string; receiptId: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const receiptRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}/receipts/${receiptId}`);
        const receiptDoc = await receiptRef.get();
        if (!receiptDoc.exists) {
          throw new GraphQLError('Receipt not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await receiptRef.update({ trashedAt: null });
        const updated = (await receiptRef.get()).data() as ReceiptDoc;
        return formatReceiptDoc(receiptId, updated);
      },

      permanentlyDeleteHsaReceipt: async (
        _: any,
        { expenseId, receiptId }: { expenseId: string; receiptId: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const receiptRef = db.doc(`users/${uid}/hsaExpenses/${expenseId}/receipts/${receiptId}`);
        const receiptDoc = await receiptRef.get();
        if (!receiptDoc.exists) {
          throw new GraphQLError('Receipt not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const data = receiptDoc.data() as ReceiptDoc;
        if (data.storagePath) {
          try {
            await getStorage().bucket().file(data.storagePath).delete();
          } catch {
            // May already be deleted
          }
        }
        await receiptRef.delete();
        return true;
      },
    },
  };
}
