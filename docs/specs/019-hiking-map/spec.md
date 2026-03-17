# Feature Spec: Hiking Map

**Status**: Implemented
**Package**: `packages/hiking-map`
**Route**: `/hiking`, `/hiking/*`
**Port**: 3022

## Summary

Interactive hiking map built on MapLibre GL with GPS tracking, waypoint management, OSRM routing, saved routes, and offline tile caching. Features multiple map styles, a route planner with start/end point selection, and community route sharing.

## Key Features

- Interactive MapLibre GL map with multiple tile providers/styles
- GPS location tracking with locate button
- Route planner: click-to-set start/end waypoints
- OSRM routing engine for path calculation (distance, duration, geometry)
- Save and load routes (private + public sharing)
- Offline tile manager for downloading map areas
- Tile cache overlay to visualize cached regions
- Route display with GeoJSON line rendering
- Map style switcher (street, satellite, outdoor, etc.)
- Zoom controls
- Waypoint circle layers with shared map utilities

## Data Sources

- **Firestore**: `users/{uid}/hikingRoutes/{routeId}` (private saved routes)
- **Firestore**: `publicHikingRoutes/{routeId}` (community shared routes)
- **OSRM API**: Route calculation (distance, duration, geometry)
- **Tile providers**: Multiple map tile sources configured in `config/mapConfig.ts`
- **IndexedDB**: Offline tile cache (via OfflineTileManager)
- **Window globals**: `window.__hikingRoutes` for cross-MFE data

## Integration Points

- **Shell route**: `/hiking`, `/hiking/*` in App.tsx (no auth required)
- **Widget**: `hikingMap` in widgetConfig.ts
- **Nav group**: Outdoor (`nav.group.outdoor`)
- **i18n namespace**: `nav.hikingMap`, `hiking.*`
- **Firestore**: `users/{uid}/hikingRoutes/{routeId}`, `publicHikingRoutes/{routeId}`
- **Window events**: `WindowEvents.HIKING_ROUTES_CHANGED`
- **Shared utilities**: `setCircleLayer`, `removeSourceAndLayers`, `MapControls` from `@mycircle/shared`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- MapLibre GL JS for map rendering
- OSRM API for route calculation
- GeoJSON for route geometry (serialized to JSON string for Firestore)
- IndexedDB for offline tile storage
- ResizeObserver for responsive map sizing
- Custom hooks, providers (`RoutingProvider`), services (`routeStorageService`)
- Map configuration in `config/mapConfig.ts`
- Custom CSS (`index.css`) for map styling

## Testing

- Unit tests: `packages/hiking-map/src/**/*.test.{ts,tsx}`
- E2E: `e2e/hiking-map.spec.ts`
