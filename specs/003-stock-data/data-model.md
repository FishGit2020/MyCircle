# Data Model: Candlestick Charts + Unified Refresh for Stock Tracker

No new Firestore collections, no GraphQL schema changes. This feature uses existing data sources and adds only local UI state.

---

## Existing Data Sources Used

### StockCandle (from `GET_STOCK_CANDLES` query — all fields already fetched)

```ts
interface StockCandle {
  c: number[];   // close prices
  h: number[];   // high prices  ← used for candlestick wick top
  l: number[];   // low prices   ← used for candlestick wick bottom
  o: number[];   // open prices  ← used for candlestick body start
  t: number[];   // timestamps (Unix seconds)
  v: number[];   // volume (not rendered currently)
  s: string;     // status: 'ok' | 'no_data'
}
```

All four OHLC arrays are already queried in `GET_STOCK_CANDLES`. No schema change required.

### StockQuote (unchanged)

```ts
interface StockQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;  // percent change
  h: number;   // day high
  l: number;   // day low
  o: number;   // day open
  pc: number;  // previous close
  t: number;   // timestamp
}
```

### CompanyNews (unchanged)

```ts
interface CompanyNews {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image?: string;
  source: string;
  summary: string;
  url: string;
}
```

---

## New UI State

### Chart Type (local to `StockChart`)

```ts
type ChartType = 'line' | 'candlestick';

// useState<ChartType>('line') inside StockChart
```

No persistence — transient toggle state.

### Per-Candle Display State (derived, not stored)

```ts
interface CandleBar {
  x: number;         // center x-pixel
  bodyTop: number;   // y-pixel = min(getY(o), getY(c))
  bodyBottom: number; // y-pixel = max(getY(o), getY(c))
  wickTop: number;   // y-pixel = getY(h)
  wickBottom: number; // y-pixel = getY(l)
  isUp: boolean;     // c >= o
  color: string;     // '#22c55e' | '#ef4444'
  barWidth: number;  // plotWidth / (n-1) * 0.6
}
```

Computed inline during render from `candles.o/h/l/c/t`. Not stored in state.

---

## Data Flow

```text
GET_STOCK_CANDLES (existing, already fetches o/h/l/c/t/v/s)
  └── useStockCandles() → { candles, loading, refetch }
        │
        ├── StockTracker.tsx
        │     └── candlesRefetch exposed for unified refresh button
        │
        └── StockChart.tsx
              ├── chartType: 'line' | 'candlestick'   (useState)
              ├── Line mode: uses candles.c only (existing)
              └── Candlestick mode: uses candles.o/h/l/c per bar (NEW)

GET_COMPANY_NEWS (existing)
  └── StockNews.tsx
        ├── fetchPolicy: cache-and-network (changed from cache-first)
        └── refetch() → news refresh button (NEW)
```

---

## Candlestick Geometry

| Element | SVG Element | Y-coordinate |
|---------|-------------|--------------|
| Upper wick | `<line>` | `getY(h[i])` → top of body |
| Body | `<rect>` | `min(getY(o[i]), getY(c[i]))` to `max(getY(o[i]), getY(c[i]))` |
| Lower wick | `<line>` | bottom of body → `getY(l[i])` |

**Color mapping**:
| Condition | Body fill | Wick stroke |
|-----------|-----------|-------------|
| `c[i] >= o[i]` (up) | `#22c55e` (green-500) | `#22c55e` |
| `c[i] < o[i]` (down) | `#ef4444` (red-500) | `#ef4444` |

**Bar width**: `plotWidth / Math.max(1, n - 1) * 0.6` where `n = candles.c.length`
