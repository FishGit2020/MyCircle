# Tasks: Synology NAS Integration for Digital Library Audio Offload

**Input**: Design documents from `/specs/025-nas-audio-offload/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/graphql.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.
**Tests**: Not explicitly requested — no test tasks generated.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (NAS HTTP Client)

**Purpose**: Create the core Synology FileStation HTTP client — the foundational building block used by all NAS resolver operations. No GraphQL or frontend work yet.

- [ ] T001 Create `functions/src/nasClient.ts` with: `NasConnectionConfig` interface (`nasUrl`, `username`, `password`, `destFolder`, `status`, `lastTestedAt`); `NasFileStationClient` class with `login()` (POST `/webapi/auth.cgi`, returns `sid`), `logout()`, `createFolder(folderPath, name)` (SYNO.FileStation.CreateFolder, treat error code 1101 as success), `upload(destFolder, fileName, buffer)` (SYNO.FileStation.Upload multipart POST using Node 22 native FormData + fetch), `download(filePath)` (SYNO.FileStation.Download GET, returns Buffer); `testNasConnection(config)` function that logs in, attempts to list `config.destFolder`, logs out, returns `{ ok: boolean; error?: string }`; `getCachedNasConfig(uid)` and `clearNasConfigCache(uid)` using an in-memory Map with 60s TTL (exact pattern from `functions/src/sqlClient.ts` lines 33–48). All HTTP calls use `AbortSignal.timeout(15_000)`.

**Checkpoint**: `cd functions && npx tsc --noEmit` passes on nasClient.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema extensions, codegen, shared queries, i18n, and Firestore rules that ALL user story phases depend on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete all tasks in this phase before starting Phase 3.

- [ ] T002 [P] Extend `functions/src/schema.ts` with: (a) add `nasArchived: Boolean` and `nasPath: String` fields to the existing `type BookChapter` block (around line 219); (b) add new types `NasConnectionStatus`, `NasConnectionInput`, `NasArchiveResult` (exact definitions from `specs/025-nas-audio-offload/contracts/graphql.md`); (c) add `nasConnectionStatus: NasConnectionStatus` to the Query type; (d) add mutations `saveNasConnection`, `testNasConnection`, `deleteNasConnection`, `archiveChapterToNas`, `archiveBookToNas`, `restoreChapterFromNas` to the Mutation type (exact signatures from contracts/graphql.md).
- [ ] T003 [P] Add `nasArchived: d.data().nasArchived ?? false` and `nasPath: d.data().nasPath ?? null` to the `bookChapters` resolver return mapping in `functions/src/resolvers/digitalLibrary.ts` (around lines 91–99 in the `snap.docs.map()` block).
- [ ] T004 [P] Add all 22 i18n keys to all 3 locale files: (a) `packages/shared/src/i18n/locales/en.ts` — add `setup.tabs.nas`, `setup.nas.*` (title, description, nasUrl, nasUrlPlaceholder, username, usernamePlaceholder, password, passwordPlaceholder, destFolder, destFolderPlaceholder, saveAndTest, retest, delete, deleteConfirm, testing, savedSuccess, savedWithError, lastTested, status.connected, status.error, status.disconnected, status.none) and `library.nas.*` (offload, offloadAll, restore, archived, offloading, restoring, offloadSuccess, restoreSuccess, offloadError, restoreError, batchSummary, archivedTooltip) keys; (b) `packages/shared/src/i18n/locales/zh.ts` — add same keys with Chinese translations; (c) `packages/shared/src/i18n/locales/es.ts` — add same keys with Spanish translations using Unicode escapes (e.g. `\u00f3`). Read the exact surrounding lines of each file before editing to preserve formatting.
- [ ] T005 [P] Add explicit Firestore rule for the `nasConnection` subcollection inside the `match /users/{userId}` block of `firestore.rules`: `match /nasConnection/{document=**} { allow read, write: if request.auth != null && request.auth.uid == userId; }`.
- [ ] T006 Run `pnpm codegen` from the repo root to regenerate `packages/shared/src/apollo/generated.ts` with the new NAS types. (Depends on T002.)
- [ ] T007 Add NAS queries and mutations to `packages/shared/src/apollo/queries.ts`: (a) extend the existing `GET_BOOK_CHAPTERS` query (around line 1063) to include `nasArchived` and `nasPath` fields; (b) add `GET_NAS_CONNECTION_STATUS`, `SAVE_NAS_CONNECTION`, `TEST_NAS_CONNECTION`, `DELETE_NAS_CONNECTION`, `ARCHIVE_CHAPTER_TO_NAS`, `ARCHIVE_BOOK_TO_NAS`, `RESTORE_CHAPTER_FROM_NAS` constants with the exact field selections from `specs/025-nas-audio-offload/contracts/graphql.md`. All are auto-exported via `packages/shared/src/apollo/index.ts` — no additional re-export needed. (Depends on T006.)
- [ ] T008 Run `pnpm build:shared` from the repo root to rebuild shared with new i18n keys and query constants. Fix any TypeScript errors before proceeding. (Depends on T004, T007.)

**Checkpoint**: `cd functions && npx tsc --noEmit` passes. `pnpm build:shared` succeeds. Foundation ready — user story phases can now begin.

---

## Phase 3: User Story 1 — Configure NAS Connection (Priority: P1) 🎯 MVP

**Goal**: Users can add, test, and remove a Synology NAS connection from the Setup page. The connection status (connected/error/unknown) is persisted per user.

**Independent Test**: Navigate to Setup > NAS tab, enter NAS credentials, click "Save & Test" — verify green "Connected" status appears with last-tested timestamp. Remove and verify form resets.

- [ ] T009 [US1] Create `functions/src/resolvers/nas.ts` with two factory functions: `createNasQueryResolvers()` returning `{ nasConnectionStatus }` (reads `users/{uid}/nasConnection/config`, returns `NasConnectionStatus` without password, returns `null` if doc doesn't exist); `createNasMutationResolvers()` returning `{ saveNasConnection, testNasConnection, deleteNasConnection }`. Implement `saveNasConnection`: Zod-validate input (`nasUrl` URL max 500, `username` non-empty max 100, `password` optional max 200, `destFolder` starts-with-/ max 200), save to Firestore with merge, read back full config, call `testNasConnection(config)`, update `status`/`lastTestedAt`, call `clearNasConfigCache(uid)`, return status (never include password). Implement `testNasConnection`: read existing config, call `testNasConnection(config)` from nasClient, update Firestore, clear cache, return status. Implement `deleteNasConnection`: delete `users/{uid}/nasConnection/config`, clear cache, return `true`. All three require auth (`if (!ctx?.uid) throw new Error('Authentication required')`). Model after `functions/src/resolvers/sql.ts`.
- [ ] T010 [US1] Wire NAS resolvers into `functions/src/resolvers/index.ts`: import `createNasQueryResolvers` and `createNasMutationResolvers` from `'./nas.js'`; spread `...createNasQueryResolvers()` into the `Query` object and `...createNasMutationResolvers()` into the `Mutation` object (following the same pattern as `createSqlQueryResolvers()` / `createSqlMutationResolvers()` at lines 65, 94). (Depends on T009.)
- [ ] T011 [P] [US1] Create `packages/setup/src/components/NasConnectionSection.tsx` mirroring `SqlConnectionSection.tsx`. Four form fields: NAS URL (text input, `setup.nas.nasUrl`, placeholder `setup.nas.nasUrlPlaceholder`), Username (text, `setup.nas.username`), Password (password type, `setup.nas.password`, placeholder `setup.nas.passwordPlaceholder`), Destination Folder (text, `setup.nas.destFolder`, placeholder `setup.nas.destFolderPlaceholder`, default value `/MyCircle`). Use `useQuery(GET_NAS_CONNECTION_STATUS)` and `useMutation` hooks for `SAVE_NAS_CONNECTION`, `TEST_NAS_CONNECTION`, `DELETE_NAS_CONNECTION` (all imported from `@mycircle/shared`). Status indicator dot (green/red/gray). "Save & Test" button (disabled if nasUrl empty), "Retest" button (shown when config exists), "Remove" button with `window.confirm` guard. Show save result banner (success/error). All button elements must have `type="button"`. All color classes must have `dark:` variants. (Depends on T008.)
- [ ] T012 [US1] Add NAS tab to `packages/setup/src/components/Setup.tsx`: import `NasConnectionSection` from `'./NasConnectionSection'`; add `{ id: 'nas', label: t('setup.tabs.nas') }` to the `tabs` array; add `{activeTab === 'nas' && <NasConnectionSection />}` in the tab content block. (Depends on T011.)

**Checkpoint**: Setup page shows NAS tab. Entering valid NAS credentials and clicking "Save & Test" shows green "Connected" status. US1 is fully functional independently.

---

## Phase 4: User Story 2 + 3 — Offload Single Chapter & Batch Offload (Priority: P2)

**Goal**: Users can offload individual audio chapters (US2) and all chapters of a book at once (US3) to NAS, freeing Firebase Storage while preserving NAS archive metadata per chapter.

**Independent Test (US2)**: With NAS connected and a converted chapter, click "Offload to NAS" — verify NAS chip appears, play button disappears, and Firebase Storage file is deleted.
**Independent Test (US3)**: Click "Offload All to NAS" toolbar button — verify all audio chapters are archived and a batch summary is shown.

- [ ] T013 [US2] Add `archiveChapterToNas` to the `createNasMutationResolvers()` return object in `functions/src/resolvers/nas.ts`. Steps: (1) require auth; (2) load NAS config via `getCachedNasConfig(uid)`, throw if not connected; (3) query `books/{bookId}/chapters` for chapter with matching `index === chapterIndex`; (4) verify `audioUrl` exists, throw descriptive error if not; (5) derive storage path as `books/${bookId}/audio/chapter-${chapterIndex}.mp3`, use `bucket.file(storagePath).exists()` to verify it exists; (6) download buffer via `bucket.file(storagePath).download()`; (7) login to NAS, call `client.createFolder(${config.destFolder}/books, bookId)` (ignore 1101 error), upload buffer as `chapter-${chapterIndex}.mp3`; (8) on upload success: delete Firebase Storage file, update chapter doc — use `FieldValue.delete()` for `audioUrl` and `audioStoragePath`, set `nasArchived: true` and `nasPath`; (9) logout NAS; (10) return `NasArchiveResult`. Wrap the transfer in try/catch — on failure do NOT modify chapter doc; logout NAS in finally block. (Depends on T009, T010.)
- [ ] T014 [US3] Add `archiveBookToNas` to `createNasMutationResolvers()` in `functions/src/resolvers/nas.ts`. Steps: (1) require auth; (2) load and validate NAS config; (3) query all chapters for the book, filter to those where `audioUrl` is set and `nasArchived !== true`; (4) login once to NAS; (5) create book subfolder once; (6) loop chapters sequentially — for each, call the core archive logic (download from Storage, upload to NAS, update Firestore) in a try/catch that records success/failure per chapter without aborting the loop; (7) logout NAS in finally; (8) return `[NasArchiveResult]` array with one entry per attempted chapter. (Depends on T013.)
- [ ] T015 [P] [US2] Extend `packages/digital-library/src/components/ChapterConvertList.tsx` to add NAS offload support: (a) extend the local `Chapter` interface to include `nasArchived?: boolean` and `nasPath?: string`; (b) add `useQuery(GET_NAS_CONNECTION_STATUS)` at component level; (c) add `useMutation(ARCHIVE_CHAPTER_TO_NAS)` hook; (d) derive `nasConnected = !!data?.nasConnectionStatus && data.nasConnectionStatus.status === 'connected'`; (e) add per-chapter `nasOffloading` state (Map or Set of chapterIndex); (f) add `handleOffloadToNas(chapterIndex)` handler that calls the mutation, updates refetch, shows error on failure; (g) in the per-chapter action buttons: when `hasAudio && nasConnected && !chapter.nasArchived`, render an "Offload to NAS" button (with loading state from nasOffloading set); when `chapter.nasArchived && !chapter.audioUrl`, render a "NAS" chip indicator instead of play button. All new buttons: `type="button"`, `aria-label`, touch-target-safe (min 44px). Dark mode on all new classes. Strings via `t('library.nas.*')`. (Depends on T008.)
- [ ] T016 [US3] Add batch "Offload All to NAS" toolbar button to `packages/digital-library/src/components/ChapterConvertList.tsx`: (a) add `useMutation(ARCHIVE_BOOK_TO_NAS)` hook; (b) add `batchOffloading` boolean state; (c) add `handleOffloadAll()` handler that calls the mutation, shows a summary toast/message using `t('library.nas.batchSummary', { success, failed })`; (d) render the "Offload All to NAS" button in the chapter list toolbar — show only when `nasConnected && chapters.some(c => c.audioUrl && !c.nasArchived)`; disabled while `batchOffloading`. Refetch chapters after batch completes. (Depends on T015.)

**Checkpoint**: With NAS connected, "Offload to NAS" and "Offload All to NAS" both work. After offload, NAS chip visible and play button absent. US2 and US3 fully functional.

---

## Phase 5: User Story 4 — Restore from NAS (Priority: P3)

**Goal**: Users can restore a NAS-archived chapter back to Firebase Storage for playback, without re-running TTS conversion.

**Independent Test**: With a NAS-archived chapter (no audioUrl), click "Restore from NAS" — verify play button returns, NAS chip remains, chapter is immediately playable.

- [ ] T017 [US4] Add `restoreChapterFromNas` to `createNasMutationResolvers()` in `functions/src/resolvers/nas.ts`. Steps: (1) require auth; (2) load and validate NAS config; (3) query chapter doc, verify `nasArchived === true` and `nasPath` is set, throw descriptive error if not; (4) login to NAS, download buffer from `chapter.nasPath`; (5) re-upload to Firebase Storage at `books/${bookId}/audio/chapter-${chapterIndex}.mp3` using `uploadToStorage()` from `functions/src/handlers/shared.ts` (same helper used by TTS workers); (6) update chapter doc: set `audioUrl` (public download URL returned by `uploadToStorage`), set `audioStoragePath`; keep `nasArchived: true` and `nasPath` unchanged; (7) logout NAS in finally; (8) return full updated `BookChapter` (same shape as bookChapters resolver returns — include all fields including `nasArchived` and `nasPath`). On error: chapter doc unchanged; throw descriptive error. (Depends on T014.)
- [ ] T018 [US4] Add "Restore from NAS" button to `packages/digital-library/src/components/ChapterConvertList.tsx`: (a) add `useMutation(RESTORE_CHAPTER_FROM_NAS)` hook; (b) add per-chapter `nasRestoring` state (Map or Set of chapterIndex); (c) add `handleRestoreFromNas(chapterIndex)` handler that calls the mutation and refetches chapters; (d) update per-chapter rendering: when `chapter.nasArchived && !chapter.audioUrl`, render "Restore from NAS" button (with loading state) instead of "Convert" button; when `chapter.nasArchived && chapter.audioUrl`, render both the play button AND a small "NAS" chip (indicating audio exists in both locations). `type="button"`, `aria-label`, dark mode variants, touch targets. Strings via `t('library.nas.restore')` etc. (Depends on T015, T016, T017.)

**Checkpoint**: All 4 user stories functional. NAS-archived chapters can be restored to playable state. NAS chip remains after restore.

---

## Phase 6: Polish & Verification

**Purpose**: Final typecheck, lint, test, and validator pass across all changes.

- [ ] T019 Run `cd functions && npx tsc --noEmit` to verify backend types pass the strict functions tsconfig (`noUnusedLocals: true`). Fix any errors found.
- [ ] T020 Run `pnpm lint && pnpm test:run && pnpm typecheck` from repo root. Fix all failures before proceeding.
- [ ] T021 [P] Run `validate_all` MCP tool to check: i18n key parity across all 3 locales, Dockerfile references (no new packages added so should pass), widget registry sync. Fix any reported issues.
- [ ] T022 [P] Manual smoke test per `specs/025-nas-audio-offload/quickstart.md`: Setup NAS tab, Save & Test, Offload chapter, verify NAS chip + Storage deletion, Restore chapter, verify playback, Remove NAS connection, verify buttons hidden.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1: Setup (T001)                    ← No dependencies — start here
    ↓
Phase 2: Foundational (T002–T008)        ← Depends on T001 (nasClient.ts for codegen types)
    ↓                                       T002/T003/T004/T005 parallel; T006→T007→T008 sequential
Phase 3: US1 (T009–T012)                 ← Depends on Phase 2 complete
Phase 4: US2+US3 (T013–T016)            ← Depends on Phase 3 (T009/T010) + Phase 2 (T008)
Phase 5: US4 (T017–T018)                ← Depends on Phase 4 (T013–T015)
Phase 6: Polish (T019–T022)              ← Depends on all phases complete
```

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 (T002–T008). No dependency on US2/US3/US4.
- **US2 (P2)**: Depends on US1 resolvers (T009/T010) being wired and Phase 2 (T008) for shared queries.
- **US3 (P2)**: Depends on US2 archiveChapterToNas logic (T013) for batch reuse.
- **US4 (P3)**: Depends on the chapter UI scaffolding from US2 (T015).

