# Feature Spec: Stock Tracker

**Status**: Implemented
**Package**: `packages/stock-tracker`
**Route**: `/stocks`, `/stocks/:symbol`
**Port**: 3005

## Summary

Real-time stock quotes and cryptocurrency tracker with watchlist management, interactive price charts, and company news. Supports deep-linking to individual stock symbols and syncs watchlist data to Firestore for cross-device persistence.

## Key Features

- Real-time stock quote display with price, change, and volume
- Symbol search with company name autocomplete
- Persistent watchlist with add/remove functionality
- Cryptocurrency tracker for BTC, ETH, SOL, ADA, DOGE via CoinGecko
- Interactive candlestick/line charts with multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- Company news feed for selected stocks
- Watchlist synced to Firestore via `WindowEvents.WATCHLIST_CHANGED`

## Data Sources

- **Cloud Function**: `/stock/**` proxy to Finnhub API (quotes, candles, news, search)
- **CoinGecko API**: Free tier for cryptocurrency prices
- **localStorage**: `StorageKeys.STOCK_WATCHLIST` for watchlist persistence
- **Firestore sync**: Watchlist restored via `restoreUserData` on sign-in

## Integration Points

- **Shell route**: `/stocks`, `/stocks/:symbol` in App.tsx
- **Widget**: `stocks` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `nav.stocks`, `stocks.*`
- **Cloud Function**: `/stock/**` -> `stockProxy`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Custom hooks: `useStockQuote`, `useStockCandles` with timeframe support
- Finnhub REST API via Cloud Function proxy
- CoinGecko free API (no key required)
- Chart rendering for price history

## Testing

- Unit tests: `packages/stock-tracker/src/**/*.test.{ts,tsx}`
- E2E: `e2e/stocks.spec.ts`, `e2e/crypto-tracker.spec.ts`
