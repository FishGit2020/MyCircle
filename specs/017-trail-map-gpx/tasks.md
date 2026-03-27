# Tasks: Trail Map GPX & Route Enhancements

**Input**: Design documents from `/specs/017-trail-map-gpx/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Organization**: Tasks grouped by user story for independent implementation and testing.
No test tasks generated (not explicitly requested in spec).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Confirm branch environment and create the one shared test fixture.

- [x] T001 Verify git branch is `017-trail-map-gpx` and `pnpm install && pnpm build:shared` completes without error
- [x] T002 Create GPX test fixture at `packages/hiking-map/src/test/fixtures/sample.gpx` — a minimal valid GPX 1.1 file with one `<trk>` containing 5 `<trkpt>` points with `<ele>` tags, and one `<wpt>` (used across US1, US2, US4 tasks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type extensions and data-model changes that US1, US2, US3, and US4 all build on.

**⚠️ CRITICAL**: Complete before any user story phase.

- [x] T003 Extend `SavedRoute` interface in `packages/hiking-map/src/services/routeStorageService.ts` — add optional fields `elevationProfile?: { distanceM: number; elevationM: number }[]`, `waypoints?: { lat: number; lng: number; label?: string }[]`, `sourceFormat?: 'planned' | 'gpx-import'` (backward-compatible; existing saved routes load without modification)
- [x] T004 [P] Add `GpxTrack` and `GpxPoint` interfaces to a new file `packages/hiking-map/src/services/gpxService.ts` (type declarations only, no logic yet — subsequent tasks will fill the functions)

**Checkpoint**: `pnpm --filter @mycircle/hiking-map typecheck` must pass before user story phases begin.

---

## Phase 3: User Story 1 — GPX Import (Priority: P1) 🎯 MVP

**Goal**: Users can upload a `.gpx` file, see the track rendered on the map, and save it to their route library.

**Independent Test**: Upload `packages/hiking-map/src/test/fixtures/sample.gpx`, verify the track renders as a blue polyline, the map flies to the track bounds, distance is shown, and the route can be saved with a custom name.

- [x] T005 [US1] Implement `parseGpx(xmlText: string): GpxTrack[]` in `packages/hiking-map/src/services/gpxService.ts` — use browser `DOMParser`; collect `<trk>/<trkseg>/<trkpt>` and `<rte>/<rtept>` elements; compute `distanceM` via haversine; set `hasElevation: true` if any `<ele>` tag is present; return `[]` on malformed XML without throwing
- [x] T006 [US1] Implement `gpxTrackToSavedRoute(track: GpxTrack, name: string): Omit<SavedRoute, 'id' | 'createdAt' | 'sharedId'>` in `packages/hiking-map/src/services/gpxService.ts` — maps track points to `GeoJSON.LineString`; sets `sourceFormat: 'gpx-import'`; populates `elevationProfile` when `track.hasElevation`; sets `duration: 0` (GPX tracks carry no travel-time)
- [x] T007 [US1] Create `packages/hiking-map/src/components/GpxImportButton.tsx` — hidden `<input type="file" accept=".gpx">` triggered by a styled `<button type="button">`; reads file with `FileReader.readAsText()`; rejects files > 10 MB with an error toast; calls `parseGpx`; if result is empty shows "No tracks found" error; if result has 1 track calls `onImport(track)` directly; if > 1 track shows a simple inline list (track name + distance) for user selection; all strings via `t('hiking.*')`; `aria-label` on the trigger button
- [x] T008 [US1] Add i18n keys for GPX import to all three locale files (`packages/shell/src/i18n/locales/en.ts`, `es.ts`, `zh.ts`): `hiking.importGpx`, `hiking.importError`, `hiking.importFileTooLarge`, `hiking.importNoTracks`, `hiking.selectTrack`, `hiking.importTrackCount`
- [x] T009 [US1] Wire `GpxImportButton` into `packages/hiking-map/src/components/HikingMap.tsx` — add `onImport` handler that converts `GpxTrack` to a `RouteResult`-shaped object, calls `map.fitBounds()` to the track bounding box, sets the active route geometry for `RouteDisplay`, and exposes a "Save" button with an inline name prompt (pre-filled with the GPX track name or file name)
- [x] T010 [US1] Implement the save-with-name UX (FR-023) in `packages/hiking-map/src/components/SavedRoutes.tsx` — replace the current auto-save-then-rename flow with an inline `<input>` name prompt shown _before_ `routeStorageService.add()` is called; pre-fill with `Route – <date>`; add i18n keys `hiking.saveRouteName`, `hiking.saveConfirm`, `hiking.saveCancel`; apply to both planned routes and GPX-imported routes

**Checkpoint**: After T010 — import a GPX file end-to-end: file picker → track on map → name prompt → saved route appears in "My Routes" list.

---

## Phase 4: User Story 2 — GPX Export (Priority: P2)

**Goal**: Each saved route can be downloaded as a well-formed GPX 1.1 file.

**Independent Test**: Save any route (planned or imported), click the export icon, verify a `.gpx` file downloads and contains correct `<trk>/<trkpt>` elements matching the route geometry.

- [x] T011 [US2] Implement `exportGpx(route: SavedRoute): string` in `packages/hiking-map/src/services/gpxService.ts` — generate GPX 1.1 XML string with `<trk><trkseg>` containing one `<trkpt lat="..." lon="...">` per coordinate; include `<ele>` child when `elevationProfile` is present (match by index); include `<wpt>` elements for `startLabel`/`endLabel` when set; sanitise filename (strip non-`[a-zA-Z0-9 _-]` chars, max 60 chars)
- [x] T012 [P] [US2] Add export button (download icon, `type="button"`) to each route card in `packages/hiking-map/src/components/SavedRoutes.tsx` — on click, call `exportGpx(route)`, create a `Blob`, trigger download via a temporary `<a download="...">` element; add dark-mode icon variant; touch target ≥ 44 px
- [x] T013 [P] [US2] Add i18n key `hiking.exportGpx` to all three locale files (`packages/shell/src/i18n/locales/en.ts`, `es.ts`, `zh.ts`)

**Checkpoint**: After T013 — export a saved route, open the `.gpx` file in a text editor and confirm GPX 1.1 structure.

---

## Phase 5: User Story 3 — Multi-Waypoint Route Planning (Priority: P3)

**Goal**: Users can plan routes through more than two points; extra waypoints are saved and restored with the route.

**Independent Test**: Add start + 2 intermediate waypoints + end in the planner, plan the route, verify a continuous polyline passes through all points in order, and verify the saved route restores all waypoints on load.

- [x] T014 [US3] Add `CoordinateInput` input type and `calcRouteMulti(waypoints: [CoordinateInput!]!): RouteResult` query to `functions/src/schema.ts` — place `CoordinateInput` alongside existing input types and `calcRouteMulti` inside `type Query { ... }` alongside existing `calcRoute`
- [x] T015 [US3] Implement `calcRouteMultiResolver` in `functions/src/resolvers/routing.ts` — build OSRM URL with all waypoints as semicolon-separated `lon,lat` pairs (`...route/v1/foot/lon1,lat1;lon2,lat2;...?overview=full&geometries=geojson`); return `null` for < 2 waypoints or on network error; register the resolver in the factory function alongside existing `calcRoute`
- [x] T016 [US3] Add `CALC_ROUTE_MULTI` query constant to `packages/shared/src/apollo/queries.ts`, then run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`; verify `cd functions && npx tsc --noEmit` passes
- [x] T017 [US3] Refactor `packages/hiking-map/src/components/RoutePlanner.tsx` to use a `waypoints: { value: string; label?: string }[]` array state (minimum 2 entries: start + end) — render each waypoint as a labelled coordinate input with ↑/↓ move buttons and a remove button (hidden when only 2 waypoints remain); add an "Add Waypoint" button that inserts a new empty entry before the last (end) waypoint; on Plan Route: use `CALC_ROUTE` when exactly 2 waypoints, `CALC_ROUTE_MULTI` when > 2; call `onRouteChange` with the updated waypoints array so it can be included in the saved route
- [x] T018 [P] [US3] Persist and restore waypoints in the save/load flow — in `packages/hiking-map/src/services/routeStorageService.ts` confirm `waypoints` is included in the Firestore write and in the IndexedDB write; in `SavedRoutes.tsx` `loadRoute` callback pass `route.waypoints` back to `RoutePlanner` so inputs are populated on load
- [x] T019 [P] [US3] Add i18n keys to all three locale files: `hiking.addWaypoint`, `hiking.removeWaypoint`, `hiking.moveWaypointUp`, `hiking.moveWaypointDown`, `hiking.waypoint` (generic label), `hiking.waypointN` is not needed (use `hiking.waypoint + index`)

