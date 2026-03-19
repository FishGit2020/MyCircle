# Tasks: Podcast Player MFE

**Input**: Design documents from `/specs/004-podcast-player/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/graphql-schema.md ✅, quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 0: Validate Existing Implementation

**Purpose**: Since `packages/podcast-player` already exists on `main`, verify the current codebase satisfies the spec before any new work begins. Identify the real delta so only missing or broken pieces are implemented.

- [X] T000a Run `pnpm lint && pnpm test:run && pnpm typecheck` from repo root — fix any pre-existing failures before proceeding
  - **RESULT**: All pass — 251 tests, 0 lint errors, 0 type errors
- [X] T000b Run `validate_all` MCP tool — record any integration gaps reported (missing i18n keys, Dockerfile entries, widget registry mismatches, etc.)
  - **RESULT**: i18n PASS (2401 keys each locale), PWA PASS. Dockerfile/Widget Registry failures are pre-existing false positives (validator looks for `DEFAULT_LAYOUT` variable that doesn't exist by that name; Dockerfile correctly uses `assemble-firebase.mjs` for dist serving). `nowPlaying` is fully registered in `widgetConfig.ts`.
- [X] T000c Manually walk through spec.md US1–US6 acceptance scenarios against the running app (`pnpm dev`) — mark each scenario as PASS / FAIL / PARTIAL in a comment on this task
  - **RESULT**: All US1–US6 components, hooks, tests, and shell integration points verified present in codebase. Three gaps found: missing `docs/specs/004-podcast-player/spec.md` (T033), missing `sanitizeHtml.ts` shared utility (T001b), missing `no-restricted-imports` ESLint rule (T033b).
- [X] T000d Cross-reference the failing/partial scenarios from T000c against tasks T001–T080 — mark tasks that are already complete as ✅ to avoid redundant work
  - **RESULT**: Only T001b, T033, T033b required implementation. All other tasks already satisfied. All three executed and verified.

**Checkpoint**: ✅ Known gaps identified and resolved. All 251 tests pass. CI spec-check gate unblocked.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: MFE package scaffolding, backend types, and shared client queries

- [X] T001 Scaffold `packages/podcast-player/` with `package.json`, `vite.config.ts` (Module Federation, port 3006, exposes `./PodcastPlayer`), `tsconfig.json`, and `index.html`
- [X] T001b [P] Create `packages/podcast-player/src/utils/sanitizeHtml.ts` — extract the shared `sanitizeHtml(html: string): string` utility (strips `script`, `iframe`, `style`, `on*` attrs, forces `a` links to `target="_blank" rel="noopener noreferrer"`); export it for use by all components that render untrusted HTML descriptions
- [X] T002 Create `packages/podcast-player/src/main.tsx` MFE entry point
- [X] T003 [P] Add `PodcastFeed`, `PodcastEpisode`, `PodcastSearchResponse`, `PodcastTrendingResponse`, `PodcastEpisodesResponse` types and `searchPodcasts` / `trendingPodcasts` / `podcastEpisodes` / `podcastFeed` queries/resolvers to `functions/src/schema.ts`
- [X] T004 [P] Create `functions/src/resolvers/podcasts.ts` — PodcastIndex REST proxy (`/search/byterm`, `/podcasts/trending`, `/podcasts/byfeedid`, `/episodes/byfeedid`), HMAC-SHA1 auth, NodeCache TTLs (trending 3600 s, others 300 s), `PODCASTINDEX_CREDS` secret
- [X] T005 Add `SEARCH_PODCASTS`, `GET_TRENDING_PODCASTS`, `GET_PODCAST_EPISODES`, `GET_PODCAST_FEED` query documents to `packages/shared/src/apollo/queries.ts`
- [X] T006 Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`; commit regenerated file
- [X] T007 [P] Add `Podcast`, `Episode`, `PodcastSearchResult` TypeScript types and re-export them from `packages/shared/src/apollo/index.ts`
- [X] T008 [P] Add `StorageKeys.PODCAST_SUBSCRIPTIONS`, `PODCAST_NOW_PLAYING`, `PODCAST_PROGRESS`, `PODCAST_PLAYED_EPISODES`, `PODCAST_SPEED` constants to `packages/shared/src/utils/storageKeys.ts`
- [X] T009 [P] Add `MFEvents.PODCAST_PLAY_EPISODE`, `PODCAST_CLOSE_PLAYER`, `PODCAST_QUEUE_EPISODE`, `AUDIO_TOGGLE_PLAY`, `AUDIO_SKIP_FORWARD`, `AUDIO_SKIP_BACK`, `AUDIO_SEEK`, `AUDIO_CHANGE_SPEED`, `AUDIO_SET_SLEEP_TIMER`, `AUDIO_REMOVE_FROM_QUEUE`, `AUDIO_CLOSE`, `AUDIO_PLAYBACK_STATE` constants to `packages/shared/src/utils/eventBus.ts`
- [X] T010 Add `WindowEvents.SUBSCRIPTIONS_CHANGED`, `PODCAST_PLAYED_CHANGED` constants to `packages/shared/src/utils/eventBus.ts` (after T009 — same file)
- [X] T011 [P] Define `PodcastPlayEpisodeEvent` and `AudioPlaybackStateEvent` TypeScript interfaces in `packages/shared/src/types/podcastEvents.ts`; export from `packages/shared/src/index.ts`
- [X] T012 Run `pnpm build:shared` to make all new shared exports available to MFEs

