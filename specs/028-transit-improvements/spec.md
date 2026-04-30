# Feature Specification: Transit Tracker Improvements

**Feature Branch**: `028-transit-improvements`
**Created**: 2026-04-29
**Status**: Draft
**Input**: User description: "i have a MFE transit-tracker — Real-time public transit arrivals and nearby stop lookup, can you check how we can improve, add new features if there are anything to add. and improve current one"

## Context

The Transit Tracker MFE today lets a user search a stop, see nearby stops, view arrivals for a chosen stop on demand, and favorite stops. The core flow works. The improvements in this feature focus on tightening that existing flow without adding new external integrations or background polling. Specifically:

- The upstream feed is currently called with a placeholder `TEST` API key — the production deployment cannot rely on this.
- Recent stops are stored as bare IDs, so reopening the app shows a list of opaque numbers until each stop is re-fetched. This wastes API calls on data the client already saw.
- Failure paths are silent: a failed refresh, a denied geolocation prompt, or an empty result from a valid stop all surface as a blank or stuck UI.
- After a manual refresh, predictions whose times have already passed by more than a minute can linger on screen with negative ETAs.

This feature delivers those four improvements and nothing more. It explicitly does not add auto-refresh, push notifications, maps, vehicle tracking, trip planning, service-alert surfacing, or multi-region routing.

## Clarifications

### Session 2026-04-29

- Q: Should arrivals auto-refresh in the background, or is the existing manual Refresh button sufficient? → A: Manual refresh is sufficient — do not add auto-polling, ETA tickers, or visibility-aware refresh logic.
- Q: Given the resource-minimization goal, which improvement scope applies? → A: Lean core only — keep US1 (recent-stops cache) plus cross-cutting fixes (production API credentials, predictable failure states, stale-arrival cleanup on refresh). Drop pre-arrival alerts, map view, trip planning, service-alert surfacing, and multi-region routing.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recent stops show names and routes immediately (Priority: P1)

A user reopens the app. Their recent-stops list shows each stop's name, direction, and route badges right away — no shimmer, no "loading…", no extra fetch. They tap one and arrivals start loading.

**Why this priority**: This is the single most visible improvement under the resource-light constraint: it both improves perceived performance and removes the per-recent-stop fetch the app currently issues just to display a list the user already saw.

**Independent Test**: Visit three different stops, close the app, reopen with the network blocked, and confirm all three recent stops display their full name, direction, and route badges from local cache.

**Acceptance Scenarios**:

1. **Given** the user has visited at least one stop, **When** they reopen the app, **Then** the recent stops list shows the name, direction, and route badges without a network call.
2. **Given** a stored stop's metadata has changed server-side, **When** the user opens that stop, **Then** the new metadata replaces the cached copy.
3. **Given** the recent-stops cache contains a stop that no longer exists upstream, **When** the user taps it, **Then** the app surfaces a clear "stop not found" state and offers to remove it from the list.

---

### User Story 2 - Predictable failure states for refresh and location (Priority: P2)

A user taps Refresh while the network is flaky. Instead of a blank screen or a spinner that never resolves, they see the previously-loaded arrivals with a clear inline message ("Couldn't refresh — showing last result from 2 minutes ago") and a Retry button. A user who declines the location permission sees a clear prompt rather than an empty Nearby section.

**Why this priority**: The primary purpose of the MFE is to show real-time arrivals. When a refresh or a permission silently fails, that purpose breaks. Closing those failure gaps is high-leverage and adds zero new API calls.

**Independent Test**: Manually trigger each failure mode (offline refresh, denied location, valid stop with no upcoming arrivals, search with no matches) and confirm the UI conveys the state clearly with an actionable next step.

**Acceptance Scenarios**:

1. **Given** the user is viewing a stop's arrivals, **When** a manual refresh fails because the upstream is unreachable, **Then** the last-known arrivals remain visible and an inline message announces the failure with a Retry control.
2. **Given** the user has not granted location permission, **When** they tap "Find nearby stops," **Then** the UI shows a clear permission prompt explaining what location is used for and how to grant it.
3. **Given** a valid stop has no upcoming arrivals in the feed window, **When** the arrivals load, **Then** the UI shows a clear "No upcoming arrivals at this stop" message rather than a blank list.
4. **Given** the search returns no matches, **When** the user views the search results, **Then** an empty-state message suggests refining the query or finding nearby stops instead.

---

### User Story 3 - Stale predictions are cleared on refresh (Priority: P3)

A user opens an arrivals view, looks away for several minutes, and taps Refresh. Any vehicle whose predicted time has already passed is removed from the list (or labeled "departed") rather than shown with a negative ETA.

**Why this priority**: A small but persistent papercut. Self-contained — adds no API calls, only changes how the existing response is rendered.

**Independent Test**: Display an arrival with a predicted time in the past, tap Refresh, and confirm that arrival is no longer rendered with a negative ETA.

**Acceptance Scenarios**:

1. **Given** the upstream response contains an arrival whose predicted time is more than 60 seconds in the past, **When** the user refreshes, **Then** that arrival is omitted from the displayed list.
2. **Given** an arrival's predicted time is in the recent past (within 60 seconds), **When** the user refreshes, **Then** the arrival is shown labeled as "departed" rather than as a negative-minute ETA.

---

### Edge Cases

