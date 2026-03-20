# Implementation Plan: Bible Enhancements

**Branch**: `006-bible-enhancements` | **Date**: 2026-03-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-bible-enhancements/spec.md`

## Summary

Extend the existing `packages/bible-reader` MFE with three enhancements: (1) a verse reference search input with client-side abbreviation resolution and verse highlighting; (2) a 1-line merge fix in `restoreUserData.ts` to complete cross-device bookmark sync (the Firestore sync pipeline already exists); (3) a side-by-side translation comparison view using a second `useLazyQuery` call. Zero new packages, zero schema changes, zero codegen required.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18 (same as existing `ai-assistant`, `bible-reader` MFEs)
**Primary Dependencies**: Existing — `packages/bible-reader`, `packages/shell`, `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, WindowEvents)
**Storage**: localStorage (`bible-bookmarks`) + Firestore `users/{uid}.bibleBookmarks` (already exists) + no new storage
**Testing**: Vitest + React Testing Library (existing per-package test setup)
**Target Platform**: Web MFE (Module Federation)
**Project Type**: Enhancement to existing MFE — not a new package
**Performance Goals**: Reference navigation < 5s (client-side parse only, no extra network call); comparison passage fetch < 2s (single `GET_BIBLE_PASSAGE` query, cached)
**Constraints**: No new npm packages. No GraphQL schema changes. No `pnpm codegen` run required. Mobile-first layout at `md:` breakpoint.
**Scale/Scope**: 3 files modified (BibleReader.tsx, useBibleData.ts, restoreUserData.ts) + i18n keys in 3 locales + test file extensions

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | No direct Firestore access from MFE; uses shell event bus (`BIBLE_BOOKMARKS_CHANGED`) |
| II. Complete Integration | ✅ PASS | Not a new MFE — no 20-point checklist required |
| III. GraphQL-First | ✅ PASS | All data via existing `GET_BIBLE_PASSAGE` + `useLazyQuery` from `@mycircle/shared`; US2 uses existing Firestore sync path (shell-side, not a new REST endpoint) |
| IV. Inclusive by Default | ✅ PASS | All new strings via `t('key')`, dark: variants on highlight/comparison, `type="button"` on new buttons, `aria-label` on search input |
| V. Fast Tests, Safe Code | ✅ PASS | Tests mock `useLazyQuery`, `useFirestoreSync`; no real network calls |
| VI. Simplicity | ✅ PASS | Client-side alias map in MFE file (no premature shared utility); 1-line merge fix; second query via existing hook pattern |

**No violations.** Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/006-bible-enhancements/
├── plan.md              ← this file
├── research.md          ← Phase 0 output ✅
├── data-model.md        ← Phase 1 output ✅
├── quickstart.md        ← Phase 1 output ✅
├── contracts/
│   └── ui-contracts.md  ← Phase 1 output ✅
└── tasks.md             ← /speckit.tasks output (not yet created)
```

### Source Code (affected files only)

```text
packages/bible-reader/
└── src/
    ├── components/
    │   └── BibleReader.tsx          ← US1 (reference input + verse highlight) + US3 (comparison state + layout)
    └── hooks/
        └── useBibleData.ts          ← US3 (useComparisonPassage hook)

packages/shell/
└── src/
    └── context/
        └── restoreUserData.ts       ← US2 (merge fix: union instead of overwrite)

packages/shared/
└── src/
    └── i18n/locales/
        ├── en.ts                    ← New i18n keys (US1 + US3)
        ├── es.ts                    ← Spanish translations
        └── zh.ts                    ← Chinese translations

packages/bible-reader/
└── src/
    ├── components/
    │   └── BibleReader.test.tsx     ← Extended (US1 parse tests, US3 comparison tests)
    └── hooks/
        └── useBibleData.test.ts     ← Extended (useComparisonPassage tests)

packages/shell/
└── src/
    └── context/
        └── restoreUserData.test.ts  ← Extended (merge behavior tests)
```

**Structure Decision**: Enhancement to existing files only. No new files created. No new MFE package.

## Implementation Notes

### US1 — Reference Lookup Key Details

1. `BOOK_ALIASES` static map goes in `BibleReader.tsx` near the top (after imports, before component): maps ~80 abbreviations to canonical names for all 66 Protestant books.
2. `parseVerseReference(input: string): VerseReference | null` — pure function, co-located.
3. Reference input renders inside the existing toolbar area between the current navigation and passage view. Conditionally visible only when `view === 'passage'` or always-visible (to allow direct-jump from any view) — choose always-visible for best UX.
4. `highlightedVerse` state cleared in `handlePrevChapter`, `handleNextChapter`, and `handleBookSelect` to avoid stale highlights on navigation.

### US2 — Bookmark Merge Key Details

`restoreUserData.ts` lines 66–67 currently:
```typescript
if (profile.bibleBookmarks && profile.bibleBookmarks.length > 0) {
  localStorage.setItem(StorageKeys.BIBLE_BOOKMARKS, JSON.stringify(profile.bibleBookmarks));
```

Change to:
```typescript
if (profile.bibleBookmarks && profile.bibleBookmarks.length > 0) {
  const existing: Bookmark[] = (() => {
    try { return JSON.parse(localStorage.getItem(StorageKeys.BIBLE_BOOKMARKS) || '[]'); }
    catch { return []; }
  })();
  const firestoreKeys = new Set(profile.bibleBookmarks.map(b => `${b.book}.${b.chapter}`));
  const merged = [...profile.bibleBookmarks, ...existing.filter(b => !firestoreKeys.has(`${b.book}.${b.chapter}`))];
  localStorage.setItem(StorageKeys.BIBLE_BOOKMARKS, JSON.stringify(merged));
```
Then dispatch `BIBLE_BOOKMARKS_CHANGED` (line 68 already does this).

### US3 — Comparison Hook Key Details

`useComparisonPassage()` in `useBibleData.ts`:
```typescript
export function useComparisonPassage() {
  const [fetchPassage, { data, loading, error }] = useLazyQuery<GetBiblePassageQuery>(GET_BIBLE_PASSAGE, {
    fetchPolicy: 'cache-first',
  });
  const loadComparisonPassage = useCallback((book: string, chapter: number, translation: string) => {
    fetchPassage({ variables: { reference: `${book} ${chapter}`, translation } });
  }, [fetchPassage]);
  return { comparisonPassage: data?.biblePassage ?? null, comparisonLoading: loading, comparisonError: error, loadComparisonPassage };
}
```

In BibleReader.tsx: add `const { comparisonPassage, loadComparisonPassage } = useComparisonPassage()`. When chapter changes AND `comparisonMode` is true, call `loadComparisonPassage(book, chapter, secondTranslation)` alongside the primary `loadPassage` call.
