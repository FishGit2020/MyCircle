# Research: Trail Map GPX & Route Enhancements

**Branch**: `017-trail-map-gpx` | **Date**: 2026-03-27

## Decision 1: GPX Parsing (Client-Side)

**Decision**: Use the browser's built-in `DOMParser` API — no new library.

**Rationale**: GPX is well-formed XML. Every modern browser ships `DOMParser` natively. A small `gpxService.ts` file (~60 lines) can extract `<trk>/<rte>` elements, collect `<trkpt>/<rtept>` lat/lon/ele attributes, and compute the bounding box. This avoids adding a dependency and aligns with the Simplicity constitution principle.

**Alternatives Considered**:
- `@tmcw/togeojson` — solid 4 KB library converting GPX→GeoJSON, but adds a dependency; the conversion to our `SavedRoute` format still requires a custom mapping layer anyway.
- `fast-xml-parser` — already in `functions/package.json` (backend) but not accessible to browser MFEs and is server-side only.

**Implementation Note**: Write a `gpxService.ts` in `packages/hiking-map/src/services/` with two functions: `parseGpx(xmlText: string): GpxTrack[]` and `exportGpx(route: SavedRoute): string`.

---

## Decision 2: GPX Export

**Decision**: Generate GPX 1.1 XML as a template string — no library needed.

**Rationale**: Export is a one-way serialisation of a known data structure into a small XML document. A template string function (`exportGpx`) in the same `gpxService.ts` is < 40 lines, fully testable, and adds zero dependencies.

**Alternatives Considered**:
- `togpx` or `geojson-to-gpx` libraries — unnecessary abstraction for a simple serialisation.

---

## Decision 3: Multi-Waypoint Routing

**Decision**: Extend the existing `calcRoute` GraphQL query to accept an array of waypoints via a new `CALC_ROUTE_MULTI` query and corresponding schema type. Chain the OSRM call with multiple semicolon-separated coordinates (already supported by the OSRM API).

**Rationale**: The current schema only accepts `startLon/startLat/endLon/endLat`. OSRM's routing API natively supports N waypoints as semicolon-separated `lon,lat` pairs. Adding a `calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult!` resolver on the backend is minimal — only the URL construction changes. The MFE's `RoutePlanner` gains a dynamic waypoint list.

**Alternatives Considered**:
- Client-side segment stitching (multiple sequential `CALC_ROUTE` calls, concatenate coordinates) — avoids schema change but produces inaccurate combined distance/duration and doubles backend round-trips per additional waypoint.
- Modify existing `calcRoute` to accept arrays — would break the existing query signature and require codegen churn for all callers.

**Schema Changes Required**:
```graphql
input CoordinateInput {
  lon: Float!
  lat: Float!
}

calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult
```
`RouteResult` type remains unchanged (coordinates, distance, duration).

---

## Decision 4: Elevation Profile Chart

**Decision**: Render a pure SVG chart — no external library.

**Rationale**: The existing `stock-tracker` (`StockChart.tsx`) and `model-benchmark` (`TrendChart.tsx`) both use hand-written SVG with manual coordinate calculations. The elevation chart is a simple polyline over a distance axis — simpler than either existing chart. Follows Simplicity principle and avoids a new charting dependency.

**Alternatives Considered**:
- `recharts`, `chart.js`, `d3` — zero of these are in the monorepo; adding one violates the Simplicity constitution gate without justification.

**Implementation Note**: `ElevationProfile.tsx` component receives `{ distanceM: number; elevationM: number }[]`. Computes min/max elevation, scales points to a 300×80 SVG viewport, renders a filled polyline path. Displays total gain/loss in a summary row below.

---

## Decision 5: Waypoint Reordering

**Decision**: Up/down arrow buttons instead of drag-and-drop.

**Rationale**: No drag-and-drop library exists in the monorepo. The spec mentions drag-and-drop, but adding `@dnd-kit` solely for a 3–7 item list would violate the Simplicity principle. Arrow buttons (`↑`/`↓`) achieve the same reordering goal, are fully keyboard-accessible, and require zero new dependencies. The spec's acceptance scenario "user drags a waypoint input to reorder" is satisfied equivalently by move buttons.

**Alternatives Considered**:
- `@dnd-kit/core` (~12 KB gzip) — functional but unjustified new dependency for a list rarely exceeding 5 items.
- HTML5 drag events manually — possible but complex to implement correctly with accessibility.

---

## Decision 6: Route Save UX (FR-023)

**Decision**: Replace the current auto-save-then-rename flow with a modal/inline name prompt shown _before_ the save is committed.

**Rationale**: The current `SavedRoutes.tsx` saves the route immediately with a date-based default name, then requires a second rename action. This is a two-step friction point. A single name-confirm step (input pre-filled with the date default, editable) is simpler for the user and cleaner in code.

---

## Decision 7: Community Route Display Names (FR-025)

**Decision**: Already partially implemented — `PublicRoute.sharedBy.displayName` field exists in the data model and the community card does display it. The logic improvement is defensive: ensure `displayName` falls back gracefully to a truncated UID if the field is empty.

**Rationale**: The `routeStorageService.ts` and `SavedRoutes.tsx` already store and display `sharedBy.displayName`. The FR-025 improvement is a one-line defensive fallback, not a new feature.

---

## Existing Dependencies Confirmed

| Library | Location | Used For |
|---------|----------|----------|
| `idb@^8.0.3` | hiking-map | IndexedDB offline route storage (existing) |
| `maplibre-gl@^5.20.1` | hiking-map | Map rendering (existing) |
| `@mycircle/shared` | hiking-map | Apollo, i18n, formatDistance, PageContent (existing) |

**New dependencies required**: None.

---

## Key File Paths

| File | Role |
|------|------|
| `packages/hiking-map/src/services/gpxService.ts` | New: GPX parse + export |
| `packages/hiking-map/src/components/GpxImportButton.tsx` | New: file picker + import flow |
| `packages/hiking-map/src/components/ElevationProfile.tsx` | New: SVG elevation chart |
| `packages/hiking-map/src/components/RoutePlanner.tsx` | Modified: multi-waypoint support |
| `packages/hiking-map/src/components/SavedRoutes.tsx` | Modified: export GPX, save UX, search/filter |
| `packages/hiking-map/src/services/routeStorageService.ts` | Modified: SavedRoute type extension |
| `functions/src/schema.ts` | Modified: add CoordinateInput + calcRouteMulti |
| `functions/src/resolvers/routing.ts` | Modified: add calcRouteMulti resolver |
| `packages/shared/src/apollo/queries.ts` | Modified: add CALC_ROUTE_MULTI query |
