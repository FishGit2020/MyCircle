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

export function createCloudFileResolvers() {
  return {
    Query: {
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
            uploadedAt: toIso(data.uploadedAt),
            folderId: data.folderId ?? null,
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

        const bucket = getStorage().bucket();
        try {
          await bucket.file(fileData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
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
