# Quickstart: Candlestick Charts + Unified Refresh for Stock Tracker

## Prerequisites

- Sign in with a Google account (required for stock search)
- No additional setup — the StockTracker MFE is already running

## Dev Setup

```bash
git checkout 003-stock-data
pnpm install
pnpm build:shared
pnpm dev:stock-tracker   # MFE on port 3003
pnpm dev:shell           # shell on port 3000
```

Open `http://localhost:3000/stocks` and sign in.

---

## Integration Scenarios

### Scenario 1: Candlestick Chart Mode (US1)

1. Navigate to `/stocks`
2. Search for a stock (e.g., "AAPL")
3. Click the Apple result → detail view opens
4. Scroll to the chart
5. **Expect**: Chart header shows two buttons: "Line" (active) and "Candle"
6. Click "Candle"
7. **Expect**: Chart re-renders with OHLC candlestick bars
   - Green bars where close ≥ open (up candles)
   - Red bars where close < open (down candles)
   - Thin wicks extending from high to low
8. Switch timeframe from 1M to 3M
9. **Expect**: Candlestick chart updates with new data (still in candle mode)
10. Click "Line"
11. **Expect**: Chart reverts to the line area chart

### Scenario 2: Unified Refresh (US2)

1. Select a stock → detail view loads (quote + chart + news all visible)
2. Note the "Last updated" timestamp under the quote
3. Wait 30+ seconds
4. Click the ↺ Refresh button in the stock header
5. **Expect**: Spinner appears on the refresh button; quote AND chart data both re-fetch; timestamp updates
6. Scroll to the News section
7. **Expect**: A small ↺ button appears in the News section header
8. Click the news refresh button
9. **Expect**: News skeleton appears briefly, then articles reload

### Scenario 3: No-Polling Verification

1. Open browser DevTools → Network tab → filter by "graphql"
2. Load a stock detail page
3. **Expect**: One `stockQuote` request fires on load (cache-and-network), then no further automatic requests
4. Wait 2+ minutes
5. **Expect**: Zero additional network requests — no polling
6. Click the refresh button
7. **Expect**: One `stockQuote` + one `stockCandles` request fires

---

## Verification Checklist

- [ ] "Line" / "Candle" toggle buttons visible in chart header
- [ ] Candlestick chart renders OHLC bars (not just line)
- [ ] Green bodies for up candles, red for down candles
- [ ] Wicks visible from high to low
- [ ] Timeframe switch works in candlestick mode
- [ ] Line ↔ Candlestick toggle works without page reload
- [ ] Refresh button re-fetches both quote AND candles
- [ ] News section has its own refresh button
- [ ] No automatic polling (verify in Network tab)
- [ ] Dark mode: candlestick chart readable in dark theme
- [ ] Mobile: chart scrolls horizontally on narrow screens

---

## Key Files

| File | What changes |
|------|-------------|
| `packages/stock-tracker/src/components/StockChart.tsx` | Add `chartType` toggle state; render candlestick SVG when in candle mode |
| `packages/stock-tracker/src/components/StockTracker.tsx` | Destructure `refetch` from `useStockCandles`; call both in unified refresh handler |
| `packages/stock-tracker/src/components/StockNews.tsx` | Change `fetchPolicy` to `cache-and-network`; add refresh button |
| `packages/shared/src/i18n/locales/{en,es,zh}.ts` | Add `stocks.chartLine`, `stocks.chartCandle`, `stocks.refreshNews` |
