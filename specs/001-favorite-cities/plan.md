# Implementation Plan: Favorite Cities Cross-MFE Integration

**Branch**: `001-favorite-cities` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-favorite-cities/spec.md`

## Summary

Extend the existing `FavoriteCity` infrastructure (already persisted to Firestore via `users/{uid}.favoriteCities[]`) to surface favorites inside the **CitySearch MFE** (star buttons on results + favorites dropdown section) and to provide a **city quick-select in TransitTracker** (chip row from favorites). No new MFE, no GraphQL schema changes, no new Firestore paths — this is a prop-injection and UI enhancement across two MFEs and the shell wrapper layer.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: React, Tailwind CSS, `@mycircle/shared` (eventBus, i18n, StorageKeys), Firebase Firestore SDK (shell-only)
**Storage**: Firestore `users/{uid}.favoriteCities[]` (existing); localStorage for recents (unchanged)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web (Module Federation in Vite)
**Project Type**: Cross-MFE feature enhancement (no new MFE)
**Performance Goals**: Favorites section renders from in-memory AuthContext — zero extra network calls
**Constraints**: Auth-only feature; max 10 favorites enforced; no GraphQL changes; Module Federation prop-passing pattern
**Scale/Scope**: Shell + 2 MFE packages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| I. Federated Isolation | ✅ PASS | CitySearch imports only from `@mycircle/shared`, no direct `@apollo/client`. Props injected by shell. |
| II. Complete Integration | ✅ PASS | No new MFE — no 20-point checklist required. Shell wrappers updated. |
| III. GraphQL-First Data Layer | ✅ PASS | No new REST or GraphQL operations. Favorites use existing Firestore SDK in shell. |
| IV. Inclusive by Default | ✅ PASS | All new strings use `t('key')`. Dark mode variants on all new Tailwind classes. ARIA labels on star buttons. Touch targets ≥ 44px. |
| V. Fast Tests, Safe Code | ✅ PASS | Unit tests mock Firebase; no real network calls. |
| VI. Simplicity | ✅ PASS | Reuses existing types, existing Firestore functions, existing prop pattern. No new abstractions. |

## Project Structure

### Documentation (this feature)

```text
specs/001-favorite-cities/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (affected files)

```text
packages/city-search/src/
└── components/
    └── CitySearch.tsx           # Add favoriteCities prop + star buttons + favorites section

packages/transit-tracker/src/
└── components/
    └── TransitTracker.tsx       # Add favoriteCities prop + city chip quick-select

packages/shell/src/
├── components/widgets/
│   └── CitySearchWrapper.tsx    # Pass favoriteCities + onToggleFavorite from useAuth()
├── App.tsx                      # Transit route: pass favoriteCities prop (if needed)
├── remotes.d.ts                 # Update CitySearch type to include new props
└── lib/
    └── firebase.ts              # Add 10-city cap guard in toggleFavoriteCity

packages/shared/src/locales/
├── en/translation.json          # Add search.favoritesSection, transit.favoriteCities
├── es/translation.json          # Same keys (Unicode escapes)
└── zh/translation.json          # Same keys
```

**Structure Decision**: Enhancement to existing packages only. No new packages, no new Firestore collections, no GraphQL schema changes.

## Implementation Phases

### Phase A: Shell + Firebase Updates

1. **`firebase.ts` — cap guard**: In `toggleFavoriteCity`, if adding a city would exceed 10, return a new `{ added: false, reason: 'cap' }` discriminated result instead of `boolean`. Update `useCityManager.toggleFavorite` to surface cap error.

2. **`CitySearchWrapper.tsx`**: Read `favoriteCities` and `toggleFavorite` from `useAuth()`. Pass them as props to `CitySearchMF`.

3. **`remotes.d.ts`**: Update `CitySearch` type from `React.ComponentType` to `React.ComponentType<CitySearchProps>` with the new props.

### Phase B: CitySearch MFE — Favorites UI

1. **`CitySearch.tsx` — new props**: Accept `favoriteCities?: FavoriteCity[]` and `onToggleFavorite?: (city) => Promise<boolean>`.

2. **Favorites section in dropdown**: When `inputFocused && query.length < 2 && favoriteCities?.length > 0`, render a "Favorites" section above the existing "Recent Searches" section, showing up to 5 favorites. No remove button (managed via star toggle).

3. **Star button on search results**: On each result row in `showSearchResults` and `showFuzzySuggestions`, add a star `<button>` (right of city name, left of WeatherPreview). Filled ★ if city is in `favoriteCities`. Only rendered if `onToggleFavorite` is provided. Clicking calls `onToggleFavorite` (stop propagation to prevent city navigation).

4. **Matching favorites in inline search**: When `query.length >= 2`, matching favorites appear at the top with a filled ★ badge (similar to `RecentBadge`).

### Phase C: Transit Tracker — City Quick-Select

1. **`TransitTracker.tsx` — new prop**: Accept `favoriteCities?: Array<{ id: string; name: string; lat: number; lon: number }>`.

2. **City chip row**: When `favoriteCities` is provided and non-empty, render a horizontal scroll row of city chips above the stop search input. Tapping a chip calls `findNearby` with the city's coordinates instead of browser geolocation.

3. **Selected chip state**: Track which chip is active (highlighted). Deselect on manual geolocation.

### Phase D: i18n + Tests

1. Add i18n keys to all 3 locales.
2. Unit tests for:
   - CitySearch: favorites section rendering, star toggle button, no star for unauthenticated (no `onToggleFavorite` prop).
   - TransitTracker: city chip row renders with favorites, chip click calls findNearby with city coords.
   - firebase.ts: cap guard rejects 11th favorite.
   - CitySearchWrapper: passes favoriteCities/onToggleFavorite from auth.

## Complexity Tracking

*No violations — straightforward prop injection into existing components.*
