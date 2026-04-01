# Tasks: Radio Station Enhancements

**Input**: Design documents from `/specs/022-radio-enhancements/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add new StorageKeys, types, and i18n keys that every user story depends on. All Phase 1 tasks touch different files and can run in parallel.

- [ ] T001 Add `RADIO_RECENT: 'radio-recent'` and `RADIO_VOTED: 'radio-voted'` to `StorageKeys` enum in `packages/shared/src/utils/eventBus.ts`
- [ ] T002 [P] Add `RadioTag` interface `{ name: string; stationCount: number }` and `RecentlyPlayedEntry` interface `{ stationuuid, name, favicon, country, url, url_resolved: string; playedAt: number }` to `packages/radio-station/src/types.ts`
- [ ] T003 [P] Add all new `radio.*` i18n keys to `packages/shared/src/i18n/locales/en.ts` (radio.tabs.recent, radio.recent.empty, radio.filter.genre, radio.filter.country, radio.filter.all, radio.filter.clearAll, radio.detail.title, radio.detail.language, radio.detail.codec, radio.detail.bitrate, radio.detail.votes, radio.detail.tags, radio.detail.homepage, radio.vote, radio.voted, radio.voteSignIn, radio.sleep.title, radio.sleep.set, radio.sleep.cancel, radio.sleep.countdown, radio.sleep.15min, radio.sleep.30min, radio.sleep.45min, radio.sleep.60min)
- [ ] T004 [P] Add same keys (Unicode escapes) to `packages/shared/src/i18n/locales/es.ts` — read the exact line before each edit to avoid encoding issues
- [ ] T005 [P] Add same keys (Unicode escapes) to `packages/shared/src/i18n/locales/zh.ts` — read the exact line before each edit to avoid encoding issues

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: GraphQL schema extensions and codegen that all user stories require. Must complete before any user story implementation.

**⚠️ CRITICAL**: No user story implementation can begin until T006–T010 are all complete.

- [ ] T006 Extend `functions/src/schema.ts`: (a) add optional `tag: String` and `country: String` args to `radioStations` query; (b) add `type RadioTag { name: String! stationCount: Int! }` type; (c) add `radioTags(limit: Int = 50): [RadioTag!]!` query; (d) add `voteRadioStation(uuid: String!): Boolean!` mutation to the Mutation type
- [ ] T007 Extend `functions/src/resolvers/radioStations.ts`: (a) update `radioStations` resolver to forward `tag` and `country` params to Radio Browser API `/stations/search`; update cache key to include tag and country (`` `search:${query}:${tag}:${country}:${limit}` ``); (b) add `radioTags` resolver calling `${RADIO_API}/tags?order=stationcount&reverse=true&hidebroken=true&limit=${limit}` with 5-min cache; (c) add `voteRadioStation` mutation resolver calling `${RADIO_API}/vote/${uuid}` (GET request), returning true/false, requiring `ctx.uid` auth check
- [ ] T008 Update `packages/shared/src/apollo/queries.ts`: (a) add `$tag: String` and `$country: String` variables to `GET_RADIO_STATIONS` query and pass to `radioStations(query: $query, limit: $limit, tag: $tag, country: $country)`; (b) add `GET_RADIO_TAGS` query; (c) add `VOTE_RADIO_STATION` mutation — see contracts/graphql-radio.md for exact definitions
- [ ] T009 Run `pnpm codegen` from repo root to regenerate `packages/shared/src/apollo/generated.ts` with new types
- [ ] T010 Run `pnpm build:shared` to rebuild the shared package

**Checkpoint**: Schema extended, codegen updated, shared rebuilt — user story implementation can begin.

---

## Phase 3: User Story 1 — Filter by Genre and Country (Priority: P1) 🎯 MVP

**Goal**: Users can narrow the Browse station list by genre tag and country using dropdown filter controls.

**Independent Test**: Open Browse tab → select a genre → only matching stations shown with active filter badge → select a country → list narrows further → clear filters → full list returns → empty state shown when no matches.

- [ ] T011 [P] [US1] Add `activeTag: string | undefined`, `activeCountry: string | undefined`, filter state setters, and derived `countries: string[]` (unique sorted from current stations) to `packages/radio-station/src/hooks/useRadioStations.ts`; update `search()` to pass `tag` and `country` to `refetch({ query, tag, country, limit: 50 })`; expose `setActiveTag`, `setActiveCountry`, `countries` from hook return
- [ ] T012 [P] [US1] Create `packages/radio-station/src/components/FilterBar.tsx`: props `tags: RadioTag[]`, `countries: string[]`, `activeTag`, `activeCountry`, `onTagChange`, `onCountryChange`; renders two `<select>` dropdowns (genre / country) each with an "All" default option; shows active filter badge pills with individual clear (×) buttons; dark mode + aria-labels + `type="button"` on all buttons; touch targets ≥ 44px
- [ ] T013 [US1] Wire `FilterBar` into `packages/radio-station/src/components/RadioStation.tsx`: add `useQuery(GET_RADIO_TAGS)` to fetch genre options; pass `tags`, `countries`, `activeTag`, `activeCountry` and callbacks from `useRadioStations` to `FilterBar`; show FilterBar only on Browse tab; show empty-state message when `displayStations.length === 0` with active filters

**Checkpoint**: Genre and country filters fully functional on Browse tab, independently testable.

---

## Phase 4: User Story 2 — Recently Played History (Priority: P2)

**Goal**: A new "Recent" tab shows the last 20 stations played, ordered newest first, playable in one tap.

**Independent Test**: Play 3 stations → navigate away → return to Radio → Recent tab shows 3 stations newest-first → tap one → it plays immediately from the Recent tab.

- [ ] T014 [P] [US2] Create `packages/radio-station/src/hooks/useRecentlyPlayed.ts`: reads/writes `localStorage[StorageKeys.RADIO_RECENT]` as `RecentlyPlayedEntry[]`; exposes `recentStations: RecentlyPlayedEntry[]`, `addToRecent(station: RadioStation): void` (adds snapshot with `playedAt: Date.now()`, deduplicates by uuid updating playedAt, keeps newest 20), `clearRecent(): void`
- [ ] T015 [US2] In `packages/radio-station/src/hooks/useRadioPlayer.ts`, import `useRecentlyPlayed` and call `addToRecent(station)` inside the `play()` callback immediately after `eventBus.publish(MFEvents.AUDIO_PLAY, source)` (depends on T014)
- [ ] T016 [US2] In `packages/radio-station/src/components/RadioStation.tsx`: extend `Tab` type to `'browse' | 'favorites' | 'recent'`; add "Recent" tab button (with count badge when non-empty); render `useRecentlyPlayed()` stations as `StationCard` components in the Recent tab panel; show `t('radio.recent.empty')` when list is empty (depends on T014, T015)

**Checkpoint**: Recent tab functional and independently testable alongside Browse and Favorites.

---

## Phase 5: User Story 3 — Station Detail View (Priority: P3)

**Goal**: Tapping the info button on any station card opens a slide-over panel with full metadata and Play/Favorite actions.

**Independent Test**: Tap info button on any card → slide-over panel opens with language, codec, bitrate, vote count, all tags, homepage link (if present) → Play works inside panel → Favorite toggles inside panel → dismiss returns to exact list position.

- [ ] T017 [P] [US3] Create `packages/radio-station/src/components/StationDetail.tsx`: props `station: RadioStation | null`, `isOpen: boolean`, `isFavorite: boolean`, `isPlaying: boolean`, `onClose()`, `onPlay(station)`, `onToggleFavorite(station)`, `onVote(uuid)` (optional, for US5 wiring later); slide-over panel using Tailwind `translate-x-full`/`translate-x-0` CSS transition; shows name, country, language, codec, `t('radio.detail.bitrate').replace('{kbps}', ...)`, vote count, comma-separated tag pills, homepage link (only if `station.url_resolved` — wait: homepage is a different field; show only if station has a `homepage` field — note this needs to be added to the type and resolver if available, otherwise skip); Play and Favorite buttons; dark mode + aria-labels; closes on backdrop click or × button
- [ ] T018 [US3] In `packages/radio-station/src/components/RadioStation.tsx`: add `selectedStation: RadioStation | null` state; render `<StationDetail>` component; pass `onSelectStation` callback down to station lists; in `packages/radio-station/src/components/StationCard.tsx`: add an info button (ⓘ icon, `type="button"`) that calls `onSelectStation(station)` — add `onSelectStation?: (station: RadioStation) => void` to `StationCardProps` (depends on T017)

**Checkpoint**: Station detail slide-over panel functional from all three tabs.

---

## Phase 6: User Story 4 — Sleep Timer (Priority: P4)

**Goal**: While a station is playing, user can set a countdown timer (15/30/45/60 min) that automatically stops playback when it expires.

**Independent Test**: Start a station → open sleep timer menu → select 15 min → countdown "Stops in 14m 59s" appears in player bar → click Cancel → countdown gone, music continues → select 1 min timer → music stops automatically after countdown reaches 0.

- [ ] T019 [P] [US4] Create `packages/radio-station/src/hooks/useSleepTimer.ts`: state `{ active: boolean, totalMinutes: number, secondsLeft: number }`; `start(minutes: 15 | 30 | 45 | 60)` sets interval ticking every second decrementing `secondsLeft`; `cancel()` clears interval and resets state; on `secondsLeft === 0` calls `onExpire` callback and clears interval; expose `{ active, secondsLeft, start, cancel }`
- [ ] T020 [US4] Update `packages/radio-station/src/components/PlayerBar.tsx`: add props `sleepTimer: { active: boolean; secondsLeft: number }`, `onSleepTimerStart(minutes: number)`, `onSleepTimerCancel()`; when NOT active: show a small clock icon button that opens a dropdown menu with 4 preset options (15/30/45/60 min); when active: replace menu with a `t('radio.sleep.countdown')` label showing `"{min}m {sec}s"` plus a cancel button; dark mode + aria-labels (depends on T019)
- [ ] T021 [US4] Wire sleep timer in `packages/radio-station/src/components/RadioStation.tsx`: instantiate `useSleepTimer({ onExpire: stop })` (where `stop` comes from `useRadioPlayer`); pass `sleepTimer`, `onSleepTimerStart`, `onSleepTimerCancel` props to `PlayerBar`; add `useEffect` that calls `sleepTimer.cancel()` when `isPlaying` becomes false (manual stop cancels timer) (depends on T019, T020)

**Checkpoint**: Sleep timer fully functional: sets, counts down, auto-stops, cancels.

---

## Phase 7: User Story 5 — Vote for a Station (Priority: P5)

**Goal**: Authenticated users can upvote a station; vote count increments and voted state persists for the session.

**Independent Test**: Signed-in user taps vote on a station → count increments, button shows voted state → tap again → nothing happens → sign out / sign in → voted state cleared (session-only) → signed-out user taps vote → sign-in prompt.

- [ ] T022 [P] [US5] Add `vote(uuid: string): Promise<boolean>` action to `packages/radio-station/src/hooks/useRadioStations.ts`: uses `useMutation(VOTE_RADIO_STATION)` from `@mycircle/shared`; on success, saves uuid to `localStorage[StorageKeys.RADIO_VOTED]` (append to array); expose `isVoted(uuid: string): boolean` (reads from same key); expose `votedIds: string[]` state initialized from localStorage
- [ ] T023 [P] [US5] Add vote button and count to `packages/radio-station/src/components/StationCard.tsx`: add props `isVoted: boolean`, `onVote(uuid: string)`, `voteCount?: number`; show thumbs-up icon button with vote count; voted state: filled icon, disabled, different color; if no `window.__currentUid` show sign-in prompt tooltip on hover; `type="button"`, aria-label, touch target ≥ 44px (depends on T022)
- [ ] T024 [US5] Wire vote into `packages/radio-station/src/components/RadioStation.tsx`: pass `isVoted`, `onVote` from `useRadioStations` to `StationCard` and `StationDetail`; update `StationDetail.tsx` to accept and display vote button using same props (depends on T022, T023, T017)

**Checkpoint**: Voting functional from both station cards and detail panel across all tabs.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final rebuild, validation, and cleanup.

- [ ] T025 Run `pnpm build:shared` to rebuild shared package with all i18n + type + query changes
- [ ] T026 [P] Run `cd functions && npx tsc --noEmit` to verify backend types compile (no unused locals)
- [ ] T027 Run `pnpm lint && pnpm typecheck && pnpm test:run` — fix any failures before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — all T001–T005 can start immediately in parallel
- **Foundational (Phase 2)**: T001 must complete before T006 (schema needs StorageKey values); T006 before T007 (resolver needs schema); T007 before T008 (queries need resolver to exist); T008 before T009 (codegen needs updated queries); T009 before T010
- **User Stories (Phase 3–7)**: All depend on Phase 2 completion (T010); T003/T004/T005 (i18n) must complete before building components that use those keys
- **Polish (Phase 8)**: Depends on all user story phases completing

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 — independent of US2–US5
- **US2 (P2)**: Depends only on Phase 2 — independent of US1, US3–US5
- **US3 (P3)**: Depends only on Phase 2 — independent of US1, US2, US4, US5
- **US4 (P4)**: Depends only on Phase 2 — independent of US1–US3, US5
- **US5 (P5)**: Depends on Phase 2 AND T017 (StationDetail.tsx from US3 — vote button goes inside it)

### Within Each User Story

- Models/types before services before components
- T011 and T012 (US1) are parallel — different files, no dependency between them
- T013 (US1) depends on both T011 and T012
- T014 (US2) is independent; T015 depends on T014; T016 depends on T014 + T015
- T017 (US3) is independent; T018 depends on T017
- T019 (US4) is independent; T020 depends on T019; T021 depends on T019 + T020
- T022 and T023 (US5) are parallel; T024 depends on T022 + T023 + T017

### Parallel Opportunities

```bash
# Phase 1 — all parallel
T001  T002  T003  T004  T005

