# UI Contracts: Bible Enhancements

**Branch**: `006-bible-enhancements` | **Date**: 2026-03-20

---

## Contract 1 — Reference Search Input (US1)

**Component**: `ReferenceSearch` (inline within `BibleReader.tsx`, not a separate file)

**Behavior contract**:
- Renders a text input + submit button (or Enter key submission)
- On submit: calls `parseVerseReference(value)`:
  - If result is `VerseReference`: calls `onNavigate(ref)` and clears the input
  - If result is null: displays inline error message using `t('bible.referenceNotFound')`, does not clear input
- Input is cleared after successful navigation
- Empty submit: no-op (no error)
- Placeholder: `t('bible.referenceSearchPlaceholder')` — e.g. "John 3:16, Ps 23"

**Reference parser contract** (`parseVerseReference(input: string): VerseReference | null`):
- Normalizes: trim whitespace, lowercase, collapse multiple spaces
- Resolves book name via `BOOK_ALIASES` map (common abbreviations → canonical names)
- Extracts chapter (required) and verse (optional) using pattern: `{book} {chapter}` or `{book} {chapter}:{verse}`
- Returns null if book cannot be resolved or chapter is not a valid positive integer

**`BOOK_ALIASES` map coverage** (minimum required):
- Old Testament short forms: Gen, Ex, Lev, Num, Deut/Dt, Josh, Judg/Jdg, 1Sam/2Sam, 1Ki/2Ki, 1Chr/2Chr, Ezra, Neh, Esth, Job, Ps/Psa/Psalm, Prov/Pr, Eccl, Song/SoS/SS, Isa, Jer, Lam, Ezek, Dan, Hos, Joel, Amos, Obad, Jonah, Mic, Nah, Hab, Zeph, Hag, Zech, Mal
- New Testament short forms: Matt/Mt, Mark/Mk, Luke/Lk, John/Jn, Acts, Rom, 1Cor/2Cor, Gal, Eph, Phil, Col, 1Thess/2Thess, 1Tim/2Tim, Titus, Philem/Phlm, Heb, Jas, 1Pet/2Pet, 1Jn/2Jn/3Jn, Jude, Rev/Apoc

---

## Contract 2 — Verse Highlight (US1)

**State variable**: `highlightedVerse: number | null` in BibleReader component

**Behavior contract**:
- When `highlightedVerse` is not null and the passage is rendered, the verse `BibleVerseItem` with `number === highlightedVerse` receives a highlight class: `bg-yellow-100 dark:bg-yellow-900/30 rounded px-1`
- Immediately after passage render, scroll the highlighted verse element into view: `element.scrollIntoView({ behavior: 'smooth', block: 'center' })`
- `highlightedVerse` is cleared (set to null) when the user manually navigates to a different chapter via prev/next buttons or the book/chapter selector

---

## Contract 3 — Comparison Mode Toggle (US3)

**State variable**: `comparisonMode: boolean` + `secondTranslation: string` in BibleReader component

**Behavior contract**:
- A toggle button (icon or text) labeled `t('bible.compareTranslations')` opens/closes comparison mode
- When comparison opens: `comparisonMode = true`, `secondTranslation` defaults to the first available translation that differs from `bibleVersion`
- A second translation `<select>` appears (options: same `dynamicVersions` list, excluding the currently selected primary version)
- When both translations are the same: second select shows inline hint `t('bible.chooseDifferentTranslation')` and the comparison column shows a placeholder instead of a passage
- When user navigates chapters: both `loadPassage(book, chapter, bibleVersion)` and `loadSecondaryPassage(book, chapter, secondTranslation)` are called
- Layout: `grid grid-cols-1 md:grid-cols-2 gap-4` — stacks on mobile, side-by-side on `md:`+
- Each column shows: translation label (from version display name), passage verses
- Closing comparison: `comparisonMode = false`, single-column view restored, primary `bibleVersion` unchanged

---

## Contract 4 — restoreUserData Merge (US2)

**Function**: `restoreUserData(profile: UserProfile, uid: string)` in `packages/shell/src/context/restoreUserData.ts`

**Current behavior** (line 66–67): overwrites localStorage with Firestore bookmarks if Firestore has any.

**Required behavior**: merge local + Firestore bookmarks as a union, deduplicated by `book + chapter` key:

```
mergedBookmarks = union(
  localBookmarks,          // from localStorage['bible-bookmarks']
  profile.bibleBookmarks   // from Firestore
)
where duplicates are identified by (bookmark.book, bookmark.chapter)
and the Firestore bookmark is preferred on conflict (it has the authoritative timestamp)
```

After merge:
1. Write merged array to localStorage
2. Dispatch `BIBLE_BOOKMARKS_CHANGED` → triggers `useFirestoreSync` to write merged set back to Firestore

---

## i18n Keys Required

### New keys for US1:
```typescript
// en.ts
'bible.referenceSearch': 'Go to verse',
'bible.referenceSearchPlaceholder': 'e.g. John 3:16, Ps 23',
'bible.referenceNotFound': 'Reference not found',
'bible.referenceSearchLabel': 'Verse reference search',
```

### New keys for US3:
```typescript
// en.ts
'bible.compareTranslations': 'Compare translations',
'bible.closeComparison': 'Close comparison',
'bible.chooseDifferentTranslation': 'Choose a different translation to compare',
'bible.comparisonSecondLabel': 'Second translation',
```
