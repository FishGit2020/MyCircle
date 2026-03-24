# Implementation Plan: AI Benchmark Enhancements

**Branch**: `013-ai-benchmark` | **Date**: 2026-03-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/013-ai-benchmark/spec.md`

## Summary

Enhance the existing `model-benchmark` MFE with three new capabilities:
1. **Multi-prompt batch benchmarking** — select multiple (or all) prompts, run in one click, view results grouped by prompt category
2. **Visual comparison bar charts** — Table/Chart toggle in Results tab with grouped bars for tok/s and quality score
3. **Historical trend view** — line chart in History tab filtered by endpoint+model, showing performance over time

All changes are **pure frontend** additions to `packages/model-benchmark`. No new backend endpoints, no schema changes, no new npm packages, no new MFE shell integration points.

## Technical Context

**Language/Version**: TypeScript 5.3.3, React 18
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, PageContent), Tailwind CSS — no new packages
**Storage**: localStorage (prompt selection persistence), Firestore via existing GraphQL queries (unchanged)
**Testing**: Vitest + React Testing Library, jsdom, 15s global timeout
**Target Platform**: Web (desktop + mobile), Module Federation MFE at port 3004
**Project Type**: Micro-frontend (enhancement to existing `packages/model-benchmark` MFE)
**Performance Goals**: Chart renders within one frame of results load; batch of 5 prompts × 3 endpoints completes in under 5 minutes on typical hardware
**Constraints**: No new npm dependencies; all chart rendering via CSS/SVG; `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` must pass
**Scale/Scope**: Single package, ~8 files modified, 4 new files, ~15 new i18n keys

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post-design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | All imports from `@mycircle/shared`, never direct `@apollo/client` |
| II. Complete Integration | ✅ PASS | This is an **enhancement** to an existing MFE — no new shell integration points required |
| III. GraphQL-First | ✅ PASS | No new REST endpoints; uses existing `GET_BENCHMARK_HISTORY`, `RUN_BENCHMARK`, `SAVE_BENCHMARK_RUN` |
| IV. Inclusive by Default | ✅ PASS | 15 new i18n keys added to all 3 locales; all new buttons have `type="button"` and aria labels; chart tooltips accessible on hover/tap |
| V. Fast Tests, Safe Code | ✅ PASS | All tests mock network calls; chart components receive data as props (no async in render) |
| VI. Simplicity | ✅ PASS | No new library; CSS bars follow existing `MonitorCharts.tsx` pattern; SVG polyline for trend |

**No violations. No Complexity Tracking table required.**

## Project Structure

### Documentation (this feature)

```text
specs/013-ai-benchmark/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code Changes

```text
packages/model-benchmark/src/
├── components/
│   ├── BenchmarkChart.tsx          # NEW — grouped bar chart for Results tab
│   ├── BenchmarkChart.test.tsx     # NEW — unit tests
│   ├── TrendChart.tsx              # NEW — SVG polyline trend chart for History tab
│   ├── TrendChart.test.tsx         # NEW — unit tests
│   ├── BenchmarkRunner.tsx         # MODIFIED — multi-prompt selection UI
│   ├── BenchmarkRunner.test.tsx    # MODIFIED — batch selection tests
│   ├── ResultsDashboard.tsx        # MODIFIED — Table/Chart toggle + batch grouping
│   ├── BenchmarkHistory.tsx        # MODIFIED — trend filter + TrendChart
│   ├── BenchmarkHistory.test.tsx   # MODIFIED — trend filter tests
│   └── ModelBenchmark.tsx          # MODIFIED — pass new hook state to Runner
└── hooks/
    ├── useBenchmark.ts             # MODIFIED — batch loop, new state fields
    └── useBenchmark.test.ts        # MODIFIED — batch run tests

packages/shared/src/
├── i18n/locales/
│   ├── en.ts                       # MODIFIED — 15 new benchmark.* keys
│   ├── es.ts                       # MODIFIED — 15 new keys (Spanish)
│   └── zh.ts                       # MODIFIED — 15 new keys (Chinese)
└── utils/storageKeys.ts            # MODIFIED — add BENCHMARK_SELECTED_PROMPTS
```

