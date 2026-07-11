---

description: "Task list for transit-tracker improvements"
---

# Tasks: Transit Tracker Improvements

**Input**: Design documents from `/specs/028-transit-improvements/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required. Both contracts (`recent-stops-cache.md`, `transit-secret.md`) declare explicit "Test obligations", and the constitution mandates fast unit tests for new modules. Test tasks are folded into each user-story phase.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — different file, no incomplete dependency
- **[Story]**: User-story label (US1, US2, US3) — required only on user-story-phase tasks
- File paths are absolute relative to repo root

## Path Conventions (this feature)

- Frontend MFE: `packages/transit-tracker/`
- Frontend tests: `packages/transit-tracker/test/`
- Backend resolvers: `functions/src/resolvers/`
- Backend handlers: `functions/src/handlers/`
- Backend tests: `functions/test/` (or co-located, per existing convention)
- i18n locales: `packages/shell/src/i18n/locales/`

---

## Phase 1: Setup

**Purpose**: Make sure the local toolchain is current before any code changes.

- [X] T001 Run `pnpm install && pnpm build:shared` at repo root to ensure `@mycircle/shared` re-exports are fresh (constitution V; CLAUDE.md MFE workflow)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: i18n keys and the credential plumbing must be in place before any user story can render new strings or call the upstream feed correctly.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Add new i18n keys (`transit.refreshFailed`, `transit.retry`, `transit.locationPermissionDenied`, `transit.locationPermissionExplain`, `transit.noUpcomingArrivals`, `transit.noSearchMatch`, `transit.departed`, `transit.stopNotFound`) to `packages/shell/src/i18n/locales/en.ts`
- [X] T003 [P] Add the same keys (Spanish translations) to `packages/shell/src/i18n/locales/es.ts` — preserve existing `\uXXXX` Unicode escapes; read each existing line before editing per CLAUDE.md
- [X] T004 [P] Add the same keys (Chinese translations) to `packages/shell/src/i18n/locales/zh.ts`
- [X] T005 [P] Update `expandApiKeys()` in `functions/src/handlers/shared.ts` to set `process.env.ONEBUSAWAY_API_KEY = ak.onebusaway || ''` (see `contracts/transit-secret.md`)
- [X] T006 [P] Replace the hard-coded `OBA_API_KEY = 'TEST'` constant in `functions/src/resolvers/transit.ts` with a `getObaKey()` helper that reads `process.env.ONEBUSAWAY_API_KEY`; in each of `transitArrivals`, `transitStop`, `transitNearbyStops`, return `[]` / `null` (without calling axios) when the key is empty, and log `console.warn('[transit] ONEBUSAWAY_API_KEY is missing')` once
- [X] T007 [P] Add `functions/test/resolvers/transit.test.ts` (vitest) verifying: present-key path calls axios and returns mapped data; missing-key path does NOT call axios and returns `[]` / `null`. Mock `axios` and `process.env.ONEBUSAWAY_API_KEY`

**Checkpoint**: i18n bundle rebuilds cleanly (`pnpm build:shared`); resolver no longer references `'TEST'`; foundation ready.

---

## Phase 3: User Story 1 — Recent stops show names and routes immediately (Priority: P1) 🎯 MVP

**Goal**: Reopening the app instantly renders the recent-stops list with full metadata (name, direction, route badges) from local cache, with zero network calls for that initial render.

**Independent Test**: Visit three stops, reload with the network blocked, and confirm all three recent stops display name + direction + route badges from local cache.

### Implementation for User Story 1

- [X] T008 [P] [US1] Add `RecentStopEntry` interface (per `data-model.md §1`) to `packages/transit-tracker/src/types.ts`
- [X] T009 [US1] Create `packages/transit-tracker/src/lib/recentStops.ts` implementing `loadRecentStops`, `saveRecentStops`, `upsertRecentStop`, `removeRecentStop` per `contracts/recent-stops-cache.md` (legacy `string[]` shape silently discarded; cap at 5 on save; never throws)
- [X] T010 [P] [US1] Add `packages/transit-tracker/test/recentStops.test.ts` covering: empty storage → `[]`; legacy `string[]` value → `[]` (and next save overwrites with V1); valid V1 read with truncation to 5; `upsertRecentStop` dedupes by `stopId` and moves to head; `saveRecentStops` truncates to 5; `removeRecentStop` removes by id and persists. Mock `localStorage` (depends on T009)
- [X] T011 [US1] Update `packages/transit-tracker/src/components/TransitTracker.tsx`: remove inline `loadRecentStops`/`saveRecentStops` helpers; change `recentStops` state to `RecentStopEntry[]`; in `handleSelectStop`, build a `RecentStopEntry` from current `stop` metadata and call `upsertRecentStop` then persist; when `useTransitArrivals` resolves with `stop === null` for a known recent stop, render an inline "stop not found" message with a button that calls `removeRecentStop` (depends on T008, T009)
- [X] T012 [P] [US1] Update `packages/transit-tracker/src/components/StopSearch.tsx`: change `recentStops` prop from `string[]` to `RecentStopEntry[]`; render each recent entry's name, direction, and route badges from the cached metadata — no new network fetch, no `useTransitStop`/`transitStop` lookup added (depends on T008)
- [X] T013 [US1] Update `packages/transit-tracker/test/TransitTracker.test.tsx` for the new recent-stops shape, the post-visit cache write, and the stop-not-found UX (depends on T011)
- [X] T014 [P] [US1] Add `packages/transit-tracker/test/StopSearch.test.tsx` covering recent-stop rendering with full metadata; assert no GraphQL/network mock fires when only rendering the recent list (depends on T012)

**Checkpoint**: US1 fully functional and independently testable. MVP increment.

---

## Phase 4: User Story 2 — Predictable failure states for refresh and location (Priority: P2)

**Goal**: Each defined failure mode (offline refresh, denied location, empty arrivals, no search matches) presents a distinct, user-facing message with a clear next action; the app never blanks or stalls.

**Independent Test**: Trigger each failure mode and confirm the UI conveys the state clearly with an actionable next step.

### Implementation for User Story 2

- [X] T015 [US2] Update `packages/transit-tracker/src/hooks/useTransitArrivals.ts` to expose `refreshError: string | null` (non-null only when `arrivalsData` already has a value AND the most recent fetch errored); preserve existing `error` semantics for the "no data at all" case (depends on Foundational)
- [X] T016 [P] [US2] Update `packages/transit-tracker/src/hooks/useNearbyStops.ts` to expose `permission: 'unknown' | 'granted' | 'denied' | 'unavailable'`; map `getCurrentPosition` error codes (`1` → `'denied'`, `2`/`3` → `'unavailable'`); set `'granted'` on success; treat absent `navigator.geolocation` as `'unavailable'`; default `'unknown'` before any call (depends on Foundational)
- [X] T017 [US2] Update `packages/transit-tracker/src/components/TransitTracker.tsx`: when `refreshError` is non-null AND `arrivals.length > 0`, render an inline banner near the Refresh control using `transit.refreshFailed` + a Retry button that calls `refresh()`; do NOT clear the existing arrivals list (depends on T015)
- [X] T018 [P] [US2] Update `packages/transit-tracker/src/components/StopSearch.tsx`: when `permission === 'denied'` render `transit.locationPermissionDenied` + `transit.locationPermissionExplain`; when `permission === 'unavailable'` render an unavailable message; when the search input is non-empty AND the filtered results are zero, render `transit.noSearchMatch` (depends on T016)
- [X] T019 [P] [US2] Update `packages/transit-tracker/src/components/ArrivalsList.tsx`: when `arrivals.length === 0` and not loading, render an explicit `transit.noUpcomingArrivals` empty state instead of nothing (independent file)
- [X] T020 [P] [US2] Add `packages/transit-tracker/test/useTransitArrivals.test.ts` covering the error/refreshError split: initial-fetch failure → `error` set, `refreshError` null; success then refetch failure → `refreshError` set, `error` null; subsequent success → both null. Mock Apollo (depends on T015)
- [X] T021 [P] [US2] Add `packages/transit-tracker/test/useNearbyStops.test.ts` covering each permission transition: success → `'granted'`; PERMISSION_DENIED → `'denied'`; POSITION_UNAVAILABLE → `'unavailable'`; missing `navigator.geolocation` → `'unavailable'`. Mock `navigator.geolocation` with `vi.fn()` callbacks (depends on T016)
- [X] T022 [US2] Extend `packages/transit-tracker/test/TransitTracker.test.tsx` and `StopSearch.test.tsx` with failure-state rendering assertions: refresh-failure banner appears with prior data still visible; permission-denied prompt appears; no-search-match message appears (depends on T017, T018)

**Checkpoint**: US2 fully functional independently of US3. Each failure mode has a distinct visible state.

---

## Phase 5: User Story 3 — Stale predictions are cleared on refresh (Priority: P3)

**Goal**: After a refresh, no arrival with a predicted time more than 60 seconds in the past is visible; arrivals within 60s of "now" show a "departed" label rather than a negative-minute ETA.

**Independent Test**: Manipulate clock around a known arrival time and confirm three states behave correctly: future (normal), recent past (departed label), far past (omitted).

⚠️ **Phase ordering**: Phase 5 modifies the same files Phase 4 already touched (`useTransitArrivals.ts`, `ArrivalsList.tsx`, `useTransitArrivals.test.ts`). Apply Phase 5 changes after Phase 4 lands to avoid merge conflicts.

### Implementation for User Story 3

- [X] T023 [P] [US3] Add optional `departed?: boolean` field to the displayed `ArrivalDeparture` shape in `packages/transit-tracker/src/types.ts` (independent file from T024/T025)
- [X] T024 [US3] Update `packages/transit-tracker/src/hooks/useTransitArrivals.ts`: replace the strict `arrivalTime > now` filter with the three-way partition from `data-model.md §2`: `Δ > 0` → keep normal; `-60_000 ≤ Δ ≤ 0` → keep with `departed: true`; `Δ < -60_000` → omit. The 60-second threshold is the spec value (FR-009/FR-010), not a new tunable (depends on T015 from Phase 4)
- [X] T025 [US3] Update `packages/transit-tracker/src/components/ArrivalsList.tsx`: when an item has `departed === true`, render `transit.departed` as the time label and suppress the minute-based ETA (no negative numbers ever rendered) (depends on T019 from Phase 4)
- [X] T026 [P] [US3] Extend `packages/transit-tracker/test/useTransitArrivals.test.ts` with partitioning cases: `vi.setSystemTime` to a fixed instant; assert future arrival rendered normally, 30s-past arrival rendered with `departed: true`, 90s-past arrival omitted from the returned list (depends on T020 from Phase 4)

**Checkpoint**: US3 fully functional. All three user stories independently demonstrable.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Confirm the constitution's ship criteria and run the quickstart manually.

- [X] T027 Run `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` from repo root — all four MUST pass before pushing (constitution V; CLAUDE.md PR-lifecycle)
- [X] T028 Run `cd functions && npx tsc --noEmit && cd ..` — `functions/` has a stricter tsconfig (`noUnusedLocals: true`) that the root typecheck does not exercise (CLAUDE.md gotcha)
- [X] T029 Walk through `quickstart.md` manually: US1 reload-with-cache (offline) shows full metadata; legacy `string[]` value migrates silently; US2 four failure modes each render their distinct message with prior data preserved on refresh failure; US3 no negative-minute ETAs appear after a refresh
- [X] T030 Verify zero source references to the placeholder credential: `git grep "OBA_API_KEY = 'TEST'" functions/` returns nothing
- [ ] T031 [OPERATIONAL] Set the production `API_KEYS` secret to include the real onebusaway value: `printf '<json with onebusaway field>' | npx firebase functions:secrets:set API_KEYS` — `printf`, never `echo` (CLAUDE.md). Skip locally if no real key on hand; the build still passes since the resolver fails closed.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** — no dependencies; run first
- **Phase 2 (Foundational)** — depends on Phase 1; BLOCKS all user stories (i18n + credential)
- **Phase 3 (US1)** — depends on Phase 2; independently shippable as MVP
- **Phase 4 (US2)** — depends on Phase 2; can be parallel with Phase 3 (different files)
- **Phase 5 (US3)** — depends on Phase 2 AND on Phase 4's edits to `useTransitArrivals.ts` / `ArrivalsList.tsx` / `useTransitArrivals.test.ts` landing first (same-file conflict)
- **Phase 6 (Polish)** — depends on every desired user-story phase being complete

### Same-file dependencies inside the MFE

| File | Tasks that touch it | Order |
|---|---|---|
| `packages/transit-tracker/src/types.ts` | T008, T023 | Both [P]; different sections; can be combined into one PR commit |
| `packages/transit-tracker/src/hooks/useTransitArrivals.ts` | T015, T024 | Strict order: T015 → T024 |
| `packages/transit-tracker/src/components/TransitTracker.tsx` | T011, T017 | Strict order: T011 → T017 |
| `packages/transit-tracker/src/components/StopSearch.tsx` | T012, T018 | Strict order: T012 → T018 |
| `packages/transit-tracker/src/components/ArrivalsList.tsx` | T019, T025 | Strict order: T019 → T025 |
| `packages/transit-tracker/test/useTransitArrivals.test.ts` | T020, T026 | Strict order: T020 → T026 |
| `packages/transit-tracker/test/TransitTracker.test.tsx` | T013, T022 | Strict order: T013 → T022 |
| `packages/transit-tracker/test/StopSearch.test.tsx` | T014, T022 | Strict order: T014 → T022 |

All other tasks marked [P] touch independent files and can run in parallel.

### Within Each User Story

- Models / types → modules → component wiring → tests (tests can be authored alongside implementation; not enforced TDD)
- Story complete and independently demoable before moving to the next priority

---

## Parallel Examples

### Phase 2 — full parallel fan-out

```text
T002 (en.ts) ║ T003 (es.ts) ║ T004 (zh.ts) ║ T005 (shared.ts) ║ T006 (transit.ts resolver) ║ T007 (transit.test.ts)
```

Six independent files, no shared edits.

### Phase 3 (US1) — parallel slots

```text
T008 (types.ts) ─┬─► T009 (lib/recentStops.ts) ─► T011 (TransitTracker.tsx) ─► T013 (TransitTracker.test.tsx)
                 │                              ╲
                 │                               ► T010 (recentStops.test.ts)  [P]
                 └─► T012 (StopSearch.tsx) [P] ─► T014 (StopSearch.test.tsx)  [P]
