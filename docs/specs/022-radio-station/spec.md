# Feature Spec: Radio Station

**Status**: Implemented
**Package**: `packages/radio-station`
**Route**: `/radio`
**Port**: 3026

## Summary

Live radio streaming application with station browsing, playback controls, and a persistent player bar. Allows users to discover and listen to radio stations from various genres and regions through external radio APIs.

## Key Features

- Browse and search radio stations
- Station card display with genre and region info
- Live audio streaming playback
- Persistent player bar with play/pause and volume controls
- Station favoriting
- Genre-based station filtering

## Data Sources

- **External radio APIs**: Station directory and stream URLs

## Integration Points

- **Shell route**: `/radio` in App.tsx (no auth required)
- **Widget**: `radioStation` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `nav.radio`, `radio.*`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- HTML5 Audio API for stream playback
- Custom hooks: `useRadioPlayer` (playback state), `useRadioStations` (station data)
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/radio-station/src/**/*.test.{ts,tsx}`
- E2E: None (no dedicated e2e spec)
