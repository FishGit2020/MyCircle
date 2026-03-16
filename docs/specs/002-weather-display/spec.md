# Feature Spec: Weather Display

**Status**: Implemented
**Package**: `packages/weather-display`
**Route**: `/weather/:coords`
**Port**: 3002

## Summary

Full-featured weather dashboard showing current conditions, forecasts, and environmental data for any city. Supports URL-based coordinate routing with reverse geocoding, favorite cities (via shell), and configurable widget visibility. Serves as one of the primary daily-use MFEs.

## Key Features

- Current weather conditions with temperature, humidity, wind, and pressure
- Hourly forecast chart and 7-day extended forecast
- Air quality index (AQI) display with pollutant breakdown
- Historical weather comparison (same day last year via Open-Meteo archive API)
- Activity suggestions based on current conditions
- Sunrise/sunset times and weather map overlay
- What-to-wear clothing recommendations
- Weather alerts display
- Configurable widget visibility panel (DashboardSettings)
- Favorite/share buttons integrated from shell

## Data Sources

- **GraphQL**: `GET_WEATHER` query via shared Apollo client
- **GraphQL**: `REVERSE_GEOCODE` lazy query for coordinate-to-name resolution
- **Open-Meteo Archive API**: Historical weather comparison data
- **sessionStorage**: Selected city data from city-search MFE
- **localStorage**: Widget visibility preferences

## Integration Points

- **Shell route**: `/weather/:coords` in App.tsx (special WeatherPage wrapper with FavoriteButton/ShareButton)
- **Widget**: `weather` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `dashboard.weather`, `weather.*`
- **Cloud Function**: `/graphql` (shared GraphQL endpoint)
- **MFE event**: Subscribes to `MFEvents.CITY_SELECTED` from city-search

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- GraphQL via `@mycircle/shared` Apollo hooks
- Open-Meteo archive REST API for historical data
- Chart rendering for hourly forecast
- `useWeatherData`, `useHistoricalWeather`, `useAirQuality` shared hooks

## Testing

- Unit tests: `packages/weather-display/src/**/*.test.{ts,tsx}`
- E2E: `e2e/weather-display.spec.ts`, `e2e/air-quality.spec.ts`, `e2e/historical-weather.spec.ts`
