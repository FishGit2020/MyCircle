# Tasks: Favorite Cities Cross-MFE Integration

**Input**: Design documents from `/specs/001-favorite-cities/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (No setup needed)

This feature enhances existing packages with no new project scaffolding. Proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shell-level prop injection and Firestore cap guard. ALL user stories depend on this phase.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Add 10-city cap guard to `toggleFavoriteCity` in `packages/shell/src/lib/firebase.ts` — if adding would push `favoriteCities.length > 10`, skip the write and return `false`; document the cap in a comment
- [X] T002 Update `useCityManager.toggleFavorite` in `packages/shell/src/hooks/useCityManager.ts` — when `toggleFavoriteCity` returns `false` on a cap condition (array already at 10), surface an error state or throw so the caller can show a toast (add a `capReached` boolean or similar signal to the return)
- [X] T003 [P] Extend `CitySearch` remote type in `packages/shell/src/remotes.d.ts` — change `React.ComponentType` to `React.ComponentType<{ favoriteCities?: import('./lib/firebase').FavoriteCity[]; onToggleFavorite?: (city: import('./lib/firebase').FavoriteCity) => Promise<boolean>; onCitySelect?: (city: unknown) => void; recentCities?: unknown[]; onRemoveCity?: (cityId: string) => void; onClearRecents?: () => void }>` so shell can pass props with type safety
- [X] T004 Update `packages/shell/src/components/widgets/CitySearchWrapper.tsx` — import `useAuth`, destructure `favoriteCities` and `toggleFavorite`, pass them as `favoriteCities={favoriteCities}` and `onToggleFavorite={toggleFavorite}` to `<CitySearchMF />`

**Checkpoint**: Shell now passes favorite city data into the CitySearch MFE. User story phases can begin.

---

## Phase 3: User Story 1 — Save a City as Favorite (Priority: P1) 🎯 MVP

**Goal**: Authenticated users can star/unstar any city in search results; the toggle persists to Firestore.

**Independent Test**: Sign in → open `/search` → type a city name → click the ☆ star on a result → icon becomes ★ → refresh page → re-open search → city appears in favorites.

- [X] T005 [US1] Add `FavoriteCity` type import and new optional props `favoriteCities?: FavoriteCity[]` and `onToggleFavorite?: (city: FavoriteCity) => Promise<boolean>` to the `CitySearch` component in `packages/city-search/src/components/CitySearch.tsx` — add a `isFavorite(city)` helper that checks `favoriteCities` by `id`
- [X] T006 [US1] Add a `StarButton` sub-component inside `packages/city-search/src/components/CitySearch.tsx` — `<button type="button" aria-label={isFav ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')} className="min-w-[44px] min-h-[44px] ...">` rendered only when `onToggleFavorite` is defined; stops event propagation on click so it doesn't trigger city selection
- [X] T007 [P] [US1] Attach `StarButton` to each API result row in the `showSearchResults` dropdown in `packages/city-search/src/components/CitySearch.tsx` — place between city name block and `<WeatherPreview>`; star is filled (★) if `isFavorite(city)` is true
- [X] T008 [P] [US1] Attach `StarButton` to each row in the `showFuzzySuggestions` dropdown in `packages/city-search/src/components/CitySearch.tsx` — same placement and behavior as T007

**Checkpoint**: Star button appears on search results for signed-in users; toggle writes to Firestore.

---

## Phase 4: User Story 2 — View Favorites in Search Dropdown (Priority: P1)

**Goal**: Favorites appear as a named section at the top of the empty-query dropdown; matching favorites surface when typing.

**Independent Test**: After starring a city (US1), re-open search with no query → see "Favorites" section above "Recent Searches" → click the favorite → navigate to weather page.

- [X] T009 [US2] Add a "Favorites" section to the initial (empty-query) dropdown in `packages/city-search/src/components/CitySearch.tsx` — render when `inputFocused && query.length < 2 && favoriteCities && favoriteCities.length > 0`; shows up to 5 cities; placed above the existing "Recent Searches" / "Popular Cities" block; each row is a button with the city name and a filled ★ `StarButton` (no WeatherPreview in this section to keep it fast)
- [X] T010 [US2] Add matching-favorites inline highlighting to the typed-query dropdown in `packages/city-search/src/components/CitySearch.tsx` — when `query.length >= 2`, cities already in `favoriteCities` that match the query appear at the top of `matchingRecents`-style deduplication with a `FavoriteBadge` (★ filled icon, similar to existing `RecentBadge`); deduplicate against API results
- [X] T011 [P] [US2] Add `search.favoritesSection` key (value: `"Favorites"`) to `packages/shared/src/locales/en/translation.json`, `packages/shared/src/locales/es/translation.json` (Unicode escapes), and `packages/shared/src/locales/zh/translation.json`

**Checkpoint**: Favorites section visible in dropdown; typing a saved city name shows it with ★ above regular results.

---

## Phase 5: User Story 3 — Transit City Quick-Select (Priority: P2)

**Goal**: Authenticated users with favorites see a city chip row in Transit Tracker that replaces geolocation with a city's coordinates.

**Independent Test**: Star a city → open `/transit` → see the city as a chip above the stop search → tap the chip → nearby stops load for that city's coordinates without triggering browser geolocation.

- [X] T012 [US3] Check `packages/shell/src/App.tsx` for the TransitTracker lazy import; if there is no wrapper component, create `packages/shell/src/components/widgets/TransitWrapper.tsx` (mirror `CitySearchWrapper` pattern) that imports `useAuth` and passes `favoriteCities` to the MFE; update `App.tsx` to use the wrapper; also update `packages/shell/src/remotes.d.ts` to declare `TransitTracker` props including `favoriteCities?: Array<{ id: string; name: string; lat: number; lon: number }>`
- [X] T013 [US3] Add optional `favoriteCities` prop to the `TransitTracker` component in `packages/transit-tracker/src/components/TransitTracker.tsx`
- [X] T014 [US3] Render a horizontal-scrollable city chip row in `packages/transit-tracker/src/components/TransitTracker.tsx` — shown when `favoriteCities` is non-empty; placed above the `<StopSearch />` component; each chip is a `<button type="button">` with the city name; tapping a chip calls `findNearby({ lat: chip.lat, lon: chip.lon })` and sets a `selectedCityChip` local state for highlight; deselect chip when user triggers manual geolocation
- [X] T015 [P] [US3] Add `transit.favoriteCities` key (value: `"Favorite Cities"`) to all 3 locale files in `packages/shared/src/locales/`

**Checkpoint**: Transit tracker shows favorite city chips; tapping a chip triggers nearby stop search for that city.

---

## Phase 6: User Story 4 — Manage Favorites Panel (Priority: P3)

**Goal**: Users can view all saved favorites and remove individual ones from a single screen without re-searching.

**Independent Test**: Open `/search` with ≥1 favorite → see "Manage" link in the Favorites section → click it → see a panel listing all favorites with trash icons → tap trash → city disappears from the list.

- [X] T016 [US4] Add a "Manage" `<button type="button">` in the Favorites section header in `packages/city-search/src/components/CitySearch.tsx` — clicking sets `showFavoritesManager` state to `true`; button renders only when `favoriteCities.length > 0 && onToggleFavorite`
- [X] T017 [US4] Create `packages/city-search/src/components/FavoritesManager.tsx` — a full-overlay panel (or modal) listing all `favoriteCities`; each row shows city name, country/state, and a trash `<button type="button" aria-label={t('favorites.removeFromFavorites')}`; clicking trash calls `onToggleFavorite(city)` and closes on last removal; has a close/back button; dark mode variants on all color classes
- [X] T018 [P] [US4] Mount `<FavoritesManager>` conditionally in `packages/city-search/src/components/CitySearch.tsx` when `showFavoritesManager` is true; pass `favoriteCities`, `onToggleFavorite`, `onClose={() => setShowFavoritesManager(false)}`
- [X] T019 [P] [US4] Add `favorites.manageFavorites` key (value: `"Manage favorites"`) and `favorites.noFavorites` key (value: `"No favorites yet"`) to all 3 locale files in `packages/shared/src/locales/`

**Checkpoint**: All 4 user stories functional; favorites can be created, browsed, and deleted.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T020 [P] Update `packages/shell/src/components/widgets/CitySearchWrapper.test.tsx` — add a test that `favoriteCities` and `onToggleFavorite` from mocked `useAuth()` are passed through as props to the `CitySearchMF` component
- [X] T021 [P] Update `packages/city-search/src/components/CitySearch.test.tsx` — add: (a) favorites section renders when `favoriteCities` is non-empty and `inputFocused`; (b) star button present on result rows when `onToggleFavorite` prop given; (c) star button absent when `onToggleFavorite` not given; (d) calling star button calls `onToggleFavorite` without triggering city navigation
- [X] T022 [P] Add cap test to `packages/shell/src/hooks/useCityManager.test.ts` — mock `toggleFavoriteCity` to simulate 10 existing favorites, call `toggleFavorite` for an 11th city, assert the cap is not exceeded
- [X] T023 Run `pnpm build:shared && pnpm --filter @mycircle/shell test:run && pnpm --filter @mycircle/city-search test:run && pnpm --filter @mycircle/transit-tracker test:run && pnpm typecheck` and fix any failures

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately; **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 (CitySearchWrapper must pass props first)
- **US2 (Phase 4)**: Depends on Phase 3 (reuses `isFavorite` helper and `favoriteCities` prop)
- **US3 (Phase 5)**: Depends on Phase 2 only — independent of US1/US2
- **US4 (Phase 6)**: Depends on Phase 3 (reuses `onToggleFavorite` prop and `FavoriteCity` type)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### Parallel Opportunities

- T003 and T004 in Foundational can run in parallel (different files)
- Once Phase 2 is done: US1 (Phase 3) and US3 (Phase 5) can run in parallel
- Within each phase, tasks marked [P] can run concurrently
- T011, T015, T019 (i18n additions) can all run in parallel across phases

---

## Parallel Example: Foundational → US1 + US3

```bash
# After Phase 2 completes, launch in parallel:
Task A: "Phase 3 — US1: Star button in CitySearch"   (packages/city-search)
Task B: "Phase 5 — US3: City chips in TransitTracker" (packages/transit-tracker)
```

---

## Implementation Strategy

### MVP (User Stories 1 + 2 only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 (star button)
3. Complete Phase 4: US2 (favorites dropdown section)
4. **STOP and validate**: star a city, reload, see it in the dropdown
5. Ship — Transit (US3) and Management (US4) can follow

### Incremental Delivery

1. Phase 2 → Foundation ready
2. Phase 3 → US1: star button on results ✓
3. Phase 4 → US2: favorites section in dropdown ✓ (MVP!)
4. Phase 5 → US3: transit city chips ✓
5. Phase 6 → US4: management panel ✓
6. Phase 7 → tests and typecheck green ✓
