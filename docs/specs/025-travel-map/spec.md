# Feature Spec: Travel Map

**Status**: Implemented
**Package**: `packages/travel-map`
**Route**: `/travel-map`
**Port**: 3029

## Summary

Interactive world map for tracking personal travel history using MapLibre GL. Users can pin locations they have visited, lived in, or wish to visit, with search-based pin placement and a visual map display of all pins.

## Key Features

- Interactive MapLibre GL world map
- Add travel pins with categories: visited, lived, wishlist
- Location search for pin placement
- Pin markers with category-specific styling
- Pin form for adding/editing pin details
- Visual overview of all travel pins on the map
- Pin management (add, edit, delete)

## Data Sources

- **Firestore**: `users/{uid}/travelPins/{pinId}` (private per-user pins)

## Integration Points

- **Shell route**: `/travel-map` in App.tsx (requires auth)
- **Widget**: `travelMap` in widgetConfig.ts
- **Nav group**: Outdoor (`nav.group.outdoor`)
- **i18n namespace**: `nav.travelMap`, `travelMap.*`
- **Firestore**: `users/{uid}/travelPins/{pinId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- MapLibre GL JS for map rendering
- Firestore CRUD for pin persistence
- Custom hooks: `useTravelPins` for pin management
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/travel-map/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