**Structure Decision**: Single-package frontend enhancement. No new packages, no backend changes.

---

## Phase 0: Research

*Complete. See [research.md](./research.md) for all decisions and rationale.*

Key resolved decisions:
- **Batch data grouping**: Client-side by `result.prompt` text matching `BENCHMARK_PROMPTS` constant — no schema change
- **Charts**: CSS flex bars (existing pattern from `MonitorCharts.tsx`) for comparison; SVG `<polyline>` for trend lines
- **Hook signature**: `runBenchmark(endpointModels, prompts: string[])` — array replaces single string
- **Trend aggregation**: Client-side from existing `GET_BENCHMARK_HISTORY` data — no new query
- **No blockers**: No new packages, no backend changes, no new shell integration points

---

## Phase 1: Design & Contracts

### Data Model

*Complete. See [data-model.md](./data-model.md).*

Key structures:
- `PromptGroup` — client-side grouping of results by prompt text, used for batch display and chart grouping
- `ChartBar` — flat display record for one bar in the comparison chart
- `TrendPoint` / `TrendSeries` — data structures for trend line chart
- Extended `useBenchmark` return: `currentPromptIndex: number | null`, `totalPrompts: number`
- New `runBenchmark` signature: `(endpointModels, prompts: string[])`
- New `StorageKeys.BENCHMARK_SELECTED_PROMPTS`

### Contracts

No external contracts. The `model-benchmark` MFE is a self-contained UI with no public API surface. Its integration with the shell (route, widget, nav) is unchanged.

The only shared interface change is:
- `useBenchmark` return type (internal to the package — not exported from `@mycircle/shared`)
- `StorageKeys.BENCHMARK_SELECTED_PROMPTS` (added to shared constants — non-breaking addition)

---

## Implementation Phases

### Phase A: Hook Extension (`useBenchmark.ts`)

Extend `runBenchmark` to accept `prompts: string[]`. Add outer prompt loop; expose `currentPromptIndex` / `totalPrompts` state. Update `useBenchmark.test.ts`.

**Key change**:
```typescript
// Before
runBenchmark(endpointModels: Array<...>, prompt: string)

// After
runBenchmark(endpointModels: Array<...>, prompts: string[])
// Internal: outer for loop over prompts; inner for loop over endpointModels (unchanged)
```

All localStorage cache updates and `WindowEvents.BENCHMARK_CHANGED` dispatch continue after the full batch completes (not per-prompt).

---

### Phase B: Prompt Selection UI (`BenchmarkRunner.tsx`)

Replace the single-select prompt pill buttons with multi-select checkboxes:

1. State: `selectedPromptIds: string[]` — initialized from `localStorage[BENCHMARK_SELECTED_PROMPTS]`, defaults to `['simple']`
2. "All Prompts" shortcut button at the top: selects all 5 preset IDs
3. Individual checkboxes per preset prompt (existing BENCHMARK_PROMPTS array)
4. "Custom" checkbox — if checked, show textarea (same as before)
5. Progress indicator: `{running && totalPrompts > 1 && <span>{t('benchmark.runner.batchProgress', {endpoint: currentEndpointLabel, current: currentPromptIndex + 1, total: totalPrompts})}</span>}`
6. Call site: `handleRun` maps `selectedPromptIds` to prompt strings and calls `runBenchmark(endpointModels, prompts)`

---

### Phase C: Results Table + Chart Toggle (`ResultsDashboard.tsx`)

1. Add `viewMode: 'table' | 'chart'` state (local, no persistence)
2. In header: add two toggle buttons ("Table" / "Chart") — only shown when `results.length > 0`
3. When `viewMode === 'chart'`: render `<BenchmarkChart results={results} />`
4. When batch results (multiple distinct prompts detected): add `groupBy: 'endpoint' | 'prompt'` state; pass to `BenchmarkChart`
5. Existing table and token counts remain unchanged in `'table'` mode