```

T010, T012, T014 can be authored in parallel by different developers once their predecessors land.

### Phase 4 (US2) — parallel slots

```text
T015 (useTransitArrivals.ts) ─► T017 (TransitTracker.tsx)
T016 (useNearbyStops.ts)     ─► T018 (StopSearch.tsx)        [P with T017]
                              ╲
                               ► T019 (ArrivalsList.tsx)     [P with T017, T018]
T020 (useTransitArrivals.test.ts)  [P after T015]
T021 (useNearbyStops.test.ts)      [P after T016]
T022 (component test extensions)   [after T017, T018]
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (T001) → Phase 2 (T002–T007) → Phase 3 (T008–T014).
2. **Stop and validate**: walk the US1 portion of `quickstart.md`. Reopen the app offline; recent stops render with full metadata.
3. Ship the MVP if needed — US1 is independently valuable and removes the per-recent-stop fetch the app currently issues.

### Incremental delivery

1. Phase 1 + Phase 2 → foundation ready.
2. Phase 3 → US1 ships → MVP.
3. Phase 4 → US2 ships → failure UX hardened.
4. Phase 5 → US3 ships → stale-prediction polish.
5. Phase 6 → final verification + operational secret update.

### Parallel team strategy

After Phase 2 completes, two developers can split:

- Dev A: Phase 3 (US1) — entirely in `transit-tracker` package, plus the recent-stops module.
- Dev B: Phase 4 (US2) — same package, but different files (hooks + ArrivalsList).
- Phase 5 needs Phase 4's `useTransitArrivals.ts` changes to land first; assign whichever dev finishes first.

---

## Notes

- [P] tasks operate on different files with no incomplete predecessor and may be run in parallel.
- Story labels (US1, US2, US3) trace each task back to its acceptance criteria in `spec.md`.
- The credential rotation (T031) is operational and requires a real OneBusAway key. Without it the resolver fails closed and tests still pass; do not block code review on it.
- Spanish locale edits (T003) require special care — read each line offset before editing per CLAUDE.md so existing `\uXXXX` escapes are preserved exactly.
- No new MFE is being added, so the 20+ MFE-integration checklist (Dockerfile, vitest aliases, dev scripts, widget registry, command palette, etc.) does not apply to this feature.
