# Research: AI Benchmark Enhancements (013-ai-benchmark)

## Summary

All three new features (batch multi-prompt runs, visual comparison charts, historical trend view) are achievable as **pure frontend additions** with no backend schema changes. Research resolved the key unknowns around data grouping strategy, chart rendering approach, and history aggregation pattern.

---

## Decision 1: Multi-Prompt Batch — Data Representation

**Decision**: Group batch results client-side by matching `result.prompt` text against the `BENCHMARK_PROMPTS` constant array. No new `promptId` field in the GraphQL schema.

**Rationale**: `BenchmarkRunResult.prompt` already stores the full prompt string. `BENCHMARK_PROMPTS` is a static array with `{ id, prompt }`. Matching `result.prompt === bp.prompt` maps each result back to its category label. This avoids a backend schema change and codegen cycle, satisfying the spec assumption that no new mutations/queries are needed.

**Alternatives considered**:
- Adding `promptId: String` to the `BenchmarkRunResult` GraphQL type → rejected: requires schema change, codegen, and functions deployment just to store a client-derivable label.
- Adding `promptId` as a separate localStorage metadata map → rejected: fragile across sessions and devices.

---

## Decision 2: Chart Rendering — No New Library

**Decision**: Use the same CSS flex + percentage-height bar pattern from `MonitorCharts.tsx` for the comparison bar chart. Use a polyline-based SVG for the trend line chart.

**Rationale**: `MonitorCharts.tsx` (in `packages/ai-assistant`) already implements a working bar chart with dark mode, Tailwind, and tooltips using only CSS — no external library. The constitution (Principle VI: Simplicity) forbids adding dependencies beyond what is needed. The existing pattern is sufficient for grouped bars.

For trend lines, a `<polyline>` SVG element (no library) drawn inside a `position: relative` container scales naturally with the data array. This is the minimal viable approach.

**Alternatives considered**:
- Recharts / Chart.js → rejected: new npm dependency, Module Federation singleton risk, 40–200 kB bundle increase.
- D3.js → rejected: massive API surface, significant learning overhead, violates simplicity principle.

---

## Decision 3: Batch Loop — Where It Lives

**Decision**: Extend `useBenchmark.runBenchmark()` to accept `prompts: string[]` instead of `prompt: string`. The inner loop stays as-is (sequential per endpoint); wrap it with an outer loop over prompts. The function signature becomes backward-compatible by making `prompts` an array while keeping the call site able to pass `[singlePrompt]`.

**Rationale**: The existing loop in `useBenchmark.ts` already iterates `endpointModels` sequentially. Adding an outer `for (const prompt of prompts)` loop reuses all the error handling, result accumulation, localStorage cache update, and `WindowEvents.BENCHMARK_CHANGED` dispatch logic with minimal change.

**Alternatives considered**:
- Keeping `runBenchmark` as-is and calling it N times from `BenchmarkRunner` → rejected: calling `setRunning(true/false)` N times causes N re-render cycles and breaks the progress indicator.
- Running prompts in parallel → rejected: Ollama endpoints are typically single-threaded; parallel requests contend on the GPU, distorting timing measurements.

---

## Decision 4: Progress Indicator — Minimal State Addition

**Decision**: Add `currentPromptIndex: number | null` and `totalPrompts: number` to `useBenchmark`'s returned state (alongside the existing `currentEndpoint`). `BenchmarkRunner` reads these to render "Endpoint N/M · Prompt P/Q".

**Rationale**: Follows the existing pattern of `currentEndpoint` state already exposed from the hook. No new component or context needed.

**Alternatives considered**:
- A separate `useProgress` hook → rejected: unnecessary abstraction for two integers.

---

## Decision 5: History Trend Aggregation — Client-Side Only

**Decision**: Aggregate trend data entirely in `BenchmarkHistory` from the existing `GET_BENCHMARK_HISTORY` query result (already fetched). Group runs by `(endpointName, model)` key, then sort by `run.createdAt`. Plot one data point per run using `run.results[]` filtered to the matching endpoint+model.

**Rationale**: `GET_BENCHMARK_HISTORY` returns `results[]` for each run. This is already loaded. No new query is needed. The trend chart is purely a view transformation of existing data.

**Alternatives considered**:
- A new `GET_BENCHMARK_TREND` GraphQL query returning pre-aggregated data → rejected: adds backend complexity for a read-only aggregation that the frontend can do trivially.

---

## Decision 6: Trend Chart Rendering — SVG Polyline

**Decision**: Render the trend line chart as a native `<svg>` with `<polyline>` elements. X-axis = run index (evenly spaced), Y-axis = tok/s (or quality score). Points are computed as percentage positions within the SVG `viewBox`.

**Rationale**: SVG polyline is the simplest cross-browser line chart primitive. No layout tricks required (unlike the CSS margin-bottom dot approach in `MonitorCharts.tsx`, which works for scatter but is awkward for connected lines). A fixed `viewBox="0 0 100 50"` with percentage-mapped coordinates is easy to maintain and test.

**Alternatives considered**:
- Extending the CSS dot-per-day pattern from `MonitorCharts.tsx` → rejected: dots without connecting lines are harder to read as trend data.

---

## Decision 7: Chart Toggle — State in ResultsDashboard

**Decision**: Add a `viewMode: 'table' | 'chart'` state local to `ResultsDashboard`. The toggle is two buttons ("Table" / "Chart") rendered in the header row, conditionally rendering `BenchmarkChart` vs. the existing table. For batch results, add a second toggle `groupBy: 'endpoint' | 'prompt'` in chart mode only.

**Rationale**: State is UI-only (no persistence needed) and scoped to a single component. Follows the existing `expandedIdx` pattern in the same file.

**Alternatives considered**:
- URL search param for chart vs. table → rejected: overkill for a purely visual preference that resets on navigation.

---

## Decision 8: New i18n Keys Required

New keys (to be added to all 3 locales):

| Key | en value |
|-----|----------|
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

Note: `benchmark.results.noResults` already appears to be used in `ResultsDashboard.tsx` (line 33 as `t('benchmark.results.noResults')`), so it may already exist in the locale files — verify and only add if missing.

---

## No Blockers

- No new npm packages needed.
- No GraphQL schema changes needed.
- No backend function changes needed.
- No new Firestore collections or indexes needed.
- No new shell integration points (this is an enhancement to an existing MFE, not a new MFE).
