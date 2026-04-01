# Research: Radio Station Enhancements (022)

## Decision 1: Genre Filter Data Source

**Decision**: Add a new `radioTags` GraphQL query that calls the Radio Browser API's `/json/tags` endpoint (returns top genres ordered by station count). Genre options come from the API, not from the current result set.

**Rationale**: Deriving genres from the current result set creates a chicken-and-egg problem — the available options change depending on what's already shown, making the UI unpredictable. The Radio Browser API provides a stable `/json/tags?order=stationcount&reverse=true&hidebroken=true&limit=50` endpoint that returns the 50 most popular genre tags with their station counts. This is the authoritative, stable list.

**Alternatives Considered**:
- *Hardcoded list*: Simple but goes stale and misses niche genres that may be popular in the user's language/region. Rejected for poor long-term quality.
- *Derive from current result set*: Cheap but causes filter options to shift unexpectedly when search text changes. Rejected for confusing UX.

---

## Decision 2: Country Filter Data Source

**Decision**: Derive unique country values from the stations already returned by the current `radioStations` query. No new API endpoint needed.

**Rationale**: The Radio Browser API does have a `/json/countries` endpoint, but it returns 200+ countries, most with very few stations. The country options shown in the filter should reflect what is actually present in the result set the user is looking at. This also avoids a third parallel query on initial load. Simplicity wins here (Constitution VI).

**Alternatives Considered**:
- *Dedicated `radioCountries` query*: More comprehensive but adds a third cold-start query and shows countries with no useful stations. Rejected.

---

## Decision 3: Genre and Country Filtering — Client vs. Server Side

**Decision**: Pass `tag` and `country` as query arguments to the existing `radioStations` GraphQL query. The Cloud Function forwards them to the Radio Browser API's `tag` and `country` parameters, letting the API do the filtering. Country is derived client-side from the returned stations.

**Rationale**: The Radio Browser API natively supports `tag` (genre) and `country` filtering in `/stations/search`. Server-side filtering returns a clean, properly sized result set (up to 50 stations matching both constraints). Client-side filtering of a large set would require fetching many more stations up-front.

**Note on cache key**: The resolver's cache key must include `tag` and `country` parameters to avoid stale cross-filter hits.

---

## Decision 4: Vote Mechanism

**Decision**: New `voteRadioStation(uuid: String!)` GraphQL mutation in the Cloud Function that calls `POST /json/vote/{uuid}` on the Radio Browser API. Vote deduplication in the current session tracked via localStorage (set of voted UUIDs), since Radio Browser API uses IP-level deduplication server-side.

**Rationale**: Radio Browser API's vote endpoint is a simple fire-and-forget `POST` with no auth required. The Cloud Function acts as the intermediary (acceptable per Constitution III — third-party API that does not offer GraphQL). Session-level deduplication in localStorage prevents accidental double-taps within a session.

**Alternatives Considered**:
- *Direct browser call to Radio Browser API*: Would bypass the GraphQL-first rule and expose the API URL directly to clients. Rejected (Constitution III violation).
- *Firestore-backed vote tracking*: Unnecessary overhead for a community API vote. Rejected (Constitution VI — no complexity beyond what is needed).

---

## Decision 5: Recently Played Storage Format

**Decision**: Store recently played as a JSON array in `localStorage` under a new `StorageKeys.RADIO_RECENT` key. Each entry stores a minimal snapshot of the station (uuid, name, favicon, country, url, url_resolved) plus a `playedAt` timestamp. Cap at 20 entries, deduplicated by uuid (latest play wins).

**Rationale**: Storing a snapshot (not just the UUID) avoids a GraphQL round-trip on every Recent tab render. The snapshot includes enough data to display and play the station immediately. The full station object from the Radio Browser API can be stale; storing the snapshot at play time gives the user exactly what they heard. `url` and `url_resolved` are included so the station can be played directly from the snapshot.

**Alternatives Considered**:
- *Store UUIDs only + fetch via `radioStationsByUuids`*: Adds GraphQL latency on every Recent tab open and fails gracefully only if we handle missing stations. Rejected for added complexity.
- *Firestore persistence*: Requires auth and backend work for a personal playback history list. Out of scope per spec assumptions.

---

## Decision 6: Sleep Timer Implementation

**Decision**: Implement as a dedicated `useSleepTimer` hook using `setInterval` (1-second tick) with React state. On expiry, calls the `stop()` function from `useRadioPlayer` via a passed callback. Timer is cleared when `isPlaying` becomes false (manual stop) via a `useEffect`.

**Rationale**: A simple countdown using `setInterval` is the minimum viable implementation. Encapsulating it in its own hook keeps `useRadioPlayer` focused and makes the timer independently testable.

**Alternatives Considered**:
- *`setTimeout` chaining*: Works but harder to display countdown. `setInterval` with a seconds counter is simpler.
- *Web Workers timer*: Survives page visibility changes more reliably on some mobile browsers. Adds significant complexity for a non-critical feature. Rejected (Constitution VI).

---

## Decision 7: Station Detail — Modal vs. Slide-Over Panel

**Decision**: Use an inline slide-over panel (off-canvas drawer) that slides in from the right on desktop and from the bottom on mobile, rendered within the RadioStation component tree. No router change needed.

**Rationale**: A modal breaks the spatial context of the list. A panel keeps the station list partially visible, reinforcing where the user came from. The existing MFE uses fixed player bar at the bottom — the panel sits above it. This is implementable with Tailwind CSS transitions without adding a modal library.

**Alternatives Considered**:
- *React Router modal route (`?detail=uuid`)*: Makes detail link-able but adds routing complexity to an MFE that has no internal routing today. Rejected.
- *Expand card in-place*: Disrupts list layout and makes scrolling confusing. Rejected.
