# Tasks: Worship Song Library — Setlist Management

**Input**: Design documents from `/specs/007-worship-songs/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Not explicitly requested — test tasks are included in the Polish phase only.

**Organization**: Tasks grouped by user story. US2 (present mode) depends on US1 (setlist CRUD must exist). US3 (export) depends on US1. The backend foundation (schema + resolver + codegen) must complete before any MFE work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete sibling tasks)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Read key source files to understand insertion points before modifying anything.

- [ ] T001 Read `functions/src/schema.ts` lines 755–810 (WorshipSong types section) and lines 877–881 (worship mutations) to locate exact insertion points for the new Setlist types, inputs, queries, and mutations
- [ ] T002 [P] Read `functions/src/resolvers/worshipSongs.ts` in full to understand the `createWorshipSongResolvers()` factory pattern (ResolverContext, requireAuth, Firestore operations, docTo* helpers) that `createWorshipSetlistResolvers()` must mirror
- [ ] T003 [P] Read `functions/src/resolvers/index.ts` in full to confirm the import and spread pattern for registering a new resolver factory
- [ ] T004 [P] Read `packages/shared/src/apollo/queries.ts` lines 679–756 (worship section) to understand fragment and query/mutation format before adding setlist operations
- [ ] T005 [P] Read `packages/worship-songs/src/types.ts`, `packages/worship-songs/src/hooks/useWorshipSongs.ts`, and `packages/worship-songs/src/components/WorshipSongs.tsx` to understand the existing type/hook/view patterns before extending them

---

## Phase 2: Foundational — Backend Schema + Codegen (Blocking)

**Purpose**: Extend the GraphQL schema, create the resolver, run codegen, add shared queries. No MFE work can begin until codegen produces the new TypeScript types.

**⚠️ CRITICAL**: All user story MFE tasks depend on this phase completing first.

- [ ] T006 In `functions/src/schema.ts`, add new GraphQL types after the existing WorshipSong types (around line 790): `SetlistEntry` type with fields `songId: ID!`, `position: Int!`, `snapshotTitle: String!`, `snapshotKey: String!`; `Setlist` type with fields `id: ID!`, `name: String!`, `serviceDate: String`, `entries: [SetlistEntry!]!`, `createdAt: String!`, `updatedAt: String!`, `createdBy: String!`; input types `SetlistEntryInput` (songId, position, snapshotTitle, snapshotKey — all required), `WorshipSetlistInput` (name required, serviceDate optional, entries optional), `WorshipSetlistUpdateInput` (name optional, serviceDate optional, entries optional)
- [ ] T007 In `functions/src/schema.ts`, add new queries to the Query type (after `worshipSong`): `worshipSetlists: [Setlist!]!` and `worshipSetlist(id: ID!): Setlist`; add new mutations to the Mutation type (after `deleteWorshipSong`): `addWorshipSetlist(input: WorshipSetlistInput!): Setlist!`, `updateWorshipSetlist(id: ID!, input: WorshipSetlistUpdateInput!): Setlist!`, `deleteWorshipSetlist(id: ID!): Boolean!`
- [ ] T008 Create `functions/src/resolvers/worshipSetlists.ts`: define `const SETLIST_COLLECTION = 'worshipSetlists'`; reuse the `requireAuth` and `toTimestampString` pattern from `worshipSongs.ts`; implement `docToSetlist(id, data)` helper; export `createWorshipSetlistResolvers()` factory returning `{ Query: { worshipSetlists, worshipSetlist }, Mutation: { addWorshipSetlist, updateWorshipSetlist, deleteWorshipSetlist } }`
  - `worshipSetlists`: requireAuth; query Firestore `worshipSetlists` where `createdBy == uid`, order by `updatedAt desc`; return mapped array
  - `worshipSetlist(id)`: requireAuth; get document; verify `createdBy == uid`; return mapped setlist or null
  - `addWorshipSetlist(input)`: requireAuth; validate `input.name.trim()` non-empty; write document with `createdBy: uid`, `entries: (input.entries ?? [])`, timestamps; return docToSetlist
  - `updateWorshipSetlist(id, input)`: requireAuth; fetch, verify ownership; merge provided fields; if `input.entries` provided, re-sort by position, validate positions are 0-based consecutive; update `updatedAt`; return updated doc
  - `deleteWorshipSetlist(id)`: requireAuth; verify ownership; delete document; return true
- [ ] T009 In `functions/src/resolvers/index.ts`: add `import { createWorshipSetlistResolvers } from './worshipSetlists.js';`; create `const worshipSetlistResolvers = createWorshipSetlistResolvers();`; spread `...worshipSetlistResolvers.Query` in the Query block and `...worshipSetlistResolvers.Mutation` in the Mutation block
- [ ] T010 In `packages/shared/src/apollo/queries.ts`, add after the existing worship section: fragments `SetlistEntryFields` (all 4 fields), `SetlistFields` (all fields + entries using SetlistEntryFields), `SetlistListFields` (id, name, serviceDate, updatedAt, createdBy, entries inline); add queries `GetWorshipSetlists` and `GetWorshipSetlist($id: ID!)`; add mutations `AddWorshipSetlist`, `UpdateWorshipSetlist`, `DeleteWorshipSetlist` — following exact code style of existing worship operations
- [ ] T011 Run `pnpm codegen` from repo root to regenerate `packages/shared/src/apollo/generated.ts` with the new setlist types and operation hooks; verify no codegen errors

**Checkpoint**: Backend is live, TypeScript types generated — MFE phases can begin

---

## Phase 3: User Story 1 — Create and Manage Setlists (Priority: P1) 🎯 MVP

**Goal**: Worship leaders can create named setlists, add songs, reorder and remove entries, and delete setlists. All data persists in Firestore via GraphQL.

**Independent Test**: Quickstart scenarios A–E. Create "Sunday Morning" setlist → add 3 songs → move song 1 down → remove song 2 → verify 2 songs remain in correct order after page reload.

### Types (shared foundation for all user stories)

- [ ] T012 [US1] In `packages/worship-songs/src/types.ts`, add TypeScript interfaces: `SetlistEntry { songId: string; position: number; snapshotTitle: string; snapshotKey: string; }`, `Setlist { id: string; name: string; serviceDate?: string; entries: SetlistEntry[]; createdAt: string; updatedAt: string; createdBy: string; }`, `SetlistListItem { id: string; name: string; serviceDate?: string; entries: SetlistEntry[]; updatedAt: string; createdBy: string; }`

### Hook

- [ ] T013 [US1] Create `packages/worship-songs/src/hooks/useWorshipSetlists.ts`: import `useQuery`, `useMutation`, `getApolloClient`, `GET_WORSHIP_SETLISTS`, `GET_WORSHIP_SETLIST`, `ADD_WORSHIP_SETLIST`, `UPDATE_WORSHIP_SETLIST`, `DELETE_WORSHIP_SETLIST`, `WindowEvents` from `@mycircle/shared`; implement `useWorshipSetlists()` hook that returns `{ setlists, loading, isAuthenticated, addSetlist, updateSetlist, deleteSetlist, getSetlist }` — mirror `useWorshipSongs.ts` auth pattern (`window.__getFirebaseIdToken`, `WindowEvents.AUTH_STATE_CHANGED`); `addSetlist(input)` returns the new setlist's ID string; `updateSetlist(id, input)` resolves void; `deleteSetlist(id)` resolves void; `getSetlist(id)` uses `getApolloClient().query` for single-item fetch

### Components

- [ ] T014 [US1] Create `packages/worship-songs/src/components/SetlistList.tsx`: accepts props `{ setlists: SetlistListItem[], loading: boolean, isAuthenticated: boolean, onSelectSetlist: (id: string) => void, onNewSetlist: () => void }`; renders a "Setlists" heading, "New Setlist" button (only when `isAuthenticated`), loading spinner while `loading`, empty state message `t('worship.noSetlists')` when empty; each setlist card shows name, optional service date, and song count badge (`t('worship.songCount', { count })` or inline); clicking a card calls `onSelectSetlist(id)`; all color classes with `dark:` variants; `type="button"` on all buttons; touch targets ≥ 44px
- [ ] T015 [US1] Create `packages/worship-songs/src/components/SetlistEditor.tsx`: accepts props per contracts/ui-contracts.md Contract 3; renders: name input (required, `aria-label={t('worship.setlistName')}`), optional service date input (type="date"), song search panel (text input filtering `allSongs` by title/artist client-side), "Add to Setlist" button per search result; entry list showing position number, `snapshotTitle`, `snapshotKey`, Move Up button (disabled at index 0), Move Down button (disabled at last index), Remove button; Save button (calls `onSave`, disabled during save), Delete button (calls `onDelete` with `window.confirm` guard, only when `onDelete` defined), Cancel button; inline validation error for empty name; all i18n keys; dark: variants; `type="button"` on all non-submit buttons; when a song is added, capture `snapshotTitle = song.title` and `snapshotKey = song.originalKey`; positions are re-computed as 0-based consecutive integers after every add/remove/reorder
- [ ] T016 [US1] In `packages/worship-songs/src/components/WorshipSongs.tsx`, extend the `View` type to add `'setlist-list' | 'setlist-new' | 'setlist-edit' | 'setlist-present'`; add URL-based view detection for `/worship/setlists`, `/worship/setlists/new`, `/worship/setlists/:setlistId`, and `/worship/setlists/:setlistId/present` using `useParams` and `useLocation`; import and call `useWorshipSetlists()`; add `selectedSetlist` state; add handlers: `handleNewSetlist`, `handleSelectSetlist`, `handleSaveNewSetlist`, `handleSaveEditSetlist`, `handleDeleteSetlist`; add a "Setlists" tab/button to the list view header that navigates to `/worship/setlists`; render `<SetlistList>` for `setlist-list` view and `<SetlistEditor>` for `setlist-new` and `setlist-edit` views within `<PageContent>` wrappers; load `selectedSetlist` via `getSetlist(setlistId)` when entering edit/present routes (same pattern as `getSong` for songs)

### i18n (US1 keys)

- [ ] T017 [US1] Add 10 US1 i18n keys to `packages/shared/src/i18n/locales/en.ts` after the existing worship keys: `'worship.setlists': 'Setlists'`, `'worship.newSetlist': 'New Setlist'`, `'worship.editSetlist': 'Edit Setlist'`, `'worship.deleteSetlist': 'Delete Setlist'`, `'worship.deleteSetlistConfirm': 'Are you sure you want to delete this setlist?'`, `'worship.setlistName': 'Setlist Name'`, `'worship.serviceDate': 'Service Date (optional)'`, `'worship.setlistSongs': 'Songs in Setlist'`, `'worship.addSongToSetlist': 'Add to Setlist'`, `'worship.noSetlists': 'No setlists yet. Create one to plan your service.'`, `'worship.emptySetlist': 'No songs in this setlist yet.'`, `'worship.setlistNameRequired': 'Setlist name is required'`
- [ ] T018 [P] [US1] Add matching Spanish translations for the 12 US1 keys to `packages/shared/src/i18n/locales/es.ts` (use Unicode escapes for accented characters: `\u00f3`, `\u00e9`, etc.)
- [ ] T019 [P] [US1] Add matching Chinese translations for the 12 US1 keys to `packages/shared/src/i18n/locales/zh.ts`

**Checkpoint**: US1 complete — create setlist → add songs → reorder → remove → delete; all persists via GraphQL

---

## Phase 4: User Story 2 — Present a Setlist During a Live Service (Priority: P2)

**Goal**: Musicians can open a setlist in present mode and navigate song-by-song with full chord chart display, per-song transposition (not persisted), and a position indicator.

**Independent Test**: Quickstart scenarios F–H. Open setlist → Start Service → "Song 1 of 3" shows → transpose +2 → Next → song 2 at default key → Next on last song → "End of setlist" shown.

**Dependency**: US1 must be complete (SetlistEditor, routes, and `selectedSetlist` state in WorshipSongs.tsx needed).

### Components

- [ ] T020 [US2] Create `packages/worship-songs/src/components/SetlistPresenter.tsx`: accepts props `{ setlist: Setlist, songs: Record<string, WorshipSong | null>, onExit: () => void }`; manages state: `currentIndex: number` (init 0), `semitonesBySongId: Record<string, number>` (init {}); renders: top header bar with "worship.songOfTotal" label (`t('worship.songOfTotal').replace('{current}', ...).replace('{total}', ...)`), Prev button (disabled when `currentIndex === 0`), Next button (disabled when at last song), Exit button; when current entry's `songs[songId] === null` render "Song not found" placeholder showing `snapshotTitle` and `snapshotKey` in muted text; when song exists render `<SongViewer song={currentSong} isAuthenticated={false} onEdit={() => {}} />` but override its semitone state via a prop or wrapper — since SongViewer manages semitones internally, pass a `key={songId}` to force remount on song change (which resets transposition to 0 per FR-008); when Next is clicked on the last song, show `t('worship.endOfSetlist')` below the header; all buttons `type="button"`, `aria-label` on Prev/Next/Exit; dark: variants
- [ ] T021 [US2] In `packages/worship-songs/src/components/WorshipSongs.tsx`: add handler `handleStartService` that navigates to `/worship/setlists/:setlistId/present`; wire the `setlist-present` view case to render `<SetlistPresenter>` with pre-loaded songs; add a "Start Service" button in the `setlist-edit` view header (only when setlist has ≥ 1 song); pre-load full song data for all entries using `Promise.all(entries.map(e => getSong(e.songId)))` when entering present route, building the `songs` Record (null for any that return null); while loading songs for presenter show a spinner

### i18n (US2 keys)

- [ ] T022 [US2] Add 4 US2 i18n keys to `packages/shared/src/i18n/locales/en.ts`: `'worship.startService': 'Start Service'`, `'worship.songOfTotal': 'Song {current} of {total}'`, `'worship.endOfSetlist': 'End of setlist'`, `'worship.songNotFound': 'Song not found'`
- [ ] T023 [P] [US2] Add matching Spanish translations for the 4 US2 keys to `packages/shared/src/i18n/locales/es.ts`
- [ ] T024 [P] [US2] Add matching Chinese translations for the 4 US2 keys to `packages/shared/src/i18n/locales/zh.ts`

**Checkpoint**: US2 complete — open setlist → Start Service → navigate songs → transpose per-song → exit

---

## Phase 5: User Story 3 — Export a Setlist (Priority: P3)

**Goal**: Worship leaders can export a setlist as a print-ready multi-song sheet (via browser print) or as a downloadable plain-text summary file.

**Independent Test**: Quickstart scenarios J–K. Open setlist with 3 songs → Export → Print → browser print dialog opens with all songs. Export as Text → `.txt` file downloads with numbered song list.

**Dependency**: US1 must be complete (setlist view exists). No dependency on US2.

### Component

- [ ] T025 [US3] Create `packages/worship-songs/src/components/SetlistPrintView.tsx`: accepts props `{ setlist: Setlist, songs: Record<string, WorshipSong | null> }`; renders all songs in `setlist.entries` order, each song in a `<section>` with: `<h2>` for title, `<p>` for artist, key badge `<span>`, and either the full song content (using `<ChordLine>` for ChordPro or `<pre>` for text format) or a "Song not found" placeholder if `songs[songId] === null`; uses `data-print-show` class on the container; this component is rendered in a `<div className="hidden print:block">` wrapper and `window.print()` is called to trigger it
- [ ] T026 [US3] In `packages/worship-songs/src/components/WorshipSongs.tsx` (or within the setlist edit/detail view context), add an "Export" menu in the `setlist-edit` view: a dropdown or two buttons: "Print All Songs" (renders `<SetlistPrintView>` into the DOM hidden div and calls `window.print()`) and "Export as Text" (generates a `.txt` Blob with setlist name, date, and numbered entries `N. Title — Key: X — BPM: Y` per line, downloads via `URL.createObjectURL` + anchor click, following the exact pattern of `SongViewer.handleDownloadText`)

### i18n (US3 keys)

- [ ] T027 [US3] Add 3 US3 i18n keys to `packages/shared/src/i18n/locales/en.ts`: `'worship.exportSetlist': 'Export Setlist'`, `'worship.exportPrint': 'Print All Songs'`, `'worship.exportText': 'Export as Text'`
- [ ] T028 [P] [US3] Add matching Spanish translations for the 3 US3 keys to `packages/shared/src/i18n/locales/es.ts`
- [ ] T029 [P] [US3] Add matching Chinese translations for the 3 US3 keys to `packages/shared/src/i18n/locales/zh.ts`

**Checkpoint**: US3 complete — print and text export work from the setlist detail view

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Rebuild shared, run full test suite, fix issues, run quickstart validation.

- [ ] T030 Run `pnpm build:shared` to rebuild shared package (new i18n keys, codegen output) — required before testing any MFE that imports from `@mycircle/shared`
- [ ] T031 Run `pnpm --filter @mycircle/worship-songs build` and verify the MFE builds cleanly; fix any TypeScript or Vite errors
- [ ] T032 Run `cd functions && npx tsc --noEmit` to verify the `worshipSetlists.ts` resolver has no TypeScript errors under the strict functions tsconfig (`noUnusedLocals: true`)
- [X] T033 Add tests for `useWorshipSetlists` hook in `packages/worship-songs/src/hooks/useWorshipSetlists.test.ts` (create file): test that `addSetlist` calls the mutation and returns an ID; test that `deleteSetlist` calls the mutation; test that `setlists` is empty array when unauthenticated; mock all Apollo calls with `vi.fn()`
- [X] T034 [P] Add tests for `SetlistEditor` in `packages/worship-songs/src/components/SetlistEditor.test.tsx` (create file): test name field is required (save with empty name shows error); test adding a song appends to entries; test Move Up/Down swaps positions; test Remove deletes entry; mock `useWorshipSetlists` and `useWorshipSongs`
- [X] T035 [P] Add tests for `SetlistPresenter` in `packages/worship-songs/src/components/SetlistPresenter.test.tsx` (create file): test "Song 1 of 3" header shows; test Next navigates to song 2; test Prev is disabled on first song; test null song shows "Song not found" placeholder; test "End of setlist" shown after last song; mock `SongViewer` as a simple div
- [X] T036 Run `pnpm --filter @mycircle/worship-songs test:run` and fix any test failures
- [X] T037 Run `pnpm lint` from repo root and fix any lint errors in modified files
- [X] T038 Run `pnpm typecheck` from repo root and fix any TypeScript errors
- [ ] T039 Run manual quickstart.md scenarios A–L against `pnpm dev` to validate all three user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 reads — backend-only, can begin after T001–T005
- **US1 (Phase 3)**: Depends on Phase 2 (codegen must complete, T011 done) — MFE types, hook, components
- **US2 (Phase 4)**: Depends on US1 (Phase 3) — needs SetlistEditor view, route wiring, `selectedSetlist` state
- **US3 (Phase 5)**: Depends on US1 (Phase 3) — needs setlist detail view context; independent of US2
- **Polish (Phase 6)**: Depends on US1 + US2 + US3 completion

### Parallel Opportunities

- T001–T005 (Setup reads) can run in parallel
- T006–T010 (schema, resolver, index, queries) are sequential within Phase 2 (each builds on previous)
- T018, T019 (US1 es/zh i18n) can run in parallel with each other after T017
- T023, T024 (US2 es/zh i18n) can run in parallel with each other after T022
- T028, T029 (US3 es/zh i18n) can run in parallel with each other after T027
- US2 (Phase 4) and US3 (Phase 5) can run in parallel — they modify different files
- T033, T034, T035 (tests) can run in parallel

---

## Implementation Strategy

### MVP (US1 only — Setlist CRUD)

1. Complete Phases 1–2 (backend + codegen)
2. Complete Phase 3 (US1 types + hook + components + i18n)
3. **VALIDATE**: Create setlist, add songs, reorder, remove, delete — all via GraphQL, persists cross-session
4. Ship US1 as MVP if needed

### Incremental Delivery

1. Phase 1: Verification reads → baseline understood
2. Phase 2: Backend + codegen → GraphQL layer ready
3. Phase 3 (US1): Setlist CRUD → planning tool usable ✓
4. Phase 4 (US2): Present mode → live service tool available ✓
5. Phase 5 (US3): Export → sharing/printing complete ✓
6. Phase 6: Tests + polish → ready for PR

### Notes

- `pnpm codegen` (T011) is the critical gate between backend and MFE phases — must complete before T012+
- i18n es/zh tasks are parallel siblings (marked [P]) — can run simultaneously
- US2 and US3 can be implemented in parallel after US1 completes since they touch different component files
- All Apollo imports in the MFE MUST come from `@mycircle/shared` (Constitution I — never `@apollo/client` directly)
