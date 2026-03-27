# Implementation Plan: Trail Map GPX & Route Enhancements

**Branch**: `017-trail-map-gpx` | **Date**: 2026-03-27 | **Spec**: [spec.md](./spec.md)

## Summary

Add GPX import/export to the existing `hiking-map` MFE (the main missing capability), extend route planning to support multiple waypoints via a new `calcRouteMulti` GraphQL resolver, add a pure-SVG elevation profile chart, introduce route search/filter, and fix four UX logic issues in the current codebase. No new npm dependencies required — GPX is parsed with the browser's built-in `DOMParser` and exported as a template string; charts follow the project's existing SVG-only pattern.

## Technical Context

**Language/Version**: TypeScript 5.3.3 (frontend + functions backend)
**Primary Dependencies**: React 18, MapLibre GL 5.x, Apollo Client (via `@mycircle/shared`), Firebase Cloud Functions, `idb@^8.0.3`
**Storage**: Firestore `users/{uid}/hikingRoutes` + `publicHikingRoutes` (existing); IndexedDB fallback for unauthenticated users (existing)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web browser (desktop + mobile-first responsive)
**Project Type**: Micro-frontend (Module Federation) — enhancements to existing `packages/hiking-map` MFE
**Performance Goals**: GPX import renders track in < 3 s for files up to 5 MB; GPX export in < 2 s
**Constraints**: No new npm dependencies; no `100vh` calculations inside MFE; all colors with `dark:` variants; all strings via `t('key')` with 3-locale coverage
**Scale/Scope**: Single MFE enhancement — ~8 new/modified files in hiking-map, ~3 files in functions/shared

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Federated Isolation** | ✅ Pass | All imports from `@mycircle/shared`; no direct `@apollo/client` imports |
| **II. Complete Integration** | ✅ Pass | Enhancing existing MFE — no new MFE routes/nav entries needed; i18n keys added to all 3 locales |
| **III. GraphQL-First** | ✅ Pass | `calcRouteMulti` added as a GraphQL query; GPX parsing is client-side file processing (not a data API) |
| **IV. Inclusive by Default** | ✅ Pass | All new strings use `t('key')`; all colors get `dark:` variants; `aria-label` on import button and chart container |
| **V. Fast Tests, Safe Code** | ✅ Pass | GPX parsing is pure function (no network) — trivially unit-tested; file content stays client-side (no upload to server) |
| **VI. Simplicity** | ✅ Pass | Browser `DOMParser` instead of a library; SVG chart instead of recharts; arrow buttons instead of drag-and-drop library |

**No Complexity Tracking violations.**

## Project Structure

### Documentation (this feature)

```text
specs/017-trail-map-gpx/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── graphql-schema-diff.md
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (affected files)

```text
packages/hiking-map/src/
├── services/
│   ├── gpxService.ts              (NEW) GPX parse + export
│   └── routeStorageService.ts     (MODIFY) SavedRoute type extension
├── components/
│   ├── GpxImportButton.tsx        (NEW) file picker + import flow
│   ├── ElevationProfile.tsx       (NEW) SVG elevation chart
│   ├── RoutePlanner.tsx           (MODIFY) multi-waypoint support
│   ├── SavedRoutes.tsx            (MODIFY) export, search/filter, save UX
│   └── HikingMap.tsx              (MODIFY) wire new components)
└── test/
    ├── fixtures/
    │   └── sample.gpx             (NEW) test fixture
    ├── gpxService.test.ts         (NEW)
    ├── GpxImportButton.test.tsx   (NEW)
    ├── ElevationProfile.test.tsx  (NEW)
    ├── RoutePlanner.test.tsx      (MODIFY)
    └── SavedRoutes.test.tsx       (MODIFY)

functions/src/
├── schema.ts                      (MODIFY) CoordinateInput + calcRouteMulti
└── resolvers/routing.ts           (MODIFY) calcRouteMulti resolver

packages/shared/src/apollo/
├── queries.ts                     (MODIFY) CALC_ROUTE_MULTI query
└── generated.ts                   (REGENERATED via pnpm codegen)

