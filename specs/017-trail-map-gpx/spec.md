# Feature Specification: Trail Map GPX & Route Enhancements

**Feature Branch**: `017-trail-map-gpx`
**Created**: 2026-03-27
**Status**: Draft
**Input**: Interactive trail map with route planning, saved routes, and GPX support — check existing MFE and add new features and improve existing logics if needed

## Background

The hiking-map MFE already ships with interactive map rendering (MapLibre GL), basic route planning (start/end coordinates, OSRM/Valhalla routing), saved routes (personal and community-shared via Firestore + IndexedDB), and offline tile caching. This spec covers GPX file support (import and export) plus focused logic improvements to existing features identified during the audit.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — GPX Import: Load an Existing Trail File (Priority: P1)

A hiker has a `.gpx` file downloaded from a trail-sharing site (Wikiloc, AllTrails, Garmin Connect). They want to open it in MyCircle to visualise the trail on the map and optionally save it to their route library.

**Why this priority**: GPX import is the single most-requested missing capability and closes the gap with dedicated hiking apps. It works independently of all other stories and delivers immediate value without authentication.

**Independent Test**: Upload a GPX file containing a single `<trk>` segment, verify the track renders on the map as a coloured polyline, and verify the route can be saved.

**Acceptance Scenarios**:

1. **Given** the user opens the hiking map, **When** they tap "Import GPX" and select a valid `.gpx` file, **Then** the track(s) render on the map, the viewport flies to fit the track bounds, and distance is shown in the user's preferred unit.
2. **Given** the user has imported a GPX track, **When** they tap "Save Route", **Then** the track is saved to their personal route library with an auto-generated name derived from the GPX file name (editable before saving).
3. **Given** the user uploads a GPX file containing multiple tracks or route segments, **When** the import completes, **Then** each segment is listed and the user can choose which one to display and save.
4. **Given** the user uploads a file that is not a valid GPX document, **When** the import is attempted, **Then** a clear error message is shown and no broken state remains on the map.
5. **Given** the user is not authenticated, **When** they import a GPX track, **Then** the track renders on the map; the save option persists to IndexedDB (the same offline fallback used for planned routes).

---

### User Story 2 — GPX Export: Download a Saved Route as GPX (Priority: P2)

A hiker planned a route in MyCircle and wants to transfer it to a GPS device or share it with a friend who uses a third-party app.

**Why this priority**: Export completes the GPX round-trip and makes MyCircle routes portable. Depends on saved routes existing (P1 or planned routes), but the export action itself is self-contained.

**Independent Test**: Save any route (planned or imported), use the export action, and verify a well-formed `.gpx` file is downloaded containing the correct waypoints.

**Acceptance Scenarios**:

1. **Given** a route exists in the user's saved routes list, **When** they select "Export GPX", **Then** a `.gpx` file is downloaded named after the route.
2. **Given** the exported GPX file, **When** opened in a third-party app (e.g., Garmin BaseCamp), **Then** the track geometry matches what was shown in MyCircle.
3. **Given** a route with a start/end label set, **When** exported, **Then** those labels appear as `<wpt>` (waypoint) entries in the GPX file.

---

### User Story 3 — Multi-Waypoint Route Planning (Priority: P3)

A hiker wants to plan a route through multiple stops — not just start to end — for example, a loop hike with a scenic detour.

**Why this priority**: Extends existing route planning beyond start→end. Core use case for trail planning but builds on the P1/P2 foundation.

**Independent Test**: Add three waypoints via the planner, request a route, verify the map shows a path through all three in order, and verify the total distance accounts for all segments.

**Acceptance Scenarios**:

1. **Given** the route planner is open, **When** the user taps "Add Waypoint", **Then** a new intermediate waypoint input field appears between start and end.
2. **Given** multiple waypoints are entered, **When** the user plans the route, **Then** the map renders a continuous path through all waypoints in the specified order.
3. **Given** a multi-waypoint route is planned, **When** the user saves it, **Then** all waypoints are preserved and reload correctly when the route is loaded.
4. **Given** multiple waypoints, **When** the user drags a waypoint input to reorder, **Then** the route recalculates with the new order.

