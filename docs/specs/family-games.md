# Feature Spec: Family Games

**Status**: Implemented
**Package**: `packages/family-games`
**Route**: `/family-games`, `/family-games/:gameType`
**Port**: 3020

## Summary

Collection of 11 mini-games designed for family entertainment, featuring trivia, math challenges, word puzzles, memory matching, and more. Includes a community scoreboard with leaderboards and per-user game progress tracking in Firestore.

## Key Features

- 11 mini-games: trivia, math challenge, word game (Wordle-style), memory match, heads up, reaction time, Simon says, number sequence, color match, maze runner, anagram
- Game card selection grid on main page
- Community scoreboard with leaderboards per game type
- Per-user game progress and high scores
- Timer component for timed challenges
- Game-over screen with score display and replay option
- Dynamic game loading via code splitting (lazy imports per game)
- Breadcrumb detail broadcast for active game name

## Data Sources

- **Firestore**: `games/scores/{gameType}/{scoreId}` (community leaderboard scores)
- **Firestore**: `users/{uid}/gameProgress/{docId}` (per-user progress)
- **Local data**: Trivia questions, word lists in `data/` directory

## Integration Points

- **Shell route**: `/family-games`, `/family-games/:gameType` in App.tsx (requires auth)
- **Widget**: `familyGames` in widgetConfig.ts
- **Nav group**: Family (`nav.group.family`)
- **i18n namespace**: `nav.familyGames`, `games.*`
- **Firestore**: `games/scores/{gameType}/{scoreId}`, `users/{uid}/gameProgress/{docId}`

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Dynamic imports for per-game code splitting
- Canvas/CSS animations for visual games (memory, Simon, color match)
- Firestore for score persistence and leaderboards
- Static game data in `data/` directory

## Testing

- Unit tests: `packages/family-games/src/**/*.test.{ts,tsx}`
- E2E: `e2e/family-games.spec.ts`
