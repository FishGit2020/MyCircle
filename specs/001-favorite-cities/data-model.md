# Data Model: Favorite Cities Cross-MFE Integration

## Entities

### FavoriteCity *(existing — no changes)*

Stored in: `Firestore users/{uid}.favoriteCities[]`

```ts
interface FavoriteCity {
  id: string;       // "{lat},{lon}" e.g. "40.71,-74.01"
  name: string;     // "New York"
  country: string;  // "US"
  state?: string;   // "New York" (optional)
  lat: number;      // 40.7128
  lon: number;      // -74.006
}
```

**Constraints**:
- Max 10 per user (enforced in `toggleFavoriteCity`)
- `id` is the dedup key — same city cannot appear twice
- Auth-only: no favorites for unauthenticated users (local storage not used for favorites)

### RecentCity *(existing — no changes)*

Stored in: `localStorage[StorageKeys.RECENT_CITIES]` (guest) or `Firestore users/{uid}.recentCities[]` (auth)

```ts
interface RecentCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt: Date;
}
```

Recents and favorites are separate lists. A city can appear in both.

---

## State Flow

```
AuthContext (shell)
  ├── favoriteCities: FavoriteCity[]     ← loaded from Firestore on sign-in
  └── toggleFavorite(city) → Firestore  ← mutates users/{uid}.favoriteCities
          │
          ▼
  CitySearchWrapper (shell)
  └── passes { favoriteCities, onToggleFavorite } as props
          │
          ▼
  CitySearch MFE (packages/city-search)
  └── renders Favorites section + star buttons

  TransitWrapper (shell)
  └── passes { favoriteCities } as prop
          │
          ▼
  TransitTracker MFE (packages/transit-tracker)
  └── renders city chip quick-select
```

---

## Firestore

No new Firestore documents or collections. All changes write to the existing `users/{uid}` document via `updateDoc`.

**Existing field**: `favoriteCities: FavoriteCity[]`
**New behavior**: Cap enforced at 10; existing `toggleFavoriteCity` function updated to return an error signal when cap is reached.

---

## No GraphQL Changes

`FavoriteCity` is not exposed via GraphQL. Shell manages it directly via Firestore SDK.

---

## Prop Contracts

### CitySearch MFE (updated)

```ts
interface CitySearchProps {
  // existing
  onCitySelect?: (city: City) => void;
  recentCities?: RecentCity[];
  onRemoveCity?: (cityId: string) => void;
  onClearRecents?: () => void;
  // new
  favoriteCities?: FavoriteCity[];
  onToggleFavorite?: (city: FavoriteCity) => Promise<boolean>;
}
```

### TransitTracker MFE (updated)

```ts
interface TransitTrackerProps {
  // new optional
  favoriteCities?: Array<{ id: string; name: string; lat: number; lon: number }>;
}
```

---

## State Transitions

```
Favorite toggle (auth user):
  ☆ (not favorite) → click star → optimistic ★ → Firestore write
                                               → success: keep ★
                                               → error: revert to ☆, show toast

Favorite toggle at cap (10 favorites):
  ☆ → click star → show toast "Maximum 10 favorites" → no change

Sign-out:
  AuthContext clears favoriteCities → CitySearchWrapper passes [] → favorites section hidden
```
