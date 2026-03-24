# Implementation Plan: Daily Log Journal Enhancements

**Branch**: `011-daily-log-enhancements` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/011-daily-log-enhancements/spec.md`

## Summary

Enhance the existing `packages/daily-log` MFE with four independently deliverable capabilities: mood tracking (emoji selector per entry, stored in Firestore), tag labeling (free-form chips, filterable), full-text search (client-side, with highlight), and a stats panel (streak, 30-day chart, mood distribution, top tags). All enhancements extend the existing `window.__workTracker` bridge and `WorkEntry` type — no new MFE, no new GraphQL schema, no new dependencies.

---

## Technical Context

**Language/Version**: TypeScript 5.x + React 18
**Primary Dependencies**: `@mycircle/shared` (useTranslation, StorageKeys, PageContent), Tailwind CSS — no new packages added
**Storage**: Firestore `users/{uid}/dailylog/{entryId}` — two optional fields added (`mood`, `tags`); existing documents untouched
**Testing**: Vitest + React Testing Library; mock `window.__workTracker` in unit tests
**Target Platform**: Web (all screen sizes, mobile-first); existing MFE host
**Project Type**: Enhancement to existing MFE — no new package, no new routes
**Performance Goals**: Search results under 1 second for 500 entries (client-side filter); Stats panel with no loading spinner (computed from already-loaded data)
**Constraints**: Backward-compatible; no data migration; no new npm dependencies
**Scale/Scope**: Single user's journal, typically ≤500 entries loaded at once

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | Enhancing existing MFE; no direct `@apollo/client` imports; all shared utilities from `@mycircle/shared` |
| II. Complete Integration | ✅ PASS | Not a new MFE — no new routes, nav items, or Docker entries needed. Only i18n keys (all 3 locales) required |
| III. GraphQL-First | ⚠️ EXISTING EXCEPTION | `daily-log` uses `window.__workTracker` bridge (established pre-existing pattern, same as `__flashcardDecks`, `__hikingRoutes`). This feature extends, but does not introduce, the exception. Justified in Complexity Tracking. |
| IV. Inclusive by Default | ✅ PASS | All new strings use `t('key')`; all new Tailwind classes include `dark:` variants; mood picker touch targets ≥ 44px; `aria-label` on icon-only buttons |
| V. Fast Tests, Safe Code | ✅ PASS | Client-side search/stats; all tests mock `window.__workTracker`; `userEvent.setup({ delay: null })` |
| VI. Simplicity | ✅ PASS | No new dependencies; client-side search; streak derived from loaded entries; 7 focused new components |

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Principle III: `window.__workTracker` bridge instead of GraphQL | `daily-log` was built on this pattern before the GraphQL-first rule was solidified; migrating to GraphQL is a separate refactor effort unrelated to journaling features | Migration would require new resolver, codegen, and full hook rewrite — pure scope creep with no user-visible benefit |

---

## Project Structure

### Documentation (this feature)

```text
specs/011-daily-log-enhancements/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── contracts/
│   └── window-api.md    ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (files touched by this feature)

```text
packages/daily-log/src/
├── types.ts                        ← add MoodValue, mood?, tags? to WorkEntry
├── hooks/
│   └── useDailyLogEntries.ts       ← pass mood/tags through add/update
├── utils/
│   ├── localDate.ts                ← no change (already correct)
│   ├── streak.ts                   ← NEW: computeStreak(entries)
│   └── stats.ts                    ← NEW: computeMoodDistribution, computeTopTags, compute30DayChart
└── components/
    ├── DailyLog.tsx                ← add SearchBar, tabs (Timeline / Stats), tag-filter state
    ├── EntryForm.tsx               ← add MoodPicker + TagInput props
    ├── DayNode.tsx                 ← render mood emoji + tag chips inline
    ├── MoodPicker.tsx              ← NEW: 5-option emoji row
    ├── TagInput.tsx                ← NEW: chip-style tag entry with add/remove
    ├── SearchBar.tsx               ← NEW: input with clear button
    ├── StatsView.tsx               ← NEW: streak, 30-day bar chart, mood %, top-5 tags
    └── HighlightedText.tsx         ← NEW: wrap matched substring in <mark>

packages/shared/src/
└── types/
    └── window.d.ts                 ← extend __workTracker add/update signatures

packages/shell/src/lib/
└── firebase.ts                     ← extend addDailyLogEntry / updateDailyLogEntry

packages/shared/src/i18n/locales/
├── en.ts                           ← add ~24 new dailyLog.* keys
├── es.ts                           ← add matching keys (Unicode escapes)
└── zh.ts                           ← add matching keys
```

