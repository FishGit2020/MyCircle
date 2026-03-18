# Tasks: Weather Data for Saved Cities

**Input**: Design documents from `/specs/002-weather-data/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US3)

---

## Phase 1: Setup (No new project scaffolding needed)

This feature enhances existing packages only. All required infrastructure exists. Proceed directly to Foundational.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared i18n keys and WeatherWrapper infrastructure that all user stories depend on.

**⚠️ CRITICAL**: US2 and US3 cannot begin until WeatherWrapper (T003) is complete. US1 can start immediately in parallel.

- [X] T001 [P] Add `weather.citySwitch` (value: `"Switch city"`) and `weather.forecastHighLow` (value: `"Today's high / low"`) keys to `packages/shared/src/i18n/locales/en.ts`
- [X] T002 [P] Add same keys with Spanish Unicode-escaped values to `packages/shared/src/i18n/locales/es.ts` — `weather.citySwitch`: `"Cambiar ciudad"`, `weather.forecastHighLow`: `"M\u00e1x / m\u00edn de hoy"`; read the exact insertion line before editing
- [X] T003 [P] Add same keys with Chinese Unicode-escaped values to `packages/shared/src/i18n/locales/zh.ts` — `weather.citySwitch`: `"\u5207\u6362\u57ce\u5e02"`, `weather.forecastHighLow`: `"\u4eca\u65e5\u6700\u9ad8/\u6700\u4f4e\u6c14\u6e29"`; read the exact insertion line before editing

**Checkpoint**: i18n keys available in all 3 locales. US1 work can proceed.

---

## Phase 3: User Story 1 — Enriched Favorite City Cards (Priority: P1) 🎯 MVP

**Goal**: Each favorite city card on the weather landing page shows a colored AQI badge, today's forecast high/low, and an optional historical note alongside the existing temp + icon.

**Independent Test**: Save 1+ favorite cities → navigate to `/weather` → verify each card shows a colored AQI badge (e.g., green "Good"), today's H/L temperatures, and (if data available and diff ≥ 3°) a "↑N° vs last year" note.

- [X] T004 [US1] Add `GET_AIR_QUALITY` query to `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — `useQuery(GET_AIR_QUALITY, { variables: { lat: city.lat, lon: city.lon }, fetchPolicy: 'cache-first' })` imported from `@mycircle/shared`; extract `data?.airQuality?.aqi`
- [X] T005 [US1] Add `GET_FORECAST` query to `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — `useQuery(GET_FORECAST, { variables: { lat: city.lat, lon: city.lon }, fetchPolicy: 'cache-first' })`; extract `forecast[0].temp.min` and `forecast[0].temp.max` for today's high/low
- [X] T006 [US1] Add `GET_HISTORICAL_WEATHER` query to `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — compute `date` as `new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0]`; extract `historical?.temp_max`; compute diff vs `currentWeather.temp`
- [X] T007 [US1] Render AQI badge in `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — colored pill below the temperature using the 5-level mapping from data-model.md (`aqi=1` → `bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400` + `t('weather.aqiGood')`, etc.); show skeleton `<div className="h-4 w-16 rounded bg-gray-200 dark:bg-gray-600 animate-pulse">` while loading; silently omit when data unavailable
- [X] T008 [US1] Render forecast high/low in `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — small text line using `formatTemperature(forecastLow, tempUnit)` and `formatTemperature(forecastHigh, tempUnit)` from `@mycircle/shared`; use `t('weather.forecastHighLow')` as aria-label; show skeleton while loading
- [X] T009 [US1] Render historical note in `FavoriteCityCard` in `packages/shell/src/components/widgets/FavoriteCities.tsx` — only when `historical?.temp_max` is non-null AND `Math.abs(currentTemp - historical.temp_max) >= 3`; show "↑N° vs last year" using `t('weather.warmer')` / `t('weather.cooler')` from existing keys; omit silently otherwise

**Checkpoint**: City cards on `/weather` show AQI badge + H/L + historical note. US2 and US3 can proceed in parallel.

---

## Phase 4: User Story 2 — City Switcher on Weather Detail Page (Priority: P1)

**Goal**: A horizontal scrollable chip row at the top of `/weather/:coords` shows all other saved cities so the user can switch cities with one tap.

**Independent Test**: Save 2+ favorites → navigate to `/weather/lat,lon?name=X` → verify a chip row appears listing other favorites → tap a chip → URL updates and weather for the new city loads.

- [X] T010 [US2] Locate the `WeatherPage` component in `packages/shell/src/App.tsx` that wraps `<WeatherDisplayMF />`; extract it into `packages/shell/src/pages/WeatherPage.tsx` if it is currently inline in App.tsx, or confirm it already exists as a separate component; read App.tsx to determine current structure before making changes
- [X] T011 [US2] Add `CitySwitcher` component to `packages/shell/src/pages/WeatherPage.tsx` — imports `useAuth` and `useParams` from their respective packages; reads `favoriteCities` from `useAuth()`; parses `coords` param (`lat,lon`) to build `currentCityId`; filters `otherCities = favoriteCities.filter(c => c.id !== currentCityId)`; renders nothing when `otherCities.length === 0`
- [X] T012 [US2] Render city chip row in `CitySwitcher` in `packages/shell/src/pages/WeatherPage.tsx` — `<div className="overflow-x-auto ..."><div className="flex gap-2 px-4 py-2 ...">` containing `<Link>` chips for each `otherCity`; each chip links to `/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`; chip is a `<Link>` styled as `rounded-full px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400`; add `aria-label={t('weather.citySwitch')}` on the containing `<nav>`; min-height 44px on chips