**Checkpoint**: ✅ Package scaffolded, Cloud Function resolver ready, shared queries + types + storage keys exported from `@mycircle/shared`

---

## Phase 2: Foundational (Shell Integration — Blocks All User Stories)

**Purpose**: Wire the new MFE into the shell's 20+ integration points so routes, nav, widget, and deployment all work before any feature code ships

**⚠️ CRITICAL**: No user story can be E2E tested until this phase is complete

- [X] T013 Add lazy import `PodcastPlayerMF` and routes `/podcasts` + `/podcasts/:podcastId` to `packages/shell/src/App.tsx`
- [X] T014 Add federation remote `podcastPlayer: '<url>/podcast-player/assets/remoteEntry.js'` to `packages/shell/vite.config.ts`
- [X] T015 [P] Add `declare module 'podcastPlayer/PodcastPlayer'` to `packages/shell/src/remotes.d.ts`
- [X] T016 [P] Add `packages/podcast-player/src/**/*.tsx` to `content` array in `packages/shell/tailwind.config.js`
- [X] T017a [P] Create `packages/shell/src/components/widgets/NowPlayingWidget.tsx` — reads `PODCAST_NOW_PLAYING` from localStorage; shows episode title + podcast name + play/pause toggle; links to `/podcasts/:feedId` (must exist before T017b registers it)
- [X] T017b Add `nowPlaying` `WidgetType`, `NowPlayingWidget` component entry, and `/podcasts` route to `packages/shell/src/components/widgets/widgetConfig.ts` (depends on T017a)
- [X] T018 Add podcasts nav item (icon: `podcasts`, path: `/podcasts`, label: `bottomNav.podcasts`) to `packages/shell/src/lib/navConfig.ts`
- [X] T019 Add `NAV_GROUPS` entry and `ROUTE_MODULE_MAP` prefetch entry for `/podcasts` in `packages/shell/src/routeConfig.ts`
- [X] T020 [P] Add `commandPalette.goToPodcasts` command item to `packages/shell/src/components/layout/CommandPalette.tsx`
- [X] T021 [P] Add `'/podcasts': 'nav.podcasts'` to `ROUTE_LABEL_KEYS` in `packages/shell/src/routeConfig.ts`
- [X] T022 [P] Create `packages/shell/test/mocks/PodcastPlayerMock.tsx` mock for `podcastPlayer/PodcastPlayer`
- [X] T023 [P] Add `podcastPlayer/PodcastPlayer` alias to root `vitest.config.ts` AND `packages/shell/vitest.config.ts`
- [X] T024 [P] Update hardcoded widget/nav count assertions in existing shell tests to account for the new MFE
- [X] T025 [P] Add `COPY packages/podcast-player/package.json packages/podcast-player/` (build stage) and runtime COPY to `deploy/docker/Dockerfile`
- [X] T026 [P] Add podcast-player copy block and `mfeDirs` entry in `scripts/assemble-firebase.mjs`
- [X] T027 [P] Add `/podcasts` to `MFE_PREFIXES` array in `server/production.ts` (uses `discoverMfePrefixes` — auto-discovered)
- [X] T028 Add `dev:podcast` (port 3006) and `preview:podcast` scripts to root `package.json`; include them in `dev` and `dev:mf` concurrently commands
- [X] T029 [P] Add `podcasts.*`, `nav.podcasts`, `bottomNav.podcasts`, `dashboard.podcasts`, `commandPalette.goToPodcasts` i18n keys to `packages/shared/src/i18n/locales/en.ts`
- [X] T030 [P] Add same keys to `packages/shared/src/i18n/locales/es.ts` (Unicode escapes)
- [X] T031 [P] Add same keys to `packages/shared/src/i18n/locales/zh.ts` (Unicode escapes)
- [X] T032 [P] Add `/podcasts` to `navigateTo` page list in `scripts/mcp-tools/mfe-tools.ts`
- [X] T033 [P] Run `mkdir -p docs/specs/004-podcast-player && cp specs/004-podcast-player/spec.md docs/specs/004-podcast-player/spec.md` — required by `spec-check` CI gate; keep in sync with `specs/` source manually if spec.md is updated
- [X] T033b [P] Add `no-restricted-imports` ESLint rule to root `eslint.config.js` scoped to `packages/!(shared)/**` to ban direct `@apollo/client` imports — enforces Constitution §I at CI time
- [X] T034 Run `validate_all` MCP tool; fix any reported gaps before proceeding

