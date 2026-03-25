# Tasks: AI Benchmark Enhancements

**Input**: Design documents from `specs/013-ai-benchmark/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are relative to repo root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared changes that unblock all three user stories. Must complete before any story work begins.

- [x] T001 Add `BENCHMARK_SELECTED_PROMPTS: 'mycircle-benchmark-selected-prompts'` to `packages/shared/src/utils/storageKeys.ts`
- [x] T002 [P] Add 15 new `benchmark.*` i18n keys to `packages/shared/src/i18n/locales/en.ts` (see research.md Decision 8 for full key list)
- [x] T003 [P] Add same 15 keys (Spanish translations) to `packages/shared/src/i18n/locales/es.ts`
- [x] T004 [P] Add same 15 keys (Chinese translations) to `packages/shared/src/i18n/locales/zh.ts`
- [x] T005 Run `pnpm build:shared` to verify locale and StorageKeys changes compile without errors

**Checkpoint**: T001–T005 complete. Shared package builds cleanly. User story work can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Hook signature change that MUST complete before US1 (batch runner UI) and US2 (chart receives batch results). US3 does not depend on this phase.

**⚠️ CRITICAL**: T006–T010 must be complete before Phase 3 begins.

- [x] T006 In `packages/model-benchmark/src/hooks/useBenchmark.ts`: change `runBenchmark` signature from `(endpointModels, prompt: string)` to `(endpointModels, prompts: string[])` and add outer `for (const prompt of prompts)` loop wrapping the existing endpoint loop
- [x] T007 In `packages/model-benchmark/src/hooks/useBenchmark.ts`: add `currentPromptIndex: number | null` and `totalPrompts: number` state fields; set `currentPromptIndex` at the start of each prompt iteration and reset to `null` after the loop; set `totalPrompts` to `prompts.length` at run start and reset to `0` on completion
- [x] T008 In `packages/model-benchmark/src/hooks/useBenchmark.ts`: move the localStorage cache update and `WindowEvents.BENCHMARK_CHANGED` dispatch to fire once after the full batch loop completes (not per-prompt)
- [x] T009 In `packages/model-benchmark/src/hooks/useBenchmark.ts`: return `currentPromptIndex` and `totalPrompts` from the hook
- [x] T010 In `packages/model-benchmark/src/hooks/useBenchmark.test.ts`: update existing tests to pass `['prompt text']` (array) instead of `'prompt text'` (string); add test verifying `currentPromptIndex` increments across a two-prompt batch and resets to `null` on completion

**Checkpoint**: `useBenchmark` accepts prompt arrays; `currentPromptIndex`/`totalPrompts` are exposed. All existing tests pass.

---

## Phase 3: User Story 1 — Multi-Prompt Batch Benchmarking (Priority: P1) 🎯 MVP

**Goal**: Users can select multiple prompts (including "All Prompts"), run a single benchmark, and see results grouped by prompt category with a real-time progress indicator.

**Independent Test**: Select 2 endpoints + all 5 preset prompts → click Run → confirm 10 result rows appear in Results tab grouped by prompt label; verify progress indicator shows "Prompt X/5" during run.

### Implementation for User Story 1

- [x] T011 [US1] In `packages/model-benchmark/src/components/BenchmarkRunner.tsx`: replace the single-select prompt pill buttons with multi-select checkboxes (one per `BENCHMARK_PROMPTS` entry) plus an "All Prompts" shortcut button at the top; initialize state from `localStorage[StorageKeys.BENCHMARK_SELECTED_PROMPTS]` defaulting to `['simple']`
- [x] T012 [US1] In `packages/model-benchmark/src/components/BenchmarkRunner.tsx`: add "All Prompts" button that sets `selectedPromptIds` to all 5 preset IDs and saves to `localStorage[StorageKeys.BENCHMARK_SELECTED_PROMPTS]`
- [x] T013 [US1] In `packages/model-benchmark/src/components/BenchmarkRunner.tsx`: add batch progress indicator rendered below the endpoint list when `running && totalPrompts > 1` — display `t('benchmark.runner.batchProgress', { endpoint: currentEndpointLabel, current: (currentPromptIndex ?? 0) + 1, total: totalPrompts })`
- [x] T014 [US1] In `packages/model-benchmark/src/components/BenchmarkRunner.tsx`: update `handleRun` to map `selectedPromptIds` to an array of prompt strings and call `runBenchmark(endpointModels, prompts)` (array); disable Run button when no prompts are selected
- [x] T015 [US1] In `packages/model-benchmark/src/components/ModelBenchmark.tsx`: destructure `currentPromptIndex` and `totalPrompts` from `useBenchmark()` and pass them to `<BenchmarkRunner>` as props; update `BenchmarkRunner` Props interface accordingly
- [x] T016 [US1] In `packages/model-benchmark/src/components/BenchmarkRunner.test.tsx`: add tests verifying: (a) "All Prompts" button selects all 5 IDs, (b) Run button stays disabled when no prompt is selected, (c) progress indicator renders when `totalPrompts > 1` and `running` is true, (d) custom textarea appears only when 'custom' is in `selectedPromptIds`

**Checkpoint**: Multi-prompt batch runs end-to-end. Progress indicator visible. Results saved to history as one record. US1 acceptance scenarios pass.

---

## Phase 4: User Story 2 — Visual Side-by-Side Comparison Charts (Priority: P2)

**Goal**: After a benchmark run, users can switch to a Chart view showing grouped bars for tok/s and quality score per endpoint/model, with tooltips on hover.

**Independent Test**: After any benchmark run (single or batch), toggle to Chart view in Results tab and verify grouped bars appear for each result; hover a bar and confirm tooltip shows endpoint name, model, and tok/s value.

### Implementation for User Story 2

- [x] T017 [P] [US2] Create `packages/model-benchmark/src/components/BenchmarkChart.tsx`: accept props `{ results: BenchmarkRunResult[], groupBy?: 'endpoint' | 'prompt' }`; derive `ChartBar[]` as described in data-model.md; render two sections ("Tokens / sec" and "Quality score") each as a `flex items-end h-40` bar container following the `MonitorCharts.tsx` pattern; add `title` attribute to each bar for tooltip accessibility
- [x] T018 [US2] In `BenchmarkChart.tsx`: handle error bars (no timing) — render a 4px-height outline bar with red border and no fill so they are visible but distinct; use `isError` flag from `ChartBar`
- [x] T019 [US2] In `BenchmarkChart.tsx`: highlight the fastest bar in `text-green-600 dark:text-green-400 bg-green-400 dark:bg-green-500`; all others use `bg-blue-400 dark:bg-blue-500`; add quality score color coding matching existing `QualityBadge` thresholds (green ≥8, yellow ≥5, red <5)
- [x] T020 [US2] In `BenchmarkChart.tsx`: when `groupBy === 'prompt'` and results contain multiple distinct prompts, derive `PromptGroup[]` as described in data-model.md and render one labeled group per prompt with per-endpoint bars inside; render `groupBy` toggle buttons ("By Endpoint" / "By Prompt") above the chart only when multiple prompt groups exist
- [x] T021 [US2] In `packages/model-benchmark/src/components/ResultsDashboard.tsx`: add `viewMode: 'table' | 'chart'` local state (default `'table'`); add Table/Chart toggle buttons in the header row next to the existing Clear button (only shown when `results.length > 0`); conditionally render `<BenchmarkChart results={results} />` when `viewMode === 'chart'`, existing table and token counts when `'table'`
- [x] T022 [P] [US2] Create `packages/model-benchmark/src/components/BenchmarkChart.test.tsx`: test that (a) bars render for each result, (b) error results show error bar element with aria/title, (c) fastest bar has green class, (d) "By Prompt" groupBy shows prompt labels as group headers, (e) component renders without error when `results` is empty

**Checkpoint**: Chart view toggles in Results tab. Bars with tooltips visible. Error results shown distinctly. US2 acceptance scenarios pass.

---

## Phase 5: User Story 3 — Historical Performance Trend View (Priority: P3)

**Goal**: In the History tab, users can filter by endpoint+model and see a line chart plotting tok/s and quality score across saved runs over time.

**Independent Test**: With ≥2 saved runs for the same endpoint+model, select that combination from the History tab filter → confirm a line chart appears with one data point per run; verify a gap appears for any run where that endpoint errored.

### Implementation for User Story 3

- [x] T023 [P] [US3] Create `packages/model-benchmark/src/components/TrendChart.tsx`: accept props `{ runs: BenchmarkRun[], filter: string }`; derive `TrendSeries[]` as described in data-model.md (group by `endpointName::model` key, sorted by `createdAt` ascending); render a fixed `<svg viewBox="0 0 200 60" className="w-full h-32">` per metric using `<polyline points="x1,y1 x2,y2 ..." fill="none" strokeWidth="1.5">` where `x = (index / (count-1)) * 200` and `y = 60 - ((value / maxValue) * 55)`; cycle stroke colors from the palette in data-model.md
- [x] T024 [US3] In `TrendChart.tsx`: render null/gap data points as `<circle>` elements with a dashed `stroke-dasharray` ring and no fill rather than connecting through them with the polyline; split each series' polyline at gaps
- [x] T025 [US3] In `TrendChart.tsx`: add a two-button local toggle ("Tokens / sec" / "Quality") above the SVG to switch between the two metric views; add X-axis run index labels (`Run 1`, `Run 2`…) below the SVG as `<text>` elements; add Y-axis max value label at top-left
- [x] T026 [US3] In `TrendChart.tsx`: when `filter === ''` (All), render one `<polyline>` per unique series with its colour; when `filter !== ''`, render only the matching series; show `t('benchmark.history.noTrendData')` message when fewer than 2 data points exist after filtering
- [x] T027 [US3] In `packages/model-benchmark/src/components/BenchmarkHistory.tsx`: derive unique `endpointName::model` combinations from `runs` data; add `trendFilter: string` local state (default `''`); render a `<select>` with `t('benchmark.history.filterAll')` option plus one option per unique combination; render section heading `t('benchmark.history.trendTitle')` and `<TrendChart runs={runs} filter={trendFilter} />` below the run list, only when `runs.length >= 2`
- [x] T028 [P] [US3] Create `packages/model-benchmark/src/components/TrendChart.test.tsx`: test that (a) polyline renders with correct number of points for a filtered series, (b) no polyline rendered for series with <2 points, (c) gap circles appear for null data points, (d) "noTrendData" message shows when <2 total data points, (e) metric toggle switches between tps and quality views
- [x] T029 [US3] In `packages/model-benchmark/src/components/BenchmarkHistory.test.tsx`: add tests verifying (a) filter `<select>` shows "All" + one option per unique endpoint+model, (b) TrendChart is not rendered when `runs.length < 2`, (c) TrendChart renders when `runs.length >= 2`

**Checkpoint**: History tab shows trend line chart with filter. Gap points visible. Metric toggle works. US3 acceptance scenarios pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification, accessibility pass, and validation gate.

- [x] T030 [P] In all new components (`BenchmarkChart.tsx`, `TrendChart.tsx`): verify every `<button>` has `type="button"`; verify toggle buttons and filter selects have appropriate `aria-label` or associated `<label>`; verify touch targets ≥44px for mobile (use `min-h-[44px]` on buttons as needed)
- [x] T031 [P] In all new components: verify every Tailwind color class has a `dark:` variant; spot-check in browser with dark mode enabled
- [x] T032 Run `pnpm build:shared` to confirm the final i18n + StorageKeys build is clean
- [x] T033 Run `pnpm --filter @mycircle/model-benchmark test:run` and confirm all new and existing tests pass
- [x] T034 Run `pnpm lint && pnpm typecheck` from repo root and fix any issues
- [ ] T035 Follow quickstart.md manual verification steps: batch run with 2 endpoints × 3 prompts; Chart view; History trend

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1, T001–T005)**: No dependencies — start immediately; T002, T003, T004 are parallel
- **Foundational (Phase 2, T006–T010)**: Depends on T005 completing — BLOCKS US1 and US2 (but not US3)
- **US1 (Phase 3, T011–T016)**: Depends on Foundational (T006–T010)
- **US2 (Phase 4, T017–T022)**: Depends on Foundational (T006–T010); `BenchmarkChart.tsx` (T017) and `ResultsDashboard` changes (T021) can proceed in parallel once Foundational is done
- **US3 (Phase 5, T023–T029)**: Depends only on Setup (T001–T005) — `TrendChart.tsx` is independent of the hook changes; `BenchmarkHistory.tsx` changes (T027) depend on `TrendChart.tsx` (T023)
- **Polish (Phase 6, T030–T035)**: Depends on all story phases

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational hook change — cannot start until T006–T009 complete
- **US2 (P2)**: Depends on Foundational hook change — `BenchmarkChart.tsx` can be built independently; `ResultsDashboard.tsx` needs US2 chart component
- **US3 (P3)**: Independent of US1/US2 — `TrendChart.tsx` and `BenchmarkHistory.tsx` changes can start after Setup (Phase 1) without waiting for Foundational

### Within Each User Story

- Models/data structures defined first (T006–T009 for hook)
- New components (T017, T023) before their parent container integration (T021, T027)
- Tests alongside or after implementation (this project uses test-after, not TDD)

### Parallel Opportunities

- T002, T003, T004 (i18n locale files) — three different files, fully parallel
- T006–T009 (hook changes) must be sequential within themselves (all in same file)
- T017 (`BenchmarkChart.tsx`) and T023 (`TrendChart.tsx`) can be worked on in parallel (different files, no dependency)
- T022 (`BenchmarkChart.test.tsx`) and T028 (`TrendChart.test.tsx`) fully parallel

---

## Parallel Example: Setup Phase

```bash
# T002, T003, T004 can run concurrently (different files):
Task: "Add 15 new benchmark.* keys to en.ts"
Task: "Add 15 new benchmark.* keys to es.ts"
Task: "Add 15 new benchmark.* keys to zh.ts"
```

## Parallel Example: US2 + US3 (after Foundational)

```bash
# Once Foundational (T006–T010) is complete:
Task A: "Create BenchmarkChart.tsx (T017)" → then "ResultsDashboard toggle (T021)"
Task B: "Create TrendChart.tsx (T023)" → then "BenchmarkHistory filter (T027)"
# A and B can proceed fully in parallel (different files, different features)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T010)
3. Complete Phase 3: US1 (T011–T016)
4. **STOP and VALIDATE**: Run batch with all prompts; confirm grouped results; check progress indicator
5. Ship US1 — users can already batch-benchmark all 5 prompts in one click

### Incremental Delivery

1. Setup + Foundational → Shared infra ready
2. US1 → Batch benchmarking shipped (MVP)
3. US2 → Chart view added to existing results
4. US3 → Trend view added to history (independent, can ship anytime after Setup)

### Parallel Team Strategy

With two developers:
- **Dev A**: Phase 1 → Phase 2 (hook) → Phase 3 (US1 batch UI)
- **Dev B**: Phase 1 (i18n in parallel) → Phase 5 (US3 TrendChart, independent of hook changes) → Phase 4 (US2 BenchmarkChart)

---

## Notes

- `[P]` = different files, no dependency on concurrent tasks
- `[US1/US2/US3]` label maps each task to its user story for traceability
- US3 (`TrendChart`) is the most independent — can start immediately after Setup
- Verify `pnpm build:shared` after every shared package change before running MFE tests
- `benchmark.results.noResults` may already exist in locale files — check before adding to avoid TS duplicate key error
- After completing each phase, run `pnpm --filter @mycircle/model-benchmark test:run` to catch regressions early
