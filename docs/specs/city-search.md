# Feature Spec: City Search

**Status**: Implemented
**Package**: `packages/city-search`
**Route**: Embedded in weather (no standalone route)
**Port**: 3001

## Summary

Autocomplete city search component embedded within the weather landing page. Provides debounced search with recent cities dropdown, dispatching a `CITY_SELECTED` event consumed by the weather display MFE. Acts as the entry point for weather navigation.

## Key Features

- Debounced city search with autocomplete dropdown
- Recent cities list persisted to localStorage
- Weather preview for hovered/selected cities
- Dispatches `MFEvents.CITY_SELECTED` for cross-MFE communication
- Keyboard navigation support for search results

## Data Sources

- **GraphQL**: `searchCities` query via shared Apollo client
- **localStorage**: Recent cities list

## Integration Points

- **Shell route**: Embedded in `/weather` landing page (not a standalone route)
- **Widget**: None (part of weather flow)
- **Nav group**: N/A (accessed via weather landing page)
- **i18n namespace**: `citySearch.*`
- **Cloud Function**: `/graphql` (shared GraphQL endpoint)
- **MFE event**: Publishes `MFEvents.CITY_SELECTED`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- GraphQL via `@mycircle/shared` Apollo hooks
- Debounced input handling
- Module Federation remote consumed by shell

## Testing

- Unit tests: `packages/city-search/src/**/*.test.{ts,tsx}`
- E2E: `e2e/city-search-autocomplete.spec.ts`