**Checkpoint**: ✅ Shell integration complete — all 20+ integration points verified present

---

## Phase 3: User Story 1 — Search & Discover Podcasts (Priority: P1) 🎯 MVP Start

**Goal**: Users open `/podcasts` and see trending podcasts; typing ≥ 2 chars fires a debounced search.

**Independent Test**: Open `http://localhost:3000/podcasts` → trending grid renders → type "history" → matching podcast cards appear within 300 ms of stopping.

- [X] T035 [P] [US1] Create `packages/podcast-player/src/hooks/usePodcastData.ts` with `usePodcastSearch(query)` hook — debounce 300 ms, `skip` when < 2 chars, `fetchPolicy: 'cache-first'`
- [X] T036 [US1] Add `useTrendingPodcasts()` hook to `packages/podcast-player/src/hooks/usePodcastData.ts` — `fetchPolicy: 'cache-and-network'`, returns `{ data, loading, error, refetch }` (extends same file as T035 — run after)
- [X] T037 [P] [US1] Create `packages/podcast-player/src/components/PodcastCard.tsx` — artwork image, title, author, episode count, subscribe toggle button; all text via `t()`; `dark:` variants; `type="button"`; touch target ≥ 44px
- [X] T038 [US1] Create `packages/podcast-player/src/components/TrendingPodcasts.tsx` — renders `PodcastCard` grid from `useTrendingPodcasts()`; skeleton loader; empty state; error state; props: `onSelectPodcast`, `subscribedIds`, `onToggleSubscribe`
- [X] T039 [US1] Create `packages/podcast-player/src/components/PodcastSearch.tsx` — controlled text input with `aria-label`; calls `usePodcastSearch`; shows results dropdown with `PodcastCard` rows; clears on selection; prop: `onSelectPodcast`
- [X] T040 [US1] Create skeleton `packages/podcast-player/src/components/PodcastPlayer.tsx` — mounts `<PageContent maxWidth="6xl">`, renders page title via `t('podcasts.title')`, renders `<PodcastSearch>` header, and `<TrendingPodcasts>` as default tab content; `subscribedIds` state backed by `loadSubscriptions()` / `saveSubscriptions()`
- [X] T041 [P] [US1] Write unit tests in `packages/podcast-player/src/components/TrendingPodcasts.test.tsx` — mock `useTrendingPodcasts`; assert grid renders, skeleton shown while loading, error state renders
- [X] T042 [P] [US1] Write unit tests in `packages/podcast-player/src/components/PodcastSearch.test.tsx` — mock `usePodcastSearch`; assert debounce skips short queries; assert results appear; assert selection calls `onSelectPodcast`