**Checkpoint**: After T019 — plan a 4-point route, save it, reload it, confirm all 4 waypoint inputs are restored.

---

## Phase 6: User Story 4 — Elevation Profile (Priority: P4)

**Goal**: When an active route has elevation data (from GPX import), a toggle shows a SVG elevation chart with gain/loss summary.

**Independent Test**: Import `sample.gpx` (which has `<ele>` tags), confirm the elevation toggle appears, click it, verify the chart renders with a filled polyline and "↑ Gain / ↓ Loss" labels; import a planned route (no elevation), confirm the toggle is hidden or disabled.

- [x] T020 [US4] Create `packages/hiking-map/src/components/ElevationProfile.tsx` — accepts `profile: { distanceM: number; elevationM: number }[]`, `totalGainM: number`, `totalLossM: number`, and `unit: 'km' | 'mi'` props; renders a 300×80 SVG (`width="100%"`, `viewBox="0 0 300 80"`) with a closed filled path (polyline to baseline); computes min/max elevation for Y-scale and total distance for X-scale; adds X-axis distance labels (start / mid / end in user unit) and Y-axis min/max elevation labels; renders a summary row below the SVG: "↑ {gain} m  ↓ {loss} m"; applies `dark:` text and fill colour variants; `aria-label` on the `<svg>` element
- [x] T021 [US4] Wire elevation profile into `packages/hiking-map/src/components/HikingMap.tsx` — track whether the active route has `elevationProfile` data; show/hide an "Elevation" toggle button accordingly; clicking the toggle opens/closes the `ElevationProfile` panel below the map controls; pass `useUnits()` value for the unit prop
- [x] T022 [P] [US4] Add i18n keys to all three locale files: `hiking.elevationProfile`, `hiking.elevationGain`, `hiking.elevationLoss`, `hiking.noElevationData`

