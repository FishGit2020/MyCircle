# Tasks: Candlestick Charts + Unified Refresh for Stock Tracker

**Input**: Design documents from `/specs/003-stock-data/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US2)

---

## Phase 1: Setup (No new project scaffolding needed)

This feature enhances existing components only. All infrastructure exists. Proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: i18n keys needed by both user stories.

- [X] T001 [P] Add `stocks.chartLine` (value: `"Line"`), `stocks.chartCandle` (value: `"Candle"`), and `stocks.refreshNews` (value: `"Refresh news"`) to `packages/shared/src/i18n/locales/en.ts` after line 385 (`'stocks.newsReadMore'`)
- [X] T002 [P] Add same keys with Spanish Unicode-escaped values to `packages/shared/src/i18n/locales/es.ts` after line 387 (`'stocks.newsReadMore'`) — `stocks.chartLine`: `"L\u00ednea"`, `stocks.chartCandle`: `"Vela"`, `stocks.refreshNews`: `"Actualizar noticias"`; read exact line before editing
- [X] T003 [P] Add same keys with Chinese Unicode-escaped values to `packages/shared/src/i18n/locales/zh.ts` after line 387 (`'stocks.newsReadMore'`) — `stocks.chartLine`: `"\u6298\u7ebf\u56fe"`, `stocks.chartCandle`: `"\u868c\u70db\u56fe"`, `stocks.refreshNews`: `"\u5237\u65b0\u65b0\u95fb"`; read exact line before editing

**Checkpoint**: i18n keys available in all 3 locales. Both user stories can proceed.

---

## Phase 3: User Story 1 — Candlestick Chart Mode (Priority: P1) 🎯 MVP

**Goal**: A "Line | Candle" toggle in the `StockChart` header lets users switch between the existing line chart and a new OHLC candlestick rendering using the same data already fetched.

**Independent Test**: Select any stock → navigate to `/stocks/:symbol` → scroll to chart → click "Candle" → chart re-renders as OHLC candlestick bars with green up-candles and red down-candles and wicks.

- [X] T004 [US1] Add `chartType` local state to `StockChart` in `packages/stock-tracker/src/components/StockChart.tsx` — `const [chartType, setChartType] = useState<'line' | 'candlestick'>('line')` at the top of the component (after the props destructure); import `useState` from `react`
- [X] T005 [US1] Add "Line | Candle" toggle buttons to the `StockChart` header in `packages/stock-tracker/src/components/StockChart.tsx` — render alongside the existing timeframe buttons as a two-button pill: `<button type="button" onClick={() => setChartType('line')} className={chartType === 'line' ? 'bg-blue-500 text-white ...' : '...'}>{t('stocks.chartLine')}</button>` and the same for `'candlestick'`/`t('stocks.chartCandle')`; same `px-2.5 py-1 text-xs font-medium rounded-md` styling as timeframe buttons
- [X] T006 [US1] Render candlestick bars in `packages/stock-tracker/src/components/StockChart.tsx` — when `chartType === 'candlestick'`, replace the `<path d={linePath} />` and `<path d={areaPath} />` elements with per-bar SVG: for each index `i` compute `barWidth = plotWidth / Math.max(1, prices.length - 1) * 0.6`; `bodyTop = Math.min(getY(candles.o[i]), getY(candles.c[i]))`; `bodyBottom = Math.max(getY(candles.o[i]), getY(candles.c[i]))`; `bodyHeight = Math.max(1, bodyBottom - bodyTop)`; `isUp = candles.c[i] >= candles.o[i]`; `color = isUp ? '#22c55e' : '#ef4444'`; render upper wick `<line x1={cx} y1={getY(candles.h[i])} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1} />`, body `<rect x={cx - barWidth/2} y={bodyTop} width={barWidth} height={bodyHeight} fill={color} />`, lower wick `<line x1={cx} y1={bodyBottom} x2={cx} y2={getY(candles.l[i])} stroke={color} strokeWidth={1} />`; where `cx = getX(i)`
- [X] T007 [US1] Update the `StockChart` SVG `aria-label` in `packages/stock-tracker/src/components/StockChart.tsx` — change from static `\`${symbol} price chart\`` to `\`${symbol} ${chartType === 'candlestick' ? 'candlestick' : 'price'} chart\`` to reflect the active chart mode for screen readers

**Checkpoint**: Candlestick chart renders correctly. Timeframe switching works in both modes.

---

## Phase 4: User Story 2 — Unified Refresh (Quote + Candles + News) (Priority: P2)

**Goal**: The header refresh button re-fetches both quote and candles. The news section gets its own refresh button. `StockNews` switches from `cache-first` to `cache-and-network`.