packages/shell/src/i18n/locales/
├── en.ts                          (MODIFY) new hiking.* keys
├── es.ts                          (MODIFY)
└── zh.ts                          (MODIFY)
```

**Structure Decision**: Enhancing an existing MFE — all changes are confined to `packages/hiking-map`, `functions/src`, and `packages/shared`. No new package, no new route, no new Dockerfile entry.

## Implementation Phases

### Phase A — Backend: calcRouteMulti Resolver

1. Add `CoordinateInput` input type to `functions/src/schema.ts`
2. Add `calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult` to the Query type
3. Implement `calcRouteMultiResolver` in `functions/src/resolvers/routing.ts`
   - Build OSRM URL: `...route/v1/foot/lon1,lat1;lon2,lat2;...?overview=full&geometries=geojson`
   - Return null if fewer than 2 waypoints
   - Error handling consistent with existing `calcRoute`
4. Register resolver in the resolver factory
5. Add `CALC_ROUTE_MULTI` query to `packages/shared/src/apollo/queries.ts`
6. Run `pnpm codegen`; verify `cd functions && npx tsc --noEmit`

### Phase B — GPX Service

1. Create `packages/hiking-map/src/services/gpxService.ts`:
   - `parseGpx(xmlText: string): GpxTrack[]` — DOMParser-based, handles `<trk>` and `<rte>`
   - `gpxTrackToSavedRoute(track, name)` — converts to partial SavedRoute
   - `exportGpx(route: SavedRoute): string` — GPX 1.1 XML string generation
2. Extend `SavedRoute` interface in `routeStorageService.ts` with `elevationProfile?`, `waypoints?`, `sourceFormat?`
3. Write `gpxService.test.ts` with sample GPX fixture covering: single track, multi-track, with/without elevation, empty file, malformed XML

### Phase C — GPX Import UI

1. Create `GpxImportButton.tsx`:
   - Hidden `<input type="file" accept=".gpx">` with a styled trigger button
   - On file select: `FileReader.readAsText()` → call `parseGpx` → handle errors
   - If multiple tracks: show a simple list modal (track name + distance) for selection
   - On track selected: call `onImport(track: GpxTrack)` callback
2. Wire into `HikingMap.tsx`: `onImport` handler converts track to geometry, flies map to bounds, sets current route
3. Add i18n keys: `hiking.importGpx`, `hiking.importError`, `hiking.selectTrack`, `hiking.trackCount`

### Phase D — GPX Export

1. Add export button (download icon) to each route card in `SavedRoutes.tsx`
2. On click: call `exportGpx(route)` → create Blob → trigger download via `<a>` with `download` attribute
3. Add i18n key: `hiking.exportGpx`
4. No network call — purely client-side

### Phase E — Save Route UX Fix (FR-023)

1. Modify the "Save Current Route" flow in `SavedRoutes.tsx`:
   - Replace immediate auto-save with an inline name prompt (input pre-filled with `Route – <date>`)
   - Confirm button calls `routeStorageService.add(route)` with the edited name
   - Cancel discards without saving
2. Remove the `renaming` state that was needed to work around the old flow (or keep for existing saved routes rename)

### Phase F — Multi-Waypoint Route Planning

1. Refactor `RoutePlanner.tsx` to use a `waypoints: WaypointInput[]` array state instead of separate `start`/`end` strings
2. Render waypoint list dynamically: each item is a coordinate input + up/down move buttons + remove button
3. "Add Waypoint" button inserts a new empty entry before the last (end) waypoint
4. On Plan Route: if 2 waypoints → use existing `CALC_ROUTE`; if > 2 → use `CALC_ROUTE_MULTI`
5. Persist waypoints in `SavedRoute.waypoints` on save; restore on route load
6. Add i18n keys: `hiking.addWaypoint`, `hiking.removeWaypoint`, `hiking.moveUp`, `hiking.moveDown`

### Phase G — Elevation Profile

1. Create `ElevationProfile.tsx`:
   - Props: `profile: { distanceM: number; elevationM: number }[]`, `totalGainM: number`, `totalLossM: number`
   - 300×80 SVG viewport (responsive via `width="100%"`, `viewBox`)
   - Filled polyline path from scaled coordinates
   - X-axis labels (start / mid / end distance in user's preferred unit)
   - Summary row: gain ↑Xm / loss ↓Xm
2. Show toggle button in `HikingMap.tsx` when active route has `elevationProfile` data
3. Add i18n keys: `hiking.elevationProfile`, `hiking.elevationGain`, `hiking.elevationLoss`, `hiking.noElevationData`

### Phase H — Route Search & Filter

1. Add search input and distance filter dropdown above the routes list in `SavedRoutes.tsx`
2. Filter logic: pure client-side over the subscribed `myRoutes` array
3. Distance filter presets stored as constants (5000m, 15000m thresholds) — recalculate labels using `formatDistance`
4. Add i18n keys: `hiking.searchRoutes`, `hiking.filterDistance`, `hiking.filterAny`, `hiking.filterShort`, `hiking.filterMedium`, `hiking.filterLong`, `hiking.noRoutesFound`

### Phase I — Logic Fixes

1. **FR-024 Geolocation error**: Add loading spinner to "Use My Location" button; catch `GeolocationPositionError` and map `code` to user-friendly messages (`hiking.locationDenied`, `hiking.locationUnavailable`, `hiking.locationTimeout`)
2. **FR-025 Display name fallback**: In `SavedRoutes.tsx` community card, render `sharedBy.displayName || sharedBy.uid.slice(0, 8) + '...'`
3. **FR-026 Optimistic delete**: In `routeStorageService.deleteRoute`, update the local state immediately before the async Firestore/IndexedDB call; revert on error

### Phase J — Tests & Validation

1. Run full test suite: `pnpm lint && pnpm test:run && pnpm typecheck`
2. Run `cd functions && npx tsc --noEmit`
3. Run `validate_all` MCP tool to verify i18n, Dockerfile, widgets sync

## Implementation Order (Dependency Graph)

```
Phase A (backend) → Phase F (multi-waypoint UI depends on CALC_ROUTE_MULTI)
Phase B (gpxService) → Phase C (import UI) → Phase D (export)
                     → Phase G (elevation, uses ElevationProfile with service data)
Phase E, H, I are independent — can be done in any order
Phase J (validation) runs last
```

**Recommended sequence**: A → B → C → D → E → F → G → H → I → J
