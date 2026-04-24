import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import {
  NasWebDavClient,
  NasConnectionConfig,
  testNasConnection as testNasConnectionFn,
  getCachedNasConfig,
  clearNasConfigCache,
} from '../nasClient.js';
import { uploadToStorage } from '../handlers/shared.js';
import { docToBook } from './digitalLibrary.js';

const logger = { error: (...args: any[]) => console.error('[NAS]', ...args) };

/** Extract storage path from a Firebase Storage public URL or download URL. */
function storagePathFromUrl(url: string, bucketName: string): string | null {
  // Public URL: https://storage.googleapis.com/BUCKET/path/to/file
  const publicPrefix = `https://storage.googleapis.com/${bucketName}/`;
  if (url.startsWith(publicPrefix)) return url.slice(publicPrefix.length).split('?')[0];
  // Token URL: https://firebasestorage.googleapis.com/v0/b/BUCKET/o/ENCODED_PATH?alt=media&token=...
  const tokenMatch = url.match(/\/o\/([^?]+)/);
  if (tokenMatch) return decodeURIComponent(tokenMatch[1]);
  return null;
}

interface ResolverContext {
  uid: string | null;
}

function requireAuth(ctx: ResolverContext): string {
  if (!ctx.uid) throw new Error('Authentication required');
  return ctx.uid;
}

function toNasStatus(config: NasConnectionConfig, status: string, lastTestedAt: string) {
  return {
    nasUrl: config.nasUrl,
    destFolder: config.destFolder,
    status,
    lastTestedAt,
    hasCredentials: !!(config.username && config.password),
  };
}

export function createNasQueryResolvers() {
  return {
    nasConnectionStatus: async (_: any, __: any, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const db = getFirestore();
      const doc = await db.doc(`users/${uid}/nasConnection/config`).get();
      if (!doc.exists) return null;
      const data = doc.data() as NasConnectionConfig;
      return {
        nasUrl: data.nasUrl,
        destFolder: data.destFolder,
        status: data.status || 'unknown',
        lastTestedAt: data.lastTestedAt ?? null,
        hasCredentials: !!(data.username && data.password),
      };
    },
  };
}

