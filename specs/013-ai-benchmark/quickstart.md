# Quickstart: AI Benchmark Enhancements (013-ai-benchmark)

## Prerequisites

- Node.js 20+, pnpm 9+
- Firebase CLI + emulator suite (for e2e)
- At least one Ollama endpoint configured in the app (or use the emulator seed data)

## Local Development

```bash
# Start the full dev stack (shell + model-benchmark MFE + shared)
pnpm dev

# Or start only the model-benchmark MFE in isolation
pnpm --filter @mycircle/model-benchmark dev
# → http://localhost:3004
```

## Running Tests

```bash
# Full test suite (required before PR)
pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck

# Run only model-benchmark tests (during development)
pnpm --filter @mycircle/model-benchmark test:run

# Watch mode
pnpm --filter @mycircle/model-benchmark test
```

## Files Changed by This Feature

### New Files

| File | Purpose |
|------|---------|
| `packages/model-benchmark/src/components/BenchmarkChart.tsx` | Grouped bar chart for comparison view in Results tab |
| `packages/model-benchmark/src/components/BenchmarkChart.test.tsx` | Unit tests for chart rendering |
| `packages/model-benchmark/src/components/TrendChart.tsx` | SVG polyline trend chart for History tab |
| `packages/model-benchmark/src/components/TrendChart.test.tsx` | Unit tests for trend chart |

### Modified Files

| File | What Changes |
|------|-------------|
| `packages/model-benchmark/src/hooks/useBenchmark.ts` | `runBenchmark` accepts `prompts: string[]`; exposes `currentPromptIndex`, `totalPrompts` |
| `packages/model-benchmark/src/hooks/useBenchmark.test.ts` | Tests for batch loop, new state fields |
| `packages/model-benchmark/src/components/BenchmarkRunner.tsx` | Prompt selection switches from single-select to multi-select with "All Prompts" shortcut |
| `packages/model-benchmark/src/components/BenchmarkRunner.test.tsx` | Tests for multi-prompt selection UI |
| `packages/model-benchmark/src/components/ResultsDashboard.tsx` | Adds Table/Chart toggle; batch grouping by prompt |
| `packages/model-benchmark/src/components/BenchmarkHistory.tsx` | Adds trend filter dropdown + `TrendChart` |
| `packages/model-benchmark/src/components/BenchmarkHistory.test.tsx` | Tests for trend filter and chart rendering |
| `packages/model-benchmark/src/components/ModelBenchmark.tsx` | Pass `currentPromptIndex`/`totalPrompts` through to `BenchmarkRunner` |
| `packages/shared/src/i18n/locales/en.ts` | 15 new `benchmark.*` keys |
| `packages/shared/src/i18n/locales/es.ts` | Same 15 keys in Spanish |
| `packages/shared/src/i18n/locales/zh.ts` | Same 15 keys in Chinese |
| `packages/shared/src/utils/storageKeys.ts` | Add `BENCHMARK_SELECTED_PROMPTS` key |

## Key Implementation Notes

### 1. Batch Progress Indicator

In `useBenchmark.ts`, the outer loop tracks `promptIndex` and calls `setCurrentPromptIndex(i)`. In `BenchmarkRunner.tsx`, render:
```
{running && totalPrompts > 1 && (
  <span>Endpoint {currentEndpointIndex}/{endpointCount} · Prompt {currentPromptIndex+1}/{totalPrompts}</span>
)}
```

### 2. Chart Bar Heights

Use the `MonitorCharts.tsx` pattern: `style={{ height: `${(value / maxValue) * 100}%` }}` inside a `flex items-end` container of fixed height (e.g. `h-40`). Bars with `null` TPS (error results) render at 0% with a red outline instead of a filled bar.

### 3. SVG Trend Line

Use a fixed `viewBox="0 0 200 60"` SVG. Map data points to `(x, y)` coordinates:
- `x = (index / (points.length - 1)) * 200`
- `y = 60 - ((value / maxValue) * 55)` (leave 5px padding at top)

Render as `<polyline points="x1,y1 x2,y2 ..." fill="none" strokeWidth="1.5" />`.

### 4. After Shared Changes

Whenever `en.ts` / `es.ts` / `zh.ts` or `storageKeys.ts` change, rebuild shared before running MFE tests:
```bash
pnpm build:shared
```

### 5. Backward Compatibility

`BenchmarkRunner` must default `selectedPromptIds` to `['simple']` when localStorage contains no saved selection, so existing users see the same single-prompt default on first load.

## Verify Locally

1. Start dev server: `pnpm dev`
2. Navigate to Model Benchmark → Run tab
3. Select 2+ endpoints and enable "All Prompts" → click Run
4. Confirm Results tab shows results grouped by prompt category
5. Toggle "Chart" → verify grouped bar chart renders with tooltips
6. Navigate to History tab → select a specific endpoint/model filter
7. Confirm trend line chart appears with data points