---

## Implementation Phases

### Phase A — Foundation (Prerequisite for all other phases)

**Goal**: Extend the data layer so mood and tags can be stored and retrieved.

1. **`packages/daily-log/src/types.ts`** — Add `MoodValue` type and optional `mood`/`tags` fields to `WorkEntry`.

2. **`packages/shared/src/types/window.d.ts`** — Extend `__workTracker` `add` and `update` signatures to accept optional `mood` and `tags` (see `contracts/window-api.md`).

3. **`packages/shell/src/lib/firebase.ts`** — Extend `addDailyLogEntry` and `updateDailyLogEntry` function signatures and Firestore writes to pass through `mood` and `tags`.

4. **`packages/daily-log/src/hooks/useDailyLogEntries.ts`** — Update `addEntry(content, mood?, tags?)` and `updateEntry(id, content, mood?, tags?)` signatures to accept and forward the new fields.

5. **i18n** — Add all 24 new `dailyLog.*` keys to `en.ts`, `es.ts`, `zh.ts`. Rebuild shared: `pnpm build:shared`.

---

### Phase B — Mood Tracking (P1, independently shippable)

**Dependencies**: Phase A complete.

1. **`MoodPicker.tsx`** — Row of 5 emoji buttons. Props: `value?: MoodValue`, `onChange(v: MoodValue | undefined): void`. Selected mood has filled background; click active mood again to deselect.

2. **`EntryForm.tsx`** — Add `mood` and `onMoodChange` props. Render `<MoodPicker>` below the text input. Pass mood through `onSubmit` callback (change signature to `(content: string, mood?: MoodValue, tags?: string[]) => Promise<void>`).

3. **`DayNode.tsx`** — Display `entry.mood` emoji inline at the start of each entry's text area (before content). No emoji shown if `mood` is absent.

4. **`DailyLog.tsx`** — Update `addEntry` call to pass mood from EntryForm.

5. **Tests** — `MoodPicker.test.tsx`, update `EntryForm.test.tsx` and `DayNode.test.tsx`.

---

### Phase C — Tags (P2, independently shippable)

**Dependencies**: Phase A complete. Phase B recommended (EntryForm signature already updated).

1. **`TagInput.tsx`** — Chip-style input: existing tags shown as pills with ✕ remove; input field appended; Enter or comma confirms a new tag. Props: `tags: string[]`, `onChange(tags: string[]): void`. Enforces ≤10 tags and ≤30 chars each; shows `dailyLog.tagLimitReached` message when at capacity.

2. **`EntryForm.tsx`** — Add `tags`/`onTagsChange` props; render `<TagInput>` below mood picker.

3. **`DayNode.tsx`** — Render tag chips below entry content. Each chip is a `<button type="button">` that calls a new `onTagFilter(tag: string)` prop.

4. **`DailyLog.tsx`** — Add `activeTag: string | null` state. Pass `onTagFilter` down to `TimelineView` → `DayNode`. Add active tag filter chip in the filter bar (with ✕ to clear). Apply tag filter in `filteredEntries` memo (AND with existing time filter + day filter).

5. **Tests** — `TagInput.test.tsx`, update `DayNode.test.tsx`, `DailyLog.test.tsx`.

---

### Phase D — Search (P3, independently shippable)

**Dependencies**: Phase A complete.

1. **`SearchBar.tsx`** — Controlled input (`value`, `onChange`). Shows a clear ✕ button when non-empty. ARIA: `role="search"`, `aria-label={t('dailyLog.searchPlaceholder')}`.

2. **`HighlightedText.tsx`** — Props: `text: string`, `query: string`. Splits text on query match (case-insensitive) and wraps matches in `<mark className="bg-yellow-100 dark:bg-yellow-800/40 rounded">`.

