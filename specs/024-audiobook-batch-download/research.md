# Research: Audiobook Batch Download

## Decisions

---

### Decision 1: ZIP trigger path — `books/{bookId}/zipJobs/{jobId}` (not `users/{uid}/...`)

**Decision**: Trigger the zip worker via a job document at `books/{bookId}/zipJobs/{jobId}`.

**Rationale**: The batch conversion worker uses `users/{uid}/conversionBatchJobs/{jobId}` because jobs are user-scoped (quota tracking, per-user fan-out). ZIP generation is book-scoped — only one ZIP per book can be outstanding — so anchoring the trigger doc under the book itself is the natural path. It also lets `permanentDeleteBook` clean up zipJobs in one place without needing to know the owner UID.

**Alternatives considered**:
- `users/{uid}/bookZipJobs/{jobId}` — rejected; adds UID dependency to cleanup and adds complexity for no benefit.

---

### Decision 2: ZIP compression — `store` mode (no compression)

**Decision**: Use `archiver` with `store` method (ZIP_STORE, no compression).

**Rationale**: MP3 files are already compressed. Applying additional compression yields negligible size savings (< 1%) while adding significant CPU cost. At 363 MB max book size and 9-minute Cloud Function timeout, avoiding wasted CPU is critical. This was explicitly called out in the spec.

**Alternatives considered**:
- DEFLATE compression — rejected; wastes CPU on incompressible data.

---

### Decision 3: ZIP memory strategy — collect buffer then upload

**Decision**: Collect the archiver output into a Buffer via a passthrough stream, then upload with `uploadToStorage()` in one call.

**Rationale**: `uploadToStorage()` (in `functions/src/handlers/shared.ts`) takes a `Buffer`. The largest book is ~363 MB. With 1 GiB allocated memory, buffering the full ZIP is safe (363 MB < 1 GiB). Streaming directly to Storage upload is possible but requires the `@google-cloud/storage` resumable upload API, which adds complexity. The buffer approach reuses the existing `uploadToStorage()` helper with zero new patterns.

**Alternatives considered**:
- Streaming directly to Storage resumable upload — rejected; adds complexity and `uploadToStorage()` doesn't support it without modification.

---

### Decision 4: ZIP URL strategy — Firebase Storage authenticated download token

**Decision**: Use `uploadToStorage()` which returns a `firebaseStorageDownloadTokens`-based URL. This URL is public (no sign-in required once you have the token) and permanent until the file is deleted.

**Rationale**: Consistent with every other Storage file in the project (audio files, cover images). The `uploadToStorage()` helper already generates a stable download URL. No expiry to manage.

**Alternatives considered**:
- Signed URL with expiry — rejected; requires periodic refresh and complicates the "come back later" UX.
- Public `.makePublic()` URL — rejected; makes ZIP world-readable without token protection.

---

### Decision 5: Frontend polling — `setInterval` inside `useEffect`, not a polling hook library

**Decision**: Implement a 10-second `setInterval` directly in `AudioDownload.tsx` using `useEffect`. Interval is started when `zipStatus === 'processing'` and cleared otherwise.

**Rationale**: This is the established pattern in the codebase (polling is used in `ConversionStatus.tsx` with `setInterval`). No new library needed. The cleanup is straightforward and testable with `vi.useFakeTimers()`.

**Alternatives considered**:
- `react-query` / `swr` polling — rejected; would add a dependency not in the project stack.
- Long-polling / WebSocket — rejected; overkill for a low-frequency status check.

---

### Decision 6: Book data refresh for ZIP status — new `onRefreshBook` prop

**Decision**: Add an `onRefreshBook: () => Promise<void>` prop to `BookReader` and pass it through to `AudioDownload`. In `DigitalLibrary.tsx`, this calls the `refetch()` function from the `GET_BOOKS` Apollo query.

**Rationale**: The existing `onRefreshChapters` prop in `BookReader` only re-fetches chapters (via `GET_BOOK_CHAPTERS`). ZIP status lives on the book document itself and is returned by `GET_BOOKS`. A separate callback keeps concerns separated and avoids fetching all chapter data on every 10-second poll.

**Alternatives considered**:
- Reuse `onRefreshChapters` to also refetch the book — rejected; wrong query, wrong data shape.
- Store `zipStatus` in local state and update via GraphQL subscription — rejected; subscriptions are not used in this MFE.

---

### Decision 7: `archiver` package version

**Decision**: Add `archiver@^7.0.0` to `functions/package.json` dependencies, `@types/archiver@^6.0.0` to devDependencies.

**Rationale**: `archiver@7.x` is the current stable release. `@types/archiver@6.x` is the matching type definitions. Neither is currently installed in `functions/package.json`. Run `cd functions && npm install` after adding.

**Alternatives considered**:
- `jszip` — rejected; loads entire ZIP into memory before writing; `archiver` is streaming-first.
- `adm-zip` — rejected; older, less maintained, also not streaming-first.

---

### Decision 8: Chapter title lookup in ZIP worker

**Decision**: Fetch all chapter docs from `books/{bookId}/chapters` in one batch at the start of the worker (before the archiver loop), build a `Map<number, string>` of `chapterIndex → title`, then use it when naming entries.

**Rationale**: Chapter titles are needed for file naming. A single `collection.get()` is faster than per-file Firestore reads inside the loop. The chapters subcollection is already used by the conversion worker.

---

### Decision 9: `Book` interface in DigitalLibrary.tsx — add `audioError` + zip fields

**Decision**: Add `audioError?: string` (currently missing from the local interface despite being in `docToBook()`) and all 5 zip fields to the `Book` interface.

**Rationale**: The `Book` interface in `DigitalLibrary.tsx` is a local TypeScript interface that mirrors the GraphQL type. It currently omits `audioError`. Since we're touching this interface anyway, we add `audioError` for correctness, then add the 5 zip fields. This keeps the local type consistent with the GraphQL schema.
