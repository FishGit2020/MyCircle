# Tasks: Polls Enhancements (021)

**Input**: Design documents from `specs/021-polls-enhancements/`
**Branch**: `021-polls-enhancements`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare the branch — rebuild shared, confirm existing tests pass as a baseline.

- [X] T001 Checkout branch `021-polls-enhancements` and run `pnpm install && pnpm build:shared` to confirm clean baseline
- [X] T002 Run `pnpm lint && pnpm test:run && pnpm typecheck` and confirm all pass before any changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infrastructure that MUST land before any user story can be implemented — Firestore functions, window type declarations, and i18n keys all block every story downstream.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Add `VoteRecord` and `UserVoteMap` TypeScript interfaces to `packages/poll-system/src/types.ts`
- [X] T004 Add `castVote`, `changeVote`, `getUserVote`, and `subscribeToUserVotes` Firestore functions to `packages/shell/src/lib/firebase.ts` (inside the existing poll functions block, lines ~1924–1965); implement each using Firestore transactions or subcollection reads per `specs/021-polls-enhancements/contracts/window-poll-system.md`
- [X] T005 Expose all four new functions via `window.__pollSystem` in `packages/shell/src/lib/firebase.ts`; replace the old `vote` entry with `castVote`
- [X] T006 Update `window.__pollSystem` type declaration in `packages/shared/src/types/window.d.ts` to match the updated interface in `specs/021-polls-enhancements/contracts/window-poll-system.md`
- [X] T007 Add `votes` subcollection Firestore security rules to `firestore.rules` (inside the existing `match /polls/{pollId}` block): `match /votes/{uid} { allow read, write: if request.auth != null && request.auth.uid == uid; }`
- [X] T008 [P] Add all 19 new i18n keys to `packages/shared/src/i18n/locales/en.ts` (see `specs/021-polls-enhancements/quickstart.md` for the full key list)
- [X] T009 [P] Add all 19 new i18n keys to `packages/shared/src/i18n/locales/es.ts` using Unicode escapes for accented characters (read the exact surrounding lines before editing — Spanish file uses Unicode escape syntax)
- [X] T010 [P] Add all 19 new i18n keys to `packages/shared/src/i18n/locales/zh.ts`
- [X] T011 Run `pnpm build:shared` after T006–T010 to confirm types and i18n compile cleanly

**Checkpoint**: Foundation ready — all four user story phases can now proceed. T008–T010 are parallelizable with each other.

---

## Phase 3: User Story 1 — One Vote Per User, Any Session (Priority: P1) 🎯 MVP

**Goal**: Prevent duplicate votes across sessions; show voted state persistently in PollDetail.

**Independent Test**: Vote on a poll, sign out, sign back in, navigate to the same poll — the voted option is highlighted and all option buttons are disabled.

- [X] T012 [US1] Update `usePolls` hook in `packages/poll-system/src/hooks/usePolls.ts`: subscribe to `window.__pollSystem.subscribeToUserVotes` on mount (when API available); store result as `userVotes: UserVoteMap` in state; expose `userVotes`, `castVote`, and `changeVote` from the hook return value
- [X] T013 [US1] Update `packages/poll-system/src/components/PollDetail.tsx`: derive `votedOptionId = userVotes[poll.id]`; when `votedOptionId` is set, render the matching option with a highlighted/selected style and disable all option click handlers; replace any call to `hooks.vote(...)` with `hooks.castVote(...)`
- [X] T014 [US1] Add test cases to `packages/poll-system/src/components/PollSystem.test.tsx`: (a) when `userVotes` contains the current poll's id, the voted option renders as selected and vote buttons are absent; (b) when `userVotes` is empty, all options are clickable
- [X] T015 [US1] Run `pnpm test:run --filter poll-system` and fix any failures

**Checkpoint**: User Story 1 complete — vote integrity enforced end-to-end.

---

## Phase 4: User Story 2 — Search and Filter Polls (Priority: P2)

**Goal**: Add keyword search and status filter tabs (All / Active / Expired / My Polls) to PollList.

**Independent Test**: With 10+ polls present, typing a keyword shows only matching polls; switching filter tabs correctly restricts the list; both constraints apply simultaneously.

