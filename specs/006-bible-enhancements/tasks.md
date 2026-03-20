# Tasks: Bible Enhancements

**Input**: Design documents from `/specs/006-bible-enhancements/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Included in Polish phase (existing test files need extending).

**Organization**: Tasks grouped by user story. US1 and US2 target different files so they can start in parallel. US3 depends on US2 being done (both modify `BibleReader.tsx`). Research Decision 5 confirmed: zero schema changes, zero codegen, zero new packages.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3)
- Exact file paths in all descriptions

---

## Phase 1: Setup (Verification)

**Purpose**: Read and understand the two primary source files before modifying them. Ensures correct insertion points.

- [X] T001 Read `packages/bible-reader/src/components/BibleReader.tsx` in full to locate the toolbar area, `loadPassage` calls in `handlePrevChapter`/`handleNextChapter`/`handleBookSelect`, the `saveBookmarks()` helper, and the verse render loop inside `view === 'passage'`
- [X] T002 [P] Read `packages/bible-reader/src/hooks/useBibleData.ts` in full to understand the `useBiblePassage()` hook pattern (`useLazyQuery`, `fetchPolicy: 'cache-first'`, return shape) that `useComparisonPassage()` must mirror
- [X] T003 [P] Read `packages/shell/src/context/restoreUserData.ts` lines 60–75 to confirm the exact overwrite lines (66–67) that need the merge fix and verify the `Bookmark` type import

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No new packages, schema changes, or migrations required. Existing infrastructure is sufficient.

**⚠️ NOTE**: This feature modifies existing files only. No foundational scaffolding needed — proceed directly to user story phases after Phase 1 verification.

- [X] T004 Verify `pnpm --filter @mycircle/bible-reader build` and `pnpm --filter @mycircle/shell build` both pass on current branch before making any changes

**Checkpoint**: Baseline builds confirmed — user story implementation can begin

---

## Phase 3: User Story 1 — Quick Verse Reference Lookup (Priority: P1) 🎯 MVP

**Goal**: Users can type "John 3:16" or "Ps 23" in a reference search input and jump directly to that passage with verse highlighting.

**Independent Test**: Open Bible Reader → type "John 3:16" in the reference search input → press Enter → passage shows John 3 with verse 16 highlighted. (See quickstart.md Scenario A.)

### Implementation for User Story 1

- [X] T005 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, add `BOOK_ALIASES` static map above the component: map ~80 abbreviations (Ps→Psalms, Gen→Genesis, Mt→Matthew, Mk→Mark, Lk→Luke, Jn→John, Rev→Revelation, and all others for the 66 Protestant canonical books) to their canonical names
- [X] T006 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, add `parseVerseReference(input: string): VerseReference | null` pure function (type `VerseReference = { book: string; chapter: number; verse: number | null }`) that: trims and lowercases input, resolves book via `BOOK_ALIASES`, extracts chapter and optional verse using regex `/([\d]+)(?::\s*([\d]+))?$/`, returns null if book not found or chapter is not a positive integer
- [X] T007 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, add `highlightedVerse: number | null` state (initialized to `null`) and a `referenceInput: string` state (initialized to `''`) for the search input value
- [X] T008 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, add a `handleReferenceSearch` callback that: calls `parseVerseReference(referenceInput)`, on null shows an inline error via `referenceError` state (`string | null`), on success calls `setCurrentBook(ref.book)`, `setCurrentChapter(ref.chapter)`, `setView('passage')`, `loadPassage(ref.book, ref.chapter, bibleVersion)`, `setHighlightedVerse(ref.verse)`, clears `referenceInput` and `referenceError`
- [X] T009 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, render the reference search input in the toolbar (always visible): a `<div>` containing `<input type="text" aria-label={t('bible.referenceSearchLabel')} placeholder={t('bible.referenceSearchPlaceholder')} value={referenceInput} onChange={...} onKeyDown={(e) => e.key === 'Enter' && handleReferenceSearch()} className="..."` and a `<button type="button" onClick={handleReferenceSearch} className="...">`, plus an inline error `<p>` rendered below when `referenceError` is set — style with `text-red-500 text-sm mt-1`
- [X] T010 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, add verse highlight rendering in the passage verse loop: when `verse.number === highlightedVerse`, add class `bg-yellow-100 dark:bg-yellow-900/30 rounded px-1`; also add a `useEffect` that fires when `highlightedVerse` changes and passage is loaded — use `document.querySelector(\`[data-verse="${highlightedVerse}"]\`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })`, and add `data-verse={verse.number}` to each verse element
- [X] T011 [US1] In `packages/bible-reader/src/components/BibleReader.tsx`, clear `highlightedVerse` (set to null) inside `handlePrevChapter`, `handleNextChapter`, and `handleBookSelect` so stale highlights are removed on manual navigation
- [X] T012 [US1] Add i18n keys for US1 to `packages/shared/src/i18n/locales/en.ts`: `'bible.referenceSearch': 'Go to verse'`, `'bible.referenceSearchPlaceholder': 'e.g. John 3:16, Ps 23'`, `'bible.referenceNotFound': 'Reference not found'`, `'bible.referenceSearchLabel': 'Verse reference search'`
- [X] T013 [P] [US1] Add matching Spanish translations for the 4 new keys to `packages/shared/src/i18n/locales/es.ts` (use Unicode escapes for accented characters per CLAUDE.md)
- [X] T014 [P] [US1] Add matching Chinese translations for the 4 new keys to `packages/shared/src/i18n/locales/zh.ts`

**Checkpoint**: US1 complete — type "John 3:16" → navigates to John 3 with verse 16 highlighted; invalid reference shows inline error

---

## Phase 4: User Story 2 — Cross-Device Bookmark Sync (Priority: P2)

**Goal**: Merge local bookmarks with Firestore bookmarks on sign-in (the sync pipeline already exists — only the merge logic is missing).

**Independent Test**: Bookmark a verse signed-out (saves to localStorage) → sign in with an account that has different Firestore bookmarks → open bookmarks list → both the local bookmark AND the Firestore bookmarks appear. (See quickstart.md Scenario E.)

**Dependency**: Can run in parallel with US1 — modifies `restoreUserData.ts` only (different file from US1's `BibleReader.tsx`).

### Implementation for User Story 2

- [X] T015 [P] [US2] In `packages/shell/src/context/restoreUserData.ts`, replace the overwrite block (lines 66–67) with a merge: read existing local bookmarks from `localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS)`, create a Set of `book+'.'+chapter` keys from `profile.bibleBookmarks`, build merged array as `[...profile.bibleBookmarks, ...existingLocal.filter(b => !firestoreKeys.has(...))]`, then write merged array to localStorage — keep the existing `dispatchEvent(BIBLE_BOOKMARKS_CHANGED)` call on line 68 (which triggers the Firestore write of the merged union via `useFirestoreSync`)

**Checkpoint**: US2 complete — local bookmarks are not lost on sign-in; both local and Firestore bookmarks appear in the merged list

---

## Phase 5: User Story 3 — Side-by-Side Translation Comparison (Priority: P3)

**Goal**: Users can display the same chapter in two translations side by side for comparison.

**Independent Test**: Navigate to John 3 → open comparison mode → select KJV as second translation → two columns appear side by side showing John 3 in NIV and KJV; navigate to John 4 → both columns update. (See quickstart.md Scenario F.)

**Dependency**: Must implement after US1 is complete — both US1 and US3 modify `BibleReader.tsx` and `useBibleData.ts`. US3 must come after US1 to avoid merge conflicts.

### Implementation for User Story 3

- [X] T016 [US3] In `packages/bible-reader/src/hooks/useBibleData.ts`, add `useComparisonPassage()` hook: mirror the `useBiblePassage()` pattern exactly — `useLazyQuery(GET_BIBLE_PASSAGE, { fetchPolicy: 'cache-first' })`, expose `comparisonPassage`, `comparisonLoading`, `comparisonError`, and `loadComparisonPassage(book, chapter, translation)` callback
- [X] T017 [US3] In `packages/bible-reader/src/components/BibleReader.tsx`, add `comparisonMode: boolean` (init `false`) and `secondTranslation: string` (init `''`) state variables, and call `const { comparisonPassage, comparisonLoading, loadComparisonPassage } = useComparisonPassage()` from `useBibleData`
- [X] T018 [US3] In `packages/bible-reader/src/components/BibleReader.tsx`, add a `handleComparisonToggle` callback: when opening, set `comparisonMode = true` and initialize `secondTranslation` to the first available version that differs from `bibleVersion` (or `''` if none); when closing, set `comparisonMode = false`
- [X] T019 [US3] In `packages/bible-reader/src/components/BibleReader.tsx`, update `handlePrevChapter` and `handleNextChapter` to also call `loadComparisonPassage(book, chapter, secondTranslation)` when `comparisonMode` is true and `secondTranslation !== bibleVersion`
- [X] T020 [US3] In `packages/bible-reader/src/components/BibleReader.tsx`, in the `view === 'passage'` render block: add a compare toggle button (`type="button"`, `aria-label={t('bible.compareTranslations')}`) in the toolbar; when `comparisonMode` is true, wrap the passage output in `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` with two columns — column 1 (primary passage), column 2 (comparison passage or a `<select>` for second translation + inline hint when same translation selected)
- [X] T021 [US3] In `packages/bible-reader/src/components/BibleReader.tsx`, render the second translation `<select>` in the comparison column header: same `dynamicVersions` options as the primary picker, `value={secondTranslation}`, `onChange={(e) => { setSecondTranslation(e.target.value); if (e.target.value !== bibleVersion) loadComparisonPassage(currentBook, currentChapter, e.target.value); }}`; when `secondTranslation === bibleVersion`, show inline hint using `t('bible.chooseDifferentTranslation')` and skip rendering `comparisonPassage`
- [X] T022 [US3] Add i18n keys for US3 to `packages/shared/src/i18n/locales/en.ts`: `'bible.compareTranslations': 'Compare translations'`, `'bible.closeComparison': 'Close comparison'`, `'bible.chooseDifferentTranslation': 'Choose a different translation to compare'`, `'bible.comparisonSecondLabel': 'Second translation'`
- [X] T023 [P] [US3] Add matching Spanish translations for the 4 new US3 keys to `packages/shared/src/i18n/locales/es.ts`
- [X] T024 [P] [US3] Add matching Chinese translations for the 4 new US3 keys to `packages/shared/src/i18n/locales/zh.ts`

**Checkpoint**: US3 complete — comparison mode shows two translations side by side; columns stack on mobile; navigating chapters updates both columns

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Extend existing tests, verify full build passes, run quickstart scenarios.

- [X] T025 [P] Add reference search tests to `packages/bible-reader/src/components/BibleReader.test.tsx`: test that typing "John 3:16" and submitting navigates to John chapter 3 and sets highlightedVerse to 16; test that "Ps 23" resolves to Psalms chapter 23; test that "Zz 99" shows the referenceNotFound error message; test that empty submit has no effect
- [X] T026 [P] Add `parseVerseReference` unit tests inline in `packages/bible-reader/src/components/BibleReader.test.tsx`: test full reference (book + chapter + verse), partial reference (book + chapter only), abbreviated book names, case-insensitive input, leading/trailing whitespace, null for unrecognized book
- [ ] T027 [P] Add bookmark merge tests to `packages/shell/src/context/restoreUserData.test.ts`: test that sign-in with Firestore bookmarks AND local bookmarks produces merged union; test that duplicates by `book+chapter` are not doubled (Firestore version kept); test that sign-in with only Firestore bookmarks still restores them; test backward compat — sign-in with empty local storage and Firestore bookmarks works as before
- [X] T028 [P] Add comparison mode tests to `packages/bible-reader/src/components/BibleReader.test.tsx`: test that clicking the compare button renders a second translation select; test that selecting the same translation shows the hint message; test that selecting a different translation triggers `loadComparisonPassage`
- [X] T029 Run `pnpm --filter @mycircle/bible-reader test:run` and fix any test failures in `packages/bible-reader/src/`
- [X] T030 Run `pnpm --filter @mycircle/shell test:run` and fix any test failures in `packages/shell/src/context/restoreUserData.test.ts`
- [X] T031 Run `pnpm --filter @mycircle/shared build` to rebuild shared (new i18n keys), then run `pnpm --filter @mycircle/bible-reader build` and `pnpm --filter @mycircle/shell build` to confirm both MFEs build cleanly
- [X] T032 Run `pnpm lint` from repo root and fix any lint errors in modified files
- [X] T033 Run `pnpm typecheck` and fix any TypeScript errors in modified files
- [ ] T034 Run manual quickstart.md scenarios A–H against `pnpm dev` to validate all three user stories end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — confirm baseline builds pass
- **US1 (Phase 3)**: Depends on Phase 2 — modifies `BibleReader.tsx` (T005–T011) and i18n (T012–T014)
- **US2 (Phase 4)**: Depends on Phase 2 — modifies `restoreUserData.ts` independently; can run in parallel with US1
- **US3 (Phase 5)**: Depends on US1 (Phase 3) completion — both modify `BibleReader.tsx` and `useBibleData.ts`; sequential to avoid conflicts
- **Polish (Phase 6)**: Depends on US1 + US2 + US3 completion

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — independent of US2
- **US2 (P2)**: Can start immediately after Phase 2 — independent of US1 (different file)
- **US3 (P3)**: Must follow US1 — same files (`BibleReader.tsx`, `useBibleData.ts`)

### Parallel Opportunities

- T001, T002, T003 (Setup reads) can run in parallel
- T013, T014 (US1 i18n es/zh) can run in parallel with each other
- US1 tasks (T005–T014) and US2 task (T015) can run in parallel — different files
- T023, T024 (US3 i18n es/zh) can run in parallel with each other
- T025, T026, T027, T028 (Polish tests) can run in parallel

---

## Parallel Example: US1 + US2 (Different Files)

```bash
# US1 and US2 can be implemented simultaneously since they touch different files:

# Developer A (or Agent A):
Task T005: Add BOOK_ALIASES map in packages/bible-reader/src/components/BibleReader.tsx
Task T006: Add parseVerseReference() function
Task T007: Add highlightedVerse + referenceInput state
Task T008: Add handleReferenceSearch callback
Task T009: Render reference search input in toolbar
Task T010: Add verse highlight rendering + scrollIntoView
Task T011: Clear highlightedVerse on manual navigation
Task T012: Add US1 i18n keys to en.ts
Task T013: Add US1 Spanish i18n keys
Task T014: Add US1 Chinese i18n keys

# Developer B (or Agent B):
Task T015: Fix merge in packages/shell/src/context/restoreUserData.ts
```

---

## Implementation Strategy

### MVP First (US1 Only — Verse Reference Lookup)

1. Complete Phase 1: Verify source files
2. Complete Phase 2: Confirm baseline builds
3. Complete Phase 3: US1 (BibleReader.tsx + i18n)
4. **STOP and VALIDATE**: Test with "John 3:16" — navigates correctly with highlight
5. Ship US1 independently if needed

### Incremental Delivery

1. Phase 1 + 2: Verification → Foundation confirmed
2. Phase 3 (US1): Reference lookup → power-user navigation fully usable ✓
3. Phase 4 (US2): Bookmark merge fix → cross-device sync completed ✓
4. Phase 5 (US3): Translation comparison → study feature available ✓
5. Phase 6: Tests + validation → ready for PR

### Notes

- `[P]` tasks = different files, no dependencies on incomplete sibling tasks
- US1 tasks (T005–T014) are sequential within `BibleReader.tsx` — each builds on the previous state variable or handler
- US2 task (T015) is a single self-contained change to `restoreUserData.ts`
- US3 tasks (T016–T024) are sequential — hook must exist before component uses it
- Commit after each phase or logical group
- Run `pnpm --filter @mycircle/shared build` after any i18n key changes before testing MFEs
