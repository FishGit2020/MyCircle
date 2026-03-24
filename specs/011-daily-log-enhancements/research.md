# Research: Daily Log Journal Enhancements

**Feature**: 011-daily-log-enhancements
**Date**: 2026-03-24

---

## Decision 1: Data Persistence Layer

**Decision**: Extend the existing `window.__workTracker` bridge (direct Firestore) rather than add GraphQL resolvers.

**Rationale**: The `daily-log` MFE already uses `window.__workTracker` backed by Firestore `users/{uid}/dailylog`. Adding `mood` and `tags` as optional fields on existing documents is a backward-compatible in-place extension requiring no schema migration. Migrating to GraphQL would require adding resolvers, regenerating codegen, and rewriting the hook — all scope beyond this enhancement.

**Alternatives considered**:
- GraphQL mutation — rejected; daily-log was intentionally designed on the window-bridge pattern (same as `window.__flashcardDecks`, `window.__hikingRoutes`). Migrating now adds risk without user-facing value.
- Separate subcollection for tags — rejected; tags are an attribute of an entry, not a standalone entity.

**Constitution note**: Direct Firestore access via window bridge is an existing exception to Principle III (GraphQL-First). This feature extends, but does not introduce, that exception. Documented in Complexity Tracking.

---

## Decision 2: Writing Streak Calculation

**Decision**: Compute streak client-side from the already-loaded `entries` array. No new Firestore field; no server-side aggregation.

**Rationale**: All entries are already loaded in memory via the real-time subscription. Computing "consecutive days with at least one entry up to today" is O(n) on sorted unique dates — trivial for ≤500 entries. The flashcards MFE stores streak in Firestore (`users/{uid}/dailyStreak`) because its streak is updated during a review session. Daily-log entries are the authoritative source, so deriving the streak from them is simpler and always consistent.

**Algorithm**:
```
1. Extract unique dates from entries (Set<string>)
2. Sort descending
3. Start from today's local date string
4. Walk backwards: if dateSet.has(dateStr) → increment streak, else break
5. Return count
```

**Alternatives considered**:
- Store streak in Firestore (like flashcards) — rejected; requires a separate write on every entry add/delete/move, and can drift from truth if entries are deleted.
- Server-side aggregation — rejected; overkill for ≤500 entries.

---

## Decision 3: Search Implementation

**Decision**: Client-side filter over the loaded entry array. No search index, no library dependency.

**Rationale**: With ≤500 entries loaded in memory, a JavaScript `Array.filter()` + `String.includes()` search is synchronous and imperceptibly fast. No `lunr`, `fuse.js`, or server-side query needed. Highlight matched text using a simple split-on-match approach in a `HighlightedText` component.

**Alternatives considered**:
- Fuse.js fuzzy search — rejected; fuzzy matching is unnecessary for journaling and adds a dependency.
- Firestore `where` query with `>=`/`<=` — rejected; Firestore does not support full-text search; would require Algolia or similar, which is far out of scope.

---

## Decision 4: Stats Computation

**Decision**: Derive all stats (streak, 30-day chart, mood distribution, top tags) from the loaded `entries` array. Compute in a `useMemo` inside the new `StatsView` component.

**Rationale**: All required data is already present in the entries subscription result. No new queries, no loading states.

**Stats computed**:
- **Streak**: see Decision 2
- **30-day chart**: for each of the 30 days ending today, count entries with matching date
- **Mood distribution**: count entries per mood value, compute percentage
- **Top 5 tags**: flatten all entry tag arrays, count frequency, take top 5

---

## Decision 5: Mood Value Set

**Decision**: 5 fixed mood options stored as string literals: `happy`, `neutral`, `sad`, `frustrated`, `energized`.

**Rationale**: A fixed set enables consistent emoji mapping, i18n keys, and color coding without user-managed taxonomy. 5 options covers the primary journaling range. Stored as a string (not a number) so it is human-readable in Firestore and resilient to reordering.

**Emoji mapping** (display only, not stored):
| Value | Emoji | Tailwind accent |
|-------|-------|-----------------|
| happy | 😊 | green |
| neutral | 😐 | gray |
| sad | 😔 | blue |
| frustrated | 😤 | red |
| energized | 🔥 | orange |

---

## Decision 6: Tag Input UX

**Decision**: Comma-separated or Enter-to-confirm input within the existing `EntryForm`. Tags render as chips below the text field during editing.

**Rationale**: Familiar tag-entry pattern (same as used in Linear, Notion). No separate tag management screen needed — tags exist only on entries.

**Constraints implemented**:
- Max 10 tags per entry (FR-005)
- Max 30 characters per tag (FR-005)
- Tags are lowercased and trimmed on save to normalize them

---

## Files to Modify (from research)

| File | Change |
|------|--------|
| `packages/shared/src/types/window.d.ts` lines 77–84 | Extend `__workTracker` type signatures |
| `packages/shell/src/lib/firebase.ts` lines 1022–1050 | Extend `addDailyLogEntry`, `updateDailyLogEntry` signatures |
| `packages/daily-log/src/types.ts` | Add `mood?`, `tags?` to `WorkEntry` |
| `packages/daily-log/src/components/EntryForm.tsx` | Add `MoodPicker` + `TagInput` |
| `packages/daily-log/src/components/DayNode.tsx` | Render mood + tag chips |
| `packages/daily-log/src/components/DailyLog.tsx` | Add `SearchBar`, stats tab, tag-filter state |
| `packages/daily-log/src/hooks/useDailyLogEntries.ts` | Pass `mood`/`tags` through add/update |
| `packages/shared/src/i18n/locales/en.ts` | Add new dailyLog.* keys |
| `packages/shared/src/i18n/locales/es.ts` | Add matching keys (Unicode escapes) |
| `packages/shared/src/i18n/locales/zh.ts` | Add matching keys |

## New Files to Create

| File | Purpose |
|------|---------|
| `packages/daily-log/src/components/MoodPicker.tsx` | Emoji mood selector row |
| `packages/daily-log/src/components/TagInput.tsx` | Tag chip input with add/remove |
| `packages/daily-log/src/components/SearchBar.tsx` | Search input with clear button |
| `packages/daily-log/src/components/StatsView.tsx` | Stats tab: streak, chart, mood %, top tags |
| `packages/daily-log/src/components/HighlightedText.tsx` | Highlight search matches in entry text |
| `packages/daily-log/src/utils/streak.ts` | `computeStreak(entries)` pure function |
| `packages/daily-log/src/utils/stats.ts` | `computeMoodDistribution`, `computeTopTags`, `compute30DayChart` |
