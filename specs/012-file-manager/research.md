# Research: Cloud Files Manager Enhancements

**Feature**: 012-file-manager
**Date**: 2026-03-24

---

## Existing Codebase Audit

### What Already Exists

| Area | Location | Detail |
|------|----------|--------|
| MFE package | `packages/cloud-files/` | Full MFE: upload, browse, share, delete, download |
| GraphQL queries | `packages/shared/src/apollo/queries.ts` | `GET_CLOUD_FILES`, `GET_SHARED_FILES`, `SHARE_FILE`, `DELETE_FILE`, `DELETE_SHARED_FILE` |
| Backend resolvers | `functions/src/resolvers/cloudFiles.ts` | `createCloudFileResolvers()` — all current ops |
| Upload handler | `functions/src/handlers/cloudFiles.ts` | REST POST `/cloud-files/upload` (base64 body) |
| Upload bridge | `packages/shell/src/lib/firebase.ts` | `window.__cloudFiles.upload()` |
| Firestore: user files | `users/{uid}/files/{fileId}` | Fields: `fileName`, `contentType`, `size`, `downloadUrl`, `storagePath`, `uploadedAt`, `isDeleted` |
| Firestore: shared | `sharedFiles/{fileId}` | Global collection; fields: `fileName`, `contentType`, `size`, `downloadUrl`, `storagePath`, `sharedBy{uid,displayName}`, `sharedAt` |
| Storage: private | `users/{uid}/files/{fileName}` | Firebase Storage path |
| Storage: shared | `shared-files/{fileId}/{fileName}` | Copied on share mutation |
| File constraints | `fileHelpers.ts` | Max 5 MB; allowed: JPEG, PNG, GIF, WebP, PDF, TXT, CSV, DOC, DOCX, XLS, XLSX |
| Shell widget | `CloudFilesWidget.tsx` | Shows file count; listens to `CLOUD_FILES_CHANGED` event |

---

## Decision Log

### Decision 1: Search & Filter — Client-side vs. Server-side

**Decision**: Client-side filtering of the already-loaded `cloudFiles` array.

**Rationale**: The `GET_CLOUD_FILES` query loads all user files on page open. A `useMemo` filter over the local array is instantaneous, requires zero backend changes, and handles the expected scale (hundreds of files per user). Server-side search would add latency, a new GraphQL argument, and a Firestore index — unnecessary complexity per Constitution Principle VI (Simplicity).

**Alternatives considered**:
- `cloudFiles(search: String, type: String)` GraphQL argument — rejected: over-engineering for client-local data already in memory.

---

### Decision 2: Folder Hierarchy — Firestore Schema

**Decision**: New top-level subcollection `users/{uid}/folders/{folderId}`. Files get an optional `folderId` field (null = root). Single-level queries using `where('folderId', '==', folderId)`.

**Rationale**: Firestore doesn't support recursive subtree queries, so a flat folder model with a `parentFolderId` reference is the simplest viable approach. Each folder query is a single index-backed `where` clause. Max 5 levels deep (spec requirement) is enforced at mutation time.

**Alternatives considered**:
- Nested subcollections (`folders/{folderId}/files`) — rejected: complicates cross-folder queries and moves.
- Materialized path strings (`/Work/2024/`) — rejected: string parsing fragile; renaming a parent folder requires updating all descendants.

---

### Decision 3: File Rename — Storage Path

**Decision**: Rename updates only the `fileName` field in Firestore. The Storage path is **not** renamed.

**Rationale**: Firebase Storage signed URLs are bound to the storage path. Renaming the path would require: copying the object, regenerating the download URL, updating Firestore, and deleting the old object — complex and risky. The spec explicitly states "file rename only changes the display name." The download URL remains valid since it points to the original path.

**Alternatives considered**:
- Full copy-rename-delete in Storage — rejected: complex, slow, doubles storage temporarily, risks orphaned objects on partial failure.

---

### Decision 4: Targeted Sharing — Firestore Schema

**Decision**: Replace the global `sharedFiles` collection approach with per-recipient documents in a new `sharedWithMe/{uid}/files/{fileId}` structure, pointing back to the original owner's file metadata. The original `shareFile` mutation (global) is preserved alongside the new `shareFileWith(recipientEmail)` mutation.

