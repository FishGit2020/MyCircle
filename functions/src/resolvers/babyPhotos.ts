import { getFirestore } from 'firebase-admin/firestore';
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

export function createBabyPhotoResolvers() {
  return {
    Query: {
      babyPhotos: async (_: any, __: any, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db.collection(`users/${uid}/babyMilestones`).get();
        return snap.docs.map(d => ({
          stageId: Number(d.id),
          photoUrl: d.data().photoUrl ?? '',
          caption: d.data().caption ?? null,
          uploadedAt: toIso(d.data().uploadedAt),
        }));
      },
    },

    Mutation: {
      deleteBabyPhoto: async (_: any, { stageId }: { stageId: number }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Delete storage file
        const bucket = getStorage().bucket();
        try {
          await bucket.file(`users/${uid}/baby-photos/${stageId}.jpg`).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        // Delete Firestore doc
        await db.doc(`users/${uid}/babyMilestones/${stageId}`).delete();
        return true;
      },
    },
  };
}
