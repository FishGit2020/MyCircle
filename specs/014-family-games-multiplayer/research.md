# Research: Family Games — Multiplayer & Enhancements

**Phase**: 0 — Research
**Date**: 2026-03-25
**Branch**: `014-family-games-multiplayer`

---

## 1. Existing MFE Audit

### 1.1 Games Inventory

The `packages/family-games` MFE ships **12 single-player games**:

| Game Type | File | Scoring Model |
|-----------|------|---------------|
| `trivia` | TriviaGame.tsx | +10 pts per correct answer |
| `math` | MathGame.tsx | Timed correct answers |
| `word` | WordGame.tsx | Word guessing |
| `memory` | MemoryGame.tsx | Card-match pairs |
| `headsup` | HeadsUpGame.tsx | Got-It count in 60s |
| `reaction` | ReactionGame.tsx | Speed-based |
| `simon` | SimonGame.tsx | Color sequence length |
| `sequence` | SequenceGame.tsx | 10 puzzles, 10+lvl×5 per correct |
| `colormatch` | ColorMatchGame.tsx | Timed matches |
| `maze` | MazeGame.tsx | Speed (not numeric score) |
| `anagram` | AnagramGame.tsx | Word unscrambles |
| `dino` | DinoGame.tsx | Distance-based |

**Score-bearing (numeric, comparable)**: trivia, math, word, headsup, reaction, simon, sequence, colormatch, anagram. These are suitable for Head-to-Head and tournament ranking.

**Non-scoring or time-only**: maze, dino. These should be excluded from Head-to-Head mode.

### 1.2 Score Persistence

**Decision**: Scores are persisted in **Firestore** under `games/scores/{gameType}` (top-20 by score, ordered desc). The shell exposes `window.__familyGames` bridge with `getScores(gameType)`, `subscribe(gameType, cb)`, and `saveScore(data)`. The bridge requires an authenticated Firebase user.

**Rationale**: Existing scores require login. Player profiles for tournament play will be **local-only** (no login required) because families play together on one device and may not all have accounts.

**Alternatives considered**: GraphQL mutation for scores — rejected because the existing `window.__familyGames.saveScore` is already the established pattern and adding a GraphQL score mutation would require schema + codegen changes with no user-visible benefit.

### 1.3 Timer Component

`Timer.tsx` exists and is reusable — it accepts `durationMs`, `running`, and `onTimeUp`. It renders a progress bar + countdown. **Beat the Clock** and **Head-to-Head** can reuse this component directly.

### 1.4 HeadsUp Game Pattern

`HeadsUpGame.tsx` implements exactly the "large prompt → Got It / Pass tap" pattern that Beat the Clock needs, including shuffle, countdown, and per-tap score increment. Beat the Clock extends this with:
- Categories (multiple topic lists instead of one word pool)
- Configurable duration (30 / 60 / 90s)
- "Confirmer" vs "Talker" role distinction

### 1.5 Number Sequence Game

`SequenceGame.tsx` has implicit difficulty — level increases each round, affecting puzzle complexity. It uses a fixed 90-second **total** timer (`_TIME_LIMIT = 90_000` — unused in rendered UI). There is no per-puzzle timer rendered, and no hint system. Difficulty selection and per-puzzle countdown bar are additive enhancements.

### 1.6 StorageKeys

`packages/shared/src/utils/eventBus.ts` defines all storage keys. `FAMILY_GAMES_CACHE` already exists. Three new keys are needed:
- `FAMILY_GAMES_PROFILES` — persists named player profiles and personal bests
- `FAMILY_GAMES_TOURNAMENT` — persists active tournament session (survives navigation)
- (No new key needed for leaderboard — derived from profiles + Firestore scores)

### 1.7 Window Bridge Expansion

The shell `__familyGames` bridge will need two new operations exposed:
- `getLeaderboard()` — fetch Firestore top scores across all game types for a set of uids
- Tournament save is handled by calling the existing `saveScore` per player per turn

---

## 2. Multiplayer Architecture Decision

**Decision**: **Same-device, pass-and-play** using a local tournament state machine stored in localStorage.

