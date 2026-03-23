import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';

interface ResolverContext {
  uid: string | null;
}

function requireAuth(context: ResolverContext): string {
  if (!context.uid) {
    throw new GraphQLError('Not authenticated', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  return context.uid;
}

function toTimestampString(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof val === 'string') return val;
  if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  return String(val);
}

export function createMilestoneEventResolvers() {
  return {
    Query: {
      milestoneEvents: async (
        _: unknown,
        { childId, limit }: { childId?: string | null; limit?: number | null },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const cap = Math.min(limit ?? 200, 500);
        let query = db
          .collection(`users/${uid}/milestoneEvents`)
          .orderBy('eventDate', 'desc')
          .limit(cap);
        if (childId !== undefined && childId !== null) {
          query = query.where('childId', '==', childId) as typeof query;
        }
        const snap = await query.get();
        return snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            childId: d.childId ?? null,
            title: d.title,
            eventDate: d.eventDate,
            note: d.note ?? null,
            createdAt: toTimestampString(d.createdAt),
            updatedAt: toTimestampString(d.updatedAt),
          };
        });
      },
    },
    Mutation: {
      addMilestoneEvent: async (
        _: unknown,
        { input }: { input: { childId?: string | null; title: string; eventDate: string; note?: string | null } },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        if (!input.title?.trim()) {
          throw new GraphQLError('title is required', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        if (!input.eventDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.eventDate)) {
          throw new GraphQLError('eventDate must be a valid ISO date (YYYY-MM-DD)', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        const db = getFirestore();
        const id = randomUUID();
        const now = FieldValue.serverTimestamp();
        const data = {
          childId: input.childId ?? null,
          title: input.title.trim(),
          eventDate: input.eventDate,
          note: input.note ?? null,
          createdAt: now,
          updatedAt: now,
        };
        await db.collection(`users/${uid}/milestoneEvents`).doc(id).set(data);
        const nowStr = new Date().toISOString();
        return {
          id,
          childId: data.childId,
          title: data.title,
          eventDate: data.eventDate,
          note: data.note,
          createdAt: nowStr,
          updatedAt: nowStr,
        };
      },

      updateMilestoneEvent: async (
        _: unknown,
        {
          id,
          input,
        }: { id: string; input: { title?: string | null; eventDate?: string | null; note?: string | null } },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(`users/${uid}/milestoneEvents`).doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          throw new GraphQLError('Milestone event not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (input.title !== undefined && input.title !== null) updates.title = input.title.trim();
        if (input.eventDate !== undefined && input.eventDate !== null) updates.eventDate = input.eventDate;
        if (input.note !== undefined) updates.note = input.note ?? null;
        await ref.update(updates);
        const updated = (await ref.get()).data()!;
        return {
          id,
          childId: updated.childId ?? null,
          title: updated.title,
          eventDate: updated.eventDate,
          note: updated.note ?? null,
          createdAt: toTimestampString(updated.createdAt),
          updatedAt: toTimestampString(updated.updatedAt),
        };
      },

      deleteMilestoneEvent: async (
        _: unknown,
        { id }: { id: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(`users/${uid}/milestoneEvents`).doc(id);
        const snap = await ref.get();
        if (!snap.exists) return false;
        await ref.delete();
        return true;
      },
    },
  };
}