export function createNasMutationResolvers() {
  return {
    saveNasConnection: async (_: any, { input }: { input: any }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const schema = z.object({
        nasUrl: z.string().url().max(500),
        username: z.string().min(1).max(100),
        password: z.string().max(200).optional(),
        destFolder: z.string().min(1).max(200).startsWith('/'),
      });
      const parsed = schema.parse(input);
      const db = getFirestore();
      const docRef = db.doc(`users/${uid}/nasConnection/config`);

      const configData: Record<string, any> = {
        nasUrl: parsed.nasUrl,
        destFolder: parsed.destFolder,
        username: parsed.username,
        updatedAt: new Date().toISOString(),
      };
      if (parsed.password) configData.password = parsed.password;

      await docRef.set(configData, { merge: true });

      const savedDoc = await docRef.get();
      const config = savedDoc.data() as NasConnectionConfig;

      const result = await testNasConnectionFn(config);
      const status = result.ok ? 'connected' : 'error';
      const now = new Date().toISOString();
      await docRef.update({ status, lastTestedAt: now, updatedAt: now });
      clearNasConfigCache(uid);

      return toNasStatus(config, status, now);
    },

    testNasConnection: async (_: any, __: any, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const db = getFirestore();
      const docRef = db.doc(`users/${uid}/nasConnection/config`);
      const doc = await docRef.get();
      if (!doc.exists) throw new Error('No NAS connection configured. Save a connection first.');
      const config = doc.data() as NasConnectionConfig;
      const result = await testNasConnectionFn(config);
      const status = result.ok ? 'connected' : 'error';
      const now = new Date().toISOString();
      await docRef.update({ status, lastTestedAt: now, updatedAt: now });
      clearNasConfigCache(uid);
      return toNasStatus(config, status, now);
    },

    deleteNasConnection: async (_: any, __: any, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const db = getFirestore();
      await db.doc(`users/${uid}/nasConnection/config`).delete();
      clearNasConfigCache(uid);
      return true;
    },

    archiveChapterToNas: async (
      _: any,
      { bookId, chapterIndex }: { bookId: string; chapterIndex: number },
      ctx: ResolverContext,
    ) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const chaptersSnap = await db
        .collection('books')
        .doc(bookId)
        .collection('chapters')
        .where('index', '==', chapterIndex)
        .limit(1)
        .get();
      if (chaptersSnap.empty) throw new Error(`Chapter ${chapterIndex} not found in book ${bookId}`);
      const chapterDoc = chaptersSnap.docs[0];
      const chapterData = chapterDoc.data();

      if (!chapterData.audioUrl) {
        throw new Error(`Chapter ${chapterIndex} has no converted audio to offload`);
      }

      const bucket = getStorage().bucket();
      const storagePath = chapterData.audioStoragePath
        ?? storagePathFromUrl(chapterData.audioUrl, bucket.name)
        ?? `books/${bookId}/audio/chapter-${String(chapterIndex).padStart(4, '0')}.mp3`;

      try {
        // If already on NAS, just delete from Firebase Storage (skip re-upload)
        if (chapterData.nasArchived && chapterData.nasPath) {
          const [fileExists] = await bucket.file(storagePath).exists();
          if (fileExists) await bucket.file(storagePath).delete();
          await chapterDoc.ref.update({
            audioUrl: FieldValue.delete(),
            audioStoragePath: FieldValue.delete(),
          });
          return { bookId, chapterIndex, success: true, nasPath: chapterData.nasPath, error: null };
        }

        const [fileExists] = await bucket.file(storagePath).exists();
        if (!fileExists) {
          throw new Error(`Audio file not found in storage at ${storagePath}`);
        }

        const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
        // Download from Firebase Storage
        const [buffer] = await bucket.file(storagePath).download();

        // Ensure book folder exists on NAS
        await client.createFolder(`${config.destFolder}/books`);
        await client.createFolder(`${config.destFolder}/books/${bookId}`);

        // Upload to NAS
        const nasFileName = `chapter-${chapterIndex}.mp3`;
        const nasDestFolder = `${config.destFolder}/books/${bookId}`;
        await client.upload(nasDestFolder, nasFileName, buffer as Buffer);

        const nasPath = `${nasDestFolder}/${nasFileName}`;

        // Delete from Firebase Storage
        await bucket.file(storagePath).delete();

        // Update chapter doc
        await chapterDoc.ref.update({
          audioUrl: FieldValue.delete(),
          audioStoragePath: FieldValue.delete(),
          nasArchived: true,
          nasPath,
        });

        return { bookId, chapterIndex, success: true, nasPath, error: null };
      } catch (err: any) {
        return { bookId, chapterIndex, success: false, nasPath: null, error: err.message || String(err) };
      }
    },

    archiveBookToNas: async (_: any, { bookId }: { bookId: string }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const chaptersSnap = await db
        .collection('books')
        .doc(bookId)
        .collection('chapters')
        .orderBy('index')
        .get();

      const audioChapters = chaptersSnap.docs.filter(
        d => d.data().audioUrl,
      );

      if (audioChapters.length === 0) {
        return { started: true, totalChapters: 0 };
      }

      // Fire-and-forget: process chapters in background
      const processInBackground = async () => {
        const bucket = getStorage().bucket();
        const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
        await client.createFolder(`${config.destFolder}/books`);
        await client.createFolder(`${config.destFolder}/books/${bookId}`);

        for (const chapterDoc of audioChapters) {
          const chapterData = chapterDoc.data();
          const chapterIndex: number = chapterData.index ?? 0;
          const storagePath = chapterData.audioStoragePath
            ?? storagePathFromUrl(chapterData.audioUrl, bucket.name)
            ?? `books/${bookId}/audio/chapter-${String(chapterIndex).padStart(4, '0')}.mp3`;
          try {
            // If already on NAS, just delete from Firebase Storage (skip re-upload)
            if (chapterData.nasArchived && chapterData.nasPath) {
              const [exists] = await bucket.file(storagePath).exists();
              if (exists) await bucket.file(storagePath).delete();
              await chapterDoc.ref.update({
                audioUrl: FieldValue.delete(),
                audioStoragePath: FieldValue.delete(),
              });
              continue;
            }

            const [fileExists] = await bucket.file(storagePath).exists();
            if (!fileExists) continue;

            const [buffer] = await bucket.file(storagePath).download();
            const nasFileName = `chapter-${chapterIndex}.mp3`;
            const nasDestFolder = `${config.destFolder}/books/${bookId}`;
            await client.upload(nasDestFolder, nasFileName, buffer as Buffer);
            const nasPath = `${nasDestFolder}/${nasFileName}`;

            await bucket.file(storagePath).delete();
            await chapterDoc.ref.update({
              audioUrl: FieldValue.delete(),
              audioStoragePath: FieldValue.delete(),
              nasArchived: true,
              nasPath,
            });
          } catch (err: any) {
            logger.error(`Background NAS offload failed for chapter ${chapterIndex}`, err.message || err);
          }
        }
      };

      processInBackground().catch(err => {
        logger.error('Background NAS batch offload failed', err);
      });

      return { started: true, totalChapters: audioChapters.length };
    },

    restoreChapterFromNas: async (
      _: any,
      { bookId, chapterIndex }: { bookId: string; chapterIndex: number },
      ctx: ResolverContext,
    ) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const chaptersSnap = await db
        .collection('books')
        .doc(bookId)
        .collection('chapters')
        .where('index', '==', chapterIndex)
        .limit(1)
        .get();
      if (chaptersSnap.empty) throw new Error(`Chapter ${chapterIndex} not found in book ${bookId}`);
      const chapterDoc = chaptersSnap.docs[0];
      const chapterData = chapterDoc.data();

      if (!chapterData.nasArchived || !chapterData.nasPath) {
        throw new Error(`Chapter ${chapterIndex} is not archived on NAS`);
      }

      const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
      const buffer = await client.download(chapterData.nasPath);

      const storagePath = `books/${bookId}/audio/chapter-${String(chapterIndex).padStart(4, '0')}.mp3`;
      const bucket = getStorage().bucket();
      const { downloadUrl } = await uploadToStorage(bucket, storagePath, buffer, 'audio/mpeg');

      await chapterDoc.ref.update({
        audioUrl: downloadUrl,
        audioStoragePath: storagePath,
        // Keep nasArchived and nasPath — audio exists in both places now
      });

      return {
        id: chapterDoc.id,
        index: chapterData.index ?? chapterIndex,
        title: chapterData.title ?? '',
        href: chapterData.href ?? '',
        characterCount: chapterData.characterCount ?? 0,
        audioUrl: downloadUrl,
        audioDuration: chapterData.audioDuration ?? null,
        nasArchived: true,
        nasPath: chapterData.nasPath,
      };
    },

    archiveEpubToNas: async (_: any, { bookId }: { bookId: string }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const bookRef = db.collection('books').doc(bookId);
      const bookSnap = await bookRef.get();
      if (!bookSnap.exists) throw new Error(`Book ${bookId} not found`);
      const bookData = bookSnap.data()!;

      if (!bookData.epubUrl) {
        throw new Error('No EPUB file available to offload');
      }

      const storagePath = bookData.storagePath || `books/${bookId}/original.epub`;
      const bucket = getStorage().bucket();

      // If already on NAS, just delete from Firebase Storage (skip re-upload)
      if (bookData.epubNasArchived && bookData.epubNasPath) {
        const [exists] = await bucket.file(storagePath).exists();
        if (exists) await bucket.file(storagePath).delete();
        await bookRef.update({
          epubUrl: FieldValue.delete(),
        });
      } else {
        const [fileExists] = await bucket.file(storagePath).exists();
        if (!fileExists) {
          throw new Error(`EPUB file not found in storage at ${storagePath}`);
        }

        const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
        await client.createFolder(`${config.destFolder}/books`);
        await client.createFolder(`${config.destFolder}/books/${bookId}`);

        const [buffer] = await bucket.file(storagePath).download();
        const nasDestFolder = `${config.destFolder}/books/${bookId}`;
        await client.upload(nasDestFolder, 'original.epub', buffer as Buffer);
        const nasPath = `${nasDestFolder}/original.epub`;

        await bucket.file(storagePath).delete();
        await bookRef.update({
          epubUrl: FieldValue.delete(),
          epubNasArchived: true,
          epubNasPath: nasPath,
        });
      }

      const updatedSnap = await bookRef.get();
      return docToBook(bookId, updatedSnap.data()!);
    },

    // ─── Cloud Files NAS Operations ─────────────────────────────────

    archiveCloudFileToNas: async (_: any, { fileId }: { fileId: string }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const fileRef = db.doc(`users/${uid}/files/${fileId}`);
      const fileSnap = await fileRef.get();
      if (!fileSnap.exists) throw new Error('File not found');
      const fileData = fileSnap.data()!;

      if (!fileData.downloadUrl || !fileData.storagePath) {
        throw new Error('File has no cloud storage data to offload');
      }

      const bucket = getStorage().bucket();
      const client = new NasWebDavClient(config.nasUrl, config.username, config.password);

      // If already on NAS, just delete from Firebase Storage
      if (fileData.nasArchived && fileData.nasPath) {
        const [exists] = await bucket.file(fileData.storagePath).exists();
        if (exists) await bucket.file(fileData.storagePath).delete();
        await fileRef.update({
          downloadUrl: FieldValue.delete(),
          storagePath: FieldValue.delete(),
        });
        const updated = (await fileRef.get()).data()!;
        return {
          id: fileId,
          fileName: updated.fileName ?? '',
          contentType: updated.contentType ?? '',
          size: updated.size ?? 0,
          downloadUrl: updated.downloadUrl ?? '',
          storagePath: updated.storagePath ?? '',
          uploadedAt: updated.uploadedAt?.toMillis ? new Date(updated.uploadedAt.toMillis()).toISOString() : (updated.uploadedAt ?? ''),
          folderId: updated.folderId ?? null,
          nasArchived: true,
          nasPath: fileData.nasPath,
        };
      }

      const [fileExists] = await bucket.file(fileData.storagePath).exists();
      if (!fileExists) throw new Error('File not found in cloud storage');

      // Download from Firebase Storage
      const [buffer] = await bucket.file(fileData.storagePath).download();

      // Create folder structure on NAS: {destFolder}/cloud-files/{fileId}/
      await client.createFolder(`${config.destFolder}/cloud-files`);
      await client.createFolder(`${config.destFolder}/cloud-files/${fileId}`);

      // Upload with original filename preserved
      const nasDestFolder = `${config.destFolder}/cloud-files/${fileId}`;
      const nasFileName = fileData.fileName ?? `file-${fileId}`;
      await client.upload(nasDestFolder, nasFileName, buffer as Buffer);
      const nasPath = `${nasDestFolder}/${nasFileName}`;

      // Delete from Firebase Storage
      await bucket.file(fileData.storagePath).delete();

      // Update Firestore doc
      await fileRef.update({
        downloadUrl: FieldValue.delete(),
        storagePath: FieldValue.delete(),
        nasArchived: true,
        nasPath,
      });

      const updated = (await fileRef.get()).data()!;
      return {
        id: fileId,
        fileName: updated.fileName ?? '',
        contentType: updated.contentType ?? '',
        size: updated.size ?? 0,
        downloadUrl: '',
        storagePath: '',
        uploadedAt: updated.uploadedAt?.toMillis ? new Date(updated.uploadedAt.toMillis()).toISOString() : (updated.uploadedAt ?? ''),
        folderId: updated.folderId ?? null,
        nasArchived: true,
        nasPath,
      };
    },

    restoreCloudFileFromNas: async (_: any, { fileId }: { fileId: string }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const fileRef = db.doc(`users/${uid}/files/${fileId}`);
      const fileSnap = await fileRef.get();
      if (!fileSnap.exists) throw new Error('File not found');
      const fileData = fileSnap.data()!;

      if (!fileData.nasArchived || !fileData.nasPath) {
        throw new Error('File is not archived on NAS');
      }

      const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
      const buffer = await client.download(fileData.nasPath);

      const storagePath = `users/${uid}/files/${fileId}/${fileData.fileName ?? `file-${fileId}`}`;
      const bucket = getStorage().bucket();
      const { downloadUrl } = await uploadToStorage(
        bucket,
        storagePath,
        buffer,
        fileData.contentType ?? 'application/octet-stream',
      );

      await fileRef.update({
        downloadUrl,
        storagePath,
        // Keep nasArchived and nasPath — file exists in both places now
      });

      const updated = (await fileRef.get()).data()!;
      return {
        id: fileId,
        fileName: updated.fileName ?? '',
        contentType: updated.contentType ?? '',
        size: updated.size ?? 0,
        downloadUrl,
        storagePath,
        uploadedAt: updated.uploadedAt?.toMillis ? new Date(updated.uploadedAt.toMillis()).toISOString() : (updated.uploadedAt ?? ''),
        folderId: updated.folderId ?? null,
        nasArchived: true,
        nasPath: fileData.nasPath,
      };
    },

    archiveAllCloudFilesToNas: async (_: any, __: any, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const snap = await db.collection(`users/${uid}/files`).get();
      const cloudFiles = snap.docs.filter(d => {
        const data = d.data();
        return !data.isDeleted && data.downloadUrl && data.storagePath;
      });

      if (cloudFiles.length === 0) {
        return { started: true, totalFiles: 0 };
      }

      // Fire-and-forget background processing
      const processInBackground = async () => {
        const bucket = getStorage().bucket();
        const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
        await client.createFolder(`${config.destFolder}/cloud-files`);

        for (const doc of cloudFiles) {
          const data = doc.data();
          const fileId = doc.id;
          try {
            // If already on NAS, just delete from Storage
            if (data.nasArchived && data.nasPath) {
              const [exists] = await bucket.file(data.storagePath).exists();
              if (exists) await bucket.file(data.storagePath).delete();
              await doc.ref.update({
                downloadUrl: FieldValue.delete(),
                storagePath: FieldValue.delete(),
              });
              continue;
            }

            const [fileExists] = await bucket.file(data.storagePath).exists();
            if (!fileExists) continue;

            const [buffer] = await bucket.file(data.storagePath).download();
            await client.createFolder(`${config.destFolder}/cloud-files/${fileId}`);
            const nasFileName = data.fileName ?? `file-${fileId}`;
            const nasDestFolder = `${config.destFolder}/cloud-files/${fileId}`;
            await client.upload(nasDestFolder, nasFileName, buffer as Buffer);
            const nasPath = `${nasDestFolder}/${nasFileName}`;

            await bucket.file(data.storagePath).delete();
            await doc.ref.update({
              downloadUrl: FieldValue.delete(),
              storagePath: FieldValue.delete(),
              nasArchived: true,
              nasPath,
            });
          } catch (err: any) {
            logger.error(`Background NAS offload failed for cloud file ${fileId}`, err.message || err);
          }
        }
      };

      processInBackground().catch(err => {
        logger.error('Background NAS batch offload for cloud files failed', err);
      });

      return { started: true, totalFiles: cloudFiles.length };
    },

    restoreEpubFromNas: async (_: any, { bookId }: { bookId: string }, ctx: ResolverContext) => {
      const uid = requireAuth(ctx);
      const config = await getCachedNasConfig(uid);
      if (!config || config.status !== 'connected') {
        throw new Error('NAS not configured or not connected. Save a NAS connection first.');
      }

      const db = getFirestore();
      const bookRef = db.collection('books').doc(bookId);
      const bookSnap = await bookRef.get();
      if (!bookSnap.exists) throw new Error(`Book ${bookId} not found`);
      const bookData = bookSnap.data()!;

      if (!bookData.epubNasArchived || !bookData.epubNasPath) {
        throw new Error('EPUB is not archived on NAS');
      }

      const client = new NasWebDavClient(config.nasUrl, config.username, config.password);
      const buffer = await client.download(bookData.epubNasPath);

      const storagePath = `books/${bookId}/original.epub`;
      const bucket = getStorage().bucket();
      const file = bucket.file(storagePath);
      await file.save(buffer, { contentType: 'application/epub+zip', metadata: { cacheControl: 'public, max-age=31536000' } });
      await file.makePublic();
      const epubUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      await bookRef.update({
        epubUrl,
        storagePath,
        // Keep epubNasArchived and epubNasPath — EPUB exists in both places now
      });

      const updatedSnap = await bookRef.get();
      return docToBook(bookId, updatedSnap.data()!);
    },
  };
}
