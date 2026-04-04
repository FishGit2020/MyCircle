import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';

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
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            provider: data.provider ?? '',
            dateOfService: data.dateOfService ?? '',
            amountCents: data.amountCents ?? 0,
            category: data.category ?? 'OTHER',
            description: data.description ?? null,
            status: data.status ?? 'PENDING',
            receiptUrl: data.receiptUrl ?? null,
            receiptContentType: data.receiptContentType ?? null,
            createdAt: toIso(data.createdAt),
            updatedAt: toIso(data.updatedAt),
          };
        });
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
          receiptUrl: null,
          receiptStoragePath: null,
          receiptContentType: null,
          createdAt: now,
          updatedAt: now,
        };
        await docRef.set(docData);
        return {
          id: docRef.id,
          ...docData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
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
        return {
          id,
          provider: updated.provider ?? '',
          dateOfService: updated.dateOfService ?? '',
          amountCents: updated.amountCents ?? 0,
          category: updated.category ?? 'OTHER',
          description: updated.description ?? null,
          status: updated.status ?? 'PENDING',
          receiptUrl: updated.receiptUrl ?? null,
          receiptContentType: updated.receiptContentType ?? null,
          createdAt: toIso(updated.createdAt),
          updatedAt: toIso(updated.updatedAt),
        };
      },
      deleteHsaExpense: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const docRef = db.doc(`users/${uid}/hsaExpenses/${id}`);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new GraphQLError('Expense not found', { extensions: { code: 'NOT_FOUND' } });
        }
        // Delete receipt from Storage if exists
        const data = doc.data()!;
        if (data.receiptStoragePath) {
          try {
            const bucket = getStorage().bucket();
            await bucket.file(data.receiptStoragePath).delete();
          } catch {
            // Receipt may already be deleted, continue
          }
        }
        await docRef.delete();
        return true;
      },
      markHsaExpenseReimbursed: async (_: any, { id, reimbursed }: { id: string; reimbursed: boolean }, context: ResolverContext) => {
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
        return {
          id,
          provider: updated.provider ?? '',
          dateOfService: updated.dateOfService ?? '',
          amountCents: updated.amountCents ?? 0,
          category: updated.category ?? 'OTHER',
          description: updated.description ?? null,
          status: updated.status ?? 'PENDING',
          receiptUrl: updated.receiptUrl ?? null,
          receiptContentType: updated.receiptContentType ?? null,
          createdAt: toIso(updated.createdAt),
          updatedAt: toIso(updated.updatedAt),
        };
      },
    },
  };
}
