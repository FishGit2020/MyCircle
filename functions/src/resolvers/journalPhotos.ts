import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';

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

export function createJournalPhotoResolvers() {
  return {
    Query: {
      journalPhotos: async (
        _: unknown,
        { childId, limit }: { childId?: string | null; limit?: number | null },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const cap = Math.min(limit ?? 200, 500);
        let query = db
          .collection(`users/${uid}/journalPhotos`)
          .orderBy('photoDate', 'desc')
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
            photoUrl: d.photoUrl,
            storagePath: d.storagePath,
            caption: d.caption ?? null,
            stageLabel: d.stageLabel ?? null,
            photoDate: d.photoDate,
            createdAt: toTimestampString(d.createdAt),
          };
        });
      },
    },
    Mutation: {
      addJournalPhoto: async (
        _: unknown,
        {
          input,
        }: {
          input: {
            childId?: string | null;
            photoUrl: string;
            storagePath: string;
            caption?: string | null;
            stageLabel?: string | null;
            photoDate: string;
          };
        },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        // Use the UUID from storagePath as the doc ID when possible
        const pathParts = input.storagePath.split('/');
        const fileBase = pathParts[pathParts.length - 1].replace(/\.[^.]+$/, '');
        const id = fileBase || db.collection(`users/${uid}/journalPhotos`).doc().id;
        const now = FieldValue.serverTimestamp();
        const data = {
          childId: input.childId ?? null,
          photoUrl: input.photoUrl,
          storagePath: input.storagePath,
          caption: input.caption ?? null,
          stageLabel: input.stageLabel ?? null,
          photoDate: input.photoDate,
          createdAt: now,
        };
        await db.collection(`users/${uid}/journalPhotos`).doc(id).set(data);
        return {
          id,
          childId: data.childId,
          photoUrl: data.photoUrl,
          storagePath: data.storagePath,
          caption: data.caption,
          stageLabel: data.stageLabel,
          photoDate: data.photoDate,
          createdAt: new Date().toISOString(),
        };
      },

      deleteJournalPhoto: async (
        _: unknown,
        { id }: { id: string },
        context: ResolverContext,
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(`users/${uid}/journalPhotos`).doc(id);
        const snap = await ref.get();
        if (!snap.exists) return false;
        const storagePath = snap.data()?.storagePath as string | undefined;
        // Delete Cloud Storage file
        if (storagePath) {
          const bucket = getStorage().bucket();
          try {
            await bucket.file(storagePath).delete();
          } catch (e: unknown) {
            if ((e as { code?: number }).code !== 404) throw e;
          }
        }
        await ref.delete();
        return true;
      },
    },
  };
}
