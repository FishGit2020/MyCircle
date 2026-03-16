# Feature Spec: Transit Tracker

**Status**: Implemented
**Package**: `packages/transit-tracker`
**Route**: `/transit`, `/transit/:stopId`
**Port**: 3028

## Summary

Real-time public transit arrival tracker with stop search, nearby stop discovery via GPS, favorite stops, and recent stop history. Provides live arrival times for bus and transit routes at specific stops.

## Key Features

- Real-time bus/transit arrival times for selected stops
- Stop search by ID or name
- Nearby stops discovery using GPS geolocation
- Favorite stops with quick access
- Recent stops history (last 5, persisted to localStorage)
- Arrivals list with route, direction, and countdown display
- Deep-link to specific stops via `/transit/:stopId`
- Auto-refresh of arrival data

## Data Sources

- **Local transit API**: Real-time arrival data and stop information
- **Geolocation API**: `navigator.geolocation` for nearby stop discovery
- **localStorage**: `transit-recent-stops` for recent stop history
- **Firestore + localStorage**: Favorite stops persistence

## Integration Points

- **Shell route**: `/transit`, `/transit/:stopId` in App.tsx (no auth required)
- **Widget**: `transitTracker` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `nav.transit`, `transit.*`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Geolocation API for nearby stop discovery
- Custom hooks: `useTransitArrivals` (real-time data), `useNearbyStops` (GPS), `useFavoriteStops` (persistence)
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/transit-tracker/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
