# Feature Specification: Candlestick Charts + Unified Refresh for Stock Tracker

**Feature Branch**: `003-stock-data`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Real-time stock quotes, candlestick charts, company news, but due to quota constraint don't use poll, just allow user refresh"

## Context

The `StockTracker` MFE already has stock quotes, a line chart, and company news. This feature adds:
1. A **candlestick chart mode** — the existing chart uses only close prices (line); the `StockCandle` data already includes O/H/L/C so we can render proper candlestick bars without any schema changes.
2. **Unified refresh** — the existing refresh button only re-fetches the quote. Candles and news should also be refreshable without polling.

No polling is already enforced (`pollInterval=0`). This feature preserves that constraint.

---

## User Scenarios & Testing

### User Story 1 — Candlestick Chart Mode (Priority: P1)

A user viewing a stock detail page can switch the chart between line view and candlestick view. Candlestick bars show open/high/low/close for each period with green bodies (close ≥ open) and red bodies (close < open).

**Why this priority**: Core of the feature request. All OHLC data is already available in `StockCandle`; this is purely a rendering enhancement.

**Independent Test**: Select any stock → scroll to chart → click "Candle" toggle button → chart re-renders as OHLC candlestick bars with colored bodies and wicks.

**Acceptance Scenarios**:

1. **Given** a stock is selected, **When** the user taps the "Candle" toggle, **Then** the chart shows candlestick bars with a green body when close ≥ open and red body when close < open, plus wicks from high to low.
2. **Given** candlestick mode is active, **When** the user switches timeframes (1W → 1Y), **Then** the candlestick chart updates correctly with the new data.
3. **Given** candlestick mode is active, **When** the user taps "Line" toggle, **Then** the chart reverts to the line view.
4. **Given** `StockCandle.s === 'no_data'`, **When** either chart mode is selected, **Then** the "no data" fallback is shown for both modes.

---

### User Story 2 — Unified Refresh (Quote + Candles + News) (Priority: P2)

The existing refresh button refreshes only the stock quote. This story extends it to also refresh candle data, and adds a separate refresh button to the news section.

**Why this priority**: The no-polling design means stale data is only corrected by manual refresh. Without this, candles and news silently stay stale.

**Independent Test**: Load a stock → wait → click the header refresh button → both quote and candles re-fetch; click refresh in the news section → news articles re-fetch.

**Acceptance Scenarios**:

1. **Given** a stock is displayed, **When** the user clicks the header refresh button, **Then** both `stockQuote` and `stockCandles` queries re-fetch (spinner visible while loading).
2. **Given** the news section is visible, **When** the user clicks the news refresh button, **Then** `companyNews` re-fetches with today's date range.
3. **Given** news fetch is in progress, **When** the refresh button is clicked, **Then** the button is disabled (no double-fetch).
4. **Given** the user has never clicked refresh, **When** the stock detail loads, **Then** data loads once via `cache-and-network` — no polling interval fires.

---

## Out of Scope

- Real-time WebSocket streaming (quota constraint — user refresh only)
- Volume bars on the candlestick chart (future enhancement)
- Intraday (sub-day) resolutions beyond existing timeframes
- New GraphQL resolvers or schema changes (all data already available)