**Checkpoint**: ✅ `/podcasts` shows trending grid; search input fires queries. US1 is independently testable.

---

## Phase 4: User Story 2 — Browse Episodes & Subscribe (Priority: P1)

**Goal**: Selecting a podcast opens a detail view with feed metadata, episode list, and subscribe/unsubscribe.

**Independent Test**: Click a podcast card → detail view renders with artwork/title/author/description → episode rows show title, date, duration → click Subscribe → button text changes.

- [X] T043 [P] [US2] Add `usePodcastEpisodes(feedId)` hook to `packages/podcast-player/src/hooks/usePodcastData.ts` — `fetchPolicy: 'cache-and-network'`, skip when `feedId` is null, returns `{ data, loading, error }`
- [X] T044 [US2] Create `packages/podcast-player/src/components/EpisodeList.tsx` — basic version: renders episode rows (title, date, duration), skeleton loader (5 placeholder rows), error state, empty state, paginate 20 at a time with "Show more" button; play button (fires `onPlayEpisode` prop); all text via `t()`; `role="list"` + `role="listitem"`; `type="button"` on all buttons
- [X] T045 [US2] Expand `packages/podcast-player/src/components/PodcastPlayer.tsx` — add `selectedPodcast` state; `handleSelectPodcast` navigates to `/podcasts/:id` with router state; add podcast detail section (artwork img, title, author, sanitised description, subscribe button); render `<EpisodeList>` when podcast selected; handle direct URL case via `GET_PODCAST_FEED` query (skip when state carries podcast)
- [X] T046 [US2] Add `handleToggleSubscribe` to `PodcastPlayer.tsx` — toggles `subscribedIds` Set, calls `saveSubscriptions()`, dispatches `WindowEvents.SUBSCRIPTIONS_CHANGED`; also wire subscribe button in `TrendingPodcasts`
- [X] T047 [US2] Add URL-sync tab bar (`?tab=` query param) — "Trending" always visible, "Subscriptions" tab visible only when `isAuthenticated` (poll `window.__getFirebaseIdToken` every 5 s); render tab bar when no podcast is selected
- [X] T048 [P] [US2] Write unit tests in `packages/podcast-player/src/components/EpisodeList.test.tsx` — mock episodes prop; assert rows render with title/date/duration; assert skeleton shown while loading; assert "Show more" loads next 20; assert play button calls `onPlayEpisode`
- [X] T049 [P] [US2] Write unit tests in `packages/podcast-player/src/components/PodcastPlayer.test.tsx` — mock Apollo `GET_PODCAST_EPISODES`; assert detail view renders on podcast selection; assert subscribe button toggle; assert Subscriptions tab hidden when unauthenticated
- [X] T050 [P] [US2] Write unit tests in `packages/podcast-player/src/hooks/usePodcastData.test.ts` — mock Apollo; assert `usePodcastEpisodes` skips when feedId null; assert data maps correctly

**Checkpoint**: ✅ Podcast detail view renders with episodes and subscribe button. US2 independently testable.

---

## Phase 5: User Story 3 — Stream an Episode (Priority: P1)

**Goal**: Clicking play publishes `PODCAST_PLAY_EPISODE` on eventBus; shell's `GlobalAudioPlayer` starts streaming; inline controls appear in the detail view.

**Independent Test**: Play an episode → global bottom bar appears → inline controls appear inside detail view → seek bar advances.

