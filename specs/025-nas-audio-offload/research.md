# Research: Synology NAS Integration for Digital Library Audio Offload

**Branch**: `025-nas-audio-offload` | **Date**: 2026-04-02

## Summary

All decisions were pre-resolved in the feature description. No NEEDS CLARIFICATION markers were present in the spec. Research below documents the chosen approaches and alternatives considered.

---

## Decision 1: Synology FileStation API Authentication

**Decision**: Use session-based login (`SYNO.API.Auth`) — POST to `/webapi/auth.cgi`, receive `sid` (session ID), pass as query param or cookie on subsequent calls, then logout after each operation.

**Rationale**: FileStation API is the standard Synology DSM web API. Session-based auth is the documented approach. The `sid` approach is stateless from our perspective (login → operate → logout per Cloud Function invocation), which aligns with the "login/logout per operation" design decision.

**Alternatives considered**:
- OAuth2: Not supported by Synology FileStation API natively.
- API tokens: Available in newer DSM versions but not universally supported; session auth covers all DSM 6.x+ versions.
- Persistent session: Not viable — Cloud Functions are stateless and sessions expire. Eliminated.

**Implementation notes**:
- Login endpoint: `POST {nasUrl}/webapi/auth.cgi` with form body `api=SYNO.API.Auth&version=3&method=login&account={username}&passwd={password}&session=FileStation&format=sid`
- Logout: same endpoint with `method=logout&session=FileStation`
- All subsequent calls pass `_sid={sid}` as query param
- AbortSignal timeout of 15s per HTTP call (network latency to external NAS)

---

## Decision 2: File Upload Method to FileStation

**Decision**: Use `SYNO.FileStation.Upload` via multipart POST (`/webapi/entry.cgi`). Send the audio buffer as `file` field with `dest_folder_path` and `filename` fields.

**Rationale**: FileStation Upload API is the documented method for uploading files. Multipart form data is natively supported in Node.js via `FormData` (available globally in Node 18+, which Cloud Functions Node 22 provides). No new npm dependency required.

**Alternatives considered**:
- Streaming upload: FileStation API doesn't support chunked transfer encoding; buffer-based upload required.
- Third-party NAS libraries (e.g., `synology-api`): Avoid adding npm dependency to `functions/package.json` for a thin wrapper.

**Implementation notes**:
- Node 22 has built-in `FormData` and `fetch` — no new deps needed
- Max buffer per chapter: ~50MB (typical audiobook chapter). Well within Cloud Function memory (1GB default).
- Upload URL: `POST {nasUrl}/webapi/entry.cgi?api=SYNO.FileStation.Upload&version=2&method=upload&_sid={sid}`

---

## Decision 3: File Download from FileStation

**Decision**: Use `SYNO.FileStation.Download` via GET request to `/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&path={encodedPath}&mode=download&_sid={sid}`. Read response as `ArrayBuffer` → convert to `Buffer`.

**Rationale**: FileStation Download API streams file content directly. This lets us pipe the response buffer to Firebase Storage re-upload without writing to disk.

**Alternatives considered**:
- NFS/SMB mount: Not viable in Cloud Functions (no persistent filesystem mount).
- WebDAV: Synology supports WebDAV but requires additional DSM configuration. FileStation API is always enabled.

---

## Decision 4: Folder Creation Before Upload

**Decision**: Use `SYNO.FileStation.CreateFolder` before the first upload to a book's subfolder. Call once per book offload (not per chapter). On error, check if error code 1101 ("folder already exists") and continue.

**Rationale**: Uploading to a non-existent folder silently fails. Creating idempotently is the safe approach.

**Implementation notes**:
- Endpoint: `POST {nasUrl}/webapi/entry.cgi` with body `api=SYNO.FileStation.CreateFolder&version=2&method=create&folder_path={destFolder}/books&name={bookId}&_sid={sid}`
- Error code 1101 = folder exists → treat as success

---

## Decision 5: Storage Path Derivation

**Decision**: Use the convention `books/{bookId}/audio/chapter-{index}.mp3` as the primary Firebase Storage path. Fall back to `books/{bookId}/audio/chapter-{chapterIndex}.mp3` derived from chapter `index` field. Do NOT rely on `audioStoragePath` Firestore field (inconsistently populated).

**Rationale**: The `audioStoragePath` field is not reliably set by all TTS conversion workers. The convention-based path is consistent and matches the pattern used by the batch download feature (024).

**Implementation notes**:
- Use `bucket.file(storagePath).exists()` to verify before attempting download
- If not found at primary path, throw a descriptive error (do not silently fail)

---

## Decision 6: NAS Folder Structure

**Decision**: `{destFolder}/books/{bookId}/chapter-{index}.mp3`

**Rationale**: Mirrors Firebase Storage structure. Makes it easy to identify files by book and chapter index. The `destFolder` default is `/MyCircle`.

**Example**: `/MyCircle/books/abc123/chapter-0.mp3`

---

## Decision 7: Credential Security

**Decision**: Store NAS `username` and `password` in Firestore `users/{uid}/nasConnection/config` document (at-rest encrypted by GCP). Never return the password via GraphQL — only `hasCredentials: boolean`.

**Rationale**: Identical pattern to SQL connection (`apiKey` never returned). Firestore at-rest encryption is the existing project security model for per-user connection configs.

**Alternatives considered**:
- Secret Manager per user: Too expensive and complex for per-user secrets.
- Client-side encryption: Not needed — Firestore at-rest encryption is sufficient for this use case.

---

## Decision 8: Synchronous vs Async Operations

**Decision**: Synchronous Cloud Function mutations. No Firestore-triggered background workers.

**Rationale**: Single chapter operations are fast (seconds for typical 50MB files). Even a 20-chapter batch fits within the 540s Cloud Function timeout. Async workers would add significant complexity (job tracking, status polling) that's unnecessary at this scale.

**Risk mitigation**: Batch mutation returns partial results if some chapters fail or timeout. Cloud Function timeout is 540s (9 minutes); a 20-chapter book at ~10s/chapter = ~200s — well within limit.

---

## Decision 9: Post-Restore State

**Decision**: After a successful restore, keep `nasArchived: true` and `nasPath` set on the chapter doc. The `audioUrl` and `audioStoragePath` are re-populated. This means audio exists in both locations — the user can offload again.

**Rationale**: Preserving NAS metadata after restore means the user doesn't lose the archive record. The chapter UI will show both the play button and a NAS indicator, making it clear audio can be re-offloaded.

---

## Decision 10: `audioStatus` Book Field

**Decision**: Leave book-level `audioStatus` as `'complete'` when chapters are offloaded. No new enum value.

**Rationale**: The audio conversion has been completed; the audio exists, just in cold storage. The `audioStatus` field tracks conversion status, not storage location. Adding a new status value would require changes in multiple components and UI states with no user benefit.