**`BenchmarkChart.tsx`** (new):
- Props: `{ results: BenchmarkRunResult[], groupBy?: 'endpoint' | 'prompt' }`
- Renders two side-by-side sections: "Tokens / sec" and "Quality score"
- Each bar: `flex items-end` container height `h-40`; bar width `flex-1`; height = `(value / max) * 100%`
- Error bars: height `4px` solid red outline, no fill
- Fastest bar: green-500 fill; others blue-400
- Tooltip on hover: `title` attribute (accessible, zero extra code)
- "By Prompt" groupBy: render one group per prompt, with endpoints as bars within each group

---

### Phase D: History Trend View (`BenchmarkHistory.tsx` + `TrendChart.tsx`)

**`BenchmarkHistory.tsx`** changes:
1. Derive unique endpoint+model combinations from `runs` data
2. Add `trendFilter: string` state — `''` means "All"
3. Render a `<select>` with "All endpoints" + one option per unique combination
4. Below the run list, render `<TrendChart runs={runs} filter={trendFilter} />`
5. Show trend chart only when `runs.length >= 2`

**`TrendChart.tsx`** (new):
- Props: `{ runs: BenchmarkRun[], filter: string }`
- Derive `TrendSeries[]` as described in data-model.md
- Render `<svg viewBox="0 0 200 60" className="w-full h-32">` per metric (TPS + quality)
- One `<polyline>` per series; gap points (null values) rendered as `<circle>` with dashed border
- X-axis labels: run index numbers below the SVG
- Y-axis max label and "0" label at left (static text elements)
- Two-tab toggle between "Tokens / sec" and "Quality" views (local state)

---

## i18n Keys

All 15 new keys must be added to `en.ts`, `es.ts`, and `zh.ts` before building shared:

| Key | English |
|-----|---------|
| `benchmark.runner.selectPrompts` | "Select Prompts" |
| `benchmark.runner.allPrompts` | "All Prompts" |
| `benchmark.runner.batchProgress` | "Endpoint {{endpoint}} · Prompt {{current}}/{{total}}" |
| `benchmark.results.chartView` | "Chart" |
| `benchmark.results.tableView` | "Table" |
| `benchmark.results.groupByEndpoint` | "By Endpoint" |
| `benchmark.results.groupByPrompt` | "By Prompt" |
| `benchmark.results.noResults` | "No results yet. Run a benchmark to see results." |
| `benchmark.history.trendTitle` | "Performance Trend" |
| `benchmark.history.filterEndpoint` | "Filter by endpoint / model" |
| `benchmark.history.filterAll` | "All endpoints" |
| `benchmark.history.trendTps` | "Tokens / sec" |
| `benchmark.history.trendQuality` | "Quality score" |
| `benchmark.history.noTrendData` | "Not enough data for a trend. Run more benchmarks." |
| `benchmark.history.trendRun` | "Run {{n}}" |

> Note: Verify `benchmark.results.noResults` — it appears to already be used in `ResultsDashboard.tsx` line 33. If it exists, skip adding it.

---

## Testing Strategy

### Unit Tests

| File | Key Scenarios |
|------|--------------|
| `useBenchmark.test.ts` | Batch loop runs each prompt × each endpoint; `currentPromptIndex` increments correctly; single-prompt backward compat |
| `BenchmarkRunner.test.tsx` | "All Prompts" selects all IDs; custom prompt enables textarea; disabled when no endpoint/prompt selected |
| `BenchmarkChart.test.tsx` | Renders bars for each result; error result shows error bar; tooltip title present; "By Prompt" grouping renders prompt labels |
| `TrendChart.test.tsx` | Renders polyline for each series; gap points for null values; filter prop limits to one series |
| `BenchmarkHistory.test.tsx` | Filter dropdown shows unique endpoint+model options; trend chart hidden when < 2 runs |

### Manual Verification

See [quickstart.md](./quickstart.md) for step-by-step local verification flow.

---

## Rollout Checklist

- [ ] `pnpm build:shared` passes after i18n and StorageKeys changes
- [ ] `pnpm --filter @mycircle/model-benchmark test:run` passes
- [ ] `pnpm lint && pnpm typecheck` passes
- [ ] Manual: batch run with 2 endpoints × 3 prompts = 6 results in Results tab
- [ ] Manual: Chart view renders bars with tooltips
- [ ] Manual: History tab trend chart appears after 2+ runs
- [ ] `validate_all` MCP tool passes (no new MFE = no shell integration gaps)