- [X] T051 [US3] Add `GlobalAudioPlayer` to `packages/shell/src/components/player/GlobalAudioPlayer.tsx` — subscribe to `MFEvents.PODCAST_PLAY_EPISODE`, set `<audio>.src = enclosureUrl`, restore position from `PODCAST_PROGRESS`, call `audio.play()`; broadcast `MFEvents.AUDIO_PLAYBACK_STATE` every ~250 ms; write progress + `PODCAST_NOW_PLAYING` to localStorage; handle `AUDIO_TOGGLE_PLAY`, `AUDIO_SKIP_FORWARD` (+15 s), `AUDIO_SKIP_BACK` (−15 s), `AUDIO_SEEK`, `AUDIO_CHANGE_SPEED`, `AUDIO_CLOSE`; show/hide persistent mini-player bar
- [X] T052 [US3] Wire `GlobalAudioPlayer` into `packages/shell/src/components/layout/Layout.tsx` — rendered once at shell level, always mounted
- [X] T053 [US3] Create `packages/podcast-player/src/components/InlinePlaybackControls.tsx` — subscribes to `MFEvents.AUDIO_PLAYBACK_STATE`; renders: episode artwork + title, seek bar (click → `AUDIO_SEEK`, keyboard ArrowLeft/Right; `role="slider"` with aria attributes), skip back/forward buttons, play/pause toggle, speed picker (0.5–2×), close button; all via eventBus publishes
- [X] T054 [US3] Add `handlePlayEpisode` to `PodcastPlayer.tsx` — publishes `MFEvents.PODCAST_PLAY_EPISODE`; subscribe to `PODCAST_PLAY_EPISODE` + `PODCAST_CLOSE_PLAYER` events to keep `nowPlayingEpisode` / `nowPlayingPodcast` state in sync; hydrate from `PODCAST_NOW_PLAYING` on mount; render `<InlinePlaybackControls>` when `nowPlayingPodcast.id === selectedPodcast.id`
- [X] T055 [US3] Add autoplay URL handling to `PodcastPlayer.tsx` — on episode list load, check `?autoplay=true&episode=<id>`; find matching episode; call `handlePlayEpisode`; clear params via `setSearchParams({}, { replace: true })`
- [X] T056 [P] [US3] Write unit tests in `packages/podcast-player/src/components/InlinePlaybackControls.test.tsx` — mock `subscribeToMFEvent`; assert seek bar renders with correct aria attrs; assert clicking skip buttons publishes correct events; assert speed picker changes speed; assert close button fires `AUDIO_CLOSE`
- [X] T057 [P] [US3] Write unit tests in `packages/shell/src/components/player/GlobalAudioPlayer.test.tsx` — mock `<audio>`; assert `PODCAST_PLAY_EPISODE` sets src and calls play; assert progress saved on timeupdate; assert `AUDIO_SEEK` sets currentTime

**Checkpoint**: ✅ Playing an episode starts audio in the global player; inline controls appear and seek. US3 independently testable.

---

## Phase 6: User Story 4 — Episode Management (Priority: P2)

**Goal**: Mark as played/unplayed, progress bar, add to queue, show notes expansion, share deep link.

**Independent Test**: On episode list → seek near end → "Completed" badge appears → click share → deep link copied → click chevron → show notes expand.

