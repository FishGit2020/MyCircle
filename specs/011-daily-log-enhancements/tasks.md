# Tasks: Daily Log Journal Enhancements

**Input**: Design documents from `specs/011-daily-log-enhancements/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/window-api.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1=Mood, US2=Tags, US3=Search, US4=Stats)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify branch and development environment are ready before any changes.

- [x] T001 Confirm active branch is `011-daily-log-enhancements` (`git branch --show-current`)
- [x] T002 Run `pnpm build:shared` to confirm baseline shared package builds cleanly before any edits

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend the data layer so mood and tags can flow through the full stack. ALL user stories depend on this phase. No US work can begin until T010 is complete.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T003 Add `MoodValue` type and extend `WorkEntry` with optional `mood?` and `tags?` in `packages/daily-log/src/types.ts`
- [x] T004 Extend `__workTracker` type declaration — update `add` and `update` signatures to accept `mood?: string` and `tags?: string[]` in `packages/shared/src/types/window.d.ts` (lines 77–84; see `contracts/window-api.md`)
- [x] T005 Extend `addDailyLogEntry` function signature and Firestore write to pass through optional `mood` and `tags` in `packages/shell/src/lib/firebase.ts` (~line 1029)
- [x] T006 Extend `updateDailyLogEntry` function signature and Firestore write to pass through optional `mood` and `tags` in `packages/shell/src/lib/firebase.ts` (~line 1038)
- [x] T007 Update `addEntry(content, mood?, tags?)` and `updateEntry(id, content, mood?, tags?)` signatures in `packages/daily-log/src/hooks/useDailyLogEntries.ts` to accept and forward new fields
- [x] T008 [P] Add all 24 new `dailyLog.*` i18n keys to `packages/shared/src/i18n/locales/en.ts` (see `data-model.md` key list)
- [x] T009 [P] Add matching `dailyLog.*` i18n keys to `packages/shared/src/i18n/locales/es.ts` (read exact surrounding lines first — file uses Unicode escapes)
- [x] T010 [P] Add matching `dailyLog.*` i18n keys to `packages/shared/src/i18n/locales/zh.ts` (read exact surrounding lines first — file uses Unicode escapes)
- [x] T011 Run `pnpm build:shared` to confirm shared package compiles with all type and i18n changes

**Checkpoint**: Foundation ready — all four user story phases can now begin.

---

## Phase 3: User Story 1 — Mood Tracking (Priority: P1) 🎯 MVP

**Goal**: Users can select an optional mood emoji when creating or editing an entry. The mood persists to Firestore and displays inline in the timeline.

**Independent Test**: Create a new entry, select the 😊 mood, save, reload the page — the entry shows the mood emoji in the timeline. Edit the entry, change to 😤, save — the updated mood reflects immediately. Create an entry without selecting any mood — it saves and displays without a mood indicator.

- [x] T012 [US1] Create `packages/daily-log/src/components/MoodPicker.tsx` — row of 5 emoji buttons (happy/neutral/sad/frustrated/energized); props: `value?: MoodValue`, `onChange(v: MoodValue | undefined): void`; clicking the active mood deselects it; touch targets ≥ 44px; `dark:` variants on all colors; `aria-label` on each button
- [x] T013 [US1] Update `packages/daily-log/src/components/EntryForm.tsx` — add `mood?: MoodValue` and `tags?: string[]` props; render `<MoodPicker>` below the text input; update `onSubmit` callback signature to `(content: string, mood?: MoodValue, tags?: string[]) => Promise<void>`
- [x] T014 [US1] Update `packages/daily-log/src/components/DayNode.tsx` — render `entry.mood` emoji inline at the start of each entry's content area; no emoji shown when `mood` is absent; add `dark:` and accessible `aria-label` wrapping the emoji span
- [x] T015 [US1] Update `packages/daily-log/src/components/DailyLog.tsx` — update the `addEntry` call site to pass mood from `EntryForm`'s updated `onSubmit` callback
- [x] T016 [US1] Run `pnpm lint && pnpm typecheck` and fix any errors introduced by EntryForm callback signature change

**Checkpoint**: Mood tracking fully functional and independently testable. Existing entries without mood display correctly.

---

## Phase 4: User Story 2 — Tags / Labels (Priority: P2)

**Goal**: Users can attach 1–10 free-form tags per entry. Tags display as tappable chips in the timeline. Tapping a chip filters the view to entries with that tag (AND-composed with existing time filters).

**Independent Test**: Create an entry with tags `#work` and `#health`, save. Timeline shows both chips on the entry. Tap `#work` chip — only entries tagged `#work` appear. Clear the filter — all entries return. Attempt to add an 11th tag — input is blocked with a limit message.

