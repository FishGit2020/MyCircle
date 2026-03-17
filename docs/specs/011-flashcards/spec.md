# Feature Spec: Flashcards

**Status**: Implemented
**Package**: `packages/flashcards`
**Route**: `/flashcards`
**Port**: 3015

## Summary

Multi-category flashcard system supporting Chinese character learning, English vocabulary, Bible verse memorization, and custom cards. Features quiz mode, handwriting practice canvas, spaced repetition progress tracking, and a public card sharing system.

## Key Features

- Chinese character flashcards with pinyin keyboard and stroke practice
- English vocabulary cards
- Bible verse flashcards with verse picker integration
- Custom user-created cards
- Quiz mode with multiple answer types
- Handwriting practice canvas (PracticeCanvas) for character writing
- Character editor for detailed stroke-by-stroke learning
- Card grid and flip card animations
- Spaced repetition progress tracking
- Public flashcard sharing
- Card thumbnail previews

## Data Sources

- **Firestore**: `users/{uid}/flashcards/{cardId}` (private cards)
- **Firestore**: `users/{uid}/flashcardProgress/{docId}` (spaced repetition data)
- **Firestore**: `publicFlashcards/{cardId}` (shared public cards)
- **Firestore**: `chineseCharacters/{charId}` (community character data)
- **Local data**: Card category data in `data/` directory

## Integration Points

- **Shell route**: `/flashcards` in App.tsx (requires auth)
- **Widget**: `flashcards` in widgetConfig.ts
- **Nav group**: Learning (`nav.group.learning`)
- **i18n namespace**: `nav.flashcards`, `flashcards.*`
- **Firestore**: `users/{uid}/flashcards`, `publicFlashcards`, `chineseCharacters`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Canvas API for handwriting practice
- Pinyin keyboard component
- Bible verse picker integration
- Custom hooks for flashcard CRUD and progress
- TypeScript types in `types.ts`

## Testing

- Unit tests: `packages/flashcards/src/**/*.test.{ts,tsx}`
- E2E: `e2e/flashcards.spec.ts`
