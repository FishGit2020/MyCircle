# Implementation Plan: Family Games — Multiplayer & Enhancements

**Branch**: `014-family-games-multiplayer` | **Date**: 2026-03-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/014-family-games-multiplayer/spec.md`

---

## Summary

Extend the existing `family-games` MFE with pass-and-play tournament mode (2–6 named players), head-to-head challenge, a new "Beat the Clock" party game, Number Sequence difficulty levels, and a persistent family leaderboard with local player profiles. All state is stored in `localStorage`; Firestore scores continue to use the existing `window.__familyGames` bridge. No new packages, no schema changes, no new REST endpoints.

---

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, `@mycircle/shared` (useTranslation, StorageKeys, PageContent), react-router, Tailwind CSS — no new packages
**Storage**: localStorage (player profiles, active tournament session); Firestore via existing `window.__familyGames` bridge (score persistence, requires auth)
**Testing**: Vitest + React Testing Library; `vi.useFakeTimers()` for timer logic; mock `window.__familyGames` and `localStorage`
**Target Platform**: Web (mobile-first), all modern browsers
**Project Type**: MFE feature enhancement (existing package `packages/family-games`)
**Performance Goals**: Tournament handoff screen renders in <100ms; no new network calls on tournament screens
**Constraints**: Offline-capable for all tournament/profile functionality; graceful degradation when not authenticated (skip Firestore save, show sign-in hint)
**Scale/Scope**: 1 MFE package modified, 1 shell file modified, 1 shared file modified, ~12 new/modified source files, ~35 new i18n keys

---

## Constitution Check

| Principle | Check | Status |
|-----------|-------|--------|
| **I. Federated Isolation** | All changes within `packages/family-games` except minimal additions to shell bridge and shared StorageKeys. No direct `@apollo/client` imports. | ✅ PASS |
| **II. Complete Integration** | Enhancement to existing MFE — existing shell routes, nav, Dockerfile entries are unchanged. New i18n keys added to all 3 locales. StorageKeys updated in shared. remotes.d.ts updated. | ✅ PASS |
| **III. GraphQL-First** | No MFE data operations go through REST. Score persistence uses existing `window.__familyGames` Firestore bridge. Player profiles use localStorage (no network). | ✅ PASS |
| **IV. Inclusive by Default** | All new strings use `t('key')`. All colors have `dark:` variants. Beat the Clock tap buttons: min 44px height. Tournament Handoff: full-screen tap target. Semantic HTML used throughout. | ✅ PASS |
| **V. Fast Tests, Safe Code** | Timers mocked with `vi.useFakeTimers()`. localStorage mocked. `window.__familyGames` mocked per test. No per-test timeout >5000ms. `userEvent.setup({ delay: null })`. | ✅ PASS |
| **VI. Simplicity** | No new packages. Beat the Clock reuses existing Timer and HeadsUp patterns. Tournament state is a simple counter + array. No abstractions beyond what is needed. | ✅ PASS |

**Complexity Tracking**: No violations — no entries required.

---

## Project Structure

### Documentation (this feature)

```text
specs/014-family-games-multiplayer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── window-bridge.md      # __familyGames bridge extensions
│   └── component-props.md    # Component + hook interfaces
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
packages/family-games/src/
├── components/
│   ├── FamilyGames.tsx          # MODIFIED — add tournament routing, Play Together button
│   ├── SequenceGame.tsx         # MODIFIED — difficulty levels, per-puzzle timer, hints
│   ├── Scoreboard.tsx           # MODIFIED — add dino to GAME_ORDER
│   ├── TournamentSetup.tsx      # NEW — player names, game + round selection
│   ├── TournamentHandoff.tsx    # NEW — "Pass to [Player]" cover screen
│   ├── TournamentResults.tsx    # NEW — final ranked leaderboard
│   ├── BeatTheClock.tsx         # NEW — category party game with timer
│   └── FamilyLeaderboard.tsx   # NEW — named profiles + wins
├── hooks/
│   ├── useTournament.ts         # NEW — tournament state machine (localStorage)
│   └── usePlayerProfiles.ts    # NEW — player profile CRUD (localStorage)
└── data/
    └── beatTheClockPrompts.ts   # NEW — bundled prompt categories (5 × ≥40 prompts)

packages/shared/src/utils/
└── eventBus.ts                  # MODIFIED — add FAMILY_GAMES_PROFILES, FAMILY_GAMES_TOURNAMENT