- [x] T017 [US2] Create `packages/daily-log/src/components/TagInput.tsx` — chip-style tag entry; renders existing tags as pills with ✕ remove buttons; appended input field; Enter or comma confirms a new tag; enforces ≤ 10 tags and ≤ 30 chars each (trim + lowercase); shows `t('dailyLog.tagLimitReached')` when at capacity; props: `tags: string[]`, `onChange(tags: string[]): void`; `type="button"` on all non-submit buttons; touch targets ≥ 44px
- [x] T018 [US2] Update `packages/daily-log/src/components/EntryForm.tsx` — add `<TagInput>` below `MoodPicker`; wire `tags` state through updated `onSubmit` callback (already accepts `tags` from T013)
- [x] T019 [US2] Update `packages/daily-log/src/components/DayNode.tsx` — render entry tags as chip buttons below entry content; add `onTagFilter(tag: string)` prop; each chip calls `onTagFilter` on click; `type="button"` on chips; `dark:` variants on chip colors
- [x] T020 [US2] Update `packages/daily-log/src/components/TimelineView.tsx` — accept and thread `onTagFilter?: (tag: string) => void` prop down to each `<DayNode>`
- [x] T021 [US2] Update `packages/daily-log/src/components/DailyLog.tsx` — add `activeTag: string | null` state; pass `onTagFilter` to `TimelineView`; add active tag filter chip in the filter bar (with ✕ to clear); extend `filteredEntries` memo to filter by `activeTag` (AND with existing time + day-type filters)

**Checkpoint**: Tags fully functional. Tag filter composes correctly with all existing filters. US1 (mood) still works.

---

## Phase 5: User Story 3 — Full-Text Search (Priority: P3)

**Goal**: Users can type in a search box to filter entries by content or tag name in real time. Matching text is highlighted. Search composes with all other active filters.

**Independent Test**: With several entries loaded, type "dentist" in the search box — only matching entries appear with "dentist" highlighted. Clear the search — full list restores. Type a tag name that exists only as a tag (not in content) — the entry appears. Type something with no match — empty state message shown.

- [x] T022 [US3] Create `packages/daily-log/src/components/HighlightedText.tsx` — props: `text: string`, `query: string`; splits text on case-insensitive match; wraps matches in `<mark className="bg-yellow-100 dark:bg-yellow-800/40 rounded px-0.5">`; renders plain `<span>` when query is empty or has no match
- [x] T023 [US3] Create `packages/daily-log/src/components/SearchBar.tsx` — controlled input; props: `value: string`, `onChange(v: string): void`; shows ✕ clear button when non-empty (`type="button"` on clear); `role="search"` wrapper; `aria-label={t('dailyLog.searchPlaceholder')}`; `dark:` variants on all classes
- [x] T024 [US3] Update `packages/daily-log/src/components/DayNode.tsx` — accept optional `searchQuery?: string` prop; replace plain `<p>` for entry content with `<HighlightedText text={entry.content} query={searchQuery ?? ''} />`
- [x] T025 [US3] Update `packages/daily-log/src/components/TimelineView.tsx` — accept and thread `searchQuery?: string` prop down to each `<DayNode>`
- [x] T026 [US3] Update `packages/daily-log/src/components/DailyLog.tsx` — add `searchQuery: string` state (default `''`); render `<SearchBar>` above the filter chips; extend `filteredEntries` memo to filter by `searchQuery` against `entry.content` and `entry.tags` (case-insensitive, AND with all other active filters); pass `searchQuery` to `TimelineView`; show `t('dailyLog.searchNoResults')` empty state when query is non-empty and results are empty

