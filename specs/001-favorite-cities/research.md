# Research: Favorite Cities Cross-MFE Integration

## 1. What already exists

### Decision: Reuse the existing FavoriteCity infrastructure — no new types or Firestore paths needed

**Rationale**: The full favorites stack is already in place:

| Layer | Location | Status |
|---|---|---|
| `FavoriteCity` type | `packages/shell/src/lib/firebase.ts:177` | ✅ exists |
| `RecentCity` type | `packages/shell/src/lib/firebase.ts:186` | ✅ exists |
| `toggleFavoriteCity(uid, city)` | `packages/shell/src/lib/firebase.ts:461` | ✅ exists |
| `useCityManager` hook | `packages/shell/src/hooks/useCityManager.ts` | ✅ exists |
| `AuthContext` fields | `favoriteCities`, `toggleFavorite` | ✅ exposed |
| `FavoriteButton` shell component | `packages/shell/src/components/weather/FavoriteButton.tsx` | ✅ exists, weather-only |
| Firestore path | `users/{uid}.favoriteCities[]` | ✅ written/read |
| `restoreUserData` | restores favorites on sign-in | ✅ exists |

**Alternatives considered**: Adding a `favorites` GraphQL query/mutation. Rejected because favorites are already handled by direct Firestore SDK in shell — adding a GraphQL layer adds complexity with no benefit (Constitution §III applies to MFE operations; shell can use Firestore directly).

---

## 2. How props flow from shell into MFEs

### Decision: Pass `favoriteCities` and `onToggleFavorite` as React props through Module Federation

**Rationale**: Module Federation allows host (shell) to pass typed React props to remote components. The CitySearch MFE already accepts other props (`onCitySelect`, `recentCities`, etc.). Shell controls rendering via `CitySearchWrapper`, which is the natural injection point.

**Pattern**:
1. Update `remotes.d.ts` type for `CitySearch` to include new prop signature.
2. Update `CitySearchWrapper` to read `favoriteCities`/`toggleFavorite` from `useAuth()` and pass them down.
3. CitySearch MFE receives these as optional props — gracefully hides star UI when props absent (unauthenticated).

**Alternatives considered**: Using the `eventBus` for favorite toggling. Rejected — eventBus is for fire-and-forget events (city selected), not for request/response state mutations. Direct prop callback is simpler and type-safe.

---

## 3. CitySearch MFE favorites UI placement

### Decision: "Favorites" section above "Recent Searches" in the initial dropdown

**Rationale**: Favorites are more intentional than recents — users explicitly save them. Showing them first makes quick-access faster. Pattern matches the existing section header approach (`dropdownLabel`).

**Star button placement**: Inline on each search result row (right side, before WeatherPreview). Only shown when `onToggleFavorite` prop is present (auth check delegated to shell).

**Alternatives considered**: A separate "Favorites" tab. Rejected as over-engineering (VI. Simplicity) — the existing dropdown sections pattern handles it.

---

## 4. Transit Tracker city integration

### Decision: Add optional `favoriteCities` prop to TransitTracker with city chip quick-select

**Rationale**: Transit tracker uses `useNearbyStops()` which calls browser geolocation. Replacing the geolocation call with `{lat, lon}` from a favorite city is the natural extension. City chips appear as a horizontal scroll row above the stop search input.

**Shell integration**: Shell's transit route wrapper passes `favoriteCities` from `useAuth()`.

**Alternatives considered**: Using `CITY_SELECTED` eventBus event. Rejected — eventBus is cross-MFE broadcast; for transit, city is a local state selection scoped to that MFE session.

**Scope limitation**: Transit tracker has stop-based search (not city-search). City favorites act as a geolocation shortcut, not a city search. No transit-specific city type is needed.

---

## 5. GraphQL schema

### Decision: No schema changes required

**Rationale**: `FavoriteCity` is stored as a plain object array in the Firestore `users/{uid}` document (not a top-level Firestore collection, not a GraphQL type). The existing `toggleFavoriteCity` SDK function handles all writes. No new resolvers or queries needed.

---

## 6. i18n keys needed

New keys required in `en`/`es`/`zh` locale files:

```
favorites.favorites          — "Favorites"
favorites.noFavorites        — "No favorites yet"
favorites.addToFavorites     — "Add to favorites"  (already exists in shell i18n)
favorites.removeFromFavorites — "Remove from favorites"  (already exists in shell i18n)
favorites.favorited          — "Favorited"  (already exists in shell i18n)
favorites.favorite           — "Favorite"  (already exists in shell i18n)
favorites.manageFavorites    — "Manage favorites"
search.favoritesSection      — "Favorites"
transit.favoriteCities       — "Favorite Cities"
```

Check for pre-existing keys before adding to avoid duplication.

---

## 7. Max favorites cap

### Decision: Enforce 10-city cap in `toggleFavoriteCity` (already at Firestore level)

Current `toggleFavoriteCity` has no explicit cap. The plan adds a guard: if adding would exceed 10, reject and show a toast ("Maximum 10 favorites reached").
