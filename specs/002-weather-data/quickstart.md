# Quickstart: Weather Data for Saved Cities

## Prerequisites

- Sign-in with a Google account in the app
- At least 1–2 saved favorite cities (star any city from the search dropdown)

## Dev Setup

```bash
git checkout 002-weather-data
pnpm install
pnpm build:shared
pnpm dev:weather-display   # weather MFE on port 3007
pnpm dev:city-search       # city-search MFE on port 3001 (for favoriting)
pnpm dev:shell             # shell on port 3000
```

Open `http://localhost:3000` and sign in.

---

## Integration Scenarios

### Scenario 1: AQI + Forecast on City Cards (US1)

1. Star 2+ cities from the search dropdown
2. Navigate to `/weather`
3. **Expect**: Each favorite city card shows:
   - Colored AQI badge ("Good", "Moderate", etc.)
   - Today's high/low (e.g., "H: 22° L: 14°")
   - Optional historical note if diff ≥ 3° (e.g., "↑4° vs last year")
4. Verify dark mode: open DevTools → toggle `dark` class on `<html>` → badge colors adapt

### Scenario 2: City Switcher (US2)

1. Star 3 cities: e.g., Tokyo, London, Sydney
2. Navigate to `/weather` → click the Tokyo card
3. **Expect**: A chip row appears near the top of the weather detail page showing "London" and "Sydney" chips
4. Tap "London" chip
5. **Expect**: URL changes to `/weather/51.5074,-0.1278?name=London` and London weather loads

### Scenario 3: Inline Comparison Uses Favorites (US3)

1. Open a new browser tab in incognito (clean session, no sessionStorage)
2. Sign in
3. Star 2+ cities
4. Navigate to `/weather/lat,lon?name=X` for one saved city
5. Scroll down to the "Compare Weather" section
6. **Expect**: The city picker dropdown lists the other saved cities (not empty as before)
7. Select a city → side-by-side comparison renders

---

## Verification Checklist

- [ ] AQI badge visible on each city card (correct color per AQI level)
- [ ] Today's high/low shows in correct unit (°C or °F based on user preference)
- [ ] Historical note appears when diff ≥ 3° (hidden otherwise)
- [ ] Loading skeleton on AQI/forecast section while fetching
- [ ] City switcher hidden when < 2 saved cities
- [ ] City switcher excludes current city from chip list
- [ ] City chip tap navigates and loads new city weather
- [ ] Inline comparison shows saved cities (not empty) in fresh session
- [ ] All text uses i18n keys (check Spanish and Chinese in settings)
- [ ] Dark mode: all new color classes have `dark:` variants
- [ ] Touch targets: AQI badge and city chips are ≥ 44px tall

---

## Key Files

| File | What changes |
|------|-------------|
| `packages/shell/src/components/widgets/FavoriteCities.tsx` | Add AQI badge, forecast H/L, historical note to FavoriteCityCard |
| `packages/shell/src/App.tsx` | Add city switcher to WeatherPage; replace direct MFE mount with WeatherWrapper |
| `packages/shell/src/components/widgets/WeatherWrapper.tsx` | NEW: passes favoriteCities to WeatherDisplayMF |
| `packages/shell/src/remotes.d.ts` | Add WeatherDisplay prop interface |
| `packages/weather-display/src/components/WeatherDisplay.tsx` | Accept favoriteCities prop; pass to WeatherComparison |
| `packages/shared/src/i18n/locales/{en,es,zh}.ts` | Add `weather.citySwitch`, `weather.forecastHighLow` keys |