**Checkpoint**: Search fully functional. Composes correctly with tag filter, time filter, and day-type toggle. US1 and US2 still work.

---

## Phase 6: User Story 4 — Stats & Insights (Priority: P4)

**Goal**: A Stats tab shows current writing streak, 30-day entry chart, mood distribution (when mood data exists), and top 5 tags (when tag data exists). All computed client-side from the already-loaded entries — no loading spinner.

**Independent Test**: With entries across multiple days, open the Stats tab — streak shows the correct consecutive-day count. With a one-day gap, streak resets to 1. Mood distribution section appears only when at least one entry has a mood. Top tags section appears only when at least one entry has tags.

- [x] T027 [P] [US4] Create `packages/daily-log/src/utils/streak.ts` — export `computeStreak(entries: WorkEntry[]): number`; pure function; extracts unique dates into `Set<string>`; walks backwards from today using `getLocalDateString()` from `../utils/localDate`; increments while date is in set; stops at first gap; returns 0 for empty entries
- [x] T028 [P] [US4] Create `packages/daily-log/src/utils/stats.ts` — export three pure functions:
  - `computeMoodDistribution(entries: WorkEntry[]): { mood: MoodValue; count: number; percentage: number }[]` — counts entries per mood, computes percentage; excludes entries with no mood; returns empty array if no mood data
  - `computeTopTags(entries: WorkEntry[], limit = 5): { tag: string; count: number }[]` — flattens all entry tags arrays, counts frequency, returns top N sorted by count; returns empty array if no tag data
  - `compute30DayChart(entries: WorkEntry[]): { date: string; count: number }[]` — returns exactly 30 items (today − 29 days through today); missing days have count 0
- [x] T029 [US4] Create `packages/daily-log/src/components/StatsView.tsx` — accepts `entries: WorkEntry[]` prop; computes all stats via `useMemo`; four sections: (1) Streak card with 🔥 emoji and `t('dailyLog.streakDays').replace('{count}', ...)` or `t('dailyLog.streakNone')`; (2) 30-day bar chart using CSS relative heights (no charting library); (3) Mood distribution with horizontal percentage bars — hidden when `computeMoodDistribution` returns empty; (4) Top 5 tags ranked list with count badges — hidden when `computeTopTags` returns empty; all colors have `dark:` variants; section headings use i18n keys
- [x] T030 [US4] Update `packages/daily-log/src/components/DailyLog.tsx` — add `activeView: 'timeline' | 'stats'` state (default `'timeline'`); render two tab buttons ("Timeline" / "Stats") in the header area with `type="button"`, active tab styling, and `dark:` variants; conditionally render `<StatsView entries={entries} />` or `<TimelineView .../>` based on active tab; hide search/filter bar when stats tab is active

**Checkpoint**: Stats fully functional. All 4 user stories complete and independently testable.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final integration verification, accessibility audit, and QA gate.

- [x] T031 [P] Verify dark mode on all new components — open each in a dark-mode browser and confirm no unstyled elements (`MoodPicker`, `TagInput`, `SearchBar`, `HighlightedText`, `StatsView`)
- [x] T032 [P] Verify touch targets — confirm all mood emoji buttons, tag chips, and search clear button are ≥ 44px tap target (inspect in browser DevTools or test on mobile)
- [x] T033 [P] Verify backward compatibility — confirm existing entries without `mood` or `tags` fields render correctly in timeline (no errors, no missing UI)
- [x] T034 Run `pnpm build:shared` to confirm shared package still builds
- [x] T035 Run `pnpm lint && pnpm test:run && pnpm typecheck` — all must pass; fix any failures before proceeding
- [x] T036 Run `validate_all` MCP tool to confirm no integration points are broken

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1 Mood)**: Depends on Phase 2 only — no dependency on US2/3/4
- **Phase 4 (US2 Tags)**: Depends on Phase 2 only; benefits from US1 EntryForm signature already updated (T013) but independently testable
- **Phase 5 (US3 Search)**: Depends on Phase 2 only — independently testable without mood or tags
- **Phase 6 (US4 Stats)**: Depends on Phase 2 only; streak and 30-day chart work without mood/tags; richer with them
- **Phase 7 (Polish)**: Depends on all desired user story phases being complete

