# Data Model: AI Benchmark Enhancements (013-ai-benchmark)

## Overview

No new Firestore collections, GraphQL types, or schema changes are introduced. All new data structures are **client-side only** — derived from existing query results or held in React component state.

---

## Existing Types (Unchanged)

### BenchmarkRunResult (GraphQL-generated, read-only reference)

```typescript
// packages/shared/src/apollo/generated.ts — DO NOT MODIFY
type BenchmarkRunResult = {
  endpointId: string;
  endpointName: string;
  model: string;
  prompt: string;           // Full prompt text — used to identify prompt category
  response: string;
  error?: string | null;
  qualityScore?: number | null;
  qualityFeedback?: string | null;
  qualityJudge?: string | null;
  timestamp: string;
  timing?: BenchmarkTimingResult | null;
}

type BenchmarkTimingResult = {
  evalCount: number;
  evalDuration: number;
  loadDuration: number;
  promptEvalCount: number;
  promptEvalDuration: number;
  promptTokensPerSecond: number;
  timeToFirstToken: number;
  tokensPerSecond: number;
  totalDuration: number;
}
```

### BenchmarkRun (GraphQL-generated, read-only reference)

```typescript
// packages/shared/src/apollo/generated.ts — DO NOT MODIFY
type BenchmarkRun = {
  id: string;
  createdAt: string;
  results: BenchmarkRunResult[];  // JSON field — can hold any additional client fields
}
```

---

## New Client-Side Data Structures

### PromptGroup (ResultsDashboard — chart/grouped view)

Derived by grouping `BenchmarkRunResult[]` by prompt text, then mapping to a display label via `BENCHMARK_PROMPTS`.

```typescript
interface PromptGroup {
  promptId: string;         // e.g. 'simple', 'reasoning', 'code', 'custom'
  promptLabel: string;      // Display label (i18n key resolved), e.g. 'Simple'
  promptText: string;       // Full prompt string
  results: BenchmarkRunResult[];  // All endpoint results for this prompt
}
```

**Derivation**:
```
Given results: BenchmarkRunResult[]
Group by result.prompt → Map<promptText, BenchmarkRunResult[]>
For each group: find matching BENCHMARK_PROMPTS entry by prompt text
  → promptId = match?.id ?? 'custom'
  → promptLabel = t(match?.labelKey) ?? 'Custom'
```

**Validation rules**:
- Results with the same `prompt` text are grouped together regardless of endpoint.
- Custom prompts (not in `BENCHMARK_PROMPTS`) are grouped under `promptId: 'custom'`.
- Single-prompt runs produce exactly one `PromptGroup`.

---

### ChartBar (BenchmarkChart component — internal)

Flat data structure for rendering one bar in the comparison chart.

```typescript
interface ChartBar {
  label: string;          // Endpoint name + model (e.g. "Home Server / gemma2:2b")
  tps: number | null;     // Tokens per second (null = error)
  quality: number | null; // Quality score 0–10 (null = not scored)
  isError: boolean;
  isFastest: boolean;
}
```

**Derivation** (when `groupBy === 'endpoint'`):
```
For each BenchmarkRunResult in the selected PromptGroup (or all results):
  label = result.endpointName + ' / ' + result.model
  tps   = result.timing?.tokensPerSecond ?? null
  quality = result.qualityScore ?? null
  isError = !!result.error
  isFastest = tps === max(all tps values)
```

**Derivation** (when `groupBy === 'prompt'`):
```
For each PromptGroup:
  For each result in group:
    label = promptGroup.promptLabel + ' — ' + result.endpointName
    (same tps / quality / isError / isFastest)
```

---

### TrendPoint (TrendChart component — internal)

One data point in the historical performance line chart.

```typescript
interface TrendPoint {
  runId: string;
  runIndex: number;       // Sequential index (1, 2, 3…) for X-axis placement
  createdAt: string;      // ISO timestamp for tooltip display
  tps: number | null;     // null = run errored for this endpoint/model
  quality: number | null; // null = not scored
}
```

**Derivation**:
```
Given runs: BenchmarkRun[]  (from GET_BENCHMARK_HISTORY, sorted by createdAt asc)
Filter runs where at least one result matches the selected (endpointName, model) pair
For each matching run:
  result = run.results.find(r => r.endpointName === filter.endpoint && r.model === filter.model)
  tps     = result?.timing?.tokensPerSecond ?? null
  quality = result?.qualityScore ?? null
```

---

### TrendSeries (TrendChart component — internal)

All points for one endpoint+model combination, used for multi-line "All" view.

```typescript
interface TrendSeries {
  key: string;            // `${endpointName}::${model}` — unique per series
  label: string;          // Display label: "Endpoint / model"
  color: string;          // Tailwind bg/stroke class (cycled from a fixed palette)
  points: TrendPoint[];
}
```

**Colour palette** (cycled by series index):
```
0: blue-500
1: green-500
2: purple-500
3: orange-500
4: pink-500
5: teal-500
```

---

### useBenchmark — Extended State

`useBenchmark()` returns two additional fields:

| Field | Type | Description |
|-------|------|-------------|
| `currentPromptIndex` | `number \| null` | 0-based index of the prompt currently being evaluated (null when not running) |
| `totalPrompts` | `number` | Total number of prompts in the current batch run (0 when not running) |

The `runBenchmark` signature changes from:
```typescript
runBenchmark(endpointModels: Array<{endpointId: string; model: string}>, prompt: string)
```
to:
```typescript
runBenchmark(endpointModels: Array<{endpointId: string; model: string}>, prompts: string[])
```

**Backward compatibility**: All current call sites pass a single prompt. They must be updated to pass `[singlePrompt]` (an array of one).

---

## State Ownership Summary

| State | Owner | Persistence |
|-------|-------|-------------|
| `selectedPromptIds: string[]` | `BenchmarkRunner` component | `localStorage` (StorageKeys.BENCHMARK_SELECTED_PROMPTS — new key) |
| `viewMode: 'table' \| 'chart'` | `ResultsDashboard` component | None (resets on navigation) |
| `groupBy: 'endpoint' \| 'prompt'` | `ResultsDashboard` component | None (resets on navigation) |
| `trendFilter: string` | `BenchmarkHistory` component | None (resets on navigation) |
| `currentPromptIndex`, `totalPrompts` | `useBenchmark` hook | None (ephemeral run state) |

---

## StorageKeys Addition

One new key in `packages/shared/src/utils/storageKeys.ts` (or wherever `StorageKeys` is defined):

```typescript
BENCHMARK_SELECTED_PROMPTS: 'mycircle-benchmark-selected-prompts'
```

This persists the user's prompt selection across sessions.

---

## Validation Rules

- `selectedPromptIds` MUST contain at least one entry before the Run button is enabled.
- If `selectedPromptIds` includes `'all'`, the runner resolves this to `BENCHMARK_PROMPTS.map(p => p.prompt)` before calling `runBenchmark`.
- A custom prompt text MUST be non-empty if `selectedPromptIds` includes `'custom'`.
- `TrendPoint.tps` and `TrendPoint.quality` are nullable — chart must handle gaps gracefully.