**Checkpoint**: After T022 — import the GPX fixture, open elevation panel, confirm chart appears; open a planned route, confirm no elevation toggle is shown.

---

## Phase 7: User Story 5 — Route Search & Filter (Priority: P5)

**Goal**: Users can narrow the saved routes list by name and by distance range.

**Independent Test**: Save three routes with distinct names and different distances; type a partial name in the search field and confirm only matching routes appear; apply a distance preset and confirm only routes within range appear; clear all filters and confirm all routes return.

- [x] T023 [US5] Add search input and distance filter dropdown above the "My Routes" list in `packages/hiking-map/src/components/SavedRoutes.tsx` — search is a debounce-free controlled input (React state, filter on each render); distance filter is a `<select>` with options Any / < 5 km / 5–15 km / > 15 km (thresholds are 5000 m and 15000 m; recalculate display labels using `formatDistance` from `@mycircle/shared`); filter logic is a pure client-side computation over the subscribed `myRoutes` array; show an empty-state message with "Clear filters" link when no routes match; all filter controls get `dark:` variants and ≥ 44 px touch targets
- [x] T024 [P] [US5] Add i18n keys to all three locale files: `hiking.searchRoutes`, `hiking.filterDistance`, `hiking.filterAny`, `hiking.filterShort`, `hiking.filterMedium`, `hiking.filterLong`, `hiking.noRoutesFound`, `hiking.clearFilters`

**Checkpoint**: After T024 — save several routes, confirm search and distance filter work independently and in combination.

---

## Phase 8: Polish & Logic Fixes

**Purpose**: Four FR-fix items (FR-024–FR-026) plus final validation that affect multiple stories.