---

### User Story 4 — Elevation Profile (Priority: P4)

After planning or loading a trail, the user wants to see the elevation gain/loss chart to assess difficulty before hiking.

**Why this priority**: Highly useful for trail assessment but requires elevation data that may not always be available; lower priority than core GPX round-trip.

**Independent Test**: Load a GPX file that includes elevation data (`<ele>` tags), tap "Elevation Profile", and verify a chart shows distance on the X-axis and elevation on the Y-axis with total gain displayed.

**Acceptance Scenarios**:

1. **Given** a route with elevation data (from GPX `<ele>` tags), **When** the user opens the elevation profile panel, **Then** a chart shows elevation vs. distance with min, max, and total gain/loss summary.
2. **Given** a route that has no elevation data, **When** the elevation profile is requested, **Then** a message states "Elevation data not available for this route" rather than crashing.

---

### User Story 5 — Route Search and Filtering (Priority: P5)

A user with many saved routes wants to quickly find the right one without scrolling through the full list.

**Why this priority**: Quality-of-life improvement that becomes important once users accumulate routes (from import or planning).

**Independent Test**: Save at least three routes with distinct names, use the search box to type a partial name, and verify only matching routes are shown.

**Acceptance Scenarios**:

1. **Given** the saved routes list is open, **When** the user types in the search/filter field, **Then** the list narrows to routes whose name contains the search string (case-insensitive).
2. **Given** the saved routes list, **When** the user applies a distance filter (e.g., "Under 10 km"), **Then** only routes within that range are shown.
3. **Given** no routes match the current filter, **When** the filter is applied, **Then** an empty state message is shown with a suggestion to clear the filter.

---

### Edge Cases

