# Research: Bible Enhancements

**Branch**: `006-bible-enhancements` | **Date**: 2026-03-20
**Derived from**: `/specs/006-bible-enhancements/spec.md`

---

## Decision 1 — Reference Parser Location (US1)

**Decision**: Client-side reference parsing in `packages/bible-reader/src/components/BibleReader.tsx` using a static `BOOK_ALIASES` map.

**Rationale**: The backend already has `convertToUsfmRef()` in `functions/src/resolvers/bible.ts` with a full 66-book alias map, but it is server-side only. The frontend navigation state requires `book` and `chapter` as separate values (not a combined USFM string), so client-side parsing is required regardless. A static alias map (common abbreviations for the 66 Protestant canonical books) is ~50 lines and needs no API call — matching the spec's requirement for sub-5-second navigation.

**Alternatives considered**:
- *New GraphQL resolver for reference parsing*: Unnecessary round-trip. The existing `loadPassage(book, chapter)` already accepts a book name; we just need to resolve the alias first.
- *Shared utility in `@mycircle/shared`*: Over-engineering — only the Bible Reader MFE uses this. Constitution VI (Simplicity) prefers local code over premature abstraction.

---

## Decision 2 — Firestore Bookmark Sync (US2)

**Decision**: The Firestore bookmark sync infrastructure is **already fully implemented** in the shell. No new code is needed in `firebase.ts` or `useFirestoreSync.ts`. The only required change is a **1-line merge fix** in `packages/shell/src/context/restoreUserData.ts`.

**Rationale**: Audit of the existing codebase revealed the complete sync pipeline:
1. `BibleReader.tsx` → `saveBookmarks()` → writes to localStorage + fires `BIBLE_BOOKMARKS_CHANGED`
2. Shell `useFirestoreSync.ts` → listens for `BIBLE_BOOKMARKS_CHANGED` → calls `updateBibleBookmarks(uid, bookmarks)` → writes to Firestore `users/{uid}.bibleBookmarks`
3. Shell `restoreUserData.ts` → on sign-in reads `profile.bibleBookmarks` → **currently overwrites** localStorage rather than merging

The spec requires merge (union, no duplicates). The fix: when restoring, read existing local bookmarks, merge with Firestore bookmarks by unique key (`book+chapter+timestamp`), write merged set, then dispatch `BIBLE_BOOKMARKS_CHANGED` to trigger Firestore write of the merged union.

**Alternatives considered**:
- *New GraphQL mutation for bookmark CRUD*: Overengineering. The existing Firestore-direct write pattern via shell event bus is established, tested, and working for 10+ other data types. Adding GraphQL for bookmarks would require schema changes + codegen with no user benefit.
- *Subcollection per bookmark*: Adds complexity; the flat array on `users/{uid}` is already the established pattern for bookmarks (book bookmarks use the same approach).

---

## Decision 3 — Translation Comparison Implementation (US3)

**Decision**: Add a `useComparisonPassage()` hook to `packages/bible-reader/src/hooks/useBibleData.ts` that wraps a second `useLazyQuery(GET_BIBLE_PASSAGE)`. BibleReader.tsx adds two state variables: `comparisonMode: boolean` and `secondTranslation: string`. When active, renders two columns using CSS grid (`grid-cols-1 md:grid-cols-2`).

**Rationale**: The existing `GET_BIBLE_PASSAGE` query + `useLazyQuery` pattern handles a single passage fetch. A second independent query hook for the comparison passage reuses the same infrastructure with zero schema changes. CSS grid provides the responsive layout requirement (single column on mobile, two columns on `md:`+) with minimal code.

**Alternatives considered**:
- *Single query with two translations*: The YouVersion API does not support batched multi-translation requests; two separate fetches are required.
- *New `BibleComparisonView` component file*: Unnecessary for initial scope. The comparison UI is toggle state within the existing `PassageDisplay` render path — extracting to a separate component would be premature at this size.

---

## Decision 4 — Verse Highlighting (US1)

**Decision**: Add `highlightedVerse: number | null` state in BibleReader.tsx. After navigating to a chapter via reference lookup, if the parsed reference includes a verse number, set `highlightedVerse` and scroll the verse element into view using a `ref` + `scrollIntoView({ behavior: 'smooth' })`.

**Rationale**: The existing passage renderer already maps over `verses` (from `BibleVerseItem[]`). Adding a highlight class to the matching `verse.number` requires a single conditional className addition. The `scrollIntoView` call handles automatic scroll-to-verse without additional dependencies.

**Alternatives considered**:
- *URL hash (#verse-16)*: Would require the shell's router to handle fragment navigation inside the MFE iframe, which is not currently supported.
- *Pass verse to GraphQL query*: The existing `biblePassage` resolver fetches the full chapter; verse-level fetch is not supported by the API and would break the prev/next chapter navigation UX.

---

## Decision 5 — No GraphQL Schema Changes

**Decision**: Zero changes to `functions/src/schema.ts` or `packages/shared/src/apollo/queries.ts`.

**Rationale**: All three user stories are served by the existing `GET_BIBLE_PASSAGE` query. US1 adds a frontend-only reference parser. US2 uses the existing event-bus sync. US3 adds a second call to the existing query with a different translation ID. No `pnpm codegen` run required.

---

## Dependency Audit

| Dependency | Status | Source |
|-----------|--------|--------|
| `GET_BIBLE_PASSAGE` GraphQL query | Existing | `packages/shared/src/apollo/queries.ts` |
| `useLazyQuery` from `@mycircle/shared` | Existing | re-export of `@apollo/client` |
| `WindowEvents.BIBLE_BOOKMARKS_CHANGED` | Existing | `packages/shared/src/utils/eventBus.ts` |
| `StorageKeys.BIBLE_BOOKMARKS` | Existing | `packages/shared/src/utils/eventBus.ts` |
| `updateBibleBookmarks()` in shell | Existing | `packages/shell/src/lib/firebase.ts` |
| `restoreUserData()` in shell | Needs 1-line merge fix | `packages/shell/src/context/restoreUserData.ts` |
| Book alias map | New (static, ~50 lines) | `packages/bible-reader/src/components/BibleReader.tsx` |
| New i18n keys (US1 + US3) | New | All 3 locale files |

**New packages required**: None.
**Schema changes required**: None.
**Codegen required**: No.