**Rationale**: The existing global `sharedFiles` collection copies the Storage object to a new path. For targeted sharing, copying per recipient wastes Storage space. Instead, store a Firestore document in `sharedWithMe/{recipientUid}/files/{shareId}` that references the owner's download URL and file metadata — no Storage duplication needed. The owner can see all `sharedWithMe` documents referencing their files to support the "revoke access" requirement.

**Alternatives considered**:
- Adding `recipientUids[]` field to `sharedFiles` — rejected: global collection is readable by all users; targeted sharing requires per-user scoping.
- Single `fileShares` collection with `(ownerUid, recipientUid, fileId)` — viable but requires two indexes. `sharedWithMe/{uid}/files` is simpler and aligns with the existing `users/{uid}/files` pattern.

---

### Decision 5: Storage Quota — Calculation Method

**Decision**: Calculate used bytes client-side by summing `size` fields from the already-loaded `cloudFiles` array. Display total quota as a constant (500 MB). No new GraphQL query needed.

**Rationale**: All file sizes are already loaded with `GET_CLOUD_FILES`. A `reduce` over the local array is O(n) and instant. Adding a `storageQuota` GraphQL query for a derived sum that can be computed locally adds backend complexity with no user benefit. The 90% warning threshold is computed from the same sum.

**Alternatives considered**:
- `storageQuota: StorageQuota` GraphQL query summing Firestore on the backend — rejected: duplicates data already on the client.
- Maintaining a running `totalBytes` counter on the user profile — rejected: complex to keep consistent on concurrent updates.

---

### Decision 6: File Preview — Browser-Native vs. Library

**Decision**: Browser-native rendering. Images rendered with `<img>` in a modal overlay. PDFs rendered with `<iframe src={downloadUrl}>` (browsers support inline PDF rendering natively).

**Rationale**: No additional npm dependency needed. Works for all spec-required types (JPEG, PNG, GIF, WebP, PDF). The `<iframe>` approach delegates PDF parsing to the browser engine (Chrome, Safari, Firefox all support native PDF rendering). Keeps the bundle small.

**Alternatives considered**:
- `react-pdf` / `pdf.js` — rejected: heavy dependency (~300 KB gzip) for functionality browsers already provide for free.
- Google Docs Viewer proxy URL — rejected: requires external network call; doesn't work offline; leaks file URL to Google.

---

### Decision 7: Upload Abort / Cleanup on Failure

**Decision**: The existing upload handler (`functions/src/handlers/cloudFiles.ts`) already returns an error response on failure. The MFE will catch errors and not add failed files to the list. No changes needed to the Storage cleanup path — Firebase Storage does not create a persistent object until the upload stream completes successfully.

**Rationale**: The upload is a REST POST that streams the base64 body. If the Cloud Function throws before writing to Storage, no object is created. If Storage write succeeds but Firestore write fails, the handler must roll back (delete the Storage object). This defensive pattern needs to be confirmed in the handler — added as a task if missing.

---

## Constitution Gate Pre-Check

| Gate | Status | Note |
|------|--------|------|
| Federated Isolation | ✅ Pass | New hooks and components stay inside `packages/cloud-files/`. All Apollo imports via `@mycircle/shared`. |
| Complete Integration | ✅ Pass | No new MFE — this is an enhancement. Only new i18n keys needed (all 3 locales). |
| GraphQL-First | ✅ Pass | New mutations: `renameFile`, `createFolder`, `deleteFolder`, `moveFile`, `shareFileWith`, `revokeFileAccess`. Upload REST bridge is pre-existing and exempt. |
| Inclusive by Default | ✅ Pass | All new strings i18n-keyed; dark mode on all new color classes; aria-labels on all interactive elements. |
| Fast Tests, Safe Code | ✅ Pass | Client-side search/filter tested with in-memory mocks; GraphQL mutations mocked in unit tests. |
| Simplicity | ✅ Pass | No extra abstractions: client-side search, client-side quota, browser-native preview. |
