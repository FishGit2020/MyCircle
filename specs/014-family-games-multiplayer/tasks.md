# Tasks: Family Games — Multiplayer & Enhancements

**Input**: Design documents from `specs/014-family-games-multiplayer/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared foundation that enables all user stories. Must complete before any user story work begins.

- [ ] T001 Add `FAMILY_GAMES_PROFILES` and `FAMILY_GAMES_TOURNAMENT` to `StorageKeys` in `packages/shared/src/utils/eventBus.ts` (add after `FAMILY_GAMES_CACHE` line)
- [ ] T002 Rebuild shared package so new StorageKeys are available to all MFEs: run `pnpm --filter @mycircle/shared build`
- [ ] T003 [P] Create `packages/family-games/src/hooks/` directory (if not exists); confirm `packages/family-games/src/data/` directory exists
- [ ] T004 [P] Update `window.__familyGames` type declaration in `packages/shell/src/remotes.d.ts` — add `getLeaderboard(uids: string[]): Promise<LeaderboardEntry[]>` method and `LeaderboardEntry` interface

**Checkpoint**: `StorageKeys.FAMILY_GAMES_PROFILES` and `StorageKeys.FAMILY_GAMES_TOURNAMENT` are importable from `@mycircle/shared` in the MFE.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks and data that every user story depends on. No user story implementation can start until this phase is complete.

**⚠️ CRITICAL**: T005–T008 are prerequisites for all user story phases.

- [ ] T005 Implement `usePlayerProfiles` hook in `packages/family-games/src/hooks/usePlayerProfiles.ts` — full CRUD (add, rename, remove profile), personal best tracking (`updatePersonalBest`), localStorage persistence under `StorageKeys.FAMILY_GAMES_PROFILES`. Interfaces from `contracts/component-props.md`. Types: `PlayerProfile`, `PersonalBest`, `AvatarColor` from `data-model.md`.
- [ ] T006 Implement `useTournament` hook in `packages/family-games/src/hooks/useTournament.ts` — tournament state machine (`idle → setup → handoff → playing → results`), `startSession`, `recordTurnScore`, `advanceTurn`, `resetSession`, `currentTurn`, `isComplete`. Persists `TournamentSession` to `StorageKeys.FAMILY_GAMES_TOURNAMENT`. Types from `data-model.md`.
- [ ] T007 Create Beat the Clock prompt data file `packages/family-games/src/data/beatTheClockPrompts.ts` — export `BEAT_THE_CLOCK_PROMPTS: Record<BeatTheClockCategory, string[]>` with 5 categories (`animals`, `foods`, `countries`, `colors`, `movies`), each containing ≥ 40 prompts. Export `BeatTheClockCategory` type.
- [ ] T008 [P] Write unit tests for `usePlayerProfiles` in `packages/family-games/src/hooks/usePlayerProfiles.test.ts` — mock localStorage; test add/rename/remove profile, personal best update, duplicate name handling, max name length (20 chars).
- [ ] T009 [P] Write unit tests for `useTournament` in `packages/family-games/src/hooks/useTournament.test.ts` — mock localStorage; test session start, turn advancement, score recording, session completion, state persistence/restore after unmount.

**Checkpoint**: Both hooks are implemented, tested, and passing. Tournament and profile data can be written/read from localStorage independently of any UI.

---

## Phase 3: User Story 1 — Pass-and-Play Tournament (Priority: P1) 🎯 MVP

**Goal**: 2–6 named players register, each takes a turn playing a chosen game, and a final ranked leaderboard is shown after all rounds.

**Independent Test**: Open Family Games → tap "Play Together" → add 3 players → pick 2 games → each player completes one turn → verify final leaderboard shows all 3 players with correct scores.

### Implementation for User Story 1

- [ ] T010 [US1] Implement `TournamentSetup` component in `packages/family-games/src/components/TournamentSetup.tsx` — player name inputs (2–6 slots, add/remove), avatar color picker (8 colors), game type checkboxes (score-compatible games only: trivia, math, word, memory, headsup, reaction, simon, sequence, colormatch, anagram), round count selector (1–3). Props from `contracts/component-props.md`. All strings use `t('key')`. Touch targets ≥ 44px. Dark mode variants on all colors.
- [ ] T011 [US1] Implement `TournamentHandoff` component in `packages/family-games/src/components/TournamentHandoff.tsx` — full-screen cover that shows "[Next Player]'s turn" and the game name, with a large "I'm Ready — Tap to Start" button. Previous player's score is hidden until next player taps. All strings use `t('key')`. Touch target covers full usable height.
- [ ] T012 [US1] Implement `TournamentResults` component in `packages/family-games/src/components/TournamentResults.tsx` — ranked list (by total tournament score, desc; ties share rank), winner highlight with visual celebration, per-player per-game score breakdown, "Play Again" (same players/games) and "Exit" buttons. Props from `contracts/component-props.md`.
- [ ] T013 [US1] Add optional `onGameEnd?: (score: number, timeMs: number) => void` prop to `TriviaGame`, `MathGame`, `WordGame`, `MemoryGame`, `HeadsUpGame`, `ReactionGame`, `SimonGame`, `ColorMatchGame`, `AnagramGame` — when `onGameEnd` is provided, call it at the point where `GameOver` would normally render (bypassing `GameOver` component entirely). Changes are backwards-compatible (prop is optional). Files: `packages/family-games/src/components/TriviaGame.tsx`, `MathGame.tsx`, `WordGame.tsx`, `MemoryGame.tsx`, `HeadsUpGame.tsx`, `ReactionGame.tsx`, `SimonGame.tsx`, `ColorMatchGame.tsx`, `AnagramGame.tsx`.
- [ ] T014 [US1] Wire tournament flow into `FamilyGames.tsx` in `packages/family-games/src/components/FamilyGames.tsx` — add "Play Together" button to hub screen; add `useTournament` hook; add conditional rendering: if `session.status === 'setup'` show `TournamentSetup`, if `'playing'` and awaiting handoff show `TournamentHandoff`, if `'playing'` and player ready show the game component with `onGameEnd`, if `'results'` show `TournamentResults`. Game navigation during tournament stays within the component tree (no URL routing to `/family-games/:gameType`).
- [ ] T015 [US1] Add tournament i18n keys to `packages/shell/src/i18n/en.ts`: `games.playTogether`, `games.tournamentSetup`, `games.addPlayer`, `games.removePlayer`, `games.startTournament`, `games.playerName`, `games.selectGames`, `games.roundCount`, `games.passDeviceTo`, `games.yourTurn`, `games.tapToStart`, `games.finalScores`, `games.tournamentWinner`, `games.tie`, `games.roundOf`, `games.totalScore`, `games.playAgain`, `games.exitTournament`, `games.round`, `games.place`, `games.signInToSave`.
- [ ] T016 [US1] Add same tournament keys (T015) to `packages/shell/src/i18n/es.ts` using Unicode escapes for Spanish accented characters. Read each target line before editing to preserve exact indentation and existing Unicode escape format.
- [ ] T017 [US1] Add same tournament keys (T015) to `packages/shell/src/i18n/zh.ts`. Read each target line before editing.
- [ ] T018 [US1] Write component tests for `TournamentSetup` in `packages/family-games/src/components/TournamentSetup.test.tsx` — mock `useTournament`; test: minimum 2 players required (error on 1), maximum 6 players enforced, at least 1 game must be selected, round count 1–3, Start button triggers `onStart`.
- [ ] T019 [US1] Write component tests for `TournamentHandoff` in `packages/family-games/src/components/TournamentHandoff.test.tsx` — test: player name visible on mount, game name visible, tapping "Ready" calls `onReady`, previous score not visible before tap.
- [ ] T020 [US1] Write component tests for `TournamentResults` in `packages/family-games/src/components/TournamentResults.test.tsx` — test: players ranked by total score desc, tie case shows equal rank, winner highlighted, "Play Again" calls `onPlayAgain`, "Exit" calls `onExit`.

**Checkpoint**: A complete pass-and-play tournament can be played end-to-end with 2+ players. Score persists locally through the handoff flow. Final leaderboard is accurate.

---

## Phase 4: User Story 2 — Head-to-Head Challenge (Priority: P2)

**Goal**: Two players compete on the same score-based game with a shared countdown timer. Higher score when timer expires wins.

**Independent Test**: From "Play Together" → select "Head to Head" → choose Math game → 60s → both players take alternating turns → timer expires → winner announced.

### Implementation for User Story 2

- [ ] T021 [US2] Implement `HeadToHead` wrapper component in `packages/family-games/src/components/HeadToHead.tsx` — accepts two `PlayerProfile` objects, a `gameType` (score-compatible only), and `durationMs` (60/90/120s); manages alternating-turn logic within the shared timer; shows both players' running scores; on timer expiry calls `onRoundEnd({ winner, player1Score, player2Score })`. Uses existing `Timer.tsx` for shared countdown display. All strings use `t('key')`.
- [ ] T022 [US2] Add "Head to Head" mode to the "Play Together" flow in `TournamentSetup.tsx` (`packages/family-games/src/components/TournamentSetup.tsx`) — add a "Mode" selector (Tournament / Head to Head); Head-to-Head mode limits player count to exactly 2 and shows compatible games only. Selecting Head-to-Head mode and tapping Start passes `{ mode: 'h2h', ... }` to `onStart`.
- [ ] T023 [US2] Wire `HeadToHead` component into `FamilyGames.tsx` (`packages/family-games/src/components/FamilyGames.tsx`) — when session mode is `h2h`, render `HeadToHead` instead of the standard game. On `onRoundEnd`, call `useTournament.recordTurnScore` for each player and advance to results.
- [ ] T024 [US2] Add Head-to-Head i18n keys to `packages/shell/src/i18n/en.ts`: `games.headToHead`, `games.selectMode`, `games.tournamentMode`, `games.h2hMode`, `games.chooseDuration`, `games.duration60s`, `games.duration90s`, `games.duration120s`, `games.vs`, `games.player1`, `games.player2`, `games.yourAnswers`, `games.winnerIs`, `games.itsATie`.
- [ ] T025 [P] [US2] Add same Head-to-Head keys (T024) to `packages/shell/src/i18n/es.ts` with Unicode escapes.
- [ ] T026 [P] [US2] Add same Head-to-Head keys (T024) to `packages/shell/src/i18n/zh.ts`.
- [ ] T027 [US2] Write component tests for `HeadToHead` in `packages/family-games/src/components/HeadToHead.test.tsx` — use `vi.useFakeTimers()`; test: alternating turns, running score update, timer expiry triggers `onRoundEnd`, correct winner determined, tie case handled.

**Checkpoint**: Two players can compete head-to-head on Math Challenge or Trivia. Timer counts down, scores update per answer, winner is declared at end.

---

## Phase 5: User Story 3 — Beat the Clock (Priority: P2)

**Goal**: A new party game where players name items in a category before a countdown hits zero, with a "confirmer" tapping each valid answer.

**Independent Test**: Open Family Games → tap "Beat the Clock" from game grid → choose "Animals" category → 30s → confirm 5 answers → verify score shows 5 and a best-score comparison is shown.

### Implementation for User Story 3

- [ ] T028 [US3] Implement `BeatTheClock` component in `packages/family-games/src/components/BeatTheClock.tsx` — 3 screens: (1) setup (category picker × 5, duration selector: 30/60/90s), (2) playing (large prompt, big "Got it!" confirm button ≥ 44px, running score, Timer bar), (3) results (final count, personal best comparison). Uses `Timer.tsx` for countdown. Prompts drawn from `beatTheClockPrompts.ts`, shuffled per round. When all prompts exhausted, end round with "You named them all!" message. Props: `onBack: () => void`, optional `onTurnComplete?: (score: number, timeMs: number) => void`. All strings use `t('key')`. Dark mode on all classes.
- [ ] T029 [US3] Register Beat the Clock in `FamilyGames.tsx` (`packages/family-games/src/components/FamilyGames.tsx`) — add `'beatclock'` to `VALID_GAMES`, `GAME_TITLE_KEYS`, and the lazy-load switch. Add `GameCard` entry for `beatclock` type with an appropriate icon and color.
- [ ] T030 [US3] Add `dino` type to `GameCard.tsx` (`packages/family-games/src/components/GameCard.tsx`) — `GameType` union must include `'beatclock'` and confirm `'dino'` is present; update the type export.
- [ ] T031 [US3] Add Beat the Clock i18n keys to `packages/shell/src/i18n/en.ts`: `games.beatTheClock`, `games.beatTheClockDesc`, `games.scoringBeatTheClock`, `games.chooseCategory`, `games.category.animals`, `games.category.foods`, `games.category.countries`, `games.category.colors`, `games.category.movies`, `games.duration`, `games.confirmed`, `games.youNamedThemAll`, `games.bestRound`, `games.newRoundBest`.
- [ ] T032 [P] [US3] Add same Beat the Clock keys (T031) to `packages/shell/src/i18n/es.ts` with Unicode escapes.
- [ ] T033 [P] [US3] Add same Beat the Clock keys (T031) to `packages/shell/src/i18n/zh.ts`.
- [ ] T034 [US3] Write component tests for `BeatTheClock` in `packages/family-games/src/components/BeatTheClock.test.tsx` — use `vi.useFakeTimers()`; mock `beatTheClockPrompts`; test: category picker renders 5 options, duration selector renders 3 options, "Got it!" increments score, timer expiry triggers results, prompt exhaustion triggers early end.

**Checkpoint**: Beat the Clock appears as a game card on the hub. A family can select a category, set a duration, and play a full round. Score updates on each "Got it!" tap and final score is shown.

---

## Phase 6: User Story 4 — Improved Number Sequence Game (Priority: P3)

**Goal**: Number Sequence gains explicit Easy/Medium/Hard difficulty selection, a per-puzzle countdown bar on Medium/Hard, and a toggleable hint with score penalty.

**Independent Test**: Start Number Sequence → select "Hard" → verify puzzles include geometric/compound types, a per-puzzle countdown bar appears, and toggling "Hint" reveals the pattern and deducts from potential score.

### Implementation for User Story 4

- [ ] T035 [US4] Enhance `SequenceGame.tsx` in `packages/family-games/src/components/SequenceGame.tsx`:
  - Add difficulty selector screen before the menu (Easy / Medium / Hard — replace current direct-start menu).
  - Easy: only `type === 0` (arithmetic) puzzles; no per-puzzle timer; hint available at 0 cost.
  - Medium: existing puzzle mix (`Math.random() * 4`); no per-puzzle timer; hint deducts 5 pts from current puzzle's potential score.
  - Hard: all 4 puzzle types; 15-second per-puzzle countdown using `Timer.tsx`; hint deducts 10 pts.
  - Add "Hint" toggle button that reveals the pattern type (e.g., "+3", "×2", "+n", "n²") when tapped.
  - Add optional `initialDifficulty?: 'easy' | 'medium' | 'hard'` and `onGameEnd?: (score: number, timeMs: number) => void` props (backwards-compatible).
  - Per-puzzle timer: when it expires, count puzzle as incorrect and advance to next puzzle.
- [ ] T036 [US4] Add Sequence difficulty i18n keys to `packages/shell/src/i18n/en.ts`: `games.chooseDifficulty`, `games.difficultyEasy`, `games.difficultyMedium`, `games.difficultyHard`, `games.hint`, `games.hintPenalty`, `games.hintPenalty5`, `games.hintPenalty10`, `games.easyDesc`, `games.mediumDesc`, `games.hardDesc`, `games.timeUp`.
- [ ] T037 [P] [US4] Add same difficulty keys (T036) to `packages/shell/src/i18n/es.ts` with Unicode escapes.
- [ ] T038 [P] [US4] Add same difficulty keys (T036) to `packages/shell/src/i18n/zh.ts`.
- [ ] T039 [US4] Write component tests for enhanced `SequenceGame` in `packages/family-games/src/components/SequenceGame.test.tsx` — use `vi.useFakeTimers()`; test: difficulty selector renders 3 options, Easy only generates arithmetic puzzles, Hard shows per-puzzle Timer, hint toggle shows/hides pattern, hint deducts correct penalty from score, per-puzzle timer expiry advances to next puzzle.

**Checkpoint**: Number Sequence shows a difficulty selection screen. Easy mode generates only simple sequences. Hard mode has a per-puzzle timer. Hint toggle reveals the pattern at a score cost.

---

## Phase 7: User Story 5 — Family Leaderboard & Player Profiles (Priority: P3)

**Goal**: Named local player profiles persist across sessions, track total tournament wins, personal bests per game, and can be managed (add/rename/delete) from a dedicated leaderboard screen.

**Independent Test**: Create a profile "Dad" → play 2 games solo → open "Family Leaderboard" → confirm "Dad" appears with correct personal bests. Delete profile → confirm it is gone after confirmation.

### Implementation for User Story 5

- [ ] T040 [US5] Add `getLeaderboard` method to `window.__familyGames` bridge in `packages/shell/src/lib/firebase.ts` — inside the existing `if (db && auth)` block, add `getLeaderboard(uids: string[]): Promise<LeaderboardEntry[]>`. Implementation: for each uid, query `games/scores/*` (or use a collectionGroup query on `games` collection) ordered by score desc, limit to top 3 per game type per uid, flatten and return. Returns `[]` if db unavailable.
- [ ] T041 [US5] Implement `FamilyLeaderboard` component in `packages/family-games/src/components/FamilyLeaderboard.tsx` — uses `usePlayerProfiles`; displays ranked list of profiles by `totalWins` (desc); per-profile: avatar color chip, display name, total wins count, best game highlight (highest `personalBest.score` across all game types), "New Best!" badge (shown for 24h after `personalBest.achievedAt`); actions: rename (inline edit), remove (with confirmation dialog). If user is authenticated, optionally calls `window.__familyGames?.getLeaderboard` to enrich with Firestore scores. Props: `onClose: () => void`.
- [ ] T042 [US5] Wire `FamilyLeaderboard` into `FamilyGames.tsx` (`packages/family-games/src/components/FamilyGames.tsx`) — add a "Family Leaderboard" button/link on the hub screen. When tapped, render `FamilyLeaderboard` as an overlay or navigate to it within the hub view. On close, return to hub.
- [ ] T043 [US5] Update tournament win tracking — in `useTournament`'s `advanceTurn` / session completion logic, call `usePlayerProfiles().updatePersonalBest` for each score recorded, and increment `totalWins` for the tournament winner's profile. Wire this call from `FamilyGames.tsx` when `isComplete` becomes `true`.
- [ ] T044 [US5] Add Family Leaderboard i18n keys to `packages/shell/src/i18n/en.ts`: `games.familyLeaderboard`, `games.profiles`, `games.totalWins`, `games.personalBest`, `games.newBest`, `games.noProfiles`, `games.createProfile`, `games.renameProfile`, `games.removeProfile`, `games.confirmRemove`, `games.avatarColor`, `games.wins`, `games.bestScore`, `games.noBestYet`.
- [ ] T045 [P] [US5] Add same leaderboard keys (T044) to `packages/shell/src/i18n/es.ts` with Unicode escapes.
- [ ] T046 [P] [US5] Add same leaderboard keys (T044) to `packages/shell/src/i18n/zh.ts`.
- [ ] T047 [US5] Write component tests for `FamilyLeaderboard` in `packages/family-games/src/components/FamilyLeaderboard.tsx` — mock `usePlayerProfiles` and `window.__familyGames`; test: profiles ranked by totalWins, "New Best!" badge appears within 24h, rename updates profile name, remove triggers confirmation then removes profile, "no profiles" empty state shown when profiles array is empty.

**Checkpoint**: Family Leaderboard is accessible from the game hub. Profiles persist across page reloads. Personal bests update after game sessions. Tournament wins increment after tournament completion.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Bug fixes, quality, a11y audit, and final validation.

- [ ] T048 Fix `Scoreboard.tsx` (`packages/family-games/src/components/Scoreboard.tsx`) — add `'dino'` and `'beatclock'` to `GAME_ORDER` array and corresponding entries in `GAME_COLORS` and `GAME_LABEL_KEYS` maps. Fix existing TypeScript gap where `GAME_ORDER` omits `dino`.
- [ ] T049 [P] Accessibility audit on all new components — verify: all interactive elements have `aria-label` or visible label, all non-submit buttons have `type="button"`, touch targets ≥ 44px (especially Beat the Clock "Got it!" and Tournament Handoff tap area), color is not the sole differentiator for player avatars (add player number or name).
- [ ] T050 [P] Dark mode audit — verify every Tailwind color utility class in new/modified components has a matching `dark:` variant. Check TournamentSetup, TournamentHandoff, TournamentResults, HeadToHead, BeatTheClock, FamilyLeaderboard.
- [ ] T051 Run full local validation suite: `pnpm lint && pnpm test:run && pnpm typecheck` — fix any failures before pushing.
- [ ] T052 [P] Run MCP validators: `validate_i18n` (confirm all 3 locale files have identical key sets), `validate_all` (confirm no integration gaps).

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3–7 (User Stories, priority order)
                                          → Phase 8 (Polish, after all stories done)
```

- **Phase 1**: No dependencies — start immediately.
- **Phase 2**: Depends on Phase 1 (T001–T004). **BLOCKS** all user story phases.
- **Phase 3 (US1)**: Depends on Phase 2 (T005, T006 required). US1 is the MVP.
- **Phase 4 (US2)**: Depends on Phase 2 (T005, T006). Integrates with Phase 3 (adds mode to `TournamentSetup`).
- **Phase 5 (US3)**: Depends on Phase 2 (T007 required). Independent of US1/US2.
- **Phase 6 (US4)**: Depends on Phase 2. Fully independent of US1–US3.
- **Phase 7 (US5)**: Depends on Phase 2 (T005 required) and Phase 3 (needs tournament win tracking).
- **Phase 8**: Depends on all desired user story phases being complete.

### User Story Dependencies

| Story | Depends On | Notes |
|-------|-----------|-------|
| US1 (Tournament) | T005, T006 (hooks) | Core MVP — implement first |
| US2 (Head-to-Head) | T005, T006, US1 partial (TournamentSetup) | Extends US1 setup UI |
| US3 (Beat the Clock) | T007 (prompts data) | Independent of US1/US2 |
| US4 (Sequence) | Phase 2 complete | Fully independent |
| US5 (Leaderboard) | T005 (profiles hook), US1 complete (win tracking) | Depends on US1 completion |

### Within Each User Story

- Hook/data tasks before component tasks
- Components before wiring into `FamilyGames.tsx`
- Implementation before i18n and tests
- Core flow before edge cases (error states, empty states)

### Parallel Opportunities

Within Phase 2: T005, T006, T007 can all be written in parallel (different files).
Within Phase 3 (US1): T010, T011, T012 can be implemented in parallel (separate component files). T013 (adding `onGameEnd` prop to 9 games) can also run in parallel with T010–T012.
Within i18n tasks: es.ts and zh.ts updates ([P]) can run in parallel after en.ts is done.
Phase 5 and Phase 6 are fully independent and can run in parallel with each other after Phase 2.
Phase 8: T049 and T050 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# After Phase 2 completes, these 4 tasks can start simultaneously:
T010  Implement TournamentSetup.tsx
T011  Implement TournamentHandoff.tsx
T012  Implement TournamentResults.tsx
T013  Add onGameEnd prop to 9 existing game components

# After T010–T013 complete:
T014  Wire tournament into FamilyGames.tsx (depends on T010–T013)

# After T014:
T015  Add en.ts i18n keys

# After T015 (in parallel):
T016  Add es.ts i18n keys
T017  Add zh.ts i18n keys

# After T010–T012 (in parallel):
T018  Tests for TournamentSetup
T019  Tests for TournamentHandoff
T020  Tests for TournamentResults
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001–T004)
2. Complete Phase 2 (T005–T009)
3. Complete Phase 3 / US1 (T010–T020)
4. **STOP and VALIDATE**: Run a 3-player tournament end-to-end. Confirm scores persist through handoffs. Confirm final leaderboard is correct.
5. Demo to family before implementing US2–US5.

### Incremental Delivery

1. Phase 1 + Phase 2 → Hooks ready
2. Phase 3 (US1) → Tournament playable (MVP ✅)
3. Phase 4 (US2) → Head-to-Head competitive mode added
4. Phase 5 (US3) → Beat the Clock party game added
5. Phase 6 (US4) → Sequence game enhanced with difficulty
6. Phase 7 (US5) → Persistent profiles and family leaderboard added
7. Phase 8 → Polish, validation, PR ready

### Parallel Team Strategy

With two developers after Phase 2:
- **Dev A**: US1 (Tournament) → US2 (Head-to-Head)
- **Dev B**: US3 (Beat the Clock) → US4 (Sequence) → US5 (Leaderboard)

---

## Notes

- [P] tasks = different files, no blocking dependencies — safe to work in parallel
- [Story] label maps task to specific user story for traceability
- All components must pass: `type="button"` on all non-submit buttons, `dark:` on all colors, `t('key')` on all visible strings, ≥ 44px touch targets
- Always read Spanish i18n lines before editing (Unicode escape format: `\u00e9` etc.)
- Commit after each task group (one commit per logical unit, not per file)
- Run `pnpm --filter @mycircle/shared build` after any changes to `eventBus.ts`
- The `window.__familyGames` bridge is only available when Firebase is initialized; always guard with `api?.methodName` null checks
