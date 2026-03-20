# Tasks: Personal Notes — Notebook GraphQL Migration

**Input**: Design documents from `/specs/008-personal-notes/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested — test update tasks are included in the Polish phase to fix existing tests broken by the hook migration.

**Organization**: US1 (CRUD) depends on the Foundational backend. US2 (Search) is independently testable after US1 because search is wired through the same `GET_NOTES` query with a `search` variable. US3 (Sync) is independently verifiable once US1's mutations trigger Apollo cache refreshes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Read key existing files to understand insertion points before modifying anything.

- [ ] T001 Read `functions/src/schema.ts` lines 363–370 (Note type) and lines 478–479 (notes query) to confirm the exact insertion points for `NoteInput`, `NoteUpdateInput`, and the three new mutations
- [ ] T002 [P] Read `functions/src/resolvers/notes.ts` in full to understand the `createNotesResolvers()` factory, `requireAuth`, `toTimestampString`, and the existing `notes` query resolver before adding mutations
- [ ] T003 [P] Read `functions/src/resolvers/index.ts` to confirm the import and Mutation spread pattern used by other resolvers (e.g., `worshipSetlists.ts`) before registering note mutations
- [ ] T004 [P] Read `packages/shared/src/apollo/queries.ts` worship section to understand the fragment + query/mutation code style before adding note operations
- [ ] T005 [P] Read `packages/notebook/src/hooks/useNotes.ts` in full and `packages/notebook/src/types.ts` to understand the current `window.__notebook` write pattern and what changes are needed in the hook

---

## Phase 2: Foundational — Backend Schema + Codegen (Blocking)

**Purpose**: Add `NoteInput`, `NoteUpdateInput`, and three GraphQL mutations to the schema, implement them in the resolver, register them, add shared Apollo operations, and regenerate TypeScript types. No hook or component work can begin until `pnpm codegen` produces the new types.

**⚠️ CRITICAL**: All US1/US2/US3 tasks depend on this phase completing first.

- [ ] T006 In `functions/src/schema.ts`, add two new input types immediately after the `Note` type block (after line 370): `input NoteInput { title: String! content: String! }` and `input NoteUpdateInput { title: String content: String }`; then add three mutations to the Mutation type after the existing `notes` query line: `addNote(input: NoteInput!): Note!`, `updateNote(id: ID!, input: NoteUpdateInput!): Note!`, `deleteNote(id: ID!): Boolean!`
- [ ] T007 In `functions/src/resolvers/notes.ts`, extend `createNotesResolvers()` to add a `Mutation` block alongside the existing `Query` block: implement `addNote(_, { input }, context)` — `requireAuth`, validate that `input.title.trim() || input.content.trim()` is non-empty, write new doc to `users/{uid}/notes` with `FieldValue.serverTimestamp()` for `createdAt` and `updatedAt`, return `docToNote(id, data)`; implement `updateNote(_, { id, input }, context)` — `requireAuth`, get doc at `users/{uid}/notes/{id}`, throw `NOT_FOUND` if missing, merge non-null fields from `input`, update `updatedAt` with server timestamp, return updated doc; implement `deleteNote(_, { id }, context)` — `requireAuth`, verify doc exists under uid's sub-collection, delete it, return `true`; also add a `docToNote(id, data)` helper that maps Firestore document fields using `toTimestampString`; increase the `notes` query `limit` default from `100` to `500` and cap to `500`
- [ ] T008 In `functions/src/resolvers/index.ts`, verify the `Mutation` block inside the merged resolvers object includes a spread for `...notesResolvers.Mutation` (add it if missing, following the same pattern used by `worshipSetlistResolvers.Mutation`)
- [ ] T009 In `packages/shared/src/apollo/queries.ts`, add after the existing worship section: fragment `NoteFields` (fields: `id title content createdAt updatedAt`); query `GetNotes($search: String)` that calls `notes(limit: 500, search: $search) { ...NoteFields }`; mutation `AddNote($input: NoteInput!)` returning `addNote(input: $input) { ...NoteFields }`; mutation `UpdateNote($id: ID!, $input: NoteUpdateInput!)` returning `updateNote(id: $id, input: $input) { ...NoteFields }`; mutation `DeleteNote($id: ID!)` returning `deleteNote(id: $id)`; export all four as named constants (`GET_NOTES`, `ADD_NOTE`, `UPDATE_NOTE`, `DELETE_NOTE`)
- [ ] T010 Run `pnpm codegen` from repo root to regenerate `packages/shared/src/apollo/generated.ts` with the new `NoteInput`, `NoteUpdateInput`, and mutation operation types; verify no codegen errors before proceeding

**Checkpoint**: Backend is live, TypeScript types generated — hook migration can begin

---

## Phase 3: User Story 1 — Create and Manage Notes (Priority: P1) 🎯 MVP

**Goal**: Signed-in users can create, read, edit, and delete personal notes via GraphQL mutations. The `useNotes` hook no longer calls `window.__notebook` for writes.

**Independent Test**: Quickstart scenarios A–E. Create "Meeting recap" → save → appears in list → edit body → save → changes persisted → delete with confirmation → removed from list.

- [ ] T011 [US1] In `packages/notebook/src/hooks/useNotes.ts`, replace the existing write operations (`window.__notebook.add/update/delete`) with Apollo mutations:
  - Import `useQuery`, `useMutation`, `GET_NOTES`, `ADD_NOTE`, `UPDATE_NOTE`, `DELETE_NOTE` from `@mycircle/shared`
  - Replace the `loadNotes` polling/one-shot pattern with `useQuery(GET_NOTES, { fetchPolicy: 'cache-and-network', skip: !isAuthenticated, variables: { search: undefined } })`
  - Replace `saveNote(null, data)` implementation: call `addNoteMutation({ variables: { input: data }, refetchQueries: [{ query: GET_NOTES }] })`
  - Replace `saveNote(id, data)` implementation: call `updateNoteMutation({ variables: { id, input: data }, refetchQueries: [{ query: GET_NOTES }] })`
  - Replace `deleteNote(id)` implementation: call `deleteNoteMutation({ variables: { id }, refetchQueries: [{ query: GET_NOTES }] })`
  - Keep the `api.subscribe` real-time path as a secondary refresh mechanism if `window.__notebook?.subscribe` is available (belt-and-suspenders for cross-device sync)
  - Return `{ notes, loading, error, saveNote, deleteNote }` with the same interface as before so `Notebook.tsx` needs no changes
- [ ] T012 [US1] In `packages/notebook/src/components/NoteEditor.tsx`, verify that the Save button is disabled when both `title.trim()` and `content.trim()` are empty (implement this guard if not present); ensure the component calls `onSave(note?.id ?? null, { title, content })` — no direct `window.__notebook` references should remain in this file
- [ ] T013 [P] [US1] In `packages/notebook/src/components/NoteList.tsx`, verify that each note card displays `note.title || 'Untitled'` as the heading (implement the fallback if missing) and that an empty-state message is shown when `notes.length === 0` and search is blank; verify the "New Note" button is conditionally rendered only when `isAuthenticated` is true
- [ ] T014 [P] [US1] Run `pnpm build:shared` to rebuild the shared package with the new codegen output and i18n changes — required before the MFE can import the new Apollo operations

**Checkpoint**: US1 complete — CRUD works via GraphQL; `window.__notebook` write calls removed from hook

---

## Phase 4: User Story 2 — Search Notes (Priority: P2)

**Goal**: The search input in NoteList filters the notes list by keyword match against title and body. Results update within 1 second of the user stopping typing. Clearing the input restores the full list.

**Independent Test**: Quickstart scenarios F–I. Create 3 notes with distinct keywords → type one keyword → only matching note shown → clear → all 3 shown → type non-existent keyword → empty-state message shown (not an error).

**Dependency**: US1 must be complete (hook must use `GET_NOTES` query before search variable can be wired).

- [ ] T015 [US2] In `packages/notebook/src/components/Notebook.tsx` (or wherever `search` state lives), wire the search input value to the `GET_NOTES` query: pass `search` as a `variables: { search }` prop to `useNotes` or apply client-side filter on the `notes` array returned by the hook; confirm that the search runs client-side on the already-fetched 500-note result set (matching the research decision) rather than re-querying on every keystroke — implement a debounced `useState` for search (300ms delay) so the filter fires after the user pauses typing
- [ ] T016 [US2] In `packages/notebook/src/components/NoteList.tsx`, add a search text input at the top of the list with `aria-label={t('notebook.search')}`, `type="search"`, bound to the `search` prop and `onSearchChange` callback; show "No notes match your search" (`t('notebook.noResults')`) when `notes.length === 0` and search is non-empty; show the standard empty-state call to action when `notes.length === 0` and search is empty

**Checkpoint**: US2 complete — search filters notes in < 1 second; clearing restores full list

---

## Phase 5: User Story 3 — Sync Across Devices (Priority: P3)

**Goal**: A note created or edited in one browser session appears on a second signed-in session within 10 seconds without a manual refresh.

**Independent Test**: Quickstart scenarios J–L. Open two windows with the same account → create note in Window A → appears in Window B within 10 seconds → edit in Window B → updated in Window A.

**Dependency**: US1 must be complete (mutations must use `refetchQueries` to trigger Apollo cache update).

- [ ] T017 [US3] In `packages/notebook/src/hooks/useNotes.ts`, verify that the `api.subscribe` real-time path (using `window.__notebook?.subscribe`) is still active after the US1 hook migration: if `api.subscribe` is available it should call `startTransition(() => setNotes(data))` when new data arrives from Firestore `onSnapshot`, providing cross-device push delivery; confirm that `refetchQueries: [{ query: GET_NOTES }]` on every mutation also updates the local Apollo cache immediately for the local window
- [ ] T018 [US3] In `packages/notebook/src/hooks/useNotes.ts`, confirm the `WindowEvents.AUTH_STATE_CHANGED` listener re-initialises the subscription on sign-in and tears it down on sign-out (this listener already exists — verify it also resets the Apollo query's `skip` variable by changing auth state)

**Checkpoint**: US3 complete — notes sync in real time across sessions via Firestore onSnapshot subscription

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: i18n cleanup, test updates, lint/typecheck, functions typecheck, final validation.

- [ ] T019 Check if `'notebook.untitled'` and `'notebook.noResults'` keys exist in `packages/shared/src/i18n/locales/en.ts`; if missing, add them: `'notebook.untitled': 'Untitled'`, `'notebook.noResults': 'No notes match your search'`
- [ ] T020 [P] If T019 added new keys to `en.ts`, add matching Spanish translations (Unicode escapes) to `packages/shared/src/i18n/locales/es.ts`: `'notebook.untitled': 'Sin t\u00edtulo'`, `'notebook.noResults': 'Ning\u00fan apunte coincide con tu b\u00fasqueda'`
- [ ] T021 [P] If T019 added new keys to `en.ts`, add matching Chinese translations (Unicode escapes) to `packages/shared/src/i18n/locales/zh.ts`: `'notebook.untitled': '\u65e0\u6807\u9898'`, `'notebook.noResults': '\u6ca1\u6709\u7b26\u5408\u641c\u7d22\u7684\u7b14\u8bb0'`
- [ ] T022 In `packages/notebook/src/hooks/useNotes.test.ts`, update mocks to replace `window.__notebook` write calls with `vi.fn()` mocks for `ADD_NOTE`, `UPDATE_NOTE`, `DELETE_NOTE` mutations from `@mycircle/shared`; mock `useQuery` to return test notes; verify `saveNote(null, data)` calls `addNoteMutation` and `saveNote(id, data)` calls `updateNoteMutation`
- [ ] T023 Run `pnpm --filter @mycircle/notebook test:run` and fix any test failures caused by the hook migration
- [ ] T024 Run `pnpm lint` from repo root and fix any warnings in modified files
- [ ] T025 Run `pnpm typecheck` from repo root and fix any TypeScript errors
- [ ] T026 Run `cd functions && npx tsc --noEmit` to verify the updated `notes.ts` resolver has no TypeScript errors under the strict functions tsconfig (`noUnusedLocals: true`)
- [ ] T027 Run manual quickstart.md scenarios A–N against `pnpm dev` to validate all three user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (read-only)
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user story work
- **US1 (Phase 3)**: Depends on Phase 2 (codegen must complete first so hook can import generated types)
- **US2 (Phase 4)**: Depends on Phase 3 (search wiring needs the `GET_NOTES` query from the migrated hook)
- **US3 (Phase 5)**: Depends on Phase 3 (mutation `refetchQueries` must be in place for cache sync to work)
- **Polish (Phase 6)**: Depends on Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No peer dependencies.
- **US2 (P2)**: Starts after US1 (needs migrated hook with `GET_NOTES`). Independently testable once wired.
- **US3 (P3)**: Starts after US1 (needs mutations with `refetchQueries`). Can run in parallel with US2.

### Parallel Opportunities

- T001–T005 (Phase 1 reads): all parallel — different files
- T006–T009 (Phase 2): T006+T007 sequential (schema before resolver); T008+T009 can run in parallel after T006
- T013, T014 (Phase 3): parallel with T012
- T020, T021 (Phase 6): parallel with each other (different locale files)
- T017, T018 (Phase 5): parallel — same file but distinct behaviours to verify (check independently)

---

## Parallel Execution Examples

### Phase 2 — Backend
```
Sequential:  T006 (schema) → T007 (resolver)
Parallel:    T008 (index.ts) ‖ T009 (queries.ts)   [after T006]
Sequential:  T010 (codegen)                         [after T007, T008, T009]
```

### Phase 3 — US1 Hook Migration
```
Sequential:  T011 (hook migration)
Parallel:    T012 (NoteEditor) ‖ T013 (NoteList) ‖ T014 (build:shared)   [after T011]
```

### Phase 5 — US3 Sync
```
Parallel:    T017 (subscribe path) ‖ T018 (auth listener)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup reads
2. Complete Phase 2: Backend foundation (schema + resolver + codegen)
3. Complete Phase 3: US1 — hook migration + component verification
4. **STOP and VALIDATE**: Run quickstart scenarios A–E; CRUD works via GraphQL
5. Merge or continue to US2/US3

### Incremental Delivery

1. Setup + Foundational → backend ready
2. US1 (CRUD migration) → all reads/writes via GraphQL ← **deploy-ready MVP**
3. US2 (search wiring) → keyword search live
4. US3 (sync verification) → real-time sync confirmed
5. Polish → tests green, lint clean, PR merged

---

## Notes

- This feature targets the **existing** `packages/notebook` MFE — no new package is created
- The `window.__notebook` global remains available for the `subscribe` path only; all write operations move to GraphQL
- After T010 (codegen), always run `pnpm build:shared` before testing the MFE to pick up new generated types
- The `notebook` MFE has a "public notes" tab — do not remove or modify it; this feature only affects the private "my notes" tab
