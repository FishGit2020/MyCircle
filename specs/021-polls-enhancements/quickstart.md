# Quickstart: Polls Enhancements (021)

**Branch**: `021-polls-enhancements`
**Date**: 2026-03-31

---

## Setup

```bash
git checkout 021-polls-enhancements
pnpm install
pnpm build:shared
```

---

## Run in Dev

```bash
pnpm dev
# or just the polls MFE + shell:
pnpm dev:shell & pnpm dev:poll-system
```

Navigate to `http://localhost:4200/polls` after both dev servers start.

---

## Key Files to Modify

| File | Change |
|------|--------|
| `packages/shell/src/lib/firebase.ts` | Add `castVote`, `changeVote`, `getUserVote`, `subscribeToUserVotes` functions; expose via `window.__pollSystem`; remove old `vote` |
| `packages/shared/src/types/window.d.ts` | Update `__pollSystem` type declaration with new methods |
| `firestore.rules` | Add `votes` subcollection rule |
| `packages/poll-system/src/types.ts` | Add `VoteRecord`, `UserVoteMap` interfaces |
| `packages/poll-system/src/hooks/usePolls.ts` | Add vote-state management; subscribe to user votes; wire `castVote`, `changeVote` |
| `packages/poll-system/src/components/PollDetail.tsx` | Show voted state; add Change Vote flow; add analytics summary; add creator export button |
| `packages/poll-system/src/components/PollList.tsx` | Add search input; add filter tabs (All / Active / Expired / My Polls) |
| `packages/shared/src/i18n/locales/en.ts` | Add new i18n keys |
| `packages/shared/src/i18n/locales/es.ts` | Add new i18n keys (Unicode escapes) |
| `packages/shared/src/i18n/locales/zh.ts` | Add new i18n keys |

---

## New i18n Keys (to add to all 3 locales)

```
pollSystem.alreadyVoted         "You already voted for this option"
pollSystem.changeVote           "Change Vote"
pollSystem.changeVoteTitle      "Change your vote"
pollSystem.changeVoteConfirm    "Confirm Change"
pollSystem.cancelChange         "Keep current vote"
pollSystem.currentVote          "Your current vote"
pollSystem.voteChanged          "Your vote has been updated"
pollSystem.searchPlaceholder    "Search polls..."
pollSystem.filterAll            "All"
pollSystem.filterActive         "Active"
pollSystem.filterExpired        "Expired"
pollSystem.filterMine           "My Polls"
pollSystem.noResults            "No polls match your search"
pollSystem.finalResults         "Final Results"
pollSystem.leadingOption        "Leading"
pollSystem.noVotesYet           "No votes yet"
pollSystem.totalVoters          "{count} voters"
pollSystem.downloadResults      "Download Results"
pollSystem.exportFilename       "poll-results"
```

---

## After Making Changes

```bash
pnpm build:shared          # rebuild shared after i18n/type changes
pnpm lint                  # must pass
pnpm test:run              # must pass
pnpm typecheck             # must pass
```

---

## Firestore Emulator (for local vote testing)

```bash
pnpm emulator              # starts Firebase emulator suite
# In another terminal:
pnpm dev:shell & pnpm dev:poll-system
```

The emulator seed data (`scripts/seed-firestore.mjs`) may need a poll fixture added for testing vote flows.
