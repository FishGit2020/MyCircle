# Data Model: Family Games — Multiplayer & Enhancements

**Phase**: 1 — Design
**Date**: 2026-03-25
**Branch**: `014-family-games-multiplayer`

---

## Entities

### PlayerProfile

Represents a named local player (no login required).

```typescript
interface PlayerProfile {
  id: string;                           // uuid, generated on creation
  displayName: string;                  // 1–20 chars
  avatarColor: AvatarColor;             // one of 8 preset colors
  totalWins: number;                    // tournament wins ever
  personalBests: Record<GameType, PersonalBest | undefined>;
  createdAt: string;                    // ISO 8601
  updatedAt: string;                    // ISO 8601
}

interface PersonalBest {
  score: number;
  timeMs: number;
  difficulty: string;
  achievedAt: string;                   // ISO 8601
}

type AvatarColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'teal';
```

**Storage**: `localStorage[StorageKeys.FAMILY_GAMES_PROFILES]` as JSON array.

**Validation rules**:
- `displayName`: non-empty, ≤ 20 characters, trimmed
- `avatarColor`: must be one of the 8 preset values
- `totalWins`: non-negative integer

---

### TournamentSession

Represents an active or completed pass-and-play tournament.

```typescript
interface TournamentSession {
  id: string;                           // uuid
  players: PlayerProfile[];             // 2–6 players in order
  gameList: GameType[];                 // games included in this tournament
  roundCount: number;                   // how many full rounds (1–3)
  status: 'setup' | 'playing' | 'results';
  currentRound: number;                 // 1-indexed
  currentPlayerIndex: number;           // index into players[]
  currentGameIndex: number;             // index into gameList[]
  scores: TournamentScore[];            // all recorded scores
  startedAt: string;                    // ISO 8601
  completedAt?: string;                 // ISO 8601, set when status = 'results'
}

interface TournamentScore {
  playerId: string;                     // PlayerProfile.id
  gameType: GameType;
  round: number;
  score: number;
  timeMs: number;
  difficulty: string;
  recordedAt: string;                   // ISO 8601
}
```

**Storage**: `localStorage[StorageKeys.FAMILY_GAMES_TOURNAMENT]` as JSON object (single active session).

**State transitions**:
```
setup → playing → results
               ↗ (on each turn end: advance player/game index)
```

**Derived computations**:
- `totalScoreByPlayer(session)`: sum of all `TournamentScore.score` per `playerId`
- `rankingByPlayer(session)`: sorted desc by total score; ties share rank
- `currentTurn(session)`: `{ player: players[currentPlayerIndex], game: gameList[currentGameIndex] }`

---

### HeadToHeadRound

Represents a single Head-to-Head match between two players.

```typescript
interface HeadToHeadRound {
  gameType: GameType;                   // must be score-compatible (see research.md §1.1)
  player1: { profileId: string; displayName: string };
  player2: { profileId: string; displayName: string };
  durationMs: number;                   // 60_000 | 90_000 | 120_000
  player1Score: number;
  player2Score: number;
  winnerId: string | null;              // null = tie
  completedAt: string;                  // ISO 8601
}
```

**Not persisted** — computed in-memory during a session and optionally fed into TournamentScore.

---

### BeatTheClockRound

Represents one round of the Beat the Clock party game.

```typescript
interface BeatTheClockRound {
  category: BeatTheClockCategory;
  durationMs: 30_000 | 60_000 | 90_000;
  promptsShown: number;
  confirmed: number;                    // score = confirmed count
  players: string[];                    // displayNames of players in this round
  completedAt: string;                  // ISO 8601
}

type BeatTheClockCategory = 'animals' | 'foods' | 'countries' | 'colors' | 'movies';
```

**Not persisted** — completed round result shown on screen and optionally fed into TournamentScore as a `beatclock` game type.

---

### ScoreEntry (existing — Firestore)

No changes to the existing Firestore schema. Scores continue to be written to `games/scores/{gameType}` with the existing `window.__familyGames.saveScore` bridge.

```typescript
// Existing (read-only reference):
interface ScoreEntry {
  id: string;                           // Firestore document ID
  gameType: string;
  score: number;
  timeMs: number;
  difficulty: string;
  playedBy: { uid: string; displayName: string };
  playedAt: Timestamp;
}
```

---

## Storage Map

| Key (`StorageKeys.*`) | Type | Managed by |
|-----------------------|------|------------|
| `FAMILY_GAMES_PROFILES` | `PlayerProfile[]` | `usePlayerProfiles` hook |
| `FAMILY_GAMES_TOURNAMENT` | `TournamentSession \| null` | `useTournament` hook |
| `FAMILY_GAMES_CACHE` | existing | existing (unchanged) |

---

## Sequence Difficulty Model (Enhancement)

The existing `SequenceGame` uses `level` (0–9) to implicitly vary puzzle complexity. The enhancement maps explicit difficulty to level ranges and per-puzzle timer:

| Difficulty | Level Range | Puzzle Types | Per-Puzzle Timer | Hint Available |
|------------|-------------|--------------|-----------------|----------------|
| Easy | 0–3 | arithmetic only | none | yes (no penalty) |
| Medium | 0–6 | existing mix | none | yes (−5 pts) |
| Hard | 0–9 | all types incl. geometric | 15s | yes (−10 pts) |

---

## Beat the Clock Prompts Structure

```typescript
// packages/family-games/src/data/beatTheClockPrompts.ts
export const BEAT_THE_CLOCK_PROMPTS: Record<BeatTheClockCategory, string[]> = {
  animals:   [...],   // ≥ 40 items
  foods:     [...],   // ≥ 40 items
  countries: [...],   // ≥ 40 items
  colors:    [...],   // ≥ 40 items
  movies:    [...],   // ≥ 40 items
};
```

Prompts are shuffled before each round. When all prompts in a category are exhausted, the round ends early with a "Well done — you named them all!" message.