### User Story Dependencies

- **US1 (Mood P1)**: No dependency on US2, US3, US4
- **US2 (Tags P2)**: No dependency on US1, US3, US4 — but T018 is easier after T013 updates EntryForm signature
- **US3 (Search P3)**: No dependency on US1 or US2 — works on plain text; matches tags if present
- **US4 (Stats P4)**: No dependency on US1, US2, or US3 — streak and chart work without mood/tags

### Within Each User Story

- Models/types before components
- New utility components (`MoodPicker`, `TagInput`, `SearchBar`, `HighlightedText`) before integrating into `EntryForm`/`DayNode`/`DailyLog`
- `DayNode` changes before `TimelineView` prop threading
- `TimelineView` prop threading before `DailyLog` orchestration

### Parallel Opportunities

- T008, T009, T010 (i18n locale files) — all parallel after T007 confirms key list
- T027, T028 (pure utility functions for stats) — parallel with each other
- T031, T032, T033 (polish verification tasks) — all parallel
- Once Phase 2 is complete, all four user story phases can be worked in parallel by different developers

---

## Parallel Execution Examples

### Phase 2 Foundational — parallel i18n

```
Parallel group (start together after T007):
  T008 — Add keys to en.ts
  T009 — Add keys to es.ts
  T010 — Add keys to zh.ts
```

### Phase 6 Stats — parallel utilities

```
Parallel group (start together):
  T027 — Create streak.ts
  T028 — Create stats.ts
Then sequentially:
  T029 — Create StatsView.tsx (depends on T027, T028)
  T030 — Update DailyLog.tsx (depends on T029)
```

### Post-Phase 2 — full parallel story execution (team scenario)

```
After T011 (Foundation checkpoint):
  Developer A → Phase 3 (US1 Mood):    T012 → T013 → T014 → T015 → T016
  Developer B → Phase 4 (US2 Tags):    T017 → T018 → T019 → T020 → T021
  Developer C → Phase 5 (US3 Search):  T022 → T023 → T024 → T025 → T026
  Developer D → Phase 6 (US4 Stats):   T027+T028 → T029 → T030
```

---

## Implementation Strategy

### MVP First (US1 — Mood Tracking Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T011) — **required blocker**
3. Complete Phase 3: User Story 1 — Mood (T012–T016)
4. **STOP and VALIDATE**: Mood picker works end-to-end; existing entries unaffected
5. Ship or demo before continuing to US2

### Incremental Delivery

1. Phase 1 + 2 → foundation ready
2. Phase 3 (Mood) → independently shippable ✅
3. Phase 4 (Tags) → independently shippable ✅
4. Phase 5 (Search) → independently shippable ✅
5. Phase 6 (Stats) → independently shippable ✅
6. Phase 7 (Polish) → QA gate before PR

### Total Task Count

| Phase | Tasks | Notes |
|-------|-------|-------|
| Phase 1 Setup | 2 | Sequential |
| Phase 2 Foundation | 9 | T008–T010 parallelizable |
| Phase 3 US1 Mood | 5 | Sequential within phase |
| Phase 4 US2 Tags | 5 | Sequential within phase |
| Phase 5 US3 Search | 5 | Sequential within phase |
| Phase 6 US4 Stats | 4 | T027+T028 parallelizable |
| Phase 7 Polish | 6 | T031–T033 parallelizable |
| **Total** | **36** | |

---

## Notes

- `[P]` tasks target different files with no dependencies on incomplete tasks
- Each user story is independently completable and testable — validate before moving on
- Commit after each task or logical group (e.g., after each Phase checkpoint)
- `es.ts` and `zh.ts` use Unicode escapes — always read the exact surrounding lines before editing
- Run `pnpm build:shared` after any change to `packages/shared/src/`
- The 30-day chart in `StatsView` uses CSS relative heights — no charting library import needed
