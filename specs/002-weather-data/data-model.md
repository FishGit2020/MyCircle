# Data Model: Weather Data for Saved Cities

No new Firestore collections or GraphQL schema changes. This feature uses existing data sources.

---

## Existing Data Sources Used

### FavoriteCity (from Firestore, via AuthContext)

```ts
interface FavoriteCity {
  id: string;       // "{lat},{lon}" composite key
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}
```

Source: `users/{uid}.favoriteCities[]` in Firestore, surfaced via `useAuth().favoriteCities`.

### AQI Data (from `GET_AIR_QUALITY` query)

Only `aqi` field used on city cards:

```ts
interface AirQualityCard {
  aqi: 1 | 2 | 3 | 4 | 5;  // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
}
```

### Forecast Data (from `GET_FORECAST` query, day 0 only for cards)

```ts
interface ForecastDay0 {
  dt: number;
  temp: {
    min: number;   // today's low
    max: number;   // today's high
  };
}
```

### Historical Weather (from `GET_HISTORICAL_WEATHER`, for card note)

```ts
interface HistoricalDay {
  date: string;
  temp_max: number;
  temp_min: number;
  weather_description: string;
}
```

---

## Derived Display State

### FavoriteCityCard Display

Computed from the three data sources above:

```ts
interface CityCardDisplay {
  // Existing (no change)
  currentTemp: number;           // from GET_CURRENT_WEATHER
  weatherIcon: string;           // from GET_CURRENT_WEATHER

  // New (US1)
  aqiLevel: 1 | 2 | 3 | 4 | 5 | null;  // null = loading or unavailable
  aqiLabel: string;              // t('weather.aqiGood') etc.
  aqiColor: string;              // Tailwind class set
  forecastHigh: number | null;   // forecast[0].temp.max
  forecastLow: number | null;    // forecast[0].temp.min
  historicalNote: string | null; // "↑4° vs last year" or null if diff < 3°
}
```

### City Switcher State (US2)

Computed in shell WeatherPage, no persistent state:

```ts
interface CitySwitcherState {
  currentCityId: string;         // "{lat},{lon}" from URL params
  otherFavorites: FavoriteCity[]; // favoriteCities.filter(c => c.id !== currentCityId)
}
```

### WeatherDisplay Props (US3 — new)

```ts
interface WeatherDisplayProps {
  favoriteCities?: FavoriteCity[];   // from shell AuthContext, excludes current city
  currentCityId?: string;            // current city id to exclude from comparison
}
```

---

## Data Flow Diagram

```text
Firestore
  └── users/{uid}.favoriteCities[]
        │
        ▼
AuthContext (shell)
  ├── favoriteCities: FavoriteCity[]
  │     │
  │     ├──▶ FavoriteCities.tsx (landing) ──▶ FavoriteCityCard
  │     │        │  calls GET_CURRENT_WEATHER (existing)
  │     │        │  calls GET_AIR_QUALITY (NEW - US1)
  │     │        │  calls GET_FORECAST (NEW - US1)
  │     │        └  calls GET_HISTORICAL_WEATHER (NEW - US1, optional)
  │     │
  │     ├──▶ WeatherPage (shell, wraps WeatherDisplayMF)
  │     │        └  renders CitySwitcherChips (NEW - US2)
  │     │              each chip: <Link to="/weather/lat,lon?name=X">
  │     │
  │     └──▶ WeatherWrapper (NEW - US3)
  │               └  passes favoriteCities to WeatherDisplayMF
  │
  └── WeatherDisplayMF (MFE)
        └── WeatherComparison (inline)
              uses props.favoriteCities instead of getRecentCitiesFromStorage()
```

---

## AQI Level → UI Mapping

| aqi | Key | Label | Badge Classes |
|-----|-----|-------|---------------|
| 1 | `weather.aqiGood` | Good | `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` |
| 2 | `weather.aqiFair` | Fair | `bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400` |
| 3 | `weather.aqiModerate` | Moderate | `bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400` |
| 4 | `weather.aqiPoor` | Poor | `bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400` |
| 5 | `weather.aqiVeryPoor` | Very Poor | `bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400` |
