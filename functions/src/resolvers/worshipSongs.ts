import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { GraphQLError } from 'graphql';

const COLLECTION = 'worshipSongs';

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

function toTimestampString(val: any): string {
  if (!val) return new Date().toISOString();
  if (typeof val.toMillis === 'function') return new Date(val.toMillis()).toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function docToSong(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title ?? '',
    artist: data.artist ?? '',
    originalKey: data.originalKey ?? '',
    format: data.format ?? 'text',
    content: data.content ?? '',
    notes: data.notes ?? '',
    youtubeUrl: data.youtubeUrl ?? null,
    bpm: data.bpm ?? null,
    tags: data.tags ?? null,
    createdAt: toTimestampString(data.createdAt),
    updatedAt: toTimestampString(data.updatedAt),
    createdBy: data.createdBy ?? null,
  };
}

export function createWorshipSongResolvers() {
  return {
    Query: {
      worshipSongs: async () => {
        const db = getFirestore();
        const snap = await db
          .collection(COLLECTION)
          .where('isDeleted', '!=', true)
          .orderBy('isDeleted')
          .orderBy('createdAt', 'desc')
          .get();
        return snap.docs.map(d => docToSong(d.id, d.data()));
      },

      worshipSong: async (_: any, { id }: { id: string }) => {
        const db = getFirestore();
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (!doc.exists || doc.data()?.isDeleted) return null;
        return docToSong(doc.id, doc.data()!);
      },
    },

    Mutation: {
      addWorshipSong: async (_: any, { input }: { input: Record<string, any> }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const now = FieldValue.serverTimestamp();
        const ref = await db.collection(COLLECTION).add({
          ...input,
          createdBy: uid,
          createdAt: now,
          updatedAt: now,
        });
        const doc = await ref.get();
        return docToSong(ref.id, doc.data()!);
      },

      updateWorshipSong: async (_: any, { id, input }: { id: string; input: Record<string, any> }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(COLLECTION).doc(id);
        // Explicit null → delete field from Firestore
        const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
        for (const [key, value] of Object.entries(input)) {
          updates[key] = value === null ? FieldValue.delete() : value;
        }
        await ref.update(updates);
        const doc = await ref.get();
        return docToSong(doc.id, doc.data()!);
      },

      deleteWorshipSong: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        await db.collection(COLLECTION).doc(id).update({
          isDeleted: true,
          deletedAt: FieldValue.serverTimestamp(),
        });
        return true;
      },
    },
  };
}
