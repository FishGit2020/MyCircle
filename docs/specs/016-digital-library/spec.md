# Feature Spec: Digital Library

**Status**: Implemented
**Package**: `packages/digital-library`
**Route**: `/library`, `/library/:bookId`
**Port**: 3019

## Summary

EPUB e-book reader and library management system with chapter navigation, text-to-speech (TTS) playback, audio conversion, and reading controls. Books are uploaded via Cloud Function and stored in Firestore with chapter-level granularity.

## Key Features

- EPUB book upload and management
- Chapter-by-chapter book reader with navigation
- Table of contents with chapter selection
- Text-to-speech (TTS) via browser speech synthesis
- Audio chapter conversion with progress tracking
- Audio player for converted chapters
- Reader controls (font size, theme, scroll position)
- Deep-link to specific books via `/library/:bookId`

## Data Sources

- **Cloud Function**: `/digital-library-api/**` -> `digitalLibrary` (book upload, chapter extraction)
- **Firestore**: `books/{bookId}` (book metadata)
- **Firestore**: `books/{bookId}/chapters/{chapterId}` (chapter content, written by Cloud Function)

## Integration Points

- **Shell route**: `/library`, `/library/:bookId` in App.tsx (requires auth)
- **Widget**: `digitalLibrary` in widgetConfig.ts
- **Nav group**: Workspace (`nav.group.workspace`)
- **i18n namespace**: `nav.digitalLibrary`, `digitalLibrary.*`
- **Cloud Function**: `/digital-library-api/**` -> `digitalLibrary`
- **Firestore**: `books/{bookId}`, `books/{bookId}/chapters/{chapterId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- EPUB parsing via Cloud Function
- Web Speech API (SpeechSynthesis) for browser TTS
- Audio player component for converted chapters
- Cloud Function for book processing and chapter extraction
- Custom hooks for book/chapter management

## Testing

- Unit tests: `packages/digital-library/src/**/*.test.{ts,tsx}`
- E2E: `e2e/digital-library.spec.ts`
