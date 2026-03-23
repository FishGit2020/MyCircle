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

export function createInfantAchievementResolvers() {
  return {
    Query: {
      infantAchievements: async (
        _: unknown,
        { childId }: { childId: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`users/${uid}/milestoneAchievements`)
          .where('childId', '==', childId)
          .get();
        return snap.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            childId: d.childId,
            milestoneId: d.milestoneId,
            achievedDate: d.achievedDate,
            note: d.note ?? null,
            createdAt: toTimestampString(d.createdAt),
            updatedAt: toTimestampString(d.updatedAt),
          };
        });
      },
    },
    Mutation: {
      addInfantAchievement: async (
        _: unknown,
        {
          input,
        }: {
          input: {
            childId: string;
            milestoneId: string;
            achievedDate: string;
            note?: string | null;
          };
        },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const collection = db.collection(`users/${uid}/milestoneAchievements`);
        // Upsert: check for existing record with same (childId, milestoneId)
        const existing = await collection
          .where('childId', '==', input.childId)
          .where('milestoneId', '==', input.milestoneId)
          .limit(1)
          .get();
        const nowStr = new Date().toISOString();
        if (!existing.empty) {
          const existingDoc = existing.docs[0];
          const updates = {
            achievedDate: input.achievedDate,
            note: input.note ?? null,
            updatedAt: FieldValue.serverTimestamp(),
          };
          await existingDoc.ref.update(updates);
          const updated = (await existingDoc.ref.get()).data()!;
          return {
            id: existingDoc.id,
            childId: updated.childId,
            milestoneId: updated.milestoneId,
            achievedDate: updated.achievedDate,
            note: updated.note ?? null,
            createdAt: toTimestampString(updated.createdAt),
            updatedAt: nowStr,
          };
        }
        // Create new
        const id = randomUUID();
        const now = FieldValue.serverTimestamp();
        const data = {
          childId: input.childId,
          milestoneId: input.milestoneId,
          achievedDate: input.achievedDate,
          note: input.note ?? null,
          createdAt: now,
          updatedAt: now,
        };
        await collection.doc(id).set(data);
        return {
          id,
          childId: data.childId,
          milestoneId: data.milestoneId,
          achievedDate: data.achievedDate,
          note: data.note,
          createdAt: nowStr,
          updatedAt: nowStr,
        };
      },

      updateInfantAchievement: async (
        _: unknown,
        {
          id,
          input,
        }: { id: string; input: { achievedDate?: string | null; note?: string | null } },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(`users/${uid}/milestoneAchievements`).doc(id);
        const snap = await ref.get();
        if (!snap.exists) {
          throw new GraphQLError('InfantAchievement not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (input.achievedDate !== undefined && input.achievedDate !== null) {
          updates.achievedDate = input.achievedDate;
        }
        if (input.note !== undefined) updates.note = input.note ?? null;
        await ref.update(updates);
        const updated = (await ref.get()).data()!;
        return {
          id,
          childId: updated.childId,
          milestoneId: updated.milestoneId,
          achievedDate: updated.achievedDate,
          note: updated.note ?? null,
          createdAt: toTimestampString(updated.createdAt),
          updatedAt: new Date().toISOString(),
        };
      },

      deleteInfantAchievement: async (
        _: unknown,
        { id }: { id: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(`users/${uid}/milestoneAchievements`).doc(id);
        const snap = await ref.get();
        if (!snap.exists) return false;
        await ref.delete();
        return true;
      },
    },
  };
}
