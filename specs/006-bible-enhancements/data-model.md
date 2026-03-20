# Data Model: Bible Enhancements

**Branch**: `006-bible-enhancements` | **Date**: 2026-03-20

---

## Entities

### VerseReference (Transient — US1)

Parsed representation of a user-typed reference string. Exists only in memory during navigation; never persisted.

```typescript
interface VerseReference {
  book: string;        // Resolved canonical book name, e.g. "John", "Psalms"
  chapter: number;     // Chapter number (>= 1)
  verse: number | null; // Optional verse number (>= 1), null if not specified
}
```

**Validation rules**:
- `book` must match a known canonical book name after alias resolution
- `chapter` must be a positive integer
- `verse` must be a positive integer or null
- If `book` cannot be resolved: parse returns `null` → show inline error

**State machine**:
```
User types input → parseVerseReference(input) → VerseReference | null
  ↓ VerseReference
setCurrentBook(book) + setCurrentChapter(chapter) + setView('passage')
  ↓ if verse != null
setHighlightedVerse(verse) → scrollIntoView
  ↓ null
Show inline error ("Reference not found")
```

---

### SyncedBookmark (Persisted — US2)

The existing `Bookmark` type, already defined in `packages/bible-reader/src/components/BibleReader.tsx` and stored at `users/{uid}.bibleBookmarks` in Firestore. No changes to the shape.

```typescript
interface Bookmark {
  book: string;      // Canonical book name, e.g. "John"
  chapter: number;   // Chapter number
  label: string;     // Display string, e.g. "John 3"
  timestamp: number; // Unix epoch ms when bookmarked
}
```

**Storage**:
- Local: `localStorage['bible-bookmarks']` — JSON-serialized `Bookmark[]`
- Cloud: `users/{uid}.bibleBookmarks: Bookmark[]` — Firestore array field on UserProfile document

**Merge key**: `book + '.' + chapter` — a bookmark is considered a duplicate if it has the same book and chapter regardless of timestamp.

**Sync flow** (already implemented, merge fix only):
```
saveBookmarks(bookmarks)
  → localStorage.setItem('bible-bookmarks', ...)
  → dispatchEvent(BIBLE_BOOKMARKS_CHANGED)
    → Shell useFirestoreSync
      → updateBibleBookmarks(uid, bookmarks) [if signed in]
        → Firestore users/{uid}.bibleBookmarks

On sign-in:
  restoreUserData(profile, uid)
    → merge(localBookmarks, profile.bibleBookmarks)  ← FIX NEEDED (currently overwrites)
    → localStorage.setItem(merged)
    → dispatchEvent(BIBLE_BOOKMARKS_CHANGED)  ← triggers Firestore write of merged set
```

---

### ComparisonState (UI-only — US3)

Ephemeral view state within BibleReader component. Not persisted to localStorage or Firestore. Cleared when the user navigates away from Bible Reader.

```typescript
interface ComparisonState {
  enabled: boolean;           // Whether comparison mode is active
  secondTranslation: string;  // Version ID for the second column, e.g. "1" (KJV)
}
```

**Constraints**:
- `secondTranslation` must differ from the primary `bibleVersion` state value
- When `enabled = false`, `secondTranslation` retains its last value so it is remembered when comparison is reopened within the same session

---

## Key Existing Entities (Unchanged)

### BiblePassage

```typescript
// Existing GraphQL type (functions/src/schema.ts)
type BiblePassage = {
  text: string;
  reference: string;
  translation: string | null;
  verseCount: number | null;
  copyright: string | null;
  verses: BibleVerseItem[];
};

type BibleVerseItem = {
  number: number;
  text: string;
};
```

Used unchanged for both the primary passage and the comparison passage (second `useLazyQuery` call with a different `translation` variable).

---

## Relationships

```
User
 └─ bibleBookmarks: SyncedBookmark[]   (Firestore: users/{uid}.bibleBookmarks)

BibleReader (component state)
 ├─ currentBook: string
 ├─ currentChapter: number
 ├─ highlightedVerse: number | null     ← NEW (US1)
 ├─ bibleVersion: string
 ├─ comparison: ComparisonState         ← NEW (US3)
 └─ bookmarks: SyncedBookmark[]         (localStorage)

VerseReference (transient)             ← NEW (US1)
 └─ parsed from user input → drives currentBook, currentChapter, highlightedVerse
```
