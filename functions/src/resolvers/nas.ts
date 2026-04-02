import { z } from 'zod';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import {
  NasFileStationClient,
  NasConnectionConfig,
  testNasConnection as testNasConnectionFn,
  getCachedNasConfig,
  clearNasConfigCache,
} from '../nasClient.js';
import { uploadToStorage } from '../handlers/shared.js';

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

      const storagePath = `books/${bookId}/audio/chapter-${chapterIndex}.mp3`;
      const bucket = getStorage().bucket();
      const [fileExists] = await bucket.file(storagePath).exists();
      if (!fileExists) {
        throw new Error(`Audio file not found in storage at ${storagePath}`);
      }

      const client = new NasFileStationClient(config.nasUrl);
      try {
        await client.login(config.username, config.password);

        // Download from Firebase Storage
        const [buffer] = await bucket.file(storagePath).download();

        // Ensure book folder exists on NAS
        await client.createFolder(`${config.destFolder}/books`, bookId);

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
      } finally {
        await client.logout();
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
        d => d.data().audioUrl && !d.data().nasArchived,
      );

      if (audioChapters.length === 0) {
        return [];
      }

      const bucket = getStorage().bucket();
      const results: Array<{ bookId: string; chapterIndex: number; success: boolean; nasPath: string | null; error: string | null }> = [];

      const client = new NasFileStationClient(config.nasUrl);
      try {
        await client.login(config.username, config.password);
        await client.createFolder(`${config.destFolder}/books`, bookId);

        for (const chapterDoc of audioChapters) {
          const chapterData = chapterDoc.data();
          const chapterIndex: number = chapterData.index ?? 0;
          const storagePath = `books/${bookId}/audio/chapter-${chapterIndex}.mp3`;
          try {
            const [fileExists] = await bucket.file(storagePath).exists();
            if (!fileExists) {
              results.push({ bookId, chapterIndex, success: false, nasPath: null, error: 'File not found in storage' });
              continue;
            }

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

            results.push({ bookId, chapterIndex, success: true, nasPath, error: null });
          } catch (err: any) {
            results.push({ bookId, chapterIndex, success: false, nasPath: null, error: err.message || String(err) });
          }
        }
      } finally {
        await client.logout();
      }

      return results;
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

      const client = new NasFileStationClient(config.nasUrl);
      try {
        await client.login(config.username, config.password);
        const buffer = await client.download(chapterData.nasPath);

        const storagePath = `books/${bookId}/audio/chapter-${chapterIndex}.mp3`;
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
      } finally {
        await client.logout();
      }
    },
  };
}
