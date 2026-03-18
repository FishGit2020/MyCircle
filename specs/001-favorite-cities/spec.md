# Feature Specification: Favorite Cities Cross-MFE Integration

**Feature Branch**: `001-favorite-cities`
**Created**: 2026-03-18
**Status**: Draft
**Input**: User description: "Search and save favorite cities used across weather, transit, and other location-aware features"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Save a City as Favorite from City Search (Priority: P1)

An authenticated user searches for a city and wants to star it so they can quickly access it later across any location-aware feature.

**Why this priority**: The core of the feature — no other story is useful without the ability to save favorites. CitySearch is the primary entry point for all city interaction.

**Independent Test**: Sign in, open city search, type a city name, click the star button on a result, re-open search, see the city appear in a "Favorites" section.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens city search, **When** they type a city name and see results, **Then** each result shows a star (☆) icon button.
2. **Given** a result is shown, **When** the user clicks the star icon, **Then** the icon turns filled (★), the city is added to their Firestore `favoriteCities`, and a toast confirms "Added to favorites".
3. **Given** a favorited city is shown, **When** the user clicks the filled star, **Then** the city is removed from favorites and the icon returns to ☆.
4. **Given** an unauthenticated user opens city search, **When** they view search results, **Then** no star buttons are shown.

---

### User Story 2 — View and Access Favorite Cities in the Search Dropdown (Priority: P1)

An authenticated user opens city search and sees their saved favorites at the top of the dropdown so they can quickly navigate to any of them.

**Why this priority**: Equal to P1 — favorites are useless if not surfaced in the search UI. Together with Story 1 this forms the MVP.

**Independent Test**: Save a favorite via Story 1, re-open search (no query typed), see the city in a "Favorites" section above recents.

**Acceptance Scenarios**:

1. **Given** an authenticated user with saved favorites opens city search, **When** the dropdown opens (no query typed), **Then** a "Favorites" section appears above "Recent Searches" showing up to 5 favorites.
2. **Given** favorites are shown, **When** the user clicks a favorite city, **Then** navigation proceeds to `/weather/:lat,:lon?name=...` (same as any city selection).
3. **Given** a user with no favorites opens city search, **Then** the "Favorites" section is not shown.
4. **Given** a query is typed that matches a favorite, **Then** matching favorites appear with a filled star (★) in the dropdown above API results.

---

### User Story 3 — Use Favorite Cities as Quick-Select in Transit Tracker (Priority: P2)

When a user opens transit tracker, their favorite cities appear as quick-picks to narrow down nearby stop searches to a specific city's area.

**Why this priority**: Extends favorites value beyond weather; transit tracker currently has no city context.

**Independent Test**: Save a favorite city, open /transit, see a city selector row showing favorite cities, click one, see nearby stops restricted to that city's coordinates.

**Acceptance Scenarios**:

1. **Given** an authenticated user with favorites opens `/transit`, **When** the page loads, **Then** a city quick-select bar appears showing up to 3 favorite cities as chips.
2. **Given** the user taps a city chip, **When** "Find Nearby" is triggered, **Then** the geolocation call is replaced by the city's `{lat, lon}` coordinates.
3. **Given** no favorites saved (or unauthenticated), **Then** the city chip bar is hidden and transit behaves as before.

---

### User Story 4 — Manage Favorites from a Dedicated Panel (Priority: P3)

A user can view and delete their saved favorite cities from a single management location without having to search for each one.

**Why this priority**: Nice-to-have UX polish; P1/P2 cover the core value.

**Independent Test**: Navigate to /search (or open a favorites panel), see all favorites listed with a delete button, remove one, confirm it's gone.

**Acceptance Scenarios**:

1. **Given** a user opens city search with favorites saved, **When** they click a "Manage" link in the Favorites section, **Then** a full-screen or modal list of all favorites appears.
2. **Given** the favorites list is open, **When** the user taps the trash icon on a city, **Then** it's removed from favorites immediately.

---

### Edge Cases

- What happens when a user is signed out while favorites are displayed? → Favorites section disappears, UI falls back to local recents.
- What if Firestore update fails when toggling a favorite? → Show error toast, revert optimistic UI update.
- What if the user has more than 10 favorites? → Cap enforced at save time (max 10); UI shows at most 5 in dropdown, all in management panel.
- What happens when a non-city-search MFE receives favorites but the user signs out mid-session? → Shell removes favorites from AuthContext; MFEs get empty array and hide city UI.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST show a star toggle button on each city search result for authenticated users.
- **FR-002**: System MUST persist toggled favorite cities to Firestore `users/{uid}.favoriteCities` array.
- **FR-003**: System MUST cap saved favorites at 10 cities per user.
- **FR-004**: System MUST show a "Favorites" section at the top of the city search dropdown (authenticated, ≥1 favorite).
- **FR-005**: System MUST pass `favoriteCities` and `onToggleFavorite` props from shell into the CitySearch MFE.
- **FR-006**: System MUST show up to 5 favorites in the dropdown; show all in the management panel.
- **FR-007**: Transit Tracker MUST accept an optional `favoriteCities` prop and render city quick-select chips when provided.
- **FR-008**: System MUST NOT show star buttons or the favorites section for unauthenticated users.
- **FR-009**: All new visible strings MUST use `t('key')` with keys in all 3 locales.

### Key Entities

- **FavoriteCity**: `{ id: string; name: string; country: string; state?: string; lat: number; lon: number }` — persisted in Firestore `users/{uid}.favoriteCities[]`, max 10 items.
- **RecentCity**: `{ ...FavoriteCity; searchedAt: Date }` — already exists; separate from favorites.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated user can star a city from search results within 2 taps and see it in the favorites section on the next dropdown open.
- **SC-002**: Favorites survive a page reload and cross-session (backed by Firestore).
- **SC-003**: Transit Tracker shows city chips for favorite cities when user is authenticated — zero additional API calls required.
- **SC-004**: All existing city-search tests remain green; new unit tests cover star toggle and favorites section rendering.