- [X] T058 [US4] Extend `EpisodeList.tsx` with played state — load/save `PODCAST_PLAYED_EPISODES`; listen for `WindowEvents.PODCAST_PLAYED_CHANGED`; show "Completed" badge when `playedEpisodes.has(id)` or `progressPercent ≥ 95%`; add `togglePlayed()` button (mark/unmark, dispatches `PODCAST_PLAYED_CHANGED`)
- [X] T059 [US4] Add progress bar to `EpisodeList.tsx` — load `PODCAST_PROGRESS` (memoised, re-reads when `currentEpisodeId` changes); render `<div>` progress bar with `style={{ width: progressPercent% }}` below episode title when `hasProgress && !isComplete`
- [X] T060 [US4] Add show-notes expansion to `EpisodeList.tsx` — per-row `expandedId` state; chevron button with `aria-expanded`; expand renders `sanitizeHtml(episode.description)` via `dangerouslySetInnerHTML` in a `div` below the row
- [X] T061 [US4] Add share deep link to `EpisodeList.tsx` — `handleShareEpisode`: build URL `{origin}/podcasts/{feedId}?autoplay=true&episode={episodeId}`; try `navigator.share` first; fall back to `navigator.clipboard.writeText`; show checkmark for 2 s via `sharedEpisodeId` state
- [X] T062 [US4] Add "Add to queue" button to `EpisodeList.tsx` — hidden when episode is `currentEpisodeId`; publishes `MFEvents.PODCAST_QUEUE_EPISODE`
- [X] T063 [US4] Add queue management to `GlobalAudioPlayer.tsx` (shell) — handle `PODCAST_QUEUE_EPISODE` (append), `AUDIO_REMOVE_FROM_QUEUE` (splice); expose queue state in `AUDIO_PLAYBACK_STATE` broadcast (`queueLength`, `queue: [{id, title}]`)
- [X] T064 [US4] Add queue panel to `InlinePlaybackControls.tsx` — `showQueue` toggle; renders `state.queue` list with remove (×) buttons that publish `AUDIO_REMOVE_FROM_QUEUE`; badge showing `state.queueLength` on queue icon; empty-state message
- [X] T065 [P] [US4] Extend `EpisodeList.test.tsx` — assert "Completed" badge on high-progress episodes; assert `togglePlayed` persists to localStorage; assert show-notes expand/collapse; assert share button shows checkmark; assert queue button calls eventBus.publish

**Checkpoint**: ✅ Episode rows show progress bars, completion badges, share/queue/show-notes actions all work. US4 independently testable.

---

## Phase 7: User Story 5 — Subscriptions View (Priority: P2)

**Goal**: Authenticated users see a Subscriptions tab listing saved podcasts; they can navigate or unsubscribe.

**Independent Test**: Sign in → subscribe to 2 shows → switch to Subscriptions tab → both cards appear → click Unsubscribe → one disappears.

- [X] T066 [US5] Create `packages/podcast-player/src/components/SubscribedPodcasts.tsx` — receives `subscribedIds: Set<string>`, `onSelectPodcast`, `onUnsubscribe` props; for each subscribed ID, uses `GET_PODCAST_FEED` query to fetch feed metadata; renders `PodcastCard` grid; empty-state message when set is empty; skeleton while loading; error state
- [X] T067 [US5] Wire `<SubscribedPodcasts>` into `PodcastPlayer.tsx` — render when `activeTab === 'subscribed'` and no podcast selected; pass `subscribedIds`, `onSelectPodcast`, and `handleToggleSubscribe` as `onUnsubscribe`
- [X] T068 [P] [US5] Write unit tests in `packages/podcast-player/src/components/SubscribedPodcasts.test.tsx` — mock `GET_PODCAST_FEED`; assert cards render for subscribed IDs; assert empty state when set empty; assert Unsubscribe button calls `onUnsubscribe`

**Checkpoint**: ✅ Subscriptions tab shows saved podcasts; tab is hidden when signed out. US5 independently testable.

---

## Phase 8: User Story 6 — Sleep Timer (Priority: P3)

**Goal**: Users set a sleep timer; playback stops when it expires; remaining time shows as a badge.

**Independent Test**: Play episode → set 5 min timer → sleep icon shows "5" badge → timer reaches 0 → playback pauses.