- **Offline refresh**: Manual refresh while offline must keep the last-known data on screen and show an offline-aware retry, not a blank state.
- **Geolocation denied or unavailable**: The Nearby flow must show a clear prompt explaining what location is used for and how to enable it; it must not appear broken or empty.
- **Stop deleted upstream**: A favorited or recent stop that no longer exists upstream must produce a "stop not found" state with an option to remove it locally.
- **Empty arrivals**: A valid stop with no current arrivals must render a friendly empty state, not a blank list.
- **Stale predictions**: Arrivals with predicted times more than 60 seconds in the past are removed from the rendered list on refresh; predictions in the recent past are labeled "departed."
- **Privacy on location**: Location is used only to answer the immediate "find nearby stops" request and is not persisted server-side.

## Requirements *(mandatory)*

### Functional Requirements

**Recent stops cache (US1)**

- **FR-001**: Recent stops MUST be cached locally with sufficient metadata (id, name, direction, route badges) to render the recent-stops list without a network round-trip.
- **FR-002**: When the user opens a recent stop, the cached metadata MUST be transparently refreshed from the upstream response and persisted back to the cache.
- **FR-003**: When a recent stop is no longer found upstream, the user MUST be able to remove it from the recent list with a single action.
- **FR-004**: The recent-stops cache MUST cap stored entries (target: 5 most recent) and evict the oldest beyond the cap.

**Predictable failure states (US2)**

- **FR-005**: A failed manual refresh MUST keep previously-loaded arrivals on screen and surface an inline failure message with a Retry control.
- **FR-006**: When location permission is denied or unavailable, the Nearby flow MUST show a clear prompt explaining the use of location and how to grant permission, instead of an empty list.
- **FR-007**: A successful arrivals fetch with zero upcoming arrivals MUST render an explicit empty state, not an empty list.
- **FR-008**: A search with zero matches MUST render an explicit empty state with at least one actionable suggestion (e.g., "find nearby stops").

**Stale predictions on refresh (US3)**

- **FR-009**: After a refresh, arrivals whose predicted time is more than 60 seconds in the past MUST be omitted from the rendered list.
- **FR-010**: Arrivals whose predicted time is in the recent past (within 60 seconds) MUST be rendered with a "departed" label rather than a negative-minute ETA.

**Cross-cutting**

- **FR-011**: All upstream credentials (e.g., the OneBusAway API key) MUST be configured via Firebase secrets / environment, with no hard-coded `TEST` or placeholder values in source.
- **FR-012**: No new background polling, scheduled jobs, or per-tick API calls MUST be introduced. Refreshes are user-initiated only.
- **FR-013**: All user-visible strings introduced MUST exist in every supported locale (en, es, zh).
- **FR-014**: All new UI MUST meet the project's existing accessibility requirements: keyboard reachable, screen-reader labeled, ≥44px touch targets, dark-mode variants for color classes.
- **FR-015**: Location data MUST be used only to answer the immediate "find nearby stops" request and MUST NOT be persisted server-side beyond logs needed for that request.

### Key Entities *(include if feature involves data)*

- **Stop**: A physical boarding location. Identified by a stable stop ID; carries name, direction, and the list of routes that serve it.
- **Recent Stop (cached)**: A locally cached snapshot of a recently visited stop, including enough metadata (id, name, direction, route badges, last-seen timestamp) to render without a network call.
- **Arrival/Departure**: A single predicted or scheduled vehicle event at a stop. Carries route, headsign/destination, predicted vs scheduled time, and a real-time flag. Display rules use the predicted time relative to "now" to decide visible/departed/omitted.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Reopening the app with at least one recent stop renders that stop's name, direction, and route badges within 100ms of the recent-stops list appearing, with zero network requests for that initial render.
- **SC-002**: A failed manual refresh never produces a blank screen or a stuck spinner; the prior arrivals remain visible and a Retry control is available within 1 second of the failure.
- **SC-003**: Each defined failure mode (offline refresh, denied location, empty arrivals, no search matches) presents a distinct, user-facing message with a clear next action — verified by manual or automated UI test.
- **SC-004**: After a refresh, no arrival with a predicted time more than 60 seconds in the past is visible on screen.
- **SC-005**: The MFE makes zero API calls per second when idle (no auto-refresh, no background polling) and issues exactly one upstream call per user-initiated refresh.
- **SC-006**: No source file contains a hard-coded API key or placeholder credential; the production build resolves credentials exclusively from Firebase secrets / environment.
- **SC-007**: All new strings ship in en, es, and zh on day one (no missing-key warnings in production).
- **SC-008**: All new interactive elements pass keyboard navigation and meet the 44px touch-target rule on a manual a11y review.

## Assumptions

- The upstream OneBusAway feed will continue to be the single data source; no second region or alternate provider is added.
- Firebase secrets infrastructure is already in place for credential management (the same channel used by other MFEs).
- The user is expected to tap Refresh to update the arrivals view; this is the intended interaction.
- The existing favorite-stops mechanism stays as-is and is not part of this feature.

## Out of Scope

- Auto-refresh / background polling of arrivals — manual refresh is the intended interaction.
- Pre-arrival alerts and any push-notification integration.
- Map view, vehicle position tracking, and viewport-based stop loading.
- Trip planning (A → B itineraries) and any new external routing integration.
- Service-alert / disruption surfacing.
- Multi-region routing or support for transit feeds outside the current OneBusAway region.
- Fare payment, ticketing, pass management, ride-hail, bike-share, scooter-share, and operator-facing tooling.
- Long-term trip history analytics.