3. **`DailyLog.tsx`** — Add `searchQuery: string` state. Render `<SearchBar>` above the filter chips. Extend `filteredEntries` memo: when query non-empty, filter entries where `content.toLowerCase().includes(q)` OR `tags?.some(tag => tag.includes(q))`. Pass `searchQuery` down to `TimelineView` → `DayNode` for highlight rendering.

4. **`DayNode.tsx`** — Accept optional `searchQuery?: string` prop; pass to `<HighlightedText>` in place of plain `<p>` for entry content.

5. **Tests** — `SearchBar.test.tsx`, `HighlightedText.test.tsx`, update `DailyLog.test.tsx`.

---

### Phase E — Stats View (P4, independently shippable after Phase A)

**Dependencies**: Phase A complete. Richer with B (mood) and C (tags) but functions without them.

1. **`packages/daily-log/src/utils/streak.ts`** — Export `computeStreak(entries: WorkEntry[]): number`. Pure function, no side effects, no imports beyond `localDate.ts`.

2. **`packages/daily-log/src/utils/stats.ts`** — Export:
   - `computeMoodDistribution(entries): { mood: MoodValue; count: number; percentage: number }[]`
   - `computeTopTags(entries, limit = 5): { tag: string; count: number }[]`
   - `compute30DayChart(entries): { date: string; count: number }[]`

3. **`StatsView.tsx`** — Four sections:
   - **Streak card**: 🔥 `{streak} days` or "Start your streak today"
   - **30-day chart**: simple bar chart using CSS height (`h-[calc(...)]` relative to max), no charting library
   - **Mood distribution**: horizontal percentage bars, one per mood that has data; hidden if no mood data
   - **Top tags**: ranked list with count badges; hidden if no tag data

4. **`DailyLog.tsx`** — Add `activeView: 'timeline' | 'stats'` state. Render two tabs ("Timeline" / "Stats") in the header area. Show `<StatsView entries={entries} />` or `<TimelineView .../>` based on active tab.

5. **Tests** — `streak.test.ts`, `stats.test.ts`, `StatsView.test.tsx`, update `DailyLog.test.tsx`.

---

### Phase F — Integration & QA

1. Run `pnpm build:shared` after i18n changes.
2. Run `pnpm lint && pnpm test:run && pnpm typecheck` — all must pass.
3. Verify backward compat: existing entries without mood/tags render correctly.
4. Verify dark mode on all new components.
5. Verify touch targets ≥ 44px on mood buttons and tag chips.
6. Run `validate_all` MCP tool.

---

## Test Strategy

| Scope | What to test | Where |
|-------|-------------|-------|
| Unit: `streak.ts` | Edge cases: no entries, single day, gap in middle, entry moved | `utils/streak.test.ts` |
| Unit: `stats.ts` | Empty arrays, all-same mood, tag deduplication, 30-day boundary | `utils/stats.test.ts` |
| Unit: `MoodPicker` | Select, deselect, disabled state | `MoodPicker.test.tsx` |
| Unit: `TagInput` | Add, remove, max-10 enforcement, 30-char limit | `TagInput.test.tsx` |
| Unit: `SearchBar` | Input, clear, aria attributes | `SearchBar.test.tsx` |
| Unit: `HighlightedText` | Match, no match, case insensitive, empty query | `HighlightedText.test.tsx` |
| Integration: `DailyLog` | Tag filter + time filter AND logic; search + tag filter AND logic; tab switching | `DailyLog.test.tsx` |
| Integration: `useDailyLogEntries` | `addEntry` with mood/tags calls bridge correctly | `useDailyLogEntries.test.ts` |

All tests mock `window.__workTracker` — never hit real Firestore.
Use `userEvent.setup({ delay: null })` for all interaction tests.
No per-test timeout overrides > 5000ms.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Existing tests break when `EntryForm` signature changes | Medium | Update mocks in `EntryForm.test.tsx` and `DailyLog.test.tsx` to pass the new optional props |
| 30-day bar chart looks broken on narrow mobile | Low | Cap bar width, test at 320px viewport; use `overflow-x-auto` wrapper |
| `es.ts` Unicode escapes — copy error corrupts a key | Medium | Read the exact surrounding lines before editing; verify with `pnpm lint` |
| Firestore write of `tags: []` doesn't clear field | Low | Use Firestore `deleteField()` in shell when `tags` is empty array |
