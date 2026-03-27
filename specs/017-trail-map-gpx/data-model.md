# Data Model: Trail Map GPX & Route Enhancements

**Branch**: `017-trail-map-gpx` | **Date**: 2026-03-27

## Modified Entity: SavedRoute

Extends the existing `SavedRoute` interface in `packages/hiking-map/src/services/routeStorageService.ts`.

### Added Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `elevationProfile` | `{ distanceM: number; elevationM: number }[]` | No | Ordered array of distance-elevation pairs. Populated only when source has `<ele>` data. |
| `waypoints` | `{ lat: number; lng: number; label?: string }[]` | No | Ordered intermediate stops for multi-waypoint routes. Empty array or absent for 2-point routes. |
| `sourceFormat` | `"planned" \| "gpx-import"` | No | Origin of the route. Defaults to `"planned"` if absent (backward-compatible). |

### Full Updated Interface

```typescript
export interface SavedRoute {
  id: string;
  name: string;
  createdAt: number;            // Unix ms
  distance: number;             // meters
  duration: number;             // seconds
  geometry: GeoJSON.LineString; // serialised to JSON string in Firestore
  startLabel?: string;
  endLabel?: string;
  sharedId?: string | null;

  // --- New fields (017-trail-map-gpx) ---
  elevationProfile?: { distanceM: number; elevationM: number }[];
  waypoints?: { lat: number; lng: number; label?: string }[];
  sourceFormat?: 'planned' | 'gpx-import';
}
```

### Storage Notes

- `elevationProfile` is an array of plain objects — no nested arrays, safe for Firestore.
- `waypoints` contains flat objects with scalar fields — no nesting, Firestore-safe.
- `geometry` continues to be serialised as a JSON string when writing to Firestore (existing pattern — avoids nested array rejection).
- `elevationProfile` and `waypoints` are optional; existing documents without them load without error.

---

## New Intermediate Type: GpxTrack

Transient in-memory type used during GPX file parsing. Never persisted.

```typescript
export interface GpxTrack {
  name: string;                       // from <name> element, defaults to filename
  points: GpxPoint[];                 // ordered track/route points
  bounds: {                           // computed from points
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  };
  distanceM: number;                  // total distance computed from haversine
  hasElevation: boolean;              // true if any point has ele data
}

export interface GpxPoint {
  lat: number;
  lng: number;
  ele?: number;                       // elevation in metres (from <ele>)
}
```

---

## New GraphQL Type: CoordinateInput

Added to `functions/src/schema.ts`. Used by the new `calcRouteMulti` resolver.

```graphql
input CoordinateInput {
  lon: Float!
  lat: Float!
}
```

---

## Modified GraphQL Query: calcRouteMulti

Added to `functions/src/schema.ts` alongside the existing `calcRoute`.

```graphql
type Query {
  # existing
  calcRoute(startLon: Float!, startLat: Float!, endLon: Float!, endLat: Float!): RouteResult

  # new (017-trail-map-gpx)
  calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult
}
```

`RouteResult` type is unchanged — the multi-waypoint resolver stitches segments server-side and returns a single combined result.

---

## State Transitions: Route Import Flow

```
[ File Selected ]
      │
      ▼
[ Parse GPX (DOMParser) ]
      │ error → [ Show Error Banner ] → done
      │
      ▼
[ Track Selection ] (if > 1 track in file)
      │
      ▼
[ Render on Map + Fly to Bounds ]
      │
      ▼
[ User taps "Save" → Name Prompt (pre-filled) ]
      │ cancel → stay on map
      │
      ▼
[ Persist to Firestore / IndexedDB ]
      │
      ▼
[ Route appears in My Routes list ]
```

---

## State Transitions: Multi-Waypoint Route Planning

```
[ Start + End fields (existing) ]
      │ user taps "Add Waypoint"
      ▼
[ Intermediate WaypointInput inserted ]
      │ user fills coordinate
      ▼
[ Auto-recalculate via calcRouteMulti ]
      │ error on segment → surface per-segment error
      ▼
[ Render stitched polyline on map ]
      │ user saves
      ▼
[ SavedRoute with waypoints[] persisted ]
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| GPX file size | Reject if > 10 MB |
| GPX file type | Accept only if MIME type is `application/gpx+xml` or extension is `.gpx` |
| `waypoints` array | Minimum 2 points (start + end) for routing; no hard max (OSRM supports up to 25) |
| `elevationProfile` points | Must be sorted ascending by `distanceM`; no negative distances |
| Route name (save prompt) | Max 100 characters; trimmed; non-empty |
| Export filename | Sanitised: strip characters outside `[a-zA-Z0-9 _-]`, max 60 chars |
