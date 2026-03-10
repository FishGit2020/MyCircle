import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
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

function storagePath(songId: string): string {
  return `worship-songs/${songId}/content.txt`;
}

async function writeContentToStorage(songId: string, content: string): Promise<void> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath(songId));
  await file.save(content, { contentType: 'text/plain; charset=utf-8' });
}

async function readContentFromStorage(songId: string): Promise<string> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath(songId));
  const [contents] = await file.download();
  return contents.toString('utf-8');
}

async function deleteContentFromStorage(songId: string): Promise<void> {
  const bucket = getStorage().bucket();
  const file = bucket.file(storagePath(songId));
  try {
    await file.delete();
  } catch {
    // File may not exist (pre-migration song) — ignore
  }
}

/** Resolve content: from Storage if migrated, otherwise inline from Firestore */
async function resolveContent(id: string, data: FirebaseFirestore.DocumentData): Promise<string> {
  if (data.storagePath) {
    try {
      return await readContentFromStorage(id);
    } catch {
      return data.content ?? '';
    }
  }
  return data.content ?? '';
}

function docToSong(id: string, data: FirebaseFirestore.DocumentData, content: string) {
  return {
    id,
    title: data.title ?? '',
    artist: data.artist ?? '',
    originalKey: data.originalKey ?? '',
    format: data.format ?? 'text',
    content,
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
        const songs = await Promise.all(
          snap.docs.map(async (d) => {
            const data = d.data();
            const content = await resolveContent(d.id, data);
            return docToSong(d.id, data, content);
          })
        );
        return songs;
      },

      worshipSong: async (_: any, { id }: { id: string }) => {
        const db = getFirestore();
        const doc = await db.collection(COLLECTION).doc(id).get();
        if (!doc.exists || doc.data()?.isDeleted) return null;
        const data = doc.data()!;
        const content = await resolveContent(id, data);
        return docToSong(doc.id, data, content);
      },
    },

    Mutation: {
      addWorshipSong: async (_: any, { input }: { input: Record<string, any> }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const now = FieldValue.serverTimestamp();
        const content = input.content ?? '';
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...rest } = input;
        const ref = await db.collection(COLLECTION).add({
          ...rest,
          storagePath: true,
          createdBy: uid,
          createdAt: now,
          updatedAt: now,
        });
        await writeContentToStorage(ref.id, content);
        const doc = await ref.get();
        return docToSong(ref.id, doc.data()!, content);
      },

      updateWorshipSong: async (_: any, { id, input }: { id: string; input: Record<string, any> }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const ref = db.collection(COLLECTION).doc(id);
        const contentUpdated = 'content' in input;
        const newContent = input.content;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { content: _content, ...rest } = input;
        const updates: Record<string, any> = { updatedAt: FieldValue.serverTimestamp() };
        for (const [key, value] of Object.entries(rest)) {
          updates[key] = value === null ? FieldValue.delete() : value;
        }
        if (contentUpdated && newContent !== null && newContent !== undefined) {
          await writeContentToStorage(id, newContent);
          updates.storagePath = true;
          // Remove inline content from Firestore (migration cleanup)
          updates.content = FieldValue.delete();
        }
        await ref.update(updates);
        const doc = await ref.get();
        const data = doc.data()!;
        const resolvedContent = contentUpdated ? newContent : await resolveContent(id, data);
        return docToSong(doc.id, data, resolvedContent);
      },

      deleteWorshipSong: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        await db.collection(COLLECTION).doc(id).update({
          isDeleted: true,
          deletedAt: FieldValue.serverTimestamp(),
        });
        await deleteContentFromStorage(id);
        return true;
      },
    },
  };
}
