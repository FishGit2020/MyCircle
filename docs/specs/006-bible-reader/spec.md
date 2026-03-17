# Feature Spec: Bible Reader

**Status**: Implemented
**Package**: `packages/bible-reader`
**Route**: `/bible`
**Port**: 3008

## Summary

Comprehensive Bible reader supporting 66 books across 19+ translations via YouVersion API. Features verse of the day, bookmarks, daily devotionals, community notes, and reading progress tracking. One of the core faith-related MFEs.

## Key Features

- Full Bible text: 66 books, all chapters and verses
- 19+ translation versions (default: NIV 2011, version ID 111)
- Verse of the day display
- Bookmark management with timestamps (persisted to localStorage + Firestore sync)
- Last-read position tracking with resume
- Daily devotional content via shared `getDailyDevotional` utility
- Verse reference parsing (`parseVerseReference` from shared)
- Community notes integration
- Translation version selector with persistence
- URL search params for deep-linking to specific passages

## Data Sources

- **YouVersion API**: Bible text, translations, verse of the day
- **localStorage**: `StorageKeys.BIBLE_TRANSLATION`, `StorageKeys.BIBLE_BOOKMARKS`, `StorageKeys.BIBLE_LAST_READ`
- **Firestore sync**: Bookmarks restored via `restoreUserData` on sign-in

## Integration Points

- **Shell route**: `/bible` in App.tsx
- **Widget**: `verse` in widgetConfig.ts (verse of the day)
- **Nav group**: Faith (`nav.group.faith`)
- **i18n namespace**: `nav.bible`, `bible.*`
- **Shared utilities**: `getDailyDevotional`, `parseVerseReference`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Custom hooks: `useVotd`, `useBiblePassage`, `useBibleVersions`
- `BIBLE_BOOKS` data constant for book metadata (chapter counts)
- YouVersion REST API for Bible content

## Testing

- Unit tests: `packages/bible-reader/src/**/*.test.{ts,tsx}`
- E2E: `e2e/community-notes.spec.ts`, `e2e/daily-devotional.spec.ts`