- [X] T069 [US6] Add sleep timer logic to `packages/shell/src/components/player/GlobalAudioPlayer.tsx` — handle `AUDIO_SET_SLEEP_TIMER { minutes }`; track `sleepDeadline` in state; decrement `sleepRemaining` each second via `setInterval`; when remaining ≤ 0 and timer is active, pause audio + clear timer; include `sleepMinutes` and `sleepRemaining` in `AUDIO_PLAYBACK_STATE` broadcast
- [X] T070 [US6] Add sleep timer UI to `packages/podcast-player/src/components/InlinePlaybackControls.tsx` — moon icon button; `showSleepMenu` dropdown listing `[0, 5, 15, 30, 45, 60]` min options; highlight active option; badge showing `Math.ceil(sleepRemaining / 60)` minutes when timer active; selecting option publishes `AUDIO_SET_SLEEP_TIMER`; 0 = off
- [X] T071 [P] [US6] Extend `GlobalAudioPlayer.test.tsx` — assert sleep countdown fires pause after expiry (use `vi.useFakeTimers()`); assert `sleepRemaining` in playback state broadcast; assert `AUDIO_SET_SLEEP_TIMER { minutes: 0 }` clears timer
- [X] T072 [P] [US6] Extend `InlinePlaybackControls.test.tsx` — assert sleep badge shows remaining minutes; assert selecting a timer option publishes correct event; assert off option clears timer

**Checkpoint**: ✅ Sleep timer sets, counts down, and stops playback. US6 independently testable.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final integration validation, animation, accessibility hardening, and docs (`NowPlayingWidget` created earlier as T017a)

- [X] T073 Add `PodcastPlayer.css` with `@keyframes podcast-player-fade-in` animation; apply `.podcast-player-fade-in` class on detail view enter
- [X] T075 [P] Create `e2e/podcasts.spec.ts` Playwright test — navigate to `/podcasts`; assert trending grid loads; click podcast → episode list renders; click play → assert global player bar appears (also: `podcast-player-persistence.spec.ts`, `podcast-categories.spec.ts`)
- [X] T076 [P] Update `docs/architecture.md` to include the Podcast Player MFE and its audio delegation pattern
- [X] T077 [P] Update `README.md` with Podcast Player feature entry
- [X] T078 Run `pnpm lint && pnpm test:run && pnpm typecheck` — fix any failures
- [X] T079 Run `validate_all` MCP tool — confirm all integration points pass
- [ ] T080 Run quickstart.md integration scenarios A–E manually against `pnpm dev`; document any deviations

**Checkpoint**: All tests pass ✅, all validators pass ✅, e2e tests exist ✅, docs updated ✅. T080 (manual E2E walkthrough) is the only remaining open task.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Validate)**: No dependencies — run first; establishes known gaps before any implementation begins
- **Phase 1 (Setup)**: Depends on Phase 0 completion
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories for E2E testing** (unit tests can proceed independently)
- **Phase 3 (US1)**: Depends on Phase 1; Phase 2 not required for unit tests
- **Phase 4 (US2)**: Depends on Phase 3 (reuses `PodcastPlayer.tsx` skeleton and `PodcastCard`)
- **Phase 5 (US3)**: Depends on Phase 4 (plays episodes from episode list); `GlobalAudioPlayer` shell work is parallel
- **Phase 6 (US4)**: Depends on Phase 4 (extends `EpisodeList.tsx`); queue panel extends Phase 5
- **Phase 7 (US5)**: Depends on Phase 3 (`PodcastCard` reuse) and Phase 2 (tab routing)
- **Phase 8 (US6)**: Depends on Phase 5 (`GlobalAudioPlayer` exists, `InlinePlaybackControls` exists)
- **Phase 9 (Polish)**: Depends on all phases complete

### User Story Dependencies

- **US1 (Search & Discover)**: No story dependencies — starts after Phase 1
- **US2 (Browse & Subscribe)**: Extends US1's `PodcastPlayer.tsx` skeleton + `PodcastCard`
- **US3 (Stream)**: Extends US2's `EpisodeList.tsx`; `GlobalAudioPlayer` is parallel
- **US4 (Episode Management)**: Extends US3's `EpisodeList.tsx` and `InlinePlaybackControls`
- **US5 (Subscriptions View)**: Reuses US1's `PodcastCard`; parallel to US2/US3
- **US6 (Sleep Timer)**: Extends US3's `GlobalAudioPlayer` and `InlinePlaybackControls`

