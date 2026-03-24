# Data Model: Daily Log Journal Enhancements

**Feature**: 011-daily-log-enhancements
**Date**: 2026-03-24

---

## Existing Entity (extended)

### WorkEntry

**Firestore path**: `users/{uid}/dailylog/{entryId}`

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | `string` | yes | non-empty | Document ID, injected on read |
| `date` | `string` | yes | `YYYY-MM-DD` local tz | Use `getLocalDateString()` |
| `content` | `string` | yes | non-empty, trimmed | Entry text |
| `createdAt` | Firestore Timestamp | yes | server-set | `.toMillis()` on read |
| `mood` | `string` *(new)* | no | one of MoodValue enum | Absent = no mood |
| `tags` | `string[]` *(new)* | no | 0–10 items, each ≤30 chars, trimmed+lowercased | Absent = no tags |

**TypeScript type** (update `packages/daily-log/src/types.ts`):
```ts
export type MoodValue = 'happy' | 'neutral' | 'sad' | 'frustrated' | 'energized';

export interface WorkEntry {
  id: string;
  date: string;
  content: string;
  createdAt: { seconds: number; nanoseconds: number };
  mood?: MoodValue;
  tags?: string[];
}
```

**Backward compatibility**: Existing documents without `mood` or `tags` fields are valid. The UI treats absent fields as "no mood selected" and "no tags."

---

## Derived Values (no storage)

### WritingStreak

Computed client-side from the loaded `entries` array on every render.

| Field | Type | Computation |
|-------|------|-------------|
| `currentStreak` | `number` | Count of consecutive calendar days (from today backwards) that have ≥1 entry |
| `longestStreak` | `number` | Not computed in this iteration — only current streak shown |

**Pure function**: `computeStreak(entries: WorkEntry[]): number`
- Extract unique dates into a `Set<string>`
- Walk backwards from today using `getLocalDateString()`
- Increment while the date is in the set; stop at first gap

### MoodDistribution

| Field | Type |
|-------|------|
| `mood` | `MoodValue` |
| `count` | `number` |
| `percentage` | `number` (0–100) |

**Pure function**: `computeMoodDistribution(entries: WorkEntry[]): MoodDistribution[]`

### TagFrequency

| Field | Type |
|-------|------|
| `tag` | `string` |
| `count` | `number` |

**Pure function**: `computeTopTags(entries: WorkEntry[], limit = 5): TagFrequency[]`

### DayCount (for 30-day chart)

| Field | Type |
|-------|------|
| `date` | `string` YYYY-MM-DD |
| `count` | `number` |

**Pure function**: `compute30DayChart(entries: WorkEntry[]): DayCount[]`
- Always returns exactly 30 items (today - 29 days → today)
- Missing days have `count: 0`

---

## Mood Value Enum

| Value | Display Emoji | Tailwind accent color |
|-------|--------------|----------------------|
| `happy` | 😊 | `text-green-500 dark:text-green-400` |
| `neutral` | 😐 | `text-gray-500 dark:text-gray-400` |
| `sad` | 😔 | `text-blue-400 dark:text-blue-300` |
| `frustrated` | 😤 | `text-red-500 dark:text-red-400` |
| `energized` | 🔥 | `text-orange-500 dark:text-orange-400` |

---

## Window Bridge Extension

**File**: `packages/shared/src/types/window.d.ts`

Extend `__workTracker` interface (lines 77–84):

```ts
__workTracker?: {
  getAll: () => Promise<WorkEntry[]>;
  add: (entry: { date: string; content: string; mood?: string; tags?: string[] }) => Promise<string>;
  update: (id: string, updates: Partial<{ content: string; date: string; mood?: string; tags?: string[] }>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  subscribe?: (callback: (entries: WorkEntry[]) => void) => () => void;
};
```

**File**: `packages/shell/src/lib/firebase.ts`

Extend Firestore function signatures:
- `addDailyLogEntry(uid, { date, content, mood?, tags? })`
- `updateDailyLogEntry(uid, id, Partial<{ content, date, mood, tags }>)`

---

## Validation Rules

| Rule | Enforcement location |
|------|---------------------|
| `mood` must be one of 5 fixed values | `MoodPicker` (only valid options shown); type guard on read |
| `tags` max 10 per entry | `TagInput` (disable add when count = 10) |
| Each tag max 30 chars | `TagInput` (trim on entry; reject if still > 30) |
| Tags normalized to lowercase + trim | Before calling `add`/`update` in hook |
| `content` non-empty | Existing `EntryForm` validation (unchanged) |

---

## i18n Keys to Add

All keys must be added to `en.ts`, `es.ts`, and `zh.ts`.

```
dailyLog.moodLabel          — "Mood"
dailyLog.noMood             — "No mood"
dailyLog.mood.happy         — "Happy"
dailyLog.mood.neutral       — "Neutral"
dailyLog.mood.sad           — "Sad"
dailyLog.mood.frustrated    — "Frustrated"
dailyLog.mood.energized     — "Energized"
dailyLog.tagsLabel          — "Tags"
dailyLog.addTag             — "Add tag"
dailyLog.tagPlaceholder     — "Add a tag..."
dailyLog.tagLimitReached    — "Maximum 10 tags per entry"
dailyLog.searchPlaceholder  — "Search entries..."
dailyLog.searchNoResults    — "No entries match your search"
dailyLog.clearSearch        — "Clear search"
dailyLog.statsTab           — "Stats"
dailyLog.timelineTab        — "Timeline"
dailyLog.streak             — "Day streak"
dailyLog.streakDays         — "{count} days"
dailyLog.streakNone         — "Start your streak today"
dailyLog.moodDistribution   — "Mood breakdown"
dailyLog.topTags            — "Top tags"
dailyLog.last30Days         — "Last 30 days"
dailyLog.totalEntries       — "Total entries"
dailyLog.noMoodData         — "No mood data yet"
dailyLog.noTagData          — "No tags yet"
```
