# Data Model: Cloud Files Manager Enhancements

**Feature**: 012-file-manager
**Date**: 2026-03-24

---

## Existing Entities (unchanged)

### CloudFile — `users/{uid}/files/{fileId}`

| Field | Type | Notes |
|-------|------|-------|
| `id` | string | Firestore doc ID |
| `fileName` | string | Display name (mutable via rename) |
| `contentType` | string | MIME type |
| `size` | number | Bytes |
| `downloadUrl` | string | Firebase Storage signed URL |
| `storagePath` | string | Storage path (never changes after upload) |
| `uploadedAt` | Timestamp | Server timestamp |
| `isDeleted` | boolean | Soft-delete flag (existing) |

### SharedFile (global) — `sharedFiles/{fileId}`

Unchanged. Used by existing global share flow. Preserved for backwards compatibility.

---

## New / Extended Entities

### CloudFile — Extended Fields

Two new optional fields added to `users/{uid}/files/{fileId}`:

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `folderId` | string \| null | `null` | References `users/{uid}/folders/{folderId}`; null = root level |

### Folder — `users/{uid}/folders/{folderId}`

New subcollection. Each document represents a named folder.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | auto | Firestore doc ID |
| `name` | string | yes | Display name; unique within same parent |
| `parentFolderId` | string \| null | yes | null = root-level folder |
| `createdAt` | Timestamp | yes | Server timestamp |
| `depth` | number | yes | 0 = top-level; max 4 (0-indexed, so 5 levels total) |

**Validation rules:**
- `name` must be non-empty, ≤ 255 characters.
- `name` must be unique within the same `parentFolderId` for the same user.
- `depth` must be ≤ 4 to enforce 5-level max hierarchy.
- Cannot delete a folder while it still contains files (`folderId` references exist) unless user confirms bulk-delete.

**State transitions:**
```
[create] → ACTIVE
ACTIVE   → [rename] → ACTIVE (name changes)
ACTIVE   → [delete + empty] → DELETED (document removed)
ACTIVE   → [delete + non-empty, confirmed] → DELETED (files inside also deleted)
```

### ShareRecipient — `sharedWithMe/{recipientUid}/files/{shareId}`

New collection for targeted sharing. Documents are written by the sharer; readable only by the recipient.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | string | auto | Firestore doc ID (`shareId`) |
| `ownerUid` | string | yes | UID of the file owner |
| `ownerName` | string | yes | Display name of the file owner |
| `fileId` | string | yes | References `users/{ownerUid}/files/{fileId}` |
| `fileName` | string | yes | Denormalized for display without extra lookup |
| `contentType` | string | yes | Denormalized |
| `size` | number | yes | Denormalized |
| `downloadUrl` | string | yes | Owner's download URL (read-only for recipient) |
| `sharedAt` | Timestamp | yes | Server timestamp |
| `revokedAt` | Timestamp \| null | yes | null = active; set when owner revokes access |

**Validation rules:**
- `recipientEmail` must resolve to a registered user in Firebase Auth.
- Cannot share a file with yourself.
- Cannot create a duplicate share (same `ownerUid` + `fileId` + `recipientUid`); re-sharing reactivates a revoked share.

**Revoking access**: Owner sets `revokedAt` on the document rather than deleting it, so the query can filter `where('revokedAt', '==', null)`. Soft-revoke simplifies the "re-share" path.

---

## Firestore Index Requirements

| Collection | Fields Indexed | Query Served |
|------------|----------------|--------------|
| `users/{uid}/files` | `(folderId ASC, uploadedAt DESC)` | Files in a specific folder, ordered by date |
| `users/{uid}/folders` | `(parentFolderId ASC, createdAt ASC)` | Sub-folders of a given parent |
| `sharedWithMe/{uid}/files` | `(revokedAt ASC, sharedAt DESC)` | Active shared files, newest first |

---

## GraphQL Schema Extensions

### New Types

```graphql
type Folder {
  id: ID!
  name: String!
  parentFolderId: ID
  createdAt: String!
  depth: Int!
}

type ShareRecipient {
  recipientUid: String!
  recipientName: String!
  shareId: String!
  sharedAt: String!
}

type TargetedShareResult {
  ok: Boolean!
  shareId: String!
}
```

### Extended Existing Types

```graphql
# CloudFile gains folderId (nullable)
type CloudFile {
  id: ID!
  fileName: String!
  contentType: String!
  size: Int!
  downloadUrl: String!
  storagePath: String!
  uploadedAt: String!
  folderId: ID          # NEW — null = root
}
```

### New Queries

```graphql
# Files in a specific folder (null = root)
cloudFilesInFolder(folderId: ID): [CloudFile!]!

# All folders for the authenticated user
folders: [Folder!]!

# Who a specific file has been shared with (owner only)
fileShareRecipients(fileId: ID!): [ShareRecipient!]!

# Files shared with the authenticated user (targeted only)
filesSharedWithMe: [TargetedSharedFile!]!
```

### New Mutations

```graphql
# Rename a file (display name only; storage path unchanged)
renameFile(fileId: ID!, newName: String!): CloudFile!

# Folder management
createFolder(name: String!, parentFolderId: ID): Folder!
deleteFolder(folderId: ID!, deleteContents: Boolean!): Boolean!
renameFolder(folderId: ID!, newName: String!): Folder!

# Move a file to a different folder (or to root with null)
moveFile(fileId: ID!, targetFolderId: ID): CloudFile!

# Targeted share: share with a specific user by email
shareFileWith(fileId: ID!, recipientEmail: String!): TargetedShareResult!

# Revoke targeted share access
revokeFileAccess(shareId: String!): Boolean!
```

---

## Client-Side Derived State (no backend)

### Storage Quota

Computed from the loaded `cloudFiles` array:

```ts
const usedBytes = files.reduce((sum, f) => sum + f.size, 0);
const totalBytes = 500 * 1024 * 1024; // 500 MB constant
const pct = usedBytes / totalBytes;
const isNearFull = pct >= 0.9;
```

No GraphQL query needed.

### Search & Filter

Computed from the loaded files array with `useMemo`:

```ts
const filtered = useMemo(() => {
  return files
    .filter(f => !query || f.fileName.toLowerCase().includes(query.toLowerCase()))
    .filter(f => !typeFilter || getFileIcon(f.contentType) === typeFilter);
}, [files, query, typeFilter]);
```

No backend changes.

---

## Firestore Security Rules Impact

New rules needed for:
- `users/{uid}/folders/{folderId}` — read/write only by owner (`uid == request.auth.uid`)
- `sharedWithMe/{uid}/files/{shareId}` — read only by recipient (`uid == request.auth.uid`); write only by the owner (enforced in Cloud Function, not rules, since owner UID is in doc data not the path)