### Within Each Phase

- Phase 2: T002, T003, T004, T005 all parallel → then T006 → then T007 → then T008
- Phase 3: T009 and T011 can run in parallel; T010 depends on T009; T012 depends on T011
- Phase 4: T013 → T014 (same file, sequential); T015 parallel with T013 (different file); T016 depends on T015
- Phase 5: T017 and T018 in the same file as T015/T016 — T018 depends on T017 (logic) and T015 (UI scaffolding)

### Parallel Opportunities

```
Phase 2 parallel group:  T002, T003, T004, T005  (different files)
Phase 3 parallel group:  T009, T011              (nas.ts resolver vs NasConnectionSection.tsx)
Phase 6 parallel group:  T021, T022              (MCP validator vs manual smoke test)
```

---

## Parallel Example: Phase 2 Foundational

```
Launch together (different files):
  Task T002: Extend functions/src/schema.ts (NAS types + BookChapter)
  Task T003: Extend functions/src/resolvers/digitalLibrary.ts (nasArchived/nasPath)
  Task T004: Add i18n keys to en.ts, zh.ts, es.ts
  Task T005: Add nasConnection rule to firestore.rules

Then sequentially:
  Task T006: pnpm codegen   (needs T002)
  Task T007: Update queries.ts  (needs T006)
  Task T008: pnpm build:shared  (needs T004 + T007)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: T001 (nasClient.ts)
2. Complete Phase 2: T002–T008 (schema, codegen, i18n, shared)
3. Complete Phase 3: T009–T012 (NAS connection setup UI)
4. **STOP and VALIDATE**: Setup > NAS tab working, connection test passing
5. Optional: Stop here if storage is not yet critical

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready
2. Phase 3 (US1) → NAS connection management live (MVP)
3. Phase 4 (US2+US3) → Audio offload available
4. Phase 5 (US4) → Restore available (completes the full loop)
5. Phase 6 → Verified and ready to merge

---

## Notes

- `[P]` tasks = different files, safe to run in parallel within the same phase
- `[Story]` label maps each task to a specific user story for traceability
- `nasClient.ts` uses Node 22 native `fetch` and `FormData` — no new npm deps required
- Always run `cd functions && npx tsc --noEmit` after backend changes (separate from root typecheck)
- Always read es.ts surrounding lines before editing — Unicode escapes required (`\u00f3`, etc.)
- After rebasing onto main, run `pnpm build:shared` immediately to catch duplicate i18n key errors
- `audioStoragePath` Firestore field is unreliable — always derive Storage path from convention: `books/{bookId}/audio/chapter-{index}.mp3`
