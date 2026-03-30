import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';

const TTS_MONTHLY_CHAR_LIMIT = 3_500_000;

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

function docToBook(id: string, data: FirebaseFirestore.DocumentData) {
  return {
    id,
    title: data.title ?? '',
    author: data.author ?? '',
    description: data.description ?? '',
    language: data.language ?? 'en',
    coverUrl: data.coverUrl ?? '',
    epubUrl: data.epubUrl ?? '',
    fileSize: data.fileSize ?? 0,
    chapterCount: data.chapterCount ?? 0,
    totalCharacters: data.totalCharacters ?? 0,
    uploadedBy: {
      uid: data.uploadedBy?.uid ?? '',
      displayName: data.uploadedBy?.displayName ?? '',
    },
    uploadedAt: toIso(data.uploadedAt),
    audioStatus: data.audioStatus ?? 'none',
    audioProgress: data.audioProgress ?? 0,
    audioError: data.audioError ?? null,
  };
}

export function createDigitalLibraryResolvers() {
  return {
    Query: {
      books: async (_: any, __: any, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const snap = await db.collection('books').orderBy('uploadedAt', 'desc').get();
        return snap.docs
          .filter(d => !d.data().isDeleted)
          .map(d => docToBook(d.id, d.data()));
      },

      bookChapters: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection('books')
          .doc(bookId)
          .collection('chapters')
          .orderBy('index')
          .get();
        return snap.docs.map(d => ({
          id: d.id,
          index: d.data().index ?? 0,
          title: d.data().title ?? '',
          href: d.data().href ?? '',
          characterCount: d.data().characterCount ?? 0,
          audioUrl: d.data().audioUrl ?? null,
          audioDuration: d.data().audioDuration ?? null,
        }));
      },

      bookConversionProgress: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookDoc = await db.collection('books').doc(bookId).get();
        if (!bookDoc.exists) {
          throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const data = bookDoc.data()!;
        let audioStatus = data.audioStatus || 'none';
        const audioError = data.audioError || null;

        // Detect stale processing (>10 min)
        if (audioStatus === 'processing' && data.updatedAt) {
          const updatedMs = data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now();
          if (Date.now() - updatedMs > 10 * 60 * 1000) {
            audioStatus = 'error';
            await bookDoc.ref.update({
              audioStatus: 'error',
              audioError: 'Conversion timed out. You can retry — already-converted chapters will be skipped.',
            });
          }
        }

        // Detect abandoned paused (>30 min)
        if (audioStatus === 'paused' && data.updatedAt) {
          const updatedMs = data.updatedAt.toMillis ? data.updatedAt.toMillis() : Date.now();
          if (Date.now() - updatedMs > 30 * 60 * 1000) {
            audioStatus = 'error';
            await bookDoc.ref.update({
              audioStatus: 'error',
              audioError: 'Conversion paused too long. Retry to continue.',
            });
          }
        }

        return {
          audioStatus,
          audioProgress: data.audioProgress || 0,
          audioError: audioStatus === 'error' && data.audioError ? data.audioError : audioError,
          canContinue: audioStatus === 'paused',
        };
      },

      conversionJobs: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`users/${uid}/conversionJobs`)
          .where('bookId', '==', bookId)
          .orderBy('createdAt', 'desc')
          .limit(50)
          .get();
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            bookId: data.bookId,
            chapterIndex: data.chapterIndex,
            voiceName: data.voiceName,
            status: data.status || 'pending',
            error: data.error || null,
            createdAt: data.createdAt?.toMillis ? new Date(data.createdAt.toMillis()).toISOString() : new Date().toISOString(),
          };
        });
      },

      ttsQuota: async (_: any, __: any, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const month = new Date().toISOString().slice(0, 7);
        const snap = await db.collection('ttsUsage').doc(month).get();
        const used = snap.exists ? (snap.data()?.totalCharacters ?? 0) : 0;
        return {
          used,
          limit: TTS_MONTHLY_CHAR_LIMIT,
          remaining: Math.max(0, TTS_MONTHLY_CHAR_LIMIT - used),
        };
      },
    },

    Mutation: {
      deleteBook: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookRef = db.collection('books').doc(id);
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) {
          throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await bookRef.update({ isDeleted: true, deletedAt: FieldValue.serverTimestamp() });
        return true;
      },

      restoreBook: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookRef = db.collection('books').doc(id);
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) {
          throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await bookRef.update({ isDeleted: false, deletedAt: null });
        return true;
      },

      permanentDeleteBook: async (_: any, { id }: { id: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookRef = db.collection('books').doc(id);
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) {
          throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });
        }

        // Delete chapters subcollection + book doc in a batch
        const chaptersSnap = await bookRef.collection('chapters').get();
        const batch = db.batch();
        for (const chapDoc of chaptersSnap.docs) batch.delete(chapDoc.ref);
        batch.delete(bookRef);
        await batch.commit();

        // Delete storage files
        const bucket = getStorage().bucket();
        const bookId = id;
        try { await bucket.file(`books/${bookId}/original.epub`).delete(); } catch { /* ignore */ }
        try { await bucket.file(`books/${bookId}/cover.jpg`).delete(); } catch { /* ignore */ }
        try {
          const [audioFiles] = await bucket.getFiles({ prefix: `books/${bookId}/audio/` });
          for (const f of audioFiles) { try { await f.delete(); } catch { /* ignore */ } }
        } catch { /* ignore */ }

        return true;
      },

      submitChapterConversions: async (
        _: any,
        { bookId, chapterIndices, voiceName }: { bookId: string; chapterIndices: number[]; voiceName: string },
        context: ResolverContext
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const now = FieldValue.serverTimestamp();
        const jobs: Array<{ id: string; bookId: string; chapterIndex: number; voiceName: string; status: string; error: null; createdAt: string }> = [];

        for (const chapterIndex of chapterIndices) {
          const ref = db.collection(`users/${uid}/conversionJobs`).doc();
          await ref.set({
            bookId,
            chapterIndex,
            voiceName,
            uid,
            status: 'pending',
            error: null,
            createdAt: now,
          });
          jobs.push({
            id: ref.id,
            bookId,
            chapterIndex,
            voiceName,
            status: 'pending',
            error: null,
            createdAt: new Date().toISOString(),
          });
        }

        return jobs;
      },
    },
  };
}
