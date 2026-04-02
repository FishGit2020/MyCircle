# Tasks: Audiobook Batch Download

**Input**: Design documents from `/specs/024-audiobook-batch-download/`
**Prerequisites**: plan.md ✅ · spec.md ✅ · research.md ✅ · data-model.md ✅ · contracts/ ✅ · quickstart.md ✅

**Tests**: Included — test tasks are part of each user story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install the one new dependency before any implementation begins.

- [x] T001Add `"archiver": "^7.0.0"` to dependencies and `"@types/archiver": "^6.0.0"` to devDependencies in `functions/package.json`
- [x] T002 Run `cd functions && npm install` to install archiver and generate updated package-lock.json

**Checkpoint**: `archiver` available in functions — TypeScript can now import it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: GraphQL schema changes, shared query updates, and i18n keys must be in place before any frontend or backend feature work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T003 Add 5 zip fields (`zipStatus`, `zipUrl`, `zipSize`, `zipGeneratedAt`, `zipError`) to the `Book` type and add `requestBookZip(bookId: ID!): Boolean!` and `deleteBookZip(bookId: ID!): Boolean!` to the `Mutation` type in `functions/src/schema.ts` (add after the `audioError: String` field and after `cancelBookConversion` respectively)
- [x] T004 [P] Add `zipStatus zipUrl zipSize zipGeneratedAt zipError` to the `BOOK_FIELDS` gql fragment (after `audioError`) and add `REQUEST_BOOK_ZIP` and `DELETE_BOOK_ZIP` mutation gql constants (after `PERMANENT_DELETE_BOOK`) in `packages/shared/src/apollo/queries.ts`
- [x] T005 [P] Add 16 `library.*` i18n keys (audioDownload, downloadAllChapters, downloadingChapter, downloadComplete, downloadCancelled, cancelDownload, generateZip, generatingZip, zipReady, zipGenerated, downloadZip, generateNewZip, deleteZip, zipFailed, sequentialHint, zipHint) to `packages/shared/src/i18n/locales/en.ts` — insert before the blank line that precedes `widgets.noAudiobook` (line ~1979)
- [x] T006 [P] Add the same 16 keys with Spanish translations (Unicode escapes: `\u00ed` for í, `\u00fa` for ú, etc.) to `packages/shared/src/i18n/locales/es.ts` — insert before the blank line that precedes `widgets.noAudiobook` (line ~1981)
- [x] T007 [P] Add the same 16 keys with Chinese translations (Unicode escapes for all Chinese characters) to `packages/shared/src/i18n/locales/zh.ts` — insert before the blank line that precedes `widgets.noAudiobook` (line ~1981)
- [x] T008 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts` (depends on T003 and T004)
- [x] T009 Run `pnpm build:shared` to compile updated queries, i18n, and generated types (depends on T008, T005, T006, T007)

**Checkpoint**: Foundation ready — `REQUEST_BOOK_ZIP`, `DELETE_BOOK_ZIP`, zip fields on `Book`, and all i18n keys are available from `@mycircle/shared`.

---

## Phase 3: User Story 1 — Download All Chapters Immediately (Priority: P1) 🎯 MVP

**Goal**: Users can download all converted audio chapters as individual MP3 files directly from the Listen tab, with sequential progress and cancel support — no backend changes required.

**Independent Test**: Open a book with converted chapters → Listen tab → "Download All Chapters" → verify MP3 files save with correct filenames → click Cancel mid-download → verify download stops.

### Implementation for User Story 1

- [x] T010 [P] [US1] Extend the `Book` interface in `packages/digital-library/src/components/DigitalLibrary.tsx` with `audioError?: string`, `zipStatus?: 'none' | 'processing' | 'ready' | 'error'`, `zipUrl?: string`, `zipSize?: number`, `zipGeneratedAt?: string`, `zipError?: string`; extract `refetch` from the existing `useQuery(GET_BOOKS)` call
- [x] T011 [P] [US1] Extend `BookReaderProps` in `packages/digital-library/src/components/BookReader.tsx` with `zipStatus?: string`, `zipUrl?: string`, `zipSize?: number`, `zipGeneratedAt?: string`, `zipError?: string`, `onRefreshBook?: () => Promise<void>`
- [x] T012 [US1] Create `packages/digital-library/src/components/AudioDownload.tsx` implementing the sequential download section: "Download All Chapters" button (enabled only when ≥1 chapter has `audioUrl`), fetch-blob-anchor download loop, `{ current, total }` progress state displayed as `t('library.downloadingChapter', { current, total })`, progress bar, Cancel button using `AbortController`, file naming `` `${bookTitle} - Ch${index} ${title}.mp3` ``; render ZIP section as a disabled placeholder with `zipStatus === 'none'` hint only (full ZIP logic added in Phase 4)
- [x] T013 [US1] Import and render `<AudioDownload>` in `packages/digital-library/src/components/BookReader.tsx` in the Listen tab after `<ChapterConvertList>` (line ~683); pass all required props through from `BookReaderProps`
- [x] T014 [US1] Pass all zip fields and `onRefreshBook={async () => { await refetch(); }}` from the `<BookReader>` call in `packages/digital-library/src/components/DigitalLibrary.tsx` (~line 378)
- [x] T015 [P] [US1] Create `packages/digital-library/src/components/AudioDownload.test.tsx` with tests: (1) "Download All Chapters" enabled when chapters have audioUrl, (2) disabled when no chapters have audioUrl, (3) progress updates during sequential download (mock `global.fetch`, mock Blob/URL.createObjectURL), (4) Cancel stops download — mock `@mycircle/shared` with `useTranslation`, `useMutation`, `REQUEST_BOOK_ZIP`, `DELETE_BOOK_ZIP`; use `userEvent.setup({ delay: null })`; no assertion timeout > 5000ms

**Checkpoint**: User Story 1 is fully functional — sequential MP3 download with progress and cancel works independently.

---

## Phase 4: User Story 2 — Request a ZIP for Later Download (Priority: P2)

**Goal**: Users can request server-side ZIP generation, leave, return to find a ready download link, and download the complete audiobook in one click.

**Independent Test**: Click "Generate Audiobook ZIP" → `requestBookZip` mutation fires → `zipStatus` transitions to `'processing'` + spinner shown → mock ZIP ready → `zipStatus === 'ready'` card appears with size, date, "Download ZIP" link.

### Implementation for User Story 2

- [x] T016 [US2] Add `requestBookZip` mutation resolver to the `Mutation` object in `functions/src/resolvers/digitalLibrary.ts`: `requireAuth`, fetch book doc (throw `NOT_FOUND`), check chapters have at least one `audioUrl` (throw `BAD_USER_INPUT`), check `zipStatus !== 'processing'` (throw `BAD_USER_INPUT`), `bookRef.update({ zipStatus: 'processing', zipError: null })`, create `bookRef.collection('zipJobs').doc(randomUUID())` with `{ status: 'pending', bookId, createdAt: FieldValue.serverTimestamp() }`, return `true`
- [x] T017 [US2] Create `functions/src/handlers/zipWorker.ts` implementing `onZipJobCreated` — Firestore-triggered on `books/{bookId}/zipJobs/{jobId}` creation, `memory: '1GiB'`, `timeoutSeconds: 540`; logic: idempotency guard (`status !== 'pending'` → return), set job to `'processing'`, fetch book title + chapter titles into a `Map<index, title>`, list + sort Storage audio files by chapter index, stream chapters into `archiver('zip', { store: true })` via PassThrough buffer, collect Buffer, call `uploadToStorage(bucket, 'books/{bookId}/audiobook.zip', zipBuffer, 'application/zip')`, update book doc with `zipStatus: 'ready'`, `zipUrl`, `zipSize`, `zipGeneratedAt`, on error: set `zipStatus: 'error'` + `zipError`
- [x] T018 [US2] Add `export { onZipJobCreated } from './handlers/zipWorker.js';` to `functions/src/index.ts`
- [x] T019 [US2] Implement the full ZIP state machine in `packages/digital-library/src/components/AudioDownload.tsx`: replace placeholder with `switch(zipStatus)` — `'none'`: "Generate Audiobook ZIP" button (calls `requestBookZip` mutation) + `library.zipHint`; `'processing'`: spinner + `library.generatingZip` + `useEffect` with `setInterval(onRefreshBook, 10000)` (cleared on cleanup/status change); `'ready'`: green card with `library.zipReady`, formatted size, `library.zipGenerated` with date, `<a href={zipUrl} download>` for `library.downloadZip`, "Generate New ZIP" button; `'error'`: red card with `zipError` message + Retry button (calls `requestBookZip` mutation)
- [x] T020 [P] [US2] Extend `packages/digital-library/src/components/AudioDownload.test.tsx` with tests: (5) `zipStatus='none'` renders "Generate Audiobook ZIP" button, (6) `zipStatus='processing'` renders spinner + "Generating ZIP...", (7) `zipStatus='processing'` calls `onRefreshBook` after 10s (`vi.useFakeTimers()`, advance 10000ms), (8) `zipStatus='ready'` renders download link + size + date + "Generate New ZIP", (9) `zipStatus='error'` renders error message + Retry, (10) clicking "Generate Audiobook ZIP" calls `REQUEST_BOOK_ZIP` mutation

**Checkpoint**: User Stories 1 AND 2 are both functional — ZIP generation, async polling, and download all work independently.

---

## Phase 5: User Story 3 — Regenerate ZIP After Audio Reconversion (Priority: P3)

**Goal**: Users who have re-converted audio can request a fresh ZIP without losing the previous one until the new one is ready. Permanent book deletion also cleans up ZIP artifacts.

**Independent Test**: With `zipStatus='ready'` → both "Download ZIP" and "Generate New ZIP" buttons visible → click "Generate New ZIP" → `requestBookZip` mutation fires → status returns to `'processing'`.

### Implementation for User Story 3

- [x] T021 [US3] Add `deleteBookZip` mutation resolver to `functions/src/resolvers/digitalLibrary.ts`: `requireAuth`, fetch book doc (throw `NOT_FOUND`), `try { await bucket.file('books/{bookId}/audiobook.zip').delete() } catch {}`, delete all docs in `books/{bookId}/zipJobs` subcollection via batch, `bookRef.update({ zipStatus: 'none', zipUrl: null, zipSize: null, zipGeneratedAt: null, zipError: null })`, return `true`
- [x] T022 [US3] Add ZIP artifact cleanup to `permanentDeleteBook` in `functions/src/resolvers/digitalLibrary.ts` (after existing audio file deletion): `try { await bucket.file('books/{bookId}/audiobook.zip').delete() } catch {}` and a batch delete of all `books/{bookId}/zipJobs` subcollection docs
- [x] T023 [US3] Verify the "Generate New ZIP" button in `packages/digital-library/src/components/AudioDownload.tsx` is correctly wired — it should call the `requestBookZip` mutation (same as initial generate), causing backend to overwrite the existing ZIP; confirm the `'ready'` state card shows both "Download ZIP" and "Generate New ZIP" side-by-side
- [x] T024 [P] [US3] Extend `packages/digital-library/src/components/AudioDownload.test.tsx` with test: (11) clicking "Generate New ZIP" when `zipStatus='ready'` calls `REQUEST_BOOK_ZIP` mutation

**Checkpoint**: All three user stories are fully functional and independently testable.

---

## Phase 6: Polish & Verification

**Purpose**: Type safety, lint, tests, and MCP validation before PR.

- [x] T025 Run `cd functions && npx tsc --noEmit` to verify strict functions TypeScript (catches `noUnusedLocals`, import types, etc.)
- [x] T026 Run `pnpm lint && pnpm test:run && pnpm typecheck` — all three must pass; fix any failures before pushing
- [x] T027 [P] Run `validate_i18n` MCP tool to confirm all 3 locale files have identical key sets
- [x] T028 [P] Run `validate_all` MCP tool to confirm no integration point gaps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 completion; no backend changes — frontend only
- **US2 (Phase 4)**: Depends on Phase 2 + Phase 3 (AudioDownload.tsx must exist to extend it)
- **US3 (Phase 5)**: Depends on Phase 4 (deleteBookZip resolver follows requestBookZip; "Generate New ZIP" button is already in Phase 4)
- **Polish (Phase 6)**: Depends on all story phases complete

### User Story Dependencies

- **US1 (P1)**: Pure frontend — no backend resolvers needed; only requires Foundational phase
- **US2 (P2)**: Requires US1's AudioDownload component to exist (extends it); adds backend resolver + Cloud Function
- **US3 (P3)**: Requires US2's "Generate New ZIP" button (already wired in Phase 4); adds deleteBookZip + permanentDeleteBook cleanup

### Within Each Phase

- T010 and T011 (Phase 3) can run in parallel — different files
- T016, T017, T018 (Phase 4) are sequential: resolver → worker → index export
- T021 and T022 (Phase 5) can run in parallel — both in same file but non-overlapping sections
- T027 and T028 (Phase 6) can run in parallel — independent validators

### Key Sequential Chains

```
T001 → T002                                    (archiver install)
T003 → T008 → T009                             (schema → codegen → build:shared)
T004 ↗         ↑                               (queries fragment, feeds into codegen)
T005/T006/T007 ↗                               (i18n, feeds into build:shared)
T009 → T010/T011 → T012 → T013 → T014 → T015  (US1 frontend chain)
T015 → T016 → T017 → T018 → T019 → T020       (US2: extend component + backend)
T020 → T021/T022 → T023 → T024                (US3: cleanup + verify regenerate)
T024 → T025 → T026 → T027/T028                (verification)
```

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
# Run all together after T001/T002:
T003  Add zip fields to functions/src/schema.ts
T004  Add zip fields to packages/shared/src/apollo/queries.ts
T005  Add i18n keys to en.ts
T006  Add i18n keys to es.ts
T007  Add i18n keys to zh.ts

# Then sequentially:
T008  pnpm codegen         (needs T003 + T004)
T009  pnpm build:shared    (needs T008 + T005 + T006 + T007)
```

