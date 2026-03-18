# Research: Candlestick Charts + Unified Refresh for Stock Tracker

## Decision 1: Candlestick rendering — SVG (no new library)

**Decision**: Implement candlestick bars in SVG, extending the existing `StockChart.tsx` SVG implementation.

**Rationale**: The existing chart is already a hand-rolled SVG with the same coordinate helpers (`getX`, `getY`). Adding candlestick rendering reuses the same scaling logic. Introducing a charting library (Recharts, Chart.js, Lightweight Charts) would add bundle weight, a new dependency, and style integration complexity — all for a feature that can be done in ~50 lines of SVG.

**Alternatives considered**:
- **TradingView Lightweight Charts**: Excellent candlestick support but ~50KB gzipped; overkill for one chart component and introduces a new MFE dependency.
- **Recharts**: React-first but doesn't have a built-in candlestick series; would need a custom shape anyway.
- **D3**: Powerful but heavy, and the existing approach avoids runtime D3 dependency.

---

## Decision 2: Chart type state — local React state, not persisted

**Decision**: `chartType: 'line' | 'candlestick'` is managed as local `useState` inside `StockChart`.

**Rationale**: Chart style preference is a transient UI choice. Persisting it to localStorage (like watchlist) adds complexity with minimal benefit — it's a one-tap toggle. Simplicity principle applies.

**Alternatives considered**:
- **localStorage persistence**: Rejected — over-engineered for a toggle.
- **URL search param**: Rejected — adds URL complexity; the chart is a sub-component of a page that already has params.

---

## Decision 3: No polling — enforced by `pollInterval=0`, no change needed

**Decision**: The `useStockQuote` call in `StockTracker.tsx` already passes `pollInterval=0`. This is intentional and must remain. The refresh button (`refetch()`) is the only way to update the quote.

**Rationale**: Finnhub free tier has strict rate limits (60 API calls/minute). Polling every 60s with multiple open tabs would exhaust the quota. Manual refresh gives the user control.

**Constraint confirmed**: `useStockQuote(selectedSymbol, 0)` at `StockTracker.tsx:44`. The `0` must not be changed.

---

## Decision 4: Candles refresh — expose `refetch` from `useStockCandles` to parent

**Decision**: `useStockCandles` already returns `refetch`, but `StockTracker.tsx` never calls it. The unified refresh handler will call both `quoteRefetch()` and `candlesRefetch()`.

**Rationale**: A single "Refresh" button that only refreshes the quote leaves the chart stale after a long session. Binding both refetch calls to one button is the minimal change.

**Implementation**: `handleRefresh = () => { quoteRefetch(); candlesRefetch(); }` — replace the inline `() => refetch()` in the refresh button's `onClick`.

---

## Decision 5: News refresh — `cache-and-network` + refetch button

**Decision**: Change `StockNews.tsx` from `fetchPolicy: 'cache-first'` to `fetchPolicy: 'cache-and-network'` and add a small refresh button in the news section header.

**Rationale**: `cache-first` means the news for AAPL never updates after the first load — even if you navigate away and come back. `cache-and-network` sends a background network request each time the component mounts (on symbol change), which is reasonable given news queries are cheap. The explicit refresh button covers the "I'm staying on the same symbol and want fresh news" case.

**Alternatives considered**:
- **Keep `cache-first`**: Rejected — stale news with no escape hatch is a poor UX when polling is disabled.
- **`network-only`**: Rejected — loses the benefit of instant cached render while network request is in flight.

---

## Decision 6: Candlestick SVG geometry

**Candle body**: `rect` from `min(getY(o), getY(c))` to `max(getY(o), getY(c))` — width ≈ 70% of the per-bar slot to leave gap between bars.

**Wick**: Two `line` elements — upper wick from top-of-body to `getY(h)`, lower wick from bottom-of-body to `getY(l)`.

**Colors**:
- Up candle (c ≥ o): `#22c55e` (green-500) — matches existing line chart positive color.
- Down candle (c < o): `#ef4444` (red-500) — matches existing line chart negative color.

**Min/Max annotation**: Keep the same min/max dot+label that the line chart shows, positioned at the close-price extremes (not wick extremes, to avoid visual clutter).

**Body width formula**: `barWidth = plotWidth / (n - 1) * 0.6` — 60% fill with 40% gap. For very long timeframes (1Y, weekly resolution, ~52 bars) this gives comfortable spacing.

---

## Decision 7: i18n keys needed

Two new keys required:
- `stocks.chartLine` — label for the "Line" toggle button
- `stocks.chartCandle` — label for the "Candlestick" toggle button
- `stocks.refreshNews` — aria-label for the news refresh button

All three needed in en/es/zh.