**Rationale**: No networking complexity, no multi-device sync issues, no latency. Families sit together; one device is the "game controller". Score is saved to Firestore (for the logged-in user) at the end of each player's turn that produces a numeric score.

**Alternatives considered**:
- Real-time networked multiplayer (WebRTC / Firestore listeners): rejected — dramatically increases complexity with no value for co-located players.
- Firebase Realtime Database session room: rejected — overkill for local play, adds dependency.

**Tournament state machine**:
```
idle → setup → handoff → playing → handoff → playing → ... → results → idle
```

The machine persists `{ players, gameList, roundCount, currentRound, currentPlayerIndex, scores }` to localStorage so accidental navigation does not lose progress.

---

## 3. Head-to-Head Mode

**Decision**: Alternating turns within a shared time budget. One player answers, then the next, then back — until the timer expires. Score is the number of correct answers in that player's turns.

**Rationale**: True simultaneous input on one touchscreen is impractical. Alternating turns is the same mechanic used by Taboo, Codenames timer games, etc.

**Compatible games**: trivia, math, sequence, anagram, colormatch. These all have discrete "answer a question" loops.

---

## 4. Beat the Clock — Prompt Categories

**Decision**: Prompt lists bundled in `packages/family-games/src/data/beatTheClockPrompts.ts`. Five initial categories: Animals, Foods, Countries, Colors, Movies/TV.

**Rationale**: No external API at runtime; works offline; easily extensible.

**Prompt count per category**: ≥ 40 prompts per category to avoid exhaustion in a 90-second round at 1 prompt/second.

---

## 5. Family Profiles — Storage

**Decision**: Player profiles stored in localStorage under `FAMILY_GAMES_PROFILES` key. Structure: array of `PlayerProfile` objects. Personal bests are embedded in the profile.

**Rationale**: No login required. Data survives app restarts. Simple JSON serialization. If user is logged in, the Firestore `saveScore` call will also record the score — the profile's personal best is the local aggregate.

**Alternative**: Firestore `users/{uid}/gameProfiles` subcollection — rejected for the core case because it requires auth and complicates profile creation for anonymous family members.

---

## 6. Constitution Compliance

| Principle | Status |
|-----------|--------|
| **I. Federated Isolation** | All changes within `packages/family-games`. No direct `@apollo/client` imports. |
| **II. Complete Integration** | This is an **enhancement** to an existing MFE, not a new MFE — most integration points (shell routes, nav, Dockerfile) are already registered. New i18n keys, StorageKeys, and window bridge methods will be added. |
| **III. GraphQL-First** | No new data is fetched via REST. Scores continue to use `window.__familyGames` bridge (Firestore). Player profiles use localStorage — no network at all. No GraphQL schema change needed. |
| **IV. Inclusive by Default** | All new strings use `t('key')`. All colors have `dark:` variants. Touch targets ≥ 44px (especially critical for the "Pass to Player" handoff and Beat the Clock tap buttons). |
| **V. Fast Tests** | All tests mock localStorage and `window.__familyGames`. Timer logic uses `vi.useFakeTimers()`. |
| **VI. Simplicity** | No new packages. Beat the Clock reuses the HeadsUp UX pattern. Tournament state uses a simple array of scores, not a complex event system. |

---

## 7. New i18n Keys (summary)

Approximately 35 new i18n keys across the feature, added to `en`, `es`, `zh` locale files. Key groups:
- `games.playTogether`, `games.tournamentSetup`, `games.addPlayer`, `games.startTournament`
- `games.passTo`, `games.yourTurn`, `games.ready`, `games.tapToStart`
- `games.finalScores`, `games.winner`, `games.tie`, `games.tournamentWinner`
- `games.headToHead`, `games.roundOf`, `games.vs`
- `games.beatTheClock`, `games.chooseCategory`, `games.chooseDuration`, `games.gotIt`, `games.nextPrompt`
- `games.categories.*` (5 categories)
- `games.familyLeaderboard`, `games.totalWins`, `games.personalBest`, `games.newBest`, `games.removeProfile`
- `games.difficultyEasy`, `games.difficultyMedium`, `games.difficultyHard`
- `games.hint`, `games.hintPenalty`
