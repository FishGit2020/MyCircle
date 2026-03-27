# GraphQL Schema Changes: Trail Map GPX & Route Enhancements

**File**: `functions/src/schema.ts`
**Codegen**: Run `pnpm codegen` after applying these changes.

---

## New Input Type

```graphql
input CoordinateInput {
  lon: Float!
  lat: Float!
}
```

Add to the schema string alongside the existing input types.

---

## New Query

```graphql
calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult
```

Add to the `type Query { ... }` block alongside the existing `calcRoute`.

---

## Unchanged Types

`RouteResult` is reused without modification:

```graphql
type RouteResult {
  coordinates: [[Float!]!]!
  distance: Float!
  duration: Float!
}
```

---

## New Shared Query (packages/shared/src/apollo/queries.ts)

```graphql
query CalcRouteMulti($waypoints: [CoordinateInput!]!) {
  calcRouteMulti(waypoints: $waypoints) {
    coordinates
    distance
    duration
  }
}
```

Export as `CALC_ROUTE_MULTI` constant.

---

## Resolver Contract

**File**: `functions/src/resolvers/routing.ts`

New function: `calcRouteMultiResolver`

- **Input**: `waypoints: { lon: number; lat: number }[]` (minimum 2 elements)
- **Behaviour**: Constructs OSRM URL with all waypoints as semicolon-separated `lon,lat` pairs
  `https://routing.openstreetmap.de/routed-foot/route/v1/foot/lon1,lat1;lon2,lat2;...?overview=full&geometries=geojson`
- **Output**: Same `RouteResult` shape (coordinates, distance, duration from OSRM response)
- **Error**: Returns `null` on network failure or OSRM error (consistent with existing `calcRoute`)
- **Validation**: If fewer than 2 waypoints provided, return `null` immediately

---

## GPX Service API Contract

**File**: `packages/hiking-map/src/services/gpxService.ts`

### parseGpx(xmlText: string): GpxTrack[]

- Parses using browser `DOMParser`
- Collects `<trk>/<trkseg>/<trkpt>` and `<rte>/<rtept>` elements
- Each distinct `<trk>` element becomes one `GpxTrack`
- Returns empty array if no tracks/routes found (callers should surface error)
- Does not throw — catches DOM errors and returns `[]`

### gpxTrackToSavedRoute(track: GpxTrack, name: string): Omit<SavedRoute, 'id' | 'createdAt' | 'sharedId'>

- Converts a `GpxTrack` to a partial `SavedRoute` for saving
- Sets `sourceFormat: 'gpx-import'`
- Populates `elevationProfile` if `track.hasElevation`
- Computes `geometry` as a GeoJSON LineString from track points
- `duration` is set to `0` (GPX tracks don't carry time-to-complete)

### exportGpx(route: SavedRoute): string

- Returns a GPX 1.1 compliant XML string
- Includes `<trk><trkseg>` with `<trkpt lat="..." lon="...">` per coordinate
- Includes `<ele>` child for each point when `elevationProfile` is present (matched by distance index)
- Includes `<wpt>` elements for `startLabel`/`endLabel` when set
- Header: `<?xml version="1.0" encoding="UTF-8"?><gpx version="1.1" creator="MyCircle" ...>`
