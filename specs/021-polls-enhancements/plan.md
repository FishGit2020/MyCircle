# Implementation Plan: Polls Enhancements

**Branch**: `021-polls-enhancements` | **Date**: 2026-03-31 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/021-polls-enhancements/spec.md`

## Summary

Enhance the existing polls MFE with per-user vote tracking (preventing duplicate votes), search and filter on the poll list, a richer results/analytics view, vote-change capability, and CSV export. All data continues to use the existing Firestore-via-window-bridge pattern. The primary structural change is a new Firestore subcollection (`polls/{pollId}/votes/{uid}`) plus four new methods on `window.__pollSystem`.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: Firebase Firestore SDK (shell-only), `@mycircle/shared` (i18n, PageContent), Vite Module Federation
**Storage**: Firestore — existing `polls` collection + new `votes` subcollection; localStorage cache (existing fallback)
**Testing**: Vitest + React Testing Library
**Target Platform**: Web (desktop + mobile, dark mode)
**Project Type**: MFE enhancement (existing `packages/poll-system`)
**Performance Goals**: Results update within 3 seconds of vote; filter/search respond instantly (client-side)
**Constraints**: Mobile-first, offline-resilient (localStorage fallback), touch targets ≥ 44px, all strings i18n, all colors dark-mode
**Scale/Scope**: Community-group scale (hundreds of polls, dozens of concurrent users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | MFE imports only from `@mycircle/shared`; no direct `@apollo/client` |
| II. Complete Integration | ✅ PASS | No new MFE added; enhancing existing one — no new integration points required |
| III. GraphQL-First Data Layer | ⚠️ DEVIATION | Existing polls MFE uses Firestore bridge — documented in Complexity Tracking |
| IV. Inclusive by Default | ✅ PASS | All new strings added to 3 locales; dark mode required on all new classes; a11y maintained |
| V. Fast Tests, Safe Code | ✅ PASS | Unit tests will mock window.__pollSystem; no network calls in tests |
| VI. Simplicity | ✅ PASS | No new abstractions; extending existing patterns; no premature generalization |

## Project Structure

### Documentation (this feature)

```text
specs/021-polls-enhancements/
├── plan.md                  # This file
├── research.md              # Phase 0 output
├── data-model.md            # Phase 1 output
├── quickstart.md            # Phase 1 output
├── contracts/
│   └── window-poll-system.md  # Updated window API contract
└── tasks.md                 # Phase 2 output (/speckit.tasks)
```

### Source Code (affected files)

```text
packages/shell/src/
├── lib/
│   └── firebase.ts          # New: castVote, changeVote, getUserVote, subscribeToUserVotes
└── (no other shell changes)

packages/shared/src/
├── types/
│   └── window.d.ts          # Updated: __pollSystem interface
└── i18n/locales/
    ├── en.ts                 # New i18n keys (19 keys)
    ├── es.ts                 # New i18n keys (Unicode escapes)
    └── zh.ts                 # New i18n keys

packages/poll-system/src/
├── types.ts                  # New: VoteRecord, UserVoteMap
├── hooks/
│   └── usePolls.ts           # Updated: vote-state management, castVote/changeVote wiring
└── components/
    ├── PollList.tsx          # Updated: search input, filter tabs
    ├── PollDetail.tsx        # Updated: voted-state display, Change Vote flow, analytics, export
    └── PollSystem.test.tsx   # Updated: additional test cases

firestore.rules                # Updated: votes subcollection rules
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Firestore bridge (non-GraphQL) for new vote record operations | The entire polls MFE already uses the Firestore window bridge. Using GraphQL for the new vote subcollection only would create an inconsistent hybrid where some poll operations use Firestore and others use Apollo. | Migrating the entire polls MFE to GraphQL is a separate refactor of equal scope to this feature. Doing it here would violate Spec Principle VI (Simplicity) and significantly expand scope beyond what was requested. A technical-debt ticket for the migration should be filed separately. |

## Implementation Phases

### Phase A — Vote Integrity (P1)

**Goal**: Prevent duplicate votes; show voted state persistently.

