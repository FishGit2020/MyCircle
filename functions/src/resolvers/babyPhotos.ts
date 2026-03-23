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
        const milestonesSnap = await db.collection(`users/${uid}/babyMilestones`).get();

        const allPhotos: any[] = [];
        for (const milestoneDoc of milestonesSnap.docs) {
          const stageId = Number(milestoneDoc.id);
          const data = milestoneDoc.data();

          // Legacy single-photo format: parent doc has photoUrl directly
          if (data.photoUrl && typeof data.photoUrl === 'string') {
            allPhotos.push({
              stageId,
              photoId: 'legacy',
              photoUrl: data.photoUrl,
              caption: data.caption ?? null,
              uploadedAt: toIso(data.uploadedAt),
            });
          }

          // New multi-photo format: photos subcollection
          const photosSnap = await milestoneDoc.ref.collection('photos').orderBy('uploadedAt', 'asc').get();
          for (const photoDoc of photosSnap.docs) {
            allPhotos.push({
              stageId,
              photoId: photoDoc.id,
              photoUrl: photoDoc.data().photoUrl ?? '',
              caption: photoDoc.data().caption ?? null,
              uploadedAt: toIso(photoDoc.data().uploadedAt),
            });
          }
        }

        return allPhotos;
      },

      babyMilestoneNotes: async (_: any, __: any, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db.collection(`users/${uid}/babyMilestones`).get();
        return snap.docs
          .filter(d => d.data().notes != null)
          .map(d => ({
            stageId: Number(d.id),
            notes: d.data().notes ?? null,
          }));
      },
    },

    Mutation: {
      deleteBabyPhoto: async (_: any, { stageId, photoId }: { stageId: number; photoId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const bucket = getStorage().bucket();

        if (photoId === 'legacy') {
          // Delete old-format single photo from parent doc + storage
          try {
            await bucket.file(`users/${uid}/baby-photos/${stageId}.jpg`).delete();
          } catch (e: any) {
            if (e.code !== 404) throw e;
          }
          await db.doc(`users/${uid}/babyMilestones/${stageId}`).update({
            photoUrl: null,
            caption: null,
            uploadedAt: null,
          });
        } else {
          // Delete new-format photo from subcollection + storage
          try {
            await bucket.file(`users/${uid}/baby-photos/${stageId}/${photoId}.jpg`).delete();
          } catch (e: any) {
            if (e.code !== 404) throw e;
          }
          await db.doc(`users/${uid}/babyMilestones/${stageId}/photos/${photoId}`).delete();
        }

        return true;
      },

      saveBabyMilestoneNotes: async (_: any, { stageId, notes }: { stageId: number; notes: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        await db.doc(`users/${uid}/babyMilestones/${stageId}`).set(
          { notes: notes.trim() || null },
          { merge: true }
        );
        return true;
      },
    },
  };
}
