# Feature Spec: Trip Planner

**Status**: Implemented
**Package**: `packages/trip-planner`
**Route**: `/trips`
**Port**: 3024

## Summary

Trip planning and itinerary management tool for organizing travel plans. Supports creating trips with destination search, detailed itinerary entries, and a map preview of destinations. All trip data is stored per-user in Firestore.

## Key Features

- Trip creation, editing, and deletion
- Destination search with location lookup
- Itinerary planning with day-by-day entries
- Trip list view with overview cards
- Trip detail view with full itinerary
- Map preview of trip destinations (TripMapPreview)
- Trip form with date range and destination fields

## Data Sources

- **Firestore**: `users/{uid}/trips/{tripId}` (private per-user trips)

## Integration Points

- **Shell route**: `/trips` in App.tsx (requires auth)
- **Widget**: `tripPlanner` in widgetConfig.ts
- **Nav group**: Workspace (`nav.group.workspace`)
- **i18n namespace**: `nav.tripPlanner`, `trips.*`
- **Firestore**: `users/{uid}/trips/{tripId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Firestore CRUD operations
- Map preview component for destination visualization
- Destination search with geocoding
- Custom hooks for trip management
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/trip-planner/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
