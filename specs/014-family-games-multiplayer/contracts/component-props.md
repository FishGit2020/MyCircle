# Contract: Component Prop Interfaces

**Type**: Internal React component contracts
**Scope**: New and modified components in `packages/family-games/src/components/`

---

## New Components

### TournamentSetup

```typescript
interface TournamentSetupProps {
  onStart: (session: TournamentSession) => void;
  onCancel: () => void;
}
```

Renders: player name inputs (2–6), game selector (checkboxes), round count selector (1–3), Start Tournament button.

---

### TournamentHandoff

```typescript
interface TournamentHandoffProps {
  playerName: string;
  gameName: string;           // translated game label
  roundLabel: string;         // e.g. "Round 1 of 2"
  onReady: () => void;
}
```

Renders: "Pass the device to [playerName]" with game name shown only after tap.

---

### TournamentResults

```typescript
interface TournamentResultsProps {
  session: TournamentSession;
  onPlayAgain: () => void;
  onExit: () => void;
}
```

Renders: ranked list of players by total score, winner highlight, "Play Again" and "Exit" buttons.

---

### BeatTheClock

```typescript
interface BeatTheClockProps {
  onBack: () => void;
  // Optional: provided when used inside a tournament turn
  onTurnComplete?: (score: number, timeMs: number) => void;
}
```

---

### FamilyLeaderboard

```typescript
interface FamilyLeaderboardProps {
  onClose: () => void;
}
```

Renders: list of PlayerProfiles ranked by totalWins, personal best per game, "New Best" badge, remove profile action.

---

## Modified Components

### SequenceGame (extended props)

```typescript
// Existing:
interface SequenceGameProps {
  onBack: () => void;
}

// Extended (backwards-compatible — new props are optional):
interface SequenceGameProps {
  onBack: () => void;
  initialDifficulty?: 'easy' | 'medium' | 'hard';   // default: 'medium'
  onGameEnd?: (score: number, timeMs: number) => void; // called instead of showing GameOver when provided
}
```

### GameOver (extended props)

No change to props — the existing `onBack` + `onPlayAgain` pattern is preserved. Tournament mode bypasses GameOver entirely by using the game-level `onGameEnd` callback pattern.

---

## Hook Interfaces

### useTournament

```typescript
function useTournament(): {
  session: TournamentSession | null;
  startSession: (players: PlayerProfile[], games: GameType[], rounds: number) => void;
  recordTurnScore: (score: number, timeMs: number, difficulty: string) => void;
  advanceTurn: () => void;
  resetSession: () => void;
  currentTurn: { player: PlayerProfile; gameType: GameType; round: number } | null;
  isComplete: boolean;
}
```

### usePlayerProfiles

```typescript
function usePlayerProfiles(): {
  profiles: PlayerProfile[];
  addProfile: (displayName: string, avatarColor: AvatarColor) => PlayerProfile;
  updateProfile: (id: string, updates: Partial<Pick<PlayerProfile, 'displayName' | 'avatarColor'>>) => void;
  removeProfile: (id: string) => void;
  updatePersonalBest: (profileId: string, gameType: GameType, entry: PersonalBest) => void;
}
```