**Checkpoint**: City switcher chips appear on weather detail page; tapping navigates to correct city.

---

## Phase 5: User Story 3 — Fix Inline WeatherComparison Using Saved Cities (Priority: P2)

**Goal**: The inline WeatherComparison panel inside WeatherDisplay uses `favoriteCities` from AuthContext (passed via WeatherWrapper) instead of the sessionStorage hack.

**Independent Test**: Fresh incognito session → sign in → save 2+ favorites → navigate to `/weather/lat,lon?name=X` → scroll to comparison section → other saved city appears as comparison option without prior city search.

- [X] T013 [US3] Create `packages/shell/src/components/widgets/WeatherWrapper.tsx` — mirrors `TransitWrapper.tsx` pattern; lazy imports `weatherDisplay/WeatherDisplay`; reads `user` and `favoriteCities` from `useAuth()`; parses current `coords` param via `useParams` to derive `currentCityId`; passes `favoriteCities={user ? favoriteCities.filter(c => c.id !== currentCityId) : undefined}` and `currentCityId={currentCityId}` to `<WeatherDisplayMF />`; wraps in `<ErrorBoundary>` and `<Suspense>`
- [X] T014 [US3] Update `packages/shell/src/remotes.d.ts` — change `declare module 'weatherDisplay/WeatherDisplay'` from `React.ComponentType` to `React.ComponentType<{ favoriteCities?: Array<{ id: string; name: string; country: string; state?: string; lat: number; lon: number }>; currentCityId?: string }>`
- [X] T015 [US3] Update `packages/shell/src/App.tsx` — replace the direct `<WeatherDisplayMF />` mount (and its surrounding lazy import) in the weather detail route with `<WeatherWrapper />`; remove the `const WeatherDisplayMF = lazy(...)` import for weatherDisplay; add `import WeatherWrapper from './components/widgets/WeatherWrapper'`; keep `WeatherLandingPage` route unchanged
- [X] T016 [US3] Update `packages/weather-display/src/components/WeatherDisplay.tsx` — add `FavoriteCity` interface (same shape as shell); add optional props `favoriteCities?: FavoriteCity[]` and `currentCityId?: string` to the component signature; replace the `availableCities={getRecentCitiesFromStorage()}` prop passed to `<WeatherComparison>` with `availableCities={favoriteCities ?? getRecentCitiesFromStorage()}` so unauthenticated users still get the sessionStorage fallback

**Checkpoint**: All 3 user stories functional. Inline comparison uses saved cities.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T017 [P] Run `pnpm build:shared` to rebuild shared with new i18n keys
- [X] T018 [P] Run `pnpm lint && pnpm --filter @mycircle/shell test:run && pnpm --filter @mycircle/weather-display test:run && pnpm typecheck` and fix any failures
- [X] T019 [P] Update `packages/shell/src/components/widgets/FavoriteCities.test.tsx` (if it exists) — add mock for `GET_AIR_QUALITY` and `GET_FORECAST` queries so existing tests don't break; add a test that AQI badge renders when `aqi=1` is returned
- [X] T020 Verify quickstart.md integration checklist passes manually: AQI badge visible, H/L shows in correct unit, city switcher excludes current city, comparison shows saved cities in fresh session

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately; T001/T002/T003 run in parallel
- **US1 (Phase 3)**: Depends only on T001 (i18n keys for H/L and AQI labels); can start as soon as T001 is done
- **US2 (Phase 4)**: Depends only on T001 (i18n for `weather.citySwitch` aria-label); independent of US1
- **US3 (Phase 5)**: No i18n dependency; can start immediately after Foundational; independent of US1/US2
- **Polish (Phase 6)**: Depends on all stories being complete

### Story Independence

- US1 and US2 and US3 can all run in parallel once Foundational is done
- US1 touches only `FavoriteCities.tsx`
- US2 touches only `WeatherPage.tsx` (or App.tsx inline section)
- US3 touches `WeatherWrapper.tsx` (new), `remotes.d.ts`, `App.tsx`, `WeatherDisplay.tsx`

### Parallel Opportunities

- T001, T002, T003 (i18n) run in parallel
- T004, T005, T006 (card queries) run in parallel within US1
- T013, T014 (WeatherWrapper + remotes) run in parallel within US3
- T017, T018, T019 run in parallel in Polish

---

## Parallel Example: US1 Card Queries

```bash
# All three card queries can be added in parallel (same file but additive changes):
Task: "T004 — Add GET_AIR_QUALITY query to FavoriteCityCard"
Task: "T005 — Add GET_FORECAST query to FavoriteCityCard"
Task: "T006 — Add GET_HISTORICAL_WEATHER query to FavoriteCityCard"
```

---

## Implementation Strategy

### MVP (US1 + US2 only — pure shell changes, no MFE edits)

1. Complete Phase 2: i18n keys (T001–T003)
2. Complete Phase 3: Enriched city cards (T004–T009) — shell-only, no MFE changes
3. Complete Phase 4: City switcher (T010–T012) — shell-only
4. **STOP and validate**: `/weather` cards show AQI + H/L; detail page shows city chips
5. Ship — US3 (WeatherDisplay prop change) can follow in next iteration

### Incremental Delivery

1. Phase 2 → i18n keys ready
2. Phase 3 → Enriched city cards ✓ (MVP value immediately visible)
3. Phase 4 → City switcher ✓ (navigation friction removed)
4. Phase 5 → Inline comparison fix ✓ (comparison reliable for signed-in users)
5. Phase 6 → Tests green, typecheck passes ✓