- [x] T025 [P] Fix geolocation error handling in `packages/hiking-map/src/components/RoutePlanner.tsx` (FR-024) — show a spinner/disabled state on the "Use My Location" button while `navigator.geolocation.getCurrentPosition` is pending; catch `GeolocationPositionError` and map `code` 1/2/3 to `t('hiking.locationDenied')` / `t('hiking.locationUnavailable')` / `t('hiking.locationTimeout')`; add those three keys to all three locale files
- [x] T026 [P] Add display-name fallback in `packages/hiking-map/src/components/SavedRoutes.tsx` community route card (FR-025) — render `route.sharedBy.displayName || route.sharedBy.uid.slice(0, 8) + '...'` instead of raw `route.sharedBy.uid`
- [x] T027 [P] Implement optimistic delete in `packages/hiking-map/src/services/routeStorageService.ts` and `SavedRoutes.tsx` (FR-026) — remove the route from the local `myRoutes` state immediately on delete button click; if the async Firestore/IndexedDB delete rejects, restore the route in state and show an error toast; add i18n key `hiking.deleteError` to all three locale files
- [x] T028 Run `pnpm build:shared` then `pnpm lint && pnpm test:run && pnpm typecheck` and fix any failures; run `cd functions && npx tsc --noEmit` and fix any failures
- [x] T029 Run the `validate_all` MCP tool; fix any i18n key mismatches, Dockerfile gaps, or widget registry issues reported

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — blocks all user story phases
- **Phase 3 (US1)**: Depends on Phase 2 — GPX import is the MVP
- **Phase 4 (US2)**: Depends on T005–T006 in Phase 3 (needs `gpxService.ts` to exist for `exportGpx`)
- **Phase 5 (US3)**: Depends on Phase 2 only — independent of US1/US2
- **Phase 6 (US4)**: Depends on T005–T006 (needs elevation data from `gpxTrackToSavedRoute`)
- **Phase 7 (US5)**: Depends on Phase 2 only — pure UI filter over existing routes
- **Phase 8 (Polish)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (GPX Import)**: Phase 2 complete — no other story dependency
- **US2 (GPX Export)**: T005 + T006 (gpxService.ts) from US1 must exist; otherwise independent
- **US3 (Multi-Waypoint)**: Phase 2 complete — fully independent of US1/US2
- **US4 (Elevation)**: T005 + T006 from US1 must exist; ElevationProfile component is otherwise independent
- **US5 (Search/Filter)**: Phase 2 complete — fully independent

### Parallel Opportunities

- T003 and T004 (foundational) can run in parallel — different files
- T005 and T014 can run in parallel after Phase 2 — frontend service vs. backend schema, different files
- T012 and T013 (export button + i18n) can run in parallel
- T018 and T019 (waypoints persistence + i18n) can run in parallel
- T025, T026, T027 (logic fixes) can all run in parallel — different components

---

## Parallel Example: User Story 1

```bash
# After T003+T004 complete, these two tasks can run in parallel:
Task T005: "Implement parseGpx in gpxService.ts"
Task T014: "Add calcRouteMulti to functions/src/schema.ts"  ← US3 can start in parallel

# Within US1, T005 must complete before T006:
Task T005 → Task T006: "Implement gpxTrackToSavedRoute"

# T007, T008, T009 can start as soon as T006 is done:
Task T007: "Create GpxImportButton.tsx"
Task T008: "Add import i18n keys"  ← parallel with T007
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T002)
2. Complete Phase 2: Foundational (T003–T004)
3. Complete Phase 3: US1 GPX Import (T005–T010)
4. **STOP and VALIDATE**: Import a real `.gpx` file end-to-end
5. Ship — users can import and save trail files immediately

### Incremental Delivery

1. Setup + Foundational → ready
2. US1 (GPX Import) → validate → **deploy MVP**
3. US2 (GPX Export) → validate → deploy
4. US3 (Multi-Waypoint) → validate → deploy
5. US4 (Elevation) → validate → deploy
6. US5 (Search/Filter) → validate → deploy
7. Polish + logic fixes → final deploy

### Parallel Team Strategy (if needed)

After Phase 2:
- **Developer A**: US1 (T005–T010) → US2 (T011–T013) → US4 (T020–T022)
- **Developer B**: US3 (T014–T019) → US5 (T023–T024) → Phase 8 (T025–T027)

---

## Notes

- [P] tasks = different files, no incomplete-task dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable after its checkpoint
- Commit after each completed checkpoint or logical group
- `pnpm build:shared` required after any change to `packages/shared/`
- `pnpm codegen` required after any change to `functions/src/schema.ts` or `packages/shared/src/apollo/queries.ts`
- `cd functions && npx tsc --noEmit` required before pushing backend changes