- [X] T016 [US2] Update `packages/poll-system/src/components/PollList.tsx`: add controlled search input at the top of the list; add filter tab bar (All / Active / Expired / My Polls) below the search input; apply both filters as AND logic over the polls prop; render the `pollSystem.noResults` i18n message when no polls match; use `window.__currentUid` for My Polls filter (read at call-time, not cached)
- [X] T017 [US2] Ensure all new class names in `PollList.tsx` have `dark:` variants; ensure search input and filter tabs meet 44px touch target minimum
- [X] T018 [US2] Add test file `packages/poll-system/src/components/PollList.test.tsx`: (a) all polls shown when no filter; (b) keyword filter is case-insensitive; (c) Active filter hides expired polls; (d) Expired filter hides active polls; (e) My Polls filter shows only creator's polls; (f) empty-state message shown when no match
- [X] T019 [US2] Run `pnpm test:run --filter poll-system` and fix any failures

**Checkpoint**: User Story 2 complete — search and filter fully functional.

---

## Phase 5: User Story 3 — Poll Results Analytics View (Priority: P3)

**Goal**: Show enriched results summary in PollDetail — total voters, per-option percentages, Leading/Winner badge, Final Results heading on expired polls, No Votes Yet state.

**Independent Test**: Create a poll and cast votes; open the detail — the leading option has a "Leading" badge; expire the poll — "Final Results" heading appears and results are visible to non-creators; zero-vote poll shows "No votes yet".

- [X] T020 [US3] Update `packages/poll-system/src/components/PollDetail.tsx`: compute `totalVotes` as sum of all option votes; compute percentage per option (guard divide-by-zero when totalVotes === 0); add a results summary section below the options list showing: total voter count (using `pollSystem.totalVoters` i18n key), per-option percentage, and a "Leading" badge on the option with the highest vote count (no badge when zero votes or tie); when poll is expired show "Final Results" heading (using `pollSystem.finalResults` key) and display results to all authenticated users; when totalVotes === 0 show "No votes yet" message (using `pollSystem.noVotesYet` key) instead of percentages
- [X] T021 [US3] Ensure all new Tailwind classes in T020 have `dark:` variants
- [X] T022 [US3] Add test cases to `packages/poll-system/src/components/PollSystem.test.tsx` or a new `PollDetail.test.tsx`: (a) Leading badge on highest-vote option; (b) no badge when all votes are 0; (c) "Final Results" heading when expired; (d) "No votes yet" shown when totalVotes is 0
- [X] T023 [US3] Run `pnpm test:run --filter poll-system` and fix any failures

**Checkpoint**: User Story 3 complete — analytics view fully functional.

---

## Phase 6: User Story 4 — Change or Retract Vote (Priority: P4)

**Goal**: Allow users with an existing vote on an active poll to change it to a different option, with confirmation before applying.

**Independent Test**: Vote on an active poll — a "Change Vote" button appears. Click it, select a different option, confirm — new option is highlighted; vote counts update. Cancelling mid-flow leaves the original vote unchanged.

- [X] T024 [US4] Update `packages/poll-system/src/components/PollDetail.tsx`: when `votedOptionId` is set and poll is active (not expired), render a "Change Vote" button (`type="button"`, `aria-label`); clicking it enters change-vote mode — re-enables option buttons and shows a "Select a new option" prompt; when a new option is clicked in change-vote mode, show a confirmation UI (inline or modal) with Confirm / Cancel; on confirm call `hooks.changeVote(poll.id, votedOptionId, newOptionId)`; on cancel restore the normal voted-state view without any change
- [X] T025 [US4] Ensure "Change Vote" button is NOT rendered when poll is expired; ensure confirmation UI has `type="button"` on all non-submit buttons; ensure touch targets ≥ 44px
- [X] T026 [US4] Add test cases: (a) "Change Vote" button visible when user has voted and poll is active; (b) not visible when poll is expired; (c) cancelling change-vote flow leaves original vote visible and unchanged
- [X] T027 [US4] Run `pnpm test:run --filter poll-system` and fix any failures

**Checkpoint**: User Story 4 complete — vote change flow fully functional.

---

## Phase 7: User Story 5 — Export Poll Results (Priority: P5)

**Goal**: Allow poll creators to download their poll's results as a CSV file.

**Independent Test**: As the poll creator, click "Download Results" — a CSV file downloads containing the question, each option, vote counts, percentages, and total votes. Non-creators see no download button.

