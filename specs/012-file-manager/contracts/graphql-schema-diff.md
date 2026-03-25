# GraphQL Schema Contract: Cloud Files Enhancements

**Feature**: 012-file-manager
**File to modify**: `functions/src/schema.ts`
**Date**: 2026-03-24

This document defines the exact changes to add to the existing GraphQL schema. All new types, queries, and mutations are additive — nothing existing is removed or changed.

---

## Types to Add

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

type TargetedSharedFile {
  shareId: String!
  ownerUid: String!
  ownerName: String!
  fileId: String!
  fileName: String!
  contentType: String!
  size: Int!
  downloadUrl: String!
  sharedAt: String!
}
```

## CloudFile Type — Add Optional Field

```graphql
# Change: add folderId field (nullable — backwards compatible)
type CloudFile {
  id: ID!
  fileName: String!
  contentType: String!
  size: Int!
  downloadUrl: String!
  storagePath: String!
  uploadedAt: String!
  folderId: ID          # NEW
}
```

---

## Queries to Add (inside `type Query`)

```graphql
# Cloud Files — enhancements
folders: [Folder!]!
fileShareRecipients(fileId: ID!): [ShareRecipient!]!
filesSharedWithMe: [TargetedSharedFile!]!
```

---

## Mutations to Add (inside `type Mutation`)

```graphql
# Cloud Files — enhancements
renameFile(fileId: ID!, newName: String!): CloudFile!
createFolder(name: String!, parentFolderId: ID): Folder!
deleteFolder(folderId: ID!, deleteContents: Boolean!): Boolean!
renameFolder(folderId: ID!, newName: String!): Folder!
moveFile(fileId: ID!, targetFolderId: ID): CloudFile!
shareFileWith(fileId: ID!, recipientEmail: String!): TargetedShareResult!
revokeFileAccess(shareId: String!): Boolean!
```

---

## Resolver File to Create

**File**: `functions/src/resolvers/cloudFilesEnhancements.ts`
**Factory function**: `createCloudFilesEnhancementResolvers()`
**Pattern**: Follows the same factory pattern as `createCloudFileResolvers()` in `functions/src/resolvers/cloudFiles.ts`.

---

## Apollo Query Constants to Add

**File**: `packages/shared/src/apollo/queries.ts`

```ts
export const GET_FOLDERS = gql`
  query GetFolders {
    folders {
      id
      name
      parentFolderId
      createdAt
      depth
    }
  }
`;

export const GET_FILE_SHARE_RECIPIENTS = gql`
  query GetFileShareRecipients($fileId: ID!) {
    fileShareRecipients(fileId: $fileId) {
      recipientUid
      recipientName
      shareId
      sharedAt
    }
  }
`;

export const GET_FILES_SHARED_WITH_ME = gql`
  query GetFilesSharedWithMe {
    filesSharedWithMe {
      shareId
      ownerUid
      ownerName
      fileId
      fileName
      contentType
      size
      downloadUrl
      sharedAt
    }
  }
`;

export const RENAME_FILE = gql`
  mutation RenameFile($fileId: ID!, $newName: String!) {
    renameFile(fileId: $fileId, newName: $newName) {
      id
      fileName
    }
  }
`;

export const CREATE_FOLDER = gql`
  mutation CreateFolder($name: String!, $parentFolderId: ID) {
    createFolder(name: $name, parentFolderId: $parentFolderId) {
      id
      name
      parentFolderId
      createdAt
      depth
    }
  }
`;

export const DELETE_FOLDER = gql`
  mutation DeleteFolder($folderId: ID!, $deleteContents: Boolean!) {
    deleteFolder(folderId: $folderId, deleteContents: $deleteContents)
  }
`;

export const RENAME_FOLDER = gql`
  mutation RenameFolder($folderId: ID!, $newName: String!) {
    renameFolder(folderId: $folderId, newName: $newName) {
      id
      name
    }
  }
`;

export const MOVE_FILE = gql`
  mutation MoveFile($fileId: ID!, $targetFolderId: ID) {
    moveFile(fileId: $fileId, targetFolderId: $targetFolderId) {
      id
      folderId
    }
  }
`;

export const SHARE_FILE_WITH = gql`
  mutation ShareFileWith($fileId: ID!, $recipientEmail: String!) {
    shareFileWith(fileId: $fileId, recipientEmail: $recipientEmail) {
      ok
      shareId
    }
  }
`;

export const REVOKE_FILE_ACCESS = gql`
  mutation RevokeFileAccess($shareId: String!) {
    revokeFileAccess(shareId: $shareId)
  }
`;
```

---

## Codegen Note

After all schema and query changes, run:

```bash
pnpm codegen
```

This regenerates `packages/shared/src/apollo/generated.ts`. Commit the generated file.

---

## Firestore Rules Contract

**File**: `firestore.rules`

New rules to add:

```
// Folders: owner-only read/write
match /users/{uid}/folders/{folderId} {
  allow read, write: if request.auth != null && request.auth.uid == uid;
}

// Files shared with a recipient: recipient reads, Cloud Function writes
match /sharedWithMe/{uid}/files/{shareId} {
  allow read: if request.auth != null && request.auth.uid == uid;
  // Write is performed server-side (Cloud Function) — deny client writes
  allow write: if false;
}
```