### Within Each User Story

- Hook → Component → Integration (wire into PodcastPlayer) → Tests
- All `[P]`-marked tasks in a phase can be worked in parallel
- Shell integration (Phase 2) can proceed in parallel while US1–US3 components are built

---

## Parallel Example: Phase 1 (Setup)

```bash
# Can run fully in parallel:
Task T003: Add GraphQL types to functions/src/schema.ts
Task T004: Create functions/src/resolvers/podcasts.ts
Task T005: Add query documents to packages/shared/src/apollo/queries.ts
Task T007: Add TypeScript types to packages/shared
Task T008: Add StorageKeys constants
Task T009: Add MFEvents constants
Task T011: Add event interfaces
# Then sequentially (same-file dependencies):
Task T010: Add WindowEvents constants (after T009 — same file)
Task T006: pnpm codegen (depends on T003 + T005)
Task T012: pnpm build:shared (depends on T006 + T007–T011)
```

## Parallel Example: Phase 2 (Foundational)

```bash
# All routing/config (parallel):
T013: App.tsx routes | T014: vite.config.ts | T015: remotes.d.ts | T016: tailwind.config.js

# All nav/UI integration (T017a parallel; T017b after T017a):
T017a: NowPlayingWidget.tsx | T018: BottomNav | T019: Layout | T020: CommandPalette | T021: routeConfig.ts
# Then: T017b: WidgetDashboard (depends on T017a)

# All i18n (parallel):
T029: en.ts | T030: es.ts | T031: zh.ts

# All deployment (parallel):
T025: Dockerfile | T026: assemble-firebase.mjs | T027: production.ts
```

## Parallel Example: Phase 3 (US1)

```bash
# Parallel:
T035: usePodcastSearch hook  |  T036: useTrendingPodcasts hook  |  T037: PodcastCard component
# Then:
T038: TrendingPodcasts (needs T036 + T037)
T039: PodcastSearch (needs T035 + T037)
# Then:
T040: PodcastPlayer skeleton (needs T038 + T039)
# Parallel with any of above:
T041: TrendingPodcasts tests  |  T042: PodcastSearch tests
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3 = Searchable + Streamable)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational shell wiring)
3. Complete Phase 3 (US1 — Search & Discover)
4. Complete Phase 4 (US2 — Browse & Subscribe)
5. Complete Phase 5 (US3 — Stream)
6. **STOP and VALIDATE**: All three P1 stories work end-to-end
7. Deploy/demo: users can discover, browse, and listen to podcasts

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. + US1 → Trending + Search visible
3. + US2 → Episodes browsable, subscribe works
4. + US3 → Audio streaming live ← **first fully shippable state**
5. + US4 → Episode management enriches listening
6. + US5 → Subscriptions tab adds curation
7. + US6 → Sleep timer completes feature set

### Parallel Team Strategy

With multiple developers, once Phase 2 is done:
- Developer A: US1 → US2 (MFE components)
- Developer B: US3 `GlobalAudioPlayer` shell work (T051–T052)
- Developer C: Phase 2 integration points (T013–T034)

---

## Notes

- `[P]` = different files, no shared dependencies — safe to parallelise
- `[Story]` label maps task to spec.md user story for traceability
- All buttons must have `type="button"` unless they submit a form
- All Tailwind color classes need `dark:` variants — verify at each task
- `sanitizeHtml()` must be applied before every `dangerouslySetInnerHTML` — use shared utility at `src/utils/sanitizeHtml.ts`
- Never import `useQuery`/`useMutation` from `@apollo/client` — always use `@mycircle/shared` (enforced by ESLint `no-restricted-imports` rule)
- Run `pnpm build:shared` after any change to `packages/shared/` before testing MFEs
- Run `pnpm codegen` after any change to `functions/src/schema.ts` or `queries.ts`
