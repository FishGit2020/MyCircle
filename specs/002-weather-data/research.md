# Research: Weather Data for Saved Cities

## Decision 1: AQI badge data source for city cards

**Decision**: Use `GET_AIR_QUALITY` GraphQL query directly in `FavoriteCityCard` (shell component), not via `useAirQuality` hook.

**Rationale**: `useAirQuality` is exported from `@mycircle/shared` and usable in shell. However, `FavoriteCityCard` is a shell component (not an MFE), so it can call Apollo queries directly via `useQuery`. The existing `FavoriteCityCard` already calls `GET_CURRENT_WEATHER` via `useQuery` — adding `GET_AIR_QUALITY` follows the same pattern. No new hooks needed.

**AQI fields needed for card**: Only `aqi` (integer 1–5). The full pollutant breakdown (`co`, `no2`, etc.) is not needed on the card.

**AQI label + color mapping** (matches existing `AirQuality.tsx` logic):
- 1 → "Good" → green (`bg-green-100 text-green-700`)
- 2 → "Fair" → yellow-green (`bg-lime-100 text-lime-700`)
- 3 → "Moderate" → yellow (`bg-yellow-100 text-yellow-700`)
- 4 → "Poor" → orange (`bg-orange-100 text-orange-700`)
- 5 → "Very Poor" → red (`bg-red-100 text-red-700`)

**i18n keys** already exist: `weather.aqiGood`, `weather.aqiFair`, `weather.aqiModerate`, `weather.aqiPoor`, `weather.aqiVeryPoor`

**Alternatives considered**: Adding a `useAirQualityCard` hook — rejected (unnecessary abstraction for one call site).

---

## Decision 2: Forecast high/low source for city cards

**Decision**: Use `GET_FORECAST` query in `FavoriteCityCard` to get `forecast[0].temp.min` and `forecast[0].temp.max` (index 0 = today).

**Rationale**: `GET_FORECAST` returns an array of daily forecast objects; index 0 is the current day. Fields `temp.min` and `temp.max` are exactly what's needed. Apollo cache-first policy means these queries are cheap if the user later navigates to the full weather detail page (which makes the same query).

**Alternatives considered**: Using `currentWeather.temp_min`/`temp_max` (already in `GET_CURRENT_WEATHER`) — these are available but inconsistently populated depending on OWM API tier. `GET_FORECAST` day 0 is more reliable.

---

## Decision 3: Historical note threshold and display

**Decision**: Show historical comparison note on city cards only if `|current.temp - historical.temp_max| >= 3°C`. Display as inline text: "↑3° vs last year" or "↓5° vs last year".

**Rationale**: Showing a comparison for trivial differences (1°C) adds noise. A 3°C threshold is perceptible and meaningful. The note is hidden when historical data is null or the diff is below threshold — no error state needed on the card.

**Historical query**: `GET_HISTORICAL_WEATHER` with `date = same month/day, one year ago` (computed by `useHistoricalWeather` hook, but we'll use `useQuery` directly in the card to avoid importing the hook unnecessarily — the date computation is simple: `new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0]`).

**Alternatives considered**: Showing a sparkline of 7-day historical trend — too complex for a card, rejected.

---

## Decision 4: City switcher placement and implementation

**Decision**: Implement the city switcher as a horizontal chip row in the **shell's `WeatherPage` component** (in `App.tsx`), not inside the `WeatherDisplay` MFE.

**Rationale**: WeatherDisplay currently receives no props from the shell — it reads city from URL params. The shell's `WeatherPage` wrapper (lines around the `<WeatherDisplayMF />` mount) already renders `<ShareButton>` and `<FavoriteButton>`. Adding city chips to this wrapper is the least invasive change: no MFE boundary crossing required, no new prop injection, no remotes.d.ts change.

**Implementation**: Read `favoriteCities` from `useAuth()` in the shell's WeatherPage component. Parse the current city `lat,lon` from `useParams()`. Render chips for all saved cities except the current one. Each chip is a `<Link to="/weather/lat,lon?name=X">`.

**Alternatives considered**:
- Adding `favoriteCities` prop to WeatherDisplay MFE (like TransitWrapper) — possible but WeatherDisplay already handles city via URL, so prop injection would require a parallel state-management path inside the MFE, creating two sources of truth. Rejected.
- Using eventBus to push city list into the MFE — over-engineered. Rejected.

---

## Decision 5: Fix inline WeatherComparison — prop injection approach

**Decision**: Create `WeatherWrapper.tsx` in shell (mirroring `CitySearchWrapper` / `TransitWrapper`), pass `favoriteCities` and `currentCityId` as props to `WeatherDisplayMF`. Update `WeatherDisplay.tsx` to accept these props and pass `favoriteCities` (excluding current city) to `WeatherComparison`.

**Rationale**: `getRecentCitiesFromStorage()` reads `selectedCity` from sessionStorage — an unreliable cross-session hack. Since the shell already has favoriteCities from Firestore, injecting them via wrapper is the correct pattern (consistent with CitySearchWrapper, TransitWrapper).

**Prop interface**:
```ts
interface WeatherDisplayProps {
  favoriteCities?: Array<{ id: string; name: string; country: string; state?: string; lat: number; lon: number }>;
  currentCityId?: string; // lat,lon string to exclude from comparison pool
}
```

**Alternatives considered**: Keeping sessionStorage but also reading favorites — dual-source complexity, rejected.

---

## Decision 6: i18n keys needed

**Existing** (no changes needed):
- `weather.aqiGood/Fair/Moderate/Poor/VeryPoor` — for AQI badge label
- `weather.tempHigh`, `weather.tempLow` — for forecast high/low
- `weather.warmer`, `weather.cooler` — for historical note

**New keys needed**:
- `weather.citySwitch` — label for the city switcher section (screen-reader aria-label), e.g., "Switch city"
- `weather.forecastHighLow` — accessible label for the high/low line, e.g., "Today's high/low"

---

## Technical Constraints

- **Apollo cache-first**: `GET_AIR_QUALITY` and `GET_FORECAST` with `fetchPolicy: 'cache-first'` — cheap repeated calls if user navigates to detail page
- **No new GraphQL resolvers**: All queries already exist in `packages/shared/src/apollo/queries.ts`
- **No new MFE packages**: All changes are within `packages/weather-display`, `packages/shell`, and `packages/shared` (i18n only)
- **No codegen needed**: No schema changes; existing generated types cover all queries
- **`useQuery` import in shell**: Shell uses `@mycircle/shared` re-exports for Apollo — must import from `@mycircle/shared`, never directly from `@apollo/client`