# Phase 2 — sequential (each depends on previous)
T006 → T007 → T008 → T009 → T010

# US1 — partial parallel
T011 ∥ T012  →  T013

# US2 — sequential with one parallel start
T014  →  T015  →  T016

# US3 — sequential
T017  →  T018

# US4 — partial parallel
T019  →  T020  →  T021

# US5 — partial parallel (T017 also required)
T022 ∥ T023  →  T024 (needs T017 from US3)
```

---

## Implementation Strategy

### MVP (User Story 1 Only — Genre/Country Filters)

1. Complete Phase 1 (T001–T005) — all in parallel
2. Complete Phase 2 (T006–T010) — sequential, schema + codegen
3. Complete Phase 3 US1 (T011–T013)
4. **STOP and VALIDATE**: Filter by jazz → filter by country → clear → empty state shown
5. Run `pnpm lint && pnpm typecheck && pnpm test:run`

### Incremental Delivery

1. Phase 1 + Phase 2 → Foundation ready
2. US1 (T011–T013) → Genre/Country filters ✓
3. US2 (T014–T016) → Recently Played tab ✓
4. US3 (T017–T018) → Station Detail panel ✓
5. US4 (T019–T021) → Sleep Timer ✓
6. US5 (T022–T024) → Voting ✓ *(requires US3 T017 first)*
7. Phase 8 (T025–T027) → Final validation + cleanup

---

## Notes

- `[P]` = different files, no blocking dependency on incomplete sibling tasks
- Each user story is independently testable after its phase completes
- US5 has a soft dependency on US3 (T017 — StationDetail.tsx receives the vote button); if skipping US3, add a vote button directly in StationCard instead
- After any schema change to `functions/src/schema.ts`, always run `pnpm codegen` before `pnpm build:shared`
- Spanish locale (`es.ts`) uses Unicode escapes — always read the target line before editing to avoid corruption
- `cd functions && npx tsc --noEmit` catches backend-only type errors (`noUnusedLocals: true`) not caught by root typecheck
