# Feature Specification: Radio Station Enhancements

**Feature Branch**: `022-radio-enhancements`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Browse and stream internet radio stations, manage favorites, check current feature and add new ones from MFE"

## Overview

The existing Radio Station feature lets users browse top-voted internet radio stations, search by name, save favorites, and stream via the global audio player. It is functional but limited in discoverability: there is no way to filter by genre or country, no history of recently played stations, and no detail view for a station. This spec defines enhancements that meaningfully raise the usefulness of the feature for everyday listeners.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Filter by Genre and Country (Priority: P1)

A user who wants to listen to jazz, classical, or country-specific stations cannot find them easily today — the only option is free-text search. They need filter controls to narrow the station list by genre and country without typing.

**Why this priority**: Discoverability is the primary barrier to regular use. A flat list sorted by votes is overwhelming; genre and country filters are the most impactful single improvement. All other enhancements build on a browsable, filterable list.

**Independent Test**: Open Radio, select "Jazz" from the genre filter — only jazz stations appear. Select "Germany" from the country filter — results narrow to German jazz stations. Clear both — the full list returns. Delivers standalone value with no other enhancements needed.

**Acceptance Scenarios**:

1. **Given** the Browse tab is open, **When** the user selects a genre (e.g., "Jazz"), **Then** only stations tagged with that genre are shown and the active filter is visually indicated.
2. **Given** the Browse tab is open, **When** the user selects a country, **Then** only stations from that country are shown.
3. **Given** both a genre and country filter are active, **When** the list renders, **Then** only stations matching both filters are shown (AND logic).
4. **Given** a filter is active, **When** the user clears it, **Then** the list returns to the unfiltered view.
5. **Given** no stations match the active filters, **When** the list renders, **Then** a descriptive empty state message is displayed — not a blank screen.
6. **Given** a text search is also active, **When** filters are applied, **Then** all three constraints (text, genre, country) apply together.

---

### User Story 2 - Recently Played History (Priority: P2)

A user who listened to a station last session wants to quickly return to it without searching or scrolling through Browse. Today there is no history tab or recently played list.

**Why this priority**: Returning to a previously enjoyed station is the most common returning-user action in any media app. A short history list makes the feature feel personalized and saves meaningful time.

**Independent Test**: Play three different stations. Navigate away and come back to Radio. A "Recent" tab shows those three stations in reverse chronological order, each playable in one tap. Delivers standalone value independently of any other enhancement.

**Acceptance Scenarios**:

1. **Given** the user plays a station, **When** they return to Radio, **Then** a "Recent" tab is visible and the played station appears at the top.
2. **Given** the user plays multiple stations, **When** they view the Recent tab, **Then** stations are ordered most-recently-played first, deduplicated (same station appears once at its latest position).
3. **Given** the Recent tab is open, **When** the user taps a station, **Then** it starts playing immediately without navigating away from the tab.
4. **Given** more than 20 unique stations have been played, **When** the Recent tab renders, **Then** only the 20 most recent unique stations are shown.
5. **Given** the Recent list is empty, **When** the Recent tab renders, **Then** a friendly prompt encourages the user to start exploring stations.

---

### User Story 3 - Station Detail View (Priority: P3)

A user curious about a station — its homepage, language, audio quality, or full tag list — has no way to see more than the name, country, and a few truncated tags shown on the card.

**Why this priority**: A detail view improves trust and helps users decide whether to favorite a station. Particularly useful for lesser-known stations where name alone is insufficient.

**Independent Test**: Tap the station name on any card — a detail panel opens showing full metadata: homepage link (if available), language, codec, bitrate, vote count, and all tags. Close it — back to the list. No other feature needed for this to be valuable.

**Acceptance Scenarios**:

1. **Given** a station card is visible, **When** the user taps the station name or info button, **Then** a detail panel opens showing: full name, country, language, codec, bitrate, vote count, all tags, and a clickable homepage URL if the station provides one.
2. **Given** the detail panel is open, **When** the user taps Play, **Then** the station starts playing without closing the panel.
3. **Given** the detail panel is open, **When** the user taps the favorite button, **Then** the station is toggled in/out of favorites without closing the panel.
4. **Given** a station has no homepage URL, **When** the detail panel renders, **Then** the homepage section is hidden — no broken link or placeholder shown.
5. **Given** the detail panel is open, **When** the user dismisses it, **Then** they return to exactly where they were in the station list.

---

### User Story 4 - Sleep Timer (Priority: P4)

A user listening to radio before sleeping wants playback to stop automatically after a set duration so they do not have to remember to stop it manually.

**Why this priority**: Sleep timer is a near-universal feature of radio apps. It increases long-session engagement and is specifically valued for bedtime listening. Lower priority than discoverability features but a meaningful quality-of-life addition.

**Independent Test**: Start a station. Open the sleep timer and select 15 minutes. A countdown appears in the player bar. After 15 minutes, playback stops. Delivers standalone value without any other enhancement.

**Acceptance Scenarios**:

1. **Given** a station is playing, **When** the user selects a sleep timer duration (15, 30, 45, or 60 minutes), **Then** a visible countdown appears in the player bar and the timer begins.
2. **Given** an active sleep timer, **When** the countdown reaches zero, **Then** playback stops automatically and the timer is cleared.
3. **Given** an active sleep timer, **When** the user cancels it, **Then** the countdown disappears and playback continues uninterrupted.
4. **Given** no station is playing, **When** the user views the player bar, **Then** the sleep timer control is not visible (only shown during active playback).
5. **Given** an active sleep timer and the user manually stops playback, **When** playback stops, **Then** the sleep timer is also cancelled.

---

### User Story 5 - Vote for a Station (Priority: P5)

A user who enjoys a station wants to upvote it to signal its quality and help it rank higher in the global radio directory.

**Why this priority**: Voting closes the feedback loop for engaged users and contributes to community-curated quality. A nice-to-have that adds depth without blocking any other enhancement.

**Independent Test**: Tap the vote button on any station card or detail panel. The vote count increments and the button changes to a voted state. On refresh, the updated count is reflected from the directory. Delivers standalone value.

**Acceptance Scenarios**:

1. **Given** a station card or detail panel is visible, **When** the user taps the vote button, **Then** the vote count for that station increments by 1 and the button reflects a voted state.
2. **Given** the user has already voted for a station in the current session, **When** they view that station, **Then** the vote button shows a voted state and cannot be tapped again.
3. **Given** an unauthenticated user taps vote, **When** the action is triggered, **Then** a prompt encourages them to sign in before voting.
4. **Given** the user votes on a station, **When** they navigate away and return within the same session, **Then** the voted state is preserved.

---

### Edge Cases

- What happens when a station stream URL is unreachable — does the player show a clear error rather than silently failing?
- What happens when the Radio Browser API is unavailable — is a cached list shown or a user-friendly error with retry option?
- What happens when a station has no tags — does it appear in Browse but simply not match any genre filter, or does an "Uncategorized" option exist?
- What happens when a favorited station is removed from the Radio Browser directory — does it still appear in Favorites or is it gracefully handled?
- What happens when the sleep timer fires while the device screen is locked — does playback still stop?
- What happens when more than 200 countries are available in the country filter — is the dropdown searchable to avoid an overwhelming scroll?
- What happens when the user plays a station with no name or malformed metadata — does the Recent tab handle it gracefully without crashing?

## Requirements *(mandatory)*

### Functional Requirements

**Filter by Genre and Country**
- **FR-001**: The Browse tab MUST include a genre filter that shows available genres derived from the current result set; selecting one filters stations to only those tagged with that genre.
- **FR-002**: The Browse tab MUST include a country filter; selecting a country filters the station list to only stations from that country.
- **FR-003**: Genre, country, and text search filters MUST apply simultaneously using AND logic.
- **FR-004**: Each active filter MUST be visually indicated and individually clearable.
- **FR-005**: When no stations match the active filters, the system MUST display a descriptive empty-state message rather than a blank area.