packages/shell/src/
├── lib/firebase.ts              # MODIFIED — add getLeaderboard to __familyGames bridge
└── remotes.d.ts                 # MODIFIED — add getLeaderboard type declaration

packages/shell/src/i18n/
├── en.ts                        # MODIFIED — ~35 new games.* keys
├── es.ts                        # MODIFIED — same keys, Spanish
└── zh.ts                        # MODIFIED — same keys, Chinese
```

**Structure Decision**: Single MFE package enhancement. No new packages. Shell receives minimal additions (one bridge method, type update). Shared receives two StorageKeys entries.

---

## Phase 0: Research — Complete

See [research.md](./research.md) for full findings. All unknowns resolved:

- **Score persistence**: Existing `window.__familyGames` Firestore bridge (auth-gated). Player profiles use localStorage (no auth required).
- **Multiplayer architecture**: Same-device pass-and-play; localStorage state machine.
- **Beat the Clock**: HeadsUp pattern + categories + configurable timer.
- **Sequence enhancements**: Difficulty selector maps to puzzle type filter + optional per-puzzle timer.
- **No new packages or schema changes required.**

---

## Phase 1: Design — Complete

See [data-model.md](./data-model.md) for entity definitions and [contracts/](./contracts/) for component interfaces.

Key design decisions:
1. `useTournament` owns the state machine and localStorage persistence.
2. `usePlayerProfiles` owns profile CRUD and personal best tracking.
3. `BeatTheClock` reuses `Timer.tsx` component unchanged.
4. `SequenceGame` receives optional `initialDifficulty` + `onGameEnd` props — fully backwards-compatible.
5. `FamilyLeaderboard` reads from both `usePlayerProfiles` (local wins) and optionally `window.__familyGames.getLeaderboard` (Firestore best scores for authenticated users).

---

## Phase 2: Implementation Phases

### P1 — Foundation (enables everything else)

1. Add `FAMILY_GAMES_PROFILES` and `FAMILY_GAMES_TOURNAMENT` to `StorageKeys` in `packages/shared/src/utils/eventBus.ts`
2. Rebuild shared: `pnpm build:shared`
3. Implement `usePlayerProfiles` hook
4. Implement `useTournament` hook
5. Create `beatTheClockPrompts.ts` data file (5 categories × ≥40 prompts each)

### P2 — Core Multiplayer

6. Implement `TournamentSetup.tsx` (player + game selection UI)
7. Implement `TournamentHandoff.tsx` (pass-device cover screen)
8. Implement `TournamentResults.tsx` (final leaderboard)
9. Wire tournament flow into `FamilyGames.tsx` — add "Play Together" button and conditional rendering of tournament screens vs. game screens
10. Update all score-bearing games to accept optional `onGameEnd(score, timeMs)` prop (GameOver bypass)

### P3 — New Game & Enhancements

11. Implement `BeatTheClock.tsx` (new game, added to VALID_GAMES + FamilyGames grid)
12. Enhance `SequenceGame.tsx` — difficulty selector, per-puzzle countdown, hint system
13. Add Head-to-Head mode wrapper (score-compatible games only) — selectable from Play Together flow

### P4 — Profiles & Leaderboard

14. Implement `FamilyLeaderboard.tsx` (profile list, wins, personal bests, remove action)
15. Add `getLeaderboard` to shell `window.__familyGames` bridge + `remotes.d.ts` type update
16. Fix `Scoreboard.tsx` — add `dino` to `GAME_ORDER` (existing bug)

### P5 — i18n, a11y, Tests

17. Add all ~35 new `games.*` keys to `en.ts`, `es.ts`, `zh.ts`
18. Write unit tests for `useTournament`, `usePlayerProfiles`
19. Write component tests for `TournamentSetup`, `TournamentHandoff`, `TournamentResults`
20. Write component tests for `BeatTheClock`
21. Write component tests for updated `SequenceGame` (difficulty, hint)
22. Run `pnpm lint && pnpm test:run && pnpm typecheck`

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Game `onGameEnd` refactor breaks existing GameOver flow | Medium | Medium | Use optional prop with `|| existing GameOver render` fallback |
| i18n Spanish file encoding errors | Low | Low | Always read exact line before editing; use Unicode escapes |
| Scoreboard missing `dino` type causes TypeScript error | High | Low | Fix in same PR (P4 step 16) |
| `window.__familyGames` not yet set when BeatTheClock mounts | Low | Low | Guard with `api?.saveScore` null check (existing pattern) |
| Beat the Clock prompt exhaustion mid-round | Low | Low | End round early with celebratory message (spec §EdgeCases) |
