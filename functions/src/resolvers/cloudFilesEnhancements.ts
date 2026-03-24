import { getFirestore, FieldValue } from 'firebase-admin/firestore';
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

function toIso(val: unknown): string {
  if (!val) return new Date().toISOString();
  if (typeof (val as { toMillis?: () => number }).toMillis === 'function') {
    return new Date((val as { toMillis: () => number }).toMillis()).toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

const MAX_FOLDER_DEPTH = 4; // 0-indexed → 5 levels total
const MAX_NAME_LENGTH = 255;

export function createCloudFilesEnhancementResolvers() {
  return {
    Query: {
      folders: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`users/${uid}/folders`)
          .orderBy('createdAt', 'asc')
          .get();
        return snap.docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name ?? '',
            parentFolderId: data.parentFolderId ?? null,
            createdAt: toIso(data.createdAt),
            depth: data.depth ?? 0,
          };
        });
      },

      fileShareRecipients: async (_: unknown, { fileId }: { fileId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        // Collection group query: find all sharedWithMe docs for this file owned by caller
        const snap = await db
          .collectionGroup('files')
          .where('ownerUid', '==', uid)
          .where('fileId', '==', fileId)
          .where('revokedAt', '==', null)
          .get();
        return snap.docs.map(d => {
          const data = d.data();
          return {
            recipientUid: data.recipientUid ?? '',
            recipientName: data.recipientName ?? '',
            shareId: d.id,
            sharedAt: toIso(data.sharedAt),
          };
        });
      },

      filesSharedWithMe: async (_: unknown, __: unknown, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const snap = await db
          .collection(`sharedWithMe/${uid}/files`)
          .where('revokedAt', '==', null)
          .orderBy('sharedAt', 'desc')
          .get();
        return snap.docs.map(d => {
          const data = d.data();
          return {
            shareId: d.id,
            ownerUid: data.ownerUid ?? '',
            ownerName: data.ownerName ?? '',
            fileId: data.fileId ?? '',
            fileName: data.fileName ?? '',
            contentType: data.contentType ?? '',
            size: data.size ?? 0,
            downloadUrl: data.downloadUrl ?? '',
            sharedAt: toIso(data.sharedAt),
          };
        });
      },
    },

    Mutation: {
      renameFile: async (_: unknown, { fileId, newName }: { fileId: string; newName: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        if (!newName || !newName.trim()) {
          throw new GraphQLError('File name cannot be empty', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        if (newName.length > MAX_NAME_LENGTH) {
          throw new GraphQLError(`File name cannot exceed ${MAX_NAME_LENGTH} characters`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const db = getFirestore();
        const fileRef = db.doc(`users/${uid}/files/${fileId}`);
        const fileSnap = await fileRef.get();
        if (!fileSnap.exists) {
          throw new GraphQLError('File not found', { extensions: { code: 'NOT_FOUND' } });
        }
        await fileRef.update({ fileName: newName.trim() });
        const updated = (await fileRef.get()).data()!;
        return {
          id: fileId,
          fileName: updated.fileName ?? newName.trim(),
          contentType: updated.contentType ?? '',
          size: updated.size ?? 0,
          downloadUrl: updated.downloadUrl ?? '',
          storagePath: updated.storagePath ?? '',
          uploadedAt: toIso(updated.uploadedAt),
          folderId: updated.folderId ?? null,
        };
      },

      createFolder: async (_: unknown, { name, parentFolderId }: { name: string; parentFolderId?: string | null }, context: ResolverContext) => {
        const uid = requireAuth(context);
        if (!name || !name.trim()) {
          throw new GraphQLError('Folder name cannot be empty', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        if (name.length > MAX_NAME_LENGTH) {
          throw new GraphQLError(`Folder name cannot exceed ${MAX_NAME_LENGTH} characters`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const db = getFirestore();
        const foldersRef = db.collection(`users/${uid}/folders`);

        // Determine depth
        let depth = 0;
        if (parentFolderId) {
          const parentSnap = await foldersRef.doc(parentFolderId).get();
          if (!parentSnap.exists) {
            throw new GraphQLError('Parent folder not found', { extensions: { code: 'NOT_FOUND' } });
          }
          depth = (parentSnap.data()!.depth ?? 0) + 1;
          if (depth > MAX_FOLDER_DEPTH) {
            throw new GraphQLError('Maximum folder depth reached', { extensions: { code: 'BAD_USER_INPUT' } });
          }
        }

        // Check duplicate name within same parent
        const dupSnap = await foldersRef
          .where('parentFolderId', '==', parentFolderId ?? null)
          .where('name', '==', name.trim())
          .get();
        if (!dupSnap.empty) {
          throw new GraphQLError('A folder with that name already exists here', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        const docRef = foldersRef.doc();
        await docRef.set({
          name: name.trim(),
          parentFolderId: parentFolderId ?? null,
          depth,
          createdAt: FieldValue.serverTimestamp(),
        });

        return {
          id: docRef.id,
          name: name.trim(),
          parentFolderId: parentFolderId ?? null,
          createdAt: new Date().toISOString(),
          depth,
        };
      },

      deleteFolder: async (_: unknown, { folderId, deleteContents }: { folderId: string; deleteContents: boolean }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const foldersRef = db.collection(`users/${uid}/folders`);
        const filesRef = db.collection(`users/${uid}/files`);

        const folderSnap = await foldersRef.doc(folderId).get();
        if (!folderSnap.exists) return true;

        // Check if folder has contents
        const childFiles = await filesRef.where('folderId', '==', folderId).get();
        const childFolders = await foldersRef.where('parentFolderId', '==', folderId).get();
        const hasContents = !childFiles.empty || !childFolders.empty;

        if (hasContents && !deleteContents) {
          throw new GraphQLError('Folder is not empty. Set deleteContents to true to delete all contents.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        if (hasContents && deleteContents) {
          const bucket = getStorage().bucket();

          // Delete files in this folder
          for (const fileDoc of childFiles.docs) {
            const fileData = fileDoc.data();
            try {
              await bucket.file(fileData.storagePath).delete();
            } catch (e: unknown) {
              if ((e as { code?: number }).code !== 404) throw e;
            }
            await fileDoc.ref.delete();
          }

          // Recursively delete sub-folders (BFS)
          const queue: string[] = childFolders.docs.map(d => d.id);
          for (const d of childFolders.docs) await d.ref.delete();

          while (queue.length) {
            const nextId = queue.shift()!;
            const subFiles = await filesRef.where('folderId', '==', nextId).get();
            const subFolders = await foldersRef.where('parentFolderId', '==', nextId).get();
            for (const f of subFiles.docs) {
              const fileData = f.data();
              try { await bucket.file(fileData.storagePath).delete(); } catch { /* ignore */ }
              await f.ref.delete();
            }
            for (const sf of subFolders.docs) {
              queue.push(sf.id);
              await sf.ref.delete();
            }
          }
        }

        await foldersRef.doc(folderId).delete();
        return true;
      },

      renameFolder: async (_: unknown, { folderId, newName }: { folderId: string; newName: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        if (!newName || !newName.trim()) {
          throw new GraphQLError('Folder name cannot be empty', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const db = getFirestore();
        const foldersRef = db.collection(`users/${uid}/folders`);
        const folderSnap = await foldersRef.doc(folderId).get();
        if (!folderSnap.exists) {
          throw new GraphQLError('Folder not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const folderData = folderSnap.data()!;

        // Check duplicate name in same parent
        const dupSnap = await foldersRef
          .where('parentFolderId', '==', folderData.parentFolderId ?? null)
          .where('name', '==', newName.trim())
          .get();
        if (!dupSnap.empty && dupSnap.docs[0].id !== folderId) {
          throw new GraphQLError('A folder with that name already exists here', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        await foldersRef.doc(folderId).update({ name: newName.trim() });
        return {
          id: folderId,
          name: newName.trim(),
          parentFolderId: folderData.parentFolderId ?? null,
          createdAt: toIso(folderData.createdAt),
          depth: folderData.depth ?? 0,
        };
      },

      moveFile: async (_: unknown, { fileId, targetFolderId }: { fileId: string; targetFolderId?: string | null }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();
        const fileRef = db.doc(`users/${uid}/files/${fileId}`);
        const fileSnap = await fileRef.get();
        if (!fileSnap.exists) {
          throw new GraphQLError('File not found', { extensions: { code: 'NOT_FOUND' } });
        }

        if (targetFolderId) {
          const folderSnap = await db.doc(`users/${uid}/folders/${targetFolderId}`).get();
          if (!folderSnap.exists) {
            throw new GraphQLError('Target folder not found', { extensions: { code: 'NOT_FOUND' } });
          }
        }

        await fileRef.update({ folderId: targetFolderId ?? null });
        const updated = (await fileRef.get()).data()!;
        return {
          id: fileId,
          fileName: updated.fileName ?? '',
          contentType: updated.contentType ?? '',
          size: updated.size ?? 0,
          downloadUrl: updated.downloadUrl ?? '',
          storagePath: updated.storagePath ?? '',
          uploadedAt: toIso(updated.uploadedAt),
          folderId: updated.folderId ?? null,
        };
      },

      shareFileWith: async (_: unknown, { fileId, recipientEmail }: { fileId: string; recipientEmail: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Validate file exists and belongs to caller
        const fileSnap = await db.doc(`users/${uid}/files/${fileId}`).get();
        if (!fileSnap.exists) {
          throw new GraphQLError('File not found', { extensions: { code: 'NOT_FOUND' } });
        }
        const fileData = fileSnap.data()!;

        // Look up recipient by email
        const { getAuth } = await import('firebase-admin/auth');
        let recipientRecord;
        try {
          recipientRecord = await getAuth().getUserByEmail(recipientEmail);
        } catch {
          throw new GraphQLError('No account found with that email address', { extensions: { code: 'NOT_FOUND' } });
        }

        if (recipientRecord.uid === uid) {
          throw new GraphQLError('Cannot share a file with yourself', { extensions: { code: 'BAD_USER_INPUT' } });
        }

        // Get sharer display name
        let ownerName = '';
        try {
          const ownerRecord = await getAuth().getUser(uid);
          ownerName = ownerRecord.displayName || ownerRecord.email || '';
        } catch { /* ignore */ }

        // Get recipient display name
        const recipientName = recipientRecord.displayName || recipientRecord.email || '';

        // Check for existing active share (upsert: reactivate if revoked)
        const existing = await db
          .collection(`sharedWithMe/${recipientRecord.uid}/files`)
          .where('ownerUid', '==', uid)
          .where('fileId', '==', fileId)
          .get();

        let shareRef;
        if (!existing.empty) {
          shareRef = existing.docs[0].ref;
          await shareRef.update({ revokedAt: null, sharedAt: FieldValue.serverTimestamp() });
        } else {
          shareRef = db.collection(`sharedWithMe/${recipientRecord.uid}/files`).doc();
          await shareRef.set({
            ownerUid: uid,
            ownerName,
            recipientUid: recipientRecord.uid,
            recipientName,
            fileId,
            fileName: fileData.fileName ?? '',
            contentType: fileData.contentType ?? '',
            size: fileData.size ?? 0,
            downloadUrl: fileData.downloadUrl ?? '',
            sharedAt: FieldValue.serverTimestamp(),
            revokedAt: null,
          });
        }

        return { ok: true, shareId: shareRef.id };
      },

      revokeFileAccess: async (_: unknown, { shareId }: { shareId: string }, context: ResolverContext) => {
        const uid = requireAuth(context);
        const db = getFirestore();

        // Find the share doc across all recipients (collection group query)
        const snap = await db
          .collectionGroup('files')
          .where('ownerUid', '==', uid)
          .get();

        const target = snap.docs.find(d => d.id === shareId);
        if (!target) {
          throw new GraphQLError('Share not found', { extensions: { code: 'NOT_FOUND' } });
        }

        await target.ref.update({ revokedAt: FieldValue.serverTimestamp() });
        return true;
      },
    },
  };
}
