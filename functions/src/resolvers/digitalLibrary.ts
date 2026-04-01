import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';

// TTS billing SKUs — each has its own independent free-tier meter.
// Limits are capped at 90% of the free tier as a hard safety buffer.
// SKU 9D01: WaveNet + Standard share 4M/mo → hard limit 3.6M
// SKU FEBD: Neural2 + Polyglot share 1M/mo → hard limit 900K
// SKU F977: Chirp3 HD 1M/mo              → hard limit 900K
type SkuGroup = 'wavenet_standard' | 'neural2_polyglot' | 'chirp3';
const TTS_LIMITS: Record<SkuGroup, number> = {
  wavenet_standard: 3_600_000, // 90% of 4M free
  neural2_polyglot:   900_000, // 90% of 1M free
  chirp3:             900_000, // 90% of 1M free
};
function getSkuGroup(voiceName: string): SkuGroup {
  if (voiceName.includes('-Chirp3-HD-')) return 'chirp3';
  if (voiceName.includes('-Neural2-') || voiceName.includes('-Polyglot-')) return 'neural2_polyglot';
  return 'wavenet_standard';
}

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

      conversionBatchJob: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db.collection(`users/${uid}/conversionBatchJobs`)
          .where('bookId', '==', bookId)
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();
        if (snap.empty) return null;
        const doc = snap.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          bookId: data.bookId,
          chapterIndices: data.chapterIndices || [],
          voiceName: data.voiceName,
          status: data.status || 'pending',
          currentChapter: data.currentChapter ?? null,
          completedChapters: data.completedChapters || [],
          error: data.error || null,
          createdAt: data.createdAt?.toMillis ? new Date(data.createdAt.toMillis()).toISOString() : new Date().toISOString(),
        };
      },

      ttsQuota: async (_: any, __: any, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const month = new Date().toISOString().slice(0, 7);
        const snap = await db.collection('ttsUsage').doc(month).get();
        const data = snap.data() || {};
        const ws = data.wavenet_standard ?? 0;
        const np = data.neural2_polyglot ?? 0;
        const c3 = data.chirp3 ?? 0;
        return {
          wavenetStandard: { used: ws, limit: TTS_LIMITS.wavenet_standard, remaining: Math.max(0, TTS_LIMITS.wavenet_standard - ws) },
          neural2Polyglot: { used: np, limit: TTS_LIMITS.neural2_polyglot, remaining: Math.max(0, TTS_LIMITS.neural2_polyglot - np) },
          chirp3:          { used: c3, limit: TTS_LIMITS.chirp3,           remaining: Math.max(0, TTS_LIMITS.chirp3           - c3) },
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

        const uid = bookDoc.data()!.uploadedBy?.uid as string | undefined;

        // Delete chapters subcollection + book doc in a batch
        const chaptersSnap = await bookRef.collection('chapters').get();
        const batch = db.batch();
        for (const chapDoc of chaptersSnap.docs) batch.delete(chapDoc.ref);
        batch.delete(bookRef);
        await batch.commit();

        // Delete conversion job docs for this book
        if (uid) {
          const jobsSnap = await db.collection(`users/${uid}/conversionJobs`)
            .where('bookId', '==', id).get();
          const batchJobsSnap = await db.collection(`users/${uid}/conversionBatchJobs`)
            .where('bookId', '==', id).get();
          const jobBatch = db.batch();
          for (const d of jobsSnap.docs) jobBatch.delete(d.ref);
          for (const d of batchJobsSnap.docs) jobBatch.delete(d.ref);
          if (jobsSnap.size + batchJobsSnap.size > 0) await jobBatch.commit();
        }

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

        // Check for existing pending/processing jobs to prevent duplicates
        const existingSnap = await db.collection(`users/${uid}/conversionJobs`)
          .where('bookId', '==', bookId)
          .where('status', 'in', ['pending', 'processing'])
          .get();
        const activeChapters = new Set(existingSnap.docs.map(d => d.data().chapterIndex as number));

        for (const chapterIndex of chapterIndices) {
          if (activeChapters.has(chapterIndex)) continue; // Skip — already queued
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

        // Mark book as processing immediately so cancel button appears on reload
        if (jobs.length > 0) {
          await db.collection('books').doc(bookId).update({
            audioStatus: 'processing',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }

        return jobs;
      },

      submitBatchConversion: async (
        _: any,
        { bookId, chapterIndices, voiceName }: { bookId: string; chapterIndices: number[]; voiceName: string },
        context: ResolverContext
      ) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Check for existing active batch for this book
        const existingSnap = await db.collection(`users/${uid}/conversionBatchJobs`)
          .where('bookId', '==', bookId)
          .where('status', 'in', ['pending', 'processing'])
          .get();
        if (!existingSnap.empty) {
          throw new GraphQLError('A batch conversion is already in progress for this book', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        const ref = db.collection(`users/${uid}/conversionBatchJobs`).doc();
        const now = FieldValue.serverTimestamp();
        await ref.set({
          bookId,
          chapterIndices,
          voiceName,
          uid,
          status: 'pending',
          currentChapter: null,
          completedChapters: [],
          error: null,
          createdAt: now,
        });

        // Mark book as processing immediately so cancel button appears on reload
        await db.collection('books').doc(bookId).update({
          audioStatus: 'processing',
          updatedAt: now,
        });

        return {
          id: ref.id,
          bookId,
          chapterIndices,
          voiceName,
          status: 'pending',
          currentChapter: null,
          completedChapters: [],
          error: null,
          createdAt: new Date().toISOString(),
        };
      },

      uploadBook: async (_: any, { fileBase64 }: { fileBase64: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const bucket = getStorage().bucket();
        const crypto = await import('crypto');

        const buffer = Buffer.from(fileBase64, 'base64');
        if (buffer.length > 20 * 1024 * 1024) {
          throw new GraphQLError('File too large (max 20MB)', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        const bookId = crypto.randomUUID();
        const storagePath = `books/${bookId}/original.epub`;
        const storageFile = bucket.file(storagePath);
        await storageFile.save(buffer, { contentType: 'application/epub+zip', metadata: { cacheControl: 'public, max-age=31536000' } });
        await storageFile.makePublic();
        const epubUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

        // Extract metadata
        const fs = await import('fs');
        const tmpPath = `/tmp/upload-${bookId}.epub`;
        fs.writeFileSync(tmpPath, buffer);
        const epub2Module = await import('epub2');
        const EPub = epub2Module.EPub;
        const epub = await (EPub as unknown as { createAsync(p: string): Promise<any> }).createAsync(tmpPath); // eslint-disable-line @typescript-eslint/no-explicit-any

        const title = epub.metadata?.title || 'Untitled';
        const author = epub.metadata?.creator || 'Unknown';
        const description = epub.metadata?.description || '';
        const language = epub.metadata?.language || 'en';

        // Extract cover
        let coverUrl = '';
        try {
          const coverId = epub.metadata?.cover;
          if (coverId && epub.manifest?.[coverId]) {
            const coverData = await new Promise<Buffer>((resolve, reject) => {
              epub.getImage(coverId, (err: Error | null, data: Buffer) => { if (err) reject(err); else resolve(data); });
            });
            const coverPath = `books/${bookId}/cover.jpg`;
            const coverFile = bucket.file(coverPath);
            await coverFile.save(coverData, { contentType: 'image/jpeg' });
            await coverFile.makePublic();
            coverUrl = `https://storage.googleapis.com/${bucket.name}/${coverPath}`;
          }
        } catch { /* ignore cover extraction failure */ }

        // Extract chapters
        const flow = epub.flow || [];
        const chapters: Array<{ index: number; title: string; href: string; characterCount: number }> = [];
        let totalCharacters = 0;
        for (let i = 0; i < flow.length; i++) {
          const item = flow[i];
          let charCount = 0;
          try {
            const html = await new Promise<string>((resolve, reject) => {
              epub.getChapter(item.id, (err: Error | null, data: string) => { if (err) reject(err); else resolve(data); });
            });
            charCount = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().length;
          } catch { /* ignore */ }
          totalCharacters += charCount;
          chapters.push({ index: i, title: item.title || `Chapter ${i + 1}`, href: item.href || '', characterCount: charCount });
        }

        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }

        // Get uploader name
        let displayName = 'Unknown';
        try {
          const { getAuth } = await import('firebase-admin/auth');
          const user = await getAuth().getUser(uid);
          displayName = user.displayName || user.email || 'Unknown';
        } catch { /* ignore */ }

        // Create book document
        const bookRef = db.collection('books').doc(bookId);
        const bookData = {
          title, author, description, language, coverUrl, epubUrl,
          storagePath, fileSize: buffer.length, chapterCount: chapters.length,
          totalCharacters, audioStatus: 'none', audioProgress: 0,
          uploadedBy: { uid, displayName },
          uploadedAt: FieldValue.serverTimestamp(),
          isDeleted: false,
        };
        await bookRef.set(bookData);

        // Create chapter documents
        const batch = db.batch();
        for (const ch of chapters) {
          batch.set(bookRef.collection('chapters').doc(`ch-${ch.index}`), ch);
        }
        await batch.commit();

        return { id: bookId, title, author, description, language, coverUrl, epubUrl, fileSize: buffer.length, chapterCount: chapters.length, totalCharacters, uploadedBy: { uid, displayName }, uploadedAt: new Date().toISOString(), audioStatus: 'none', audioProgress: 0 };
      },

      deleteChapterAudio: async (_: any, { bookId, chapterIndex }: { bookId: string; chapterIndex: number }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookRef = db.collection('books').doc(bookId);
        const chapSnap = await bookRef.collection('chapters').where('index', '==', chapterIndex).get();
        if (chapSnap.empty) throw new GraphQLError('Chapter not found', { extensions: { code: 'NOT_FOUND' } });

        const chapDoc = chapSnap.docs[0];
        await chapDoc.ref.update({ audioUrl: FieldValue.delete(), audioStoragePath: FieldValue.delete(), audioDuration: FieldValue.delete() });

        // Recount and update book progress
        const allChaps = await bookRef.collection('chapters').get();
        const convertedCount = allChaps.docs.filter(d => d.id !== chapDoc.id && d.data().audioUrl).length;
        const progress = allChaps.size > 0 ? Math.round((convertedCount / allChaps.size) * 100) : 0;
        await bookRef.update({ audioProgress: progress, audioStatus: convertedCount === 0 ? 'none' : 'complete', updatedAt: FieldValue.serverTimestamp() });

        return true;
      },

      resetBookConversion: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const bookRef = db.collection('books').doc(bookId);
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });

        await bookRef.update({ audioStatus: 'none', audioProgress: 0, audioError: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
        return true;
      },

      cancelBookConversion: async (_: any, { bookId }: { bookId: string }, context: ResolverContext) => {
        requireAuth(context);
        const uid = context.uid!;
        const db = getFirestore();
        const bookRef = db.collection('books').doc(bookId);
        const bookDoc = await bookRef.get();
        if (!bookDoc.exists) throw new GraphQLError('Book not found', { extensions: { code: 'NOT_FOUND' } });

        // Mark all active batch jobs so workers stop between chapters
        const activeBatchJobs = await db.collection(`users/${uid}/conversionBatchJobs`)
          .where('bookId', '==', bookId)
          .where('status', 'in', ['pending', 'processing', 'paused'])
          .get();

        // Mark all pending/processing individual chapter jobs as cancelled
        const activeChapterJobs = await db.collection(`users/${uid}/conversionJobs`)
          .where('bookId', '==', bookId)
          .where('status', 'in', ['pending', 'processing'])
          .get();

        const batch = db.batch();
        for (const doc of activeBatchJobs.docs) {
          batch.update(doc.ref, { cancelRequested: true });
        }
        for (const doc of activeChapterJobs.docs) {
          batch.update(doc.ref, { status: 'cancelled' });
        }

        // Reset book state immediately so UI reflects cancellation
        batch.update(bookRef, { audioStatus: 'none', audioProgress: 0, audioError: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() });
        await batch.commit();
        return true;
      },

      previewVoice: async (_: any, { voiceName }: { voiceName: string }, context: ResolverContext) => {
        requireAuth(context);
        const db = getFirestore();
        const langCode = voiceName.split('-').slice(0, 2).join('-');
        const sampleText = langCode.startsWith('cmn') ? '\u4f60\u597d\uff0c\u8fd9\u662f\u8bed\u97f3\u9884\u89c8\u3002'
          : langCode.startsWith('es') ? 'Hola, esta es una vista previa de la voz.'
          : 'Hello, this is a voice preview sample.';

        // Check and track quota for this voice's SKU group
        const month = new Date().toISOString().slice(0, 7);
        const usageRef = db.collection('ttsUsage').doc(month);
        const usageSnap = await usageRef.get();
        const data = usageSnap.data() || {};
        const skuGroup = getSkuGroup(voiceName);
        const currentChars = data[skuGroup] ?? 0;
        if (currentChars + sampleText.length > TTS_LIMITS[skuGroup]) {
          throw new GraphQLError('Monthly TTS quota reached', { extensions: { code: 'QUOTA_EXCEEDED' } });
        }

        const ttsClient = new (await import('@google-cloud/text-to-speech')).TextToSpeechClient();
        const [response] = await ttsClient.synthesizeSpeech({
          input: { text: sampleText },
          voice: { languageCode: langCode, name: voiceName },
          audioConfig: { audioEncoding: 'MP3' },
        });

        if (!response.audioContent) throw new GraphQLError('TTS preview failed');
        await usageRef.set({ [skuGroup]: FieldValue.increment(sampleText.length), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return Buffer.from(response.audioContent as Uint8Array).toString('base64');
      },
    },
  };
}