- What happens when a GPX file contains zero tracks and zero route elements? → Show an error: "No tracks found in this file."
- What happens when a GPX file is larger than 10 MB? → Show a size warning and prevent import with guidance to use a smaller file.
- What happens when the user imports a GPX file while a planned route is already displayed? → Prompt to replace or add as a new route.
- What happens when offline tile cache is full and a GPX track extends beyond cached area? → Tiles outside cache render as blank but the track line still shows; a banner reminds the user to download tiles for the new area.
- What happens when elevation data is partially missing (some points have `<ele>`, others don't)? → Interpolate missing values or skip elevation chart for segments without data, with a notice to the user.
- What happens when a multi-waypoint route calculation fails for one segment? → Show which segment failed and allow the user to remove that waypoint and retry.

## Requirements *(mandatory)*

### Functional Requirements

**GPX Import**

- **FR-001**: Users MUST be able to upload a `.gpx` file from their device via a file picker button in the hiking map UI.
- **FR-002**: The system MUST parse GPX `<trk>`, `<trkseg>`, `<trkpt>`, `<rte>`, and `<rtept>` elements and convert them to a renderable polyline.
- **FR-003**: The system MUST extract elevation data from `<ele>` tags when present and associate it with each point.
- **FR-004**: The system MUST fly the map viewport to fit the bounding box of the imported track after parsing.
- **FR-005**: The system MUST display the imported track's total distance in the user's preferred unit immediately after import.
- **FR-006**: Users MUST be able to save an imported GPX track to their route library (personal, with IndexedDB fallback when unauthenticated).
- **FR-007**: The system MUST show a meaningful error message for malformed, oversized (> 10 MB), or non-GPX files.
- **FR-008**: When a GPX file contains multiple tracks, the system MUST list all tracks and allow the user to select one to import.

**GPX Export**

- **FR-009**: Each saved route MUST have an "Export GPX" action accessible from the saved routes list.
- **FR-010**: The exported `.gpx` file MUST conform to the GPX 1.1 standard and include `<trk>`, `<trkseg>`, `<trkpt>` elements with `lat`/`lon` attributes.
- **FR-011**: If the route has elevation data, the exported file MUST include `<ele>` tags for each point.
- **FR-012**: If the route has start/end labels, the exported file MUST include corresponding `<wpt>` elements.
- **FR-013**: The exported file MUST be named after the route (sanitised for filesystem safety).

**Multi-Waypoint Route Planning**

- **FR-014**: The route planner MUST allow users to add intermediate waypoints between start and end (minimum 1 additional waypoint).
- **FR-015**: Waypoints MUST be reorderable via drag-and-drop within the planner.
- **FR-016**: The system MUST recalculate the full route whenever a waypoint is added, removed, or reordered.
- **FR-017**: Multi-waypoint routes MUST be saveable and restoreable with all waypoints intact.

**Elevation Profile**

- **FR-018**: When a route with elevation data is active on the map, a toggle MUST be available to show/hide an elevation profile panel.
- **FR-019**: The elevation profile MUST show a chart with distance on the X-axis and elevation on the Y-axis, along with total gain and total loss labels.
- **FR-020**: If no elevation data exists for the active route, the elevation toggle MUST be hidden or disabled with a tooltip explaining why.

**Route Filtering**

- **FR-021**: The saved routes panel MUST include a text search field that filters routes by name in real time.
- **FR-022**: The saved routes panel MUST include a distance filter with presets (Any, < 5 km, 5–15 km, > 15 km) using the user's preferred unit.

**Logic Improvements to Existing Features**

- **FR-023**: Route save confirmation MUST allow the user to edit the route name before saving (the current flow auto-saves with a generated name and requires a separate rename action).
- **FR-024**: The "Use My Location" button in the planner MUST show a loading state while geolocation is pending and surface a human-readable error if permission is denied.
- **FR-025**: Community routes MUST display the sharer's display name (not raw UID) alongside the route in the community list.
- **FR-026**: Deleted routes MUST be removed immediately from the UI via optimistic update before the async delete completes.

### Key Entities

- **SavedRoute** (extended): Existing entity gains optional `elevationProfile` (array of distance/elevation pairs), `waypoints` (ordered array of coordinate + optional label for multi-point routes), and `sourceFormat` (`"planned"` or `"gpx-import"`) fields.
- **GpxTrack**: Parsed intermediate representation of a GPX track — name, array of coordinate points with optional elevation, computed bounding box, computed distance.
- **WaypointInput**: Ordered list of coordinate entries with optional labels representing the stops in a multi-waypoint route plan.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can import a GPX file and see the track rendered on the map in under 3 seconds for files up to 5 MB.
- **SC-002**: Users can export a saved route as a GPX file in under 2 seconds.
- **SC-003**: Multi-waypoint route planning supports at least 5 intermediate waypoints without degraded UI responsiveness.
- **SC-004**: 100% of exported GPX files are parseable by standard GPX 1.1 schema validators.
- **SC-005**: Route name search returns filtered results with no visible delay after each keystroke.
- **SC-006**: The elevation profile chart renders correctly for all GPX files containing valid elevation tags in the test suite.
- **SC-007**: Existing saved routes, route planning, and community sharing features continue to function without regression after the enhancements are deployed.

## Assumptions

- The existing OSRM/Valhalla routing integration does not return elevation data; elevation is sourced exclusively from GPX `<ele>` tags when importing files. Planned routes (not from GPX) will not show an elevation profile unless the routing provider is later extended.
- GPX parsing is handled in the browser (client-side) to avoid sending user location data to any server unnecessarily.
- The multi-waypoint routing uses the same underlying routing provider; the MFE will chain sequential route calls and stitch segments if the backend does not natively support multi-waypoint routing.
- Display names for community route sharers will be fetched from the existing user profile data accessible via the shell's Firebase bridge.
- File size limit for GPX import is 10 MB to cover the vast majority of real-world trail files while preventing browser memory issues.
