# Feature Specification: Weather Data for Saved Cities

**Feature Branch**: `002-weather-data`
**Created**: 2026-03-18
**Status**: Draft
**Input**: Current weather, forecast, air quality, and historical data for saved cities

## Context

The weather MFE (`WeatherDisplay.tsx`) already renders current weather, forecast, AQI, and historical data for a single city. The `FavoriteCities.tsx` shell widget shows saved city cards with only current temp + weather icon. The inline `WeatherComparison` inside WeatherDisplay reads from sessionStorage instead of using the actual saved favorites.

This feature enriches the weather experience specifically around saved cities: richer city cards, quick switching between favorites on the detail page, and wiring the comparison panel to real favorite city data.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Enriched Favorite City Cards (Priority: P1)

A user with 3 saved cities opens the weather landing page. Each city card shows: current temperature + weather icon (existing), a colored AQI badge ("Good", "Moderate", etc.), and today's forecast high/low. Optionally, a one-line historical note ("↑4° vs last year") when historical data differs significantly.

**Why this priority**: The cards are the primary entry point for weather data on saved cities — enriching them delivers value without requiring any navigation.

**Independent Test**: Save 1+ favorite cities → navigate to `/weather` → verify each city card shows an AQI badge with a color matching the AQI level and a today's high/low temperature range.

**Acceptance Scenarios**:

1. **Given** a user has 2 saved cities with AQI data available, **When** they open `/weather`, **Then** each city card shows a colored pill ("Good" = green, "Fair" = yellow-green, "Moderate" = yellow, "Poor" = orange, "Very Poor" = red) beneath the temperature.
2. **Given** forecast data is available, **When** the city card renders, **Then** it shows today's high/low (e.g., "H: 22° L: 14°") in small text below the AQI badge.
3. **Given** historical data is available and today is ≥3° different from last year, **When** the card renders, **Then** it shows a subtle historical note (e.g., "↑4° vs last year").
4. **Given** AQI data is still loading, **When** the card renders, **Then** a skeleton placeholder appears (no layout shift).
5. **Given** AQI data is unavailable (error), **When** the card renders, **Then** the AQI section is silently omitted (no error state shown on card).

---

### User Story 2 — City Switcher on Weather Detail Page (Priority: P1)

A user viewing weather for "Tokyo" wants to check the weather for "London" (also saved). Currently they must navigate back to `/weather`, find the London card, and tap it. With the city switcher, a horizontal scrollable chip row at the top of the detail page shows all other saved cities — tapping one navigates to that city's weather page.

**Why this priority**: Without this, multi-city users must navigate back to the landing page for every city switch — high friction for the most common action.

**Independent Test**: Save 2+ favorite cities → navigate to `/weather/lat,lon?name=X` for one of them → verify a chip row appears at the top listing the other saved cities → tap a chip → URL changes and weather data updates for the new city.

**Acceptance Scenarios**:

1. **Given** a user has 2+ saved cities and is viewing one, **When** the weather detail page loads, **Then** a horizontal scrollable chip row appears above the weather content showing the other saved cities.
2. **Given** the current city is "Tokyo", **When** the chip row renders, **Then** "Tokyo" is excluded from the chip list (no self-chip) or shown as the active/selected chip.
3. **Given** the user taps the "London" chip, **When** the tap occurs, **Then** the browser navigates to `/weather/lat,lon?name=London` and weather data for London loads.
4. **Given** the user has 0 or 1 saved city, **When** the detail page loads, **Then** the chip row is not shown.
5. **Given** the chip list is long (>4 cities), **When** rendered on mobile, **Then** the row scrolls horizontally without wrapping.

---

### User Story 3 — Fix Inline Weather Comparison Using Saved Cities (Priority: P2)

The `WeatherComparison` panel inside `WeatherDisplay.tsx` calls `getRecentCitiesFromStorage()` (reads `selectedCity` from sessionStorage) to populate the "compare with" city picker. This means comparison only works if the user had previously selected a city in the current session. With saved favorites available, the comparison should use `favoriteCities` from the shell context instead.

**Why this priority**: The comparison panel silently shows no options for new sessions, making it appear broken. Wiring it to favorites makes it reliably useful.

**Independent Test**: Sign in → save 2+ favorite cities → open `/weather/lat,lon?name=X` for one of them → scroll to the inline comparison section → verify the other saved cities appear as comparison options without requiring a prior city search.

**Acceptance Scenarios**:

1. **Given** a signed-in user with 2 saved cities views a weather detail page in a fresh session (no sessionStorage), **When** they scroll to the comparison section, **Then** the other saved city appears as a comparison option.
2. **Given** favoriteCities is passed as a prop to WeatherDisplay, **When** the comparison section renders, **Then** it uses `favoriteCities` (excluding the current city by `id`) as the city pool.
3. **Given** the user is not signed in, **When** the comparison section renders, **Then** it falls back to the sessionStorage behavior (no change for unauthenticated users).
4. **Given** the current city is in the favorites list, **When** the comparison city pool is built, **Then** the current city is excluded to prevent "compare with itself".

---

## Out of Scope

- Adding new GraphQL resolvers (all queries exist: `GET_AIR_QUALITY`, `GET_FORECAST`, `GET_HISTORICAL_WEATHER`)
- Redesigning the WeatherDisplay detail page layout
- Multi-city weather table (separate feature)
- Push notifications for weather alerts on saved cities