**Independent Test**: Load a stock detail → click ↺ refresh → both quote and candles re-fetch (spinners visible); scroll to news → click news ↺ → articles re-fetch.

- [X] T008 [US2] Destructure `refetch: candlesRefetch` from `useStockCandles` in `packages/stock-tracker/src/components/StockTracker.tsx` — change line 46 from `const { candles: selectedCandles, loading: candlesLoading } = useStockCandles(...)` to `const { candles: selectedCandles, loading: candlesLoading, refetch: candlesRefetch } = useStockCandles(selectedSymbol, timeframe)`
- [X] T009 [US2] Update the refresh button `onClick` in `packages/stock-tracker/src/components/StockTracker.tsx` — change `onClick={() => refetch()}` (the quote-only refresh) to `onClick={() => { quoteRefetch(); candlesRefetch(); }}` and rename the destructured `refetch` from `useStockQuote` to `refetch: quoteRefetch` for clarity (line 42–45)
- [X] T010 [US2] Change `fetchPolicy` to `cache-and-network` in `packages/stock-tracker/src/components/StockNews.tsx` — in the `useQuery<GetCompanyNewsQuery>` call on line 29, change `fetchPolicy: 'cache-first'` to `fetchPolicy: 'cache-and-network'`; also destructure `refetch: newsRefetch` from the query result
- [X] T011 [US2] Add news refresh button to `StockNews` in `packages/stock-tracker/src/components/StockNews.tsx` — in the news section header `<div>` (the flex row containing the newspaper icon + `t('stocks.news')` title), add a `<button type="button" onClick={() => newsRefetch()} disabled={loading} aria-label={t('stocks.refreshNews')} className="ml-auto p-1 rounded text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50 transition">` containing a refresh SVG icon (same icon as the header refresh button in `StockTracker.tsx`); min touch target: add `min-h-[44px] min-w-[44px]` or `p-2.5` to ensure ≥44px

**Checkpoint**: Unified refresh works. News refreshes independently. No polling in either story.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T012 [P] Run `pnpm build:shared` to rebuild shared with new i18n keys
- [X] T013 [P] Run `pnpm lint && pnpm --filter @mycircle/stock-tracker test:run && pnpm typecheck` and fix any failures
- [X] T014 [P] Update `packages/stock-tracker/src/components/StockChart.test.tsx` — add mock for `candles.o` / `candles.h` / `candles.l` arrays in the existing mock data (they are likely `undefined` in current mocks since only `candles.c` was used); add a test that clicking the "Candle" button renders candlestick elements (look for `<rect>` with the fill color `#22c55e` or `#ef4444`)
- [X] T015 Run `pnpm lint && pnpm test:run && pnpm typecheck` full suite and fix any remaining failures; verify no `pollInterval` value other than `0` was introduced anywhere in `stock-tracker`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately; T001/T002/T003 run in parallel
- **US1 (Phase 3)**: Depends on T001 (i18n keys for toggle labels); T004→T005→T006→T007 are sequential within StockChart
- **US2 (Phase 4)**: Depends on T001 (i18n key for `stocks.refreshNews`); T008→T009 sequential (same function), T010→T011 sequential (same file); US1 and US2 are independent of each other
- **Polish (Phase 5)**: Depends on all stories complete

### Story Independence

- US1 touches only `StockChart.tsx`
- US2 touches `StockTracker.tsx` and `StockNews.tsx` (different files — T008/T009 and T010/T011 can run in parallel)

### Parallel Opportunities

- T001, T002, T003 (i18n) run in parallel
- T004–T007 (StockChart) sequential — same file
- T008/T009 (StockTracker) and T010/T011 (StockNews) can run in parallel — different files

---

## Parallel Example: US2

```bash
# StockTracker.tsx changes (T008, T009) and StockNews.tsx changes (T010, T011) are independent:
Task: "T008+T009 — Add candlesRefetch to StockTracker.tsx unified refresh"
Task: "T010+T011 — cache-and-network + refresh button in StockNews.tsx"
```

---

## Implementation Strategy

### MVP (US1 only — pure StockChart enhancement)

1. Complete Phase 2: i18n keys (T001–T003)
2. Complete Phase 3: Candlestick chart (T004–T007)
3. **STOP and validate**: Candle toggle works; green/red bars visible; timeframes work
4. Ship — US2 (unified refresh) can follow in next iteration

### Incremental Delivery

1. Phase 2 → i18n keys ready
2. Phase 3 → Candlestick chart ✓ (core feature, immediately visible)
3. Phase 4 → Unified refresh ✓ (better UX for stale-data prevention)
4. Phase 5 → Tests green, typecheck passes ✓