**Recently Played**
- **FR-006**: The system MUST record each station the user plays, persisted locally across sessions, with the timestamp of last play.
- **FR-007**: A dedicated "Recent" tab MUST display the recently played list ordered most-recently-played first, deduplicated by station ID.
- **FR-008**: The recently played list MUST be capped at 20 entries; entries beyond 20 are automatically dropped in oldest-first order.
- **FR-009**: Stations in the recently played list MUST be playable directly from that list with a single tap.

**Station Detail**
- **FR-010**: Each station card MUST provide an action that opens a detail view showing: full name, country, language, codec, bitrate, vote count, all tags, and homepage URL if available.
- **FR-011**: The detail view MUST include Play and Favorite actions without requiring the user to close it.
- **FR-012**: A homepage URL MUST only be shown when provided by the station; missing URLs MUST NOT render as broken links or empty anchors.

**Sleep Timer**
- **FR-013**: While a station is playing, the player bar MUST offer a sleep timer control with preset durations: 15, 30, 45, and 60 minutes.
- **FR-014**: An active sleep timer MUST display a visible countdown in the player bar.
- **FR-015**: When the timer reaches zero, playback MUST stop automatically without any user action.
- **FR-016**: The user MUST be able to cancel an active sleep timer without stopping playback.
- **FR-017**: If playback is manually stopped while a sleep timer is active, the timer MUST also be cancelled.

**Vote**
- **FR-018**: Each station card and detail view MUST display the current vote count and a vote action.
- **FR-019**: Voting MUST require the user to be authenticated; unauthenticated users MUST be prompted to sign in.
- **FR-020**: A station voted in the current session MUST show a voted state and not allow a second vote in the same session.

### Key Entities

- **Radio Station**: A streamable audio station sourced from the internet radio directory. Has a unique ID, name, stream URL, country, language, codec, bitrate, comma-separated tags, vote count, and optional homepage URL.
- **Favorite**: A locally persisted reference to a station UUID indicating the user has saved that station. One record per unique station per device.
- **Recently Played Entry**: A locally persisted record of a station UUID and the timestamp it was last played. Deduplicated by station ID and capped at 20 entries.
- **Sleep Timer**: A countdown duration set by the user that stops playback on expiry. Ephemeral — not persisted across page reloads.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can find a station matching a specific genre and country in under 30 seconds without typing, using only filter controls.
- **SC-002**: 100% of stations played in prior sessions are accessible from the Recent tab in one navigation step — no search required.
- **SC-003**: Playback stops within 5 seconds of the sleep timer reaching zero, with no user action required.
- **SC-004**: A user can view the complete metadata for any station (language, codec, all tags, homepage) in a single tap from the station list.
- **SC-005**: The station list loads and renders within 3 seconds after a filter is applied, including on a standard mobile connection.
- **SC-006**: Vote counts displayed in the app reflect the radio directory within one full refresh cycle after a vote is cast.

## Assumptions

- The Radio Browser API provides genre/tag and country fields on each station — no new data source is required for filtering.
- Favorites and recently played history are stored locally on the device — no server-side persistence of listening history is in scope.
- The sleep timer is implemented entirely client-side; it does not need to survive app restarts or background kills.
- Genre filter options are derived from the most common tags in the current result set — not a hardcoded master list.
- Country filter options are derived from the countries present in the current result set.
- Voting uses the Radio Browser API's built-in vote mechanism — no custom vote storage is required.
- The existing global audio player handles stream connection errors and network interruptions; this spec does not change that behavior.
- Authentication is already provided by the shell; the vote feature gates on the existing signed-in state.
- The existing Browse and Favorites tabs remain unchanged; the Recent tab is added alongside them.
