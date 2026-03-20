# Quickstart: Bible Enhancements

**Branch**: `006-bible-enhancements` | **Date**: 2026-03-20

---

## Prerequisites

1. **Dev stack running**:
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000` → navigate to **Bible Reader**.

2. **A signed-in account** for US2 bookmark sync scenarios.

3. **Two browser profiles or devices** available for US2 cross-device test (or use browser's private window as "device B" after signing in with the same account).

---

## Scenario A — US1: Verse Reference Lookup (Full Reference)

**Goal**: Verify that typing "John 3:16" navigates to John chapter 3 with verse 16 highlighted.

**Steps**:
1. Open Bible Reader.
2. Locate the reference search input (above or near the navigation controls, placeholder: "e.g. John 3:16, Ps 23").
3. Type: `John 3:16`
4. Press Enter or click the Go button.

**Expected**:
- Passage view shows John chapter 3.
- Verse 16 is visually highlighted (yellow background, smooth scroll to it).
- The reference input is cleared.
- No `#` or verse navigation buttons were used.

**Failure indicators**:
- Passage does not change — `parseVerseReference` not wired to `loadPassage`.
- Verse 16 not highlighted — `highlightedVerse` state not set.
- Input not cleared after navigation.

---

## Scenario B — US1: Abbreviated Book Reference

**Goal**: Verify that book abbreviations resolve correctly.

**Steps**:
1. In the reference search input, type: `Ps 23`
2. Press Enter.

**Expected**:
- Passage view shows Psalms chapter 23.
- No verse highlight (no verse specified).
- Input is cleared.

Then try: `Gen 1:1`, `Rev 22:21`, `Mt 5:3`.

**Expected**: Each resolves to the correct book/chapter/verse.

---

## Scenario C — US1: Invalid Reference

**Goal**: Verify graceful error handling for unrecognized references.

**Steps**:
1. Type: `Zz 99:99`
2. Press Enter.

**Expected**:
- Inline error message appears: "Reference not found".
- The passage display does not change.
- Input is NOT cleared (user can correct the typo).

Also try: `John` (no chapter), `` (empty submit).

**Expected for empty submit**: Nothing happens, no error.

---

## Scenario D — US2: Cross-Device Bookmark Sync

**Goal**: Verify that bookmarks saved on device A appear on device B after sign-in.

**Steps** (Device A):
1. Sign in with your account.
2. Navigate to any verse, e.g. Philippians 4:13.
3. Tap the bookmark button — confirm it is bookmarked.

**Steps** (Device B — different browser/private window):
1. Open `http://localhost:3000` → Bible Reader.
2. Sign in with the same account.
3. Open the bookmarks list.

**Expected**:
- "Philippians 4" (or the bookmarked label) appears in the bookmarks list on device B.
- No manual sync action was required.

**Failure indicators**:
- Bookmark not present on device B — `restoreUserData` not reading `bibleBookmarks` from Firestore.
- Bookmark present but duplicated — merge not deduplicating by `book + chapter`.

---

## Scenario E — US2: Local Bookmark Merge on Sign-In

**Goal**: Verify that local bookmarks on device B are merged with Firestore bookmarks, not overwritten.

**Steps**:
1. On a browser (signed out), navigate to Romans 8:28 and bookmark it (saved to localStorage).
2. Sign in with an account that has different bookmarks in Firestore (e.g. John 3 from Scenario D).
3. Open the bookmarks list.

**Expected**:
- Both Romans 8 (local) AND John 3 (Firestore) appear in the list.
- Neither bookmark was lost.

**Failure indicators**:
- Only John 3 appears — old overwrite behavior still in place.
- Only Romans 8 appears — Firestore bookmarks not merged in.

---

## Scenario F — US3: Side-by-Side Translation Comparison

**Goal**: Verify that the comparison view shows two translations of the same chapter side by side.

**Steps**:
1. Navigate to John chapter 3.
2. Click the "Compare translations" button.
3. In the second translation selector, choose KJV (or any translation different from the current one).

**Expected**:
- Two columns appear side by side (on desktop: `md:grid-cols-2`).
- Left column shows the primary translation (e.g. NIV), right column shows KJV.
- Both columns show the same chapter (John 3).
- Column headers show the translation name.

Then click **next chapter** (→ John 4).

**Expected**: Both columns update to John 4 simultaneously.

---

## Scenario G — US3: Same Translation Rejected

**Goal**: Verify that selecting the same translation in both slots is prevented.

**Steps**:
1. Open comparison mode.
2. In the second translation selector, choose the same translation as the primary (e.g. both NIV).

**Expected**:
- Inline hint appears: "Choose a different translation to compare".
- The second column shows a placeholder (no passage rendered for the duplicate).

---

## Scenario H — US3: Mobile Responsive Stack

**Goal**: Verify columns stack on narrow viewports.

**Steps**:
1. Open comparison mode on desktop.
2. Open browser DevTools → Responsive mode → set width to 375px (iPhone size).

**Expected**:
- Both columns stack vertically (one on top of the other, not side by side).
- Each column is full width and fully readable.
- No horizontal overflow.

---

## Unit Test Smoke Check

After implementation, confirm all tests pass:

```bash
pnpm --filter @mycircle/bible-reader test:run
pnpm --filter @mycircle/shell test:run
```

Key test files:
- `packages/bible-reader/src/components/BibleReader.test.tsx`
- `packages/shell/src/context/restoreUserData.test.ts`

---

## Common Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Reference search not found after typing valid reference | `parseVerseReference` regex not matching format | Log the parsed result; check chapter/verse split |
| Verse not highlighted after navigation | `highlightedVerse` not set or verse number mismatch | Confirm `verses[].number` matches the parsed verse |
| Bookmark lost after sign-in | `restoreUserData.ts` still overwrites | Verify the merge logic reads local bookmarks before writing |
| Both columns show same passage | `secondTranslation` state not passed to `loadSecondaryPassage` | Check the `useEffect` that triggers both queries on chapter change |
| Comparison columns not side-by-side on desktop | Missing `md:grid-cols-2` class | Check the comparison wrapper div |
| Dark mode: highlight invisible | Missing `dark:bg-yellow-900/30` on highlighted verse | Add dark variant to highlight class |