### Phase 3 (US1)

```
# Run together after T009:
T010  Extend Book interface in DigitalLibrary.tsx
T011  Extend BookReaderProps in BookReader.tsx

# Then sequentially:
T012  Create AudioDownload.tsx (sequential section)
T013  Render AudioDownload in BookReader.tsx
T014  Pass props from DigitalLibrary.tsx
T015  Write AudioDownload.test.tsx (sequential tests) ← can be parallel with T012-T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (install archiver)
2. Complete Phase 2: Foundational (schema + shared + i18n)
3. Complete Phase 3: User Story 1 (sequential download)
4. **STOP and VALIDATE**: Download all chapters from a real book → correct filenames, progress, cancel
5. Ship if sequential download alone delivers sufficient value

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → Sequential download works → **MVP: ship it**
3. Phase 4 (US2) → ZIP generation + async polling → Deploy/Demo
4. Phase 5 (US3) → ZIP regeneration + cleanup → Deploy/Demo
5. Each phase adds value without breaking previous phases

---

## Notes

- **`audioError` addition**: The `Book` interface in `DigitalLibrary.tsx` currently omits `audioError` even though the resolver maps it. T010 adds it for correctness alongside the zip fields.
- **No shared/index.ts edit needed**: `REQUEST_BOOK_ZIP` and `DELETE_BOOK_ZIP` are auto-exported via `export * from './queries'` → `export * from './apollo'` → `export * from './apollo'` chain. No additional re-export step required.
- **ZIP overwrite**: When the user requests a new ZIP (US3), the worker uploads to the same storage path `books/{bookId}/audiobook.zip`, overwriting the old file. `deleteBookZip` is for explicit cleanup only.
- **Polling cleanup**: The `setInterval` in `AudioDownload.tsx` MUST be cleared in the `useEffect` cleanup function AND when `zipStatus` changes away from `'processing'` — use the deps array `[zipStatus]` and return the clearInterval callback.
- **es.ts Unicode escapes**: Read the exact line before editing — the file uses `\u00xx` escapes, not literal accented characters.
- [P] tasks operate on different files with no incomplete dependencies
- Commit after each phase or logical group of tasks
- Stop at each Checkpoint to validate independently before continuing
