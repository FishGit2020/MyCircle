import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { GraphQLError } from 'graphql';
import { getStorageDownloadUrl } from '../handlers/shared.js';

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

// Firebase Storage free-tier limit for Spark plan (1 GB)
const STORAGE_FREE_TIER_BYTES = 1_073_741_824;
// Cache TTL: 24 hours
const STORAGE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function getStorageUsageFromBucket(): Promise<number> {
  const bucket = getStorage().bucket();
  let totalBytes = 0;
  let pageToken: string | undefined;
  do {
    const [files, , apiResponse] = await bucket.getFiles({
      maxResults: 1000,
      pageToken,
      autoPaginate: false,
    });
    for (const file of files) {
      totalBytes += parseInt(file.metadata.size as string, 10) || 0;
    }
    pageToken = (apiResponse as any)?.nextPageToken;
  } while (pageToken);
  return totalBytes;
}

export function createCloudFileResolvers() {
  return {
    Query: {
      storageUsage: async () => {
        const db = getFirestore();
        const cacheRef = db.doc('systemStats/storageUsage');
        const snap = await cacheRef.get();
        const cached = snap.data();
        const now = Date.now();
        if (cached?.usedBytes !== undefined && cached?.measuredAt) {
          const age = now - (cached.measuredAt.toMillis?.() ?? now);
          if (age < STORAGE_CACHE_TTL_MS) {
            return {
              usedBytes: cached.usedBytes,
              totalBytes: STORAGE_FREE_TIER_BYTES,
              cachedAt: new Date(cached.measuredAt.toMillis()).toISOString(),
            };
          }
        }
        // Cache miss or stale — measure the bucket
        const usedBytes = await getStorageUsageFromBucket();
        await cacheRef.set({ usedBytes, measuredAt: FieldValue.serverTimestamp() }, { merge: true });
        return {
          usedBytes,
          totalBytes: STORAGE_FREE_TIER_BYTES,
          cachedAt: new Date().toISOString(),
        };
      },

      cloudFiles: async (_: any, __: any, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`users/${uid}/files`)
          .orderBy('uploadedAt', 'desc')
          .get();
        return snap.docs.filter(d => !d.data().isDeleted).map(d => {
          const data = d.data();
          return {
            id: d.id,
            fileName: data.fileName ?? '',
            contentType: data.contentType ?? '',
            size: data.size ?? 0,
            downloadUrl: data.downloadUrl ?? '',
            storagePath: data.storagePath ?? '',
            folderId: data.folderId ?? null,
            uploadedAt: toIso(data.uploadedAt),
            nasArchived: data.nasArchived ?? null,
            nasPath: data.nasPath ?? null,
          };
        });
      },

      sharedFiles: async () => {
        const db = getFirestore();
        const snap = await db
          .collection('sharedFiles')
          .orderBy('sharedAt', 'desc')
          .get();
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            fileName: data.fileName ?? '',
            contentType: data.contentType ?? '',
            size: data.size ?? 0,
            downloadUrl: data.downloadUrl ?? '',
            storagePath: data.storagePath ?? '',
            sharedByUid: data.sharedBy?.uid ?? '',
            sharedByName: data.sharedBy?.displayName ?? '',
            sharedAt: toIso(data.sharedAt),
          };
        });
      },
    },

    Mutation: {
      shareFile: async (_: any, { fileId }: { fileId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const fileRef = db.doc(`users/${uid}/files/${fileId}`);
        const fileSnap = await fileRef.get();
        if (!fileSnap.exists) {
          throw new GraphQLError('File not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const fileData = fileSnap.data()!;

        const bucket = getStorage().bucket();
        const srcFile = bucket.file(fileData.storagePath);
        const destPath = `shared-files/${fileId}/${fileData.fileName}`;
        await srcFile.copy(bucket.file(destPath));
        const { downloadUrl } = await getStorageDownloadUrl(bucket, destPath);

        // Get uploader display name from auth
        const { getAuth } = await import('firebase-admin/auth');
        let displayName = '';
        try {
          const userRecord = await getAuth().getUser(uid);
          displayName = userRecord.displayName || userRecord.email || '';
        } catch { /* ignore */ }

        await db.doc(`sharedFiles/${fileId}`).set({
          fileName: fileData.fileName,
          contentType: fileData.contentType,
          size: fileData.size,
          downloadUrl,
          storagePath: destPath,
          sharedBy: { uid, displayName },
          sharedAt: FieldValue.serverTimestamp(),
        });

        return { ok: true, downloadUrl };
      },

      deleteFile: async (_: any, { fileId }: { fileId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const fileRef = db.doc(`users/${uid}/files/${fileId}`);
        const fileSnap = await fileRef.get();
        if (!fileSnap.exists) return true; // already gone
        const fileData = fileSnap.data()!;

        // Delete from Firebase Storage if the file is still in the cloud
        if (fileData.storagePath) {
          const bucket = getStorage().bucket();
          try {
            await bucket.file(fileData.storagePath).delete();
          } catch (e: any) {
            if (e.code !== 404) throw e;
          }
        }
        await fileRef.delete();
        return true;
      },

      deleteSharedFile: async (_: any, { fileId }: { fileId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const sharedRef = db.doc(`sharedFiles/${fileId}`);
        const sharedSnap = await sharedRef.get();
        if (!sharedSnap.exists) return true;
        const sharedData = sharedSnap.data()!;

        if (sharedData.sharedBy?.uid !== uid) {
          throw new GraphQLError('Only the original sharer can delete this file', {
            extensions: { code: 'FORBIDDEN' },
          });
        }

        const bucket = getStorage().bucket();
        try {
          await bucket.file(sharedData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }
        await sharedRef.delete();
        return true;
      },
    },
  };
}