**Files changed**:
1. `packages/shell/src/lib/firebase.ts`
   - Add `getUserVote(uid, pollId): Promise<string | null>` — single doc read from `polls/{pollId}/votes/{uid}`
   - Add `castVote(uid, pollId, optionId): Promise<void>` — Firestore transaction: check VoteRecord doesn't exist, increment option count, create VoteRecord
   - Add `subscribeToUserVotes(uid, callback): () => void` — `onSnapshot` on `collectionGroup` or per-poll-subcollection
   - Expose all three as new `window.__pollSystem` methods
   - Remove old `vote` exposure; keep `votePoll` internal function for any remaining use
2. `packages/shared/src/types/window.d.ts` — update `__pollSystem` type
3. `packages/poll-system/src/types.ts` — add `VoteRecord`, `UserVoteMap`
4. `packages/poll-system/src/hooks/usePolls.ts` — subscribe to user votes on mount; expose `userVotes: UserVoteMap`, `castVote`, `changeVote`
5. `packages/poll-system/src/components/PollDetail.tsx` — use `userVotes[poll.id]` to show voted state; disable option buttons when voted
6. `firestore.rules` — add votes subcollection rule

**Test additions** (`PollSystem.test.tsx` + new `PollDetail.test.tsx`):
- Renders voted option as highlighted when `userVotes` contains the poll
- Does not render vote buttons when user has already voted
- Renders all options as clickable when user has not voted

---

### Phase B — Search & Filter (P2)

**Goal**: Add keyword search and status filter tabs to the poll list.

**Files changed**:
1. `packages/poll-system/src/components/PollList.tsx`
   - Add search input (controlled, real-time filter)
   - Add filter tab bar: All / Active / Expired / My Polls
   - Apply both filters as AND logic over the polls array
   - Show descriptive empty state when no results
2. `packages/shared/src/i18n/locales/{en,es,zh}.ts` — search/filter i18n keys

**Test additions** (`PollList.test.tsx`):
- Shows all polls when no filter/search active
- Filters correctly by keyword (case-insensitive)
- Filters correctly by Active / Expired / My Polls status
- Shows empty-state message when no polls match

---

### Phase C — Results Analytics (P3)

**Goal**: Show richer results summary; distinguish Final Results on expired polls.

**Files changed**:
1. `packages/poll-system/src/components/PollDetail.tsx`
   - Add results summary section with: total votes, per-option percentage, "Leading" badge on top option
   - Show "Final Results" heading when poll is expired (visible to all)
   - Show "No votes yet" when total is zero
2. `packages/shared/src/i18n/locales/{en,es,zh}.ts` — analytics i18n keys

**Test additions**:
- Renders "Leading" badge on highest-vote option
- Renders "Final Results" heading when poll is expired
- Renders "No votes yet" when vote count is zero

---

### Phase D — Vote Change (P4)

**Goal**: Allow users to change their vote on an active poll.

**Files changed**:
1. `packages/shell/src/lib/firebase.ts`
   - Add `changeVote(uid, pollId, oldOptionId, newOptionId): Promise<void>` — Firestore transaction: decrement old option, increment new option, upsert VoteRecord
2. `packages/poll-system/src/hooks/usePolls.ts` — expose `changeVote` from window API
3. `packages/poll-system/src/components/PollDetail.tsx`
   - Show "Change Vote" button when user has voted and poll is active
   - Enter change-vote mode: re-enable option buttons, show "Select a new option" prompt
   - On new option selection: show confirmation dialog before submitting
   - On confirm: call `changeVote`; on cancel: restore voted state without change

**Test additions**:
- "Change Vote" button visible when user has voted and poll is active
- "Change Vote" button not visible when poll is expired
- Selecting new option shows confirmation; cancelling restores original voted state

---

### Phase E — Export (P5)

**Goal**: Allow poll creators to download results as CSV.

**Files changed**:
1. `packages/poll-system/src/components/PollDetail.tsx`
   - Add "Download Results" button visible only to poll creator
   - On click: generate CSV string in memory; trigger browser download via Blob + URL.createObjectURL
   - CSV format: header rows (Question, Status, Total Votes, Export Date), then option rows (Option, Votes, Percentage)
2. `packages/shared/src/i18n/locales/{en,es,zh}.ts` — export i18n keys

**Test additions**:
- "Download Results" visible to creator; not visible to non-creator
- Export function produces correct CSV content

---

### Phase F — i18n & Tests Cleanup

**Goal**: Ensure all 19 new keys are in all 3 locale files; run full suite.

1. Verify all new keys present in `en.ts`, `es.ts`, `zh.ts`
2. Run `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck`
3. Fix any failures