- [X] T028 [US5] Add an `exportPollToCsv(poll: Poll): void` utility function inline in `packages/poll-system/src/components/PollDetail.tsx` (or in a small helper within the same component file): build a CSV string with header rows (Question, Status, Total Votes, Export Date) and option rows (Option, Votes, Percentage); trigger download via `URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))` and a temporary `<a>` element; filename: `poll-results-<pollId>.csv`
- [X] T029 [US5] Render a "Download Results" button (`type="button"`) in `PollDetail.tsx` only when `poll.createdBy === window.__currentUid` (read at render time); use `pollSystem.downloadResults` i18n key for label
- [X] T030 [US5] Ensure "Download Results" button is NOT rendered for non-creators; ensure the export works when totalVotes is 0
- [X] T031 [US5] Add test cases: (a) download button visible to creator; (b) not visible to non-creator; (c) export produces correct CSV content for a known poll fixture
- [X] T032 [US5] Run `pnpm test:run --filter poll-system` and fix any failures

**Checkpoint**: User Story 5 complete — export fully functional.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final integration pass — validate all changes together before pushing.

- [X] T033 [P] Run `pnpm validate_all` (MCP) or manually verify: (a) all 19 new i18n keys present in all 3 locale files; (b) no missing `dark:` variants on new color classes; (c) no `type="button"` omissions on non-submit buttons added in this feature
- [X] T034 [P] Review `packages/poll-system/src/components/PollDetail.tsx` for any `aria-label` gaps on interactive elements added in phases 5–7 (Change Vote button, confirmation buttons, Download button)
- [X] T035 Run full suite: `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` — all four MUST pass
- [X] T036 Fix any lint, type, or test failures surfaced by T035
- [X] T037 Commit all changes on branch `021-polls-enhancements` with conventional commit messages, then push and open PR

---

## Dependency Graph

```
T001 → T002                          (baseline check)
           ↓
T003–T011                            (Phase 2 foundation; T008–T010 parallel)
           ↓
     ┌─────┴─────┐
     ↓           ↓
  T012–T015   T016–T019             (US1 and US2 parallel after foundation)
     ↓
  T020–T023                         (US3 depends on US1 voted-state logic)
     ↓
  T024–T027                         (US4 depends on US1 voted-state + US3 analytics)
     ↓
  T028–T032                         (US5 independent of US3/US4 but share PollDetail)
     ↓
  T033–T037                         (polish, runs after all stories)
```

**Note**: US2 (T016–T019) can be developed in parallel with US1 (T012–T015) since it only touches `PollList.tsx`. US3–US5 all modify `PollDetail.tsx` so must run sequentially to avoid conflicts.

---

## Parallel Execution Opportunities

| Group | Tasks | What runs in parallel |
|-------|-------|----------------------|
| i18n keys | T008, T009, T010 | All three locale files independently |
| Story independence | T012–T015, T016–T019 | US1 (PollDetail) and US2 (PollList) touch different files |
| Polish checks | T033, T034 | a11y review and i18n validation are independent |

---

## Implementation Strategy

**Suggested MVP scope**: Phase 2 (foundation) + Phase 3 (US1 — vote integrity). This alone delivers the most critical correctness fix and is fully shippable as a standalone improvement.

**Incremental delivery order**:
1. **MVP**: T001–T015 — vote integrity end-to-end (Phases 1–3)
2. **Add**: T016–T019 — search & filter (Phase 4)
3. **Add**: T020–T023 — analytics view (Phase 5)
4. **Add**: T024–T027 — vote change (Phase 6)
5. **Add**: T028–T032 — export (Phase 7)
6. **Ship**: T033–T037 — polish & PR (Phase 8)

Each increment leaves the feature in a working, shippable state.

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 37 |
| Phase 1 (Setup) | 2 |
| Phase 2 (Foundation) | 9 |
| US1 — Vote Integrity | 4 |
| US2 — Search & Filter | 4 |
| US3 — Analytics | 4 |
| US4 — Vote Change | 4 |
| US5 — Export | 5 |
| Phase 8 (Polish) | 5 |
| Parallelizable tasks [P] | 7 |
| Independent stories | US1 + US2 parallel; US3–US5 sequential |
