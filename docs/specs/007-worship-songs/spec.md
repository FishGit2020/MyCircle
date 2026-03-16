# Feature Spec: Worship Songs

**Status**: Implemented
**Package**: `packages/worship-songs`
**Route**: `/worship`, `/worship/new`, `/worship/:songId`, `/worship/:songId/edit`
**Port**: 3009

## Summary

Collaborative worship song management with a ChordPro editor, chord transposition, auto-scroll for live performance, metronome, and capo calculator. Songs are stored in Firestore with real-time sync, allowing teams to share and edit songs collaboratively.

## Key Features

- ChordPro format editor for creating/editing songs
- Chord transposition (up/down semitones)
- Auto-scroll for hands-free live performance
- Built-in metronome with adjustable BPM
- Capo calculator for guitar players
- Song list with search and filtering
- YouTube link integration for reference recordings
- Real-time Firestore sync for collaborative editing
- Create, edit, view, and delete songs
- Chord rendering with inline display above lyrics

## Data Sources

- **Firestore**: `worshipSongs` collection (real-time `onSnapshot` sync)

## Integration Points

- **Shell route**: `/worship`, `/worship/new`, `/worship/:songId`, `/worship/:songId/edit` in App.tsx (all require auth)
- **Widget**: `worship` in widgetConfig.ts
- **Nav group**: Faith (`nav.group.faith`)
- **i18n namespace**: `nav.worship`, `worship.*`
- **Firestore**: `worshipSongs/{songId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- ChordPro parsing and rendering
- Firestore real-time listeners (`onSnapshot`)
- Web Audio API for metronome
- Custom CSS (`index.css`) for chord styling
- Utility functions in `utils/` for chord transposition

## Testing

- Unit tests: `packages/worship-songs/src/**/*.test.{ts,tsx}`
- E2E: `e2e/worship-print.spec.ts`
