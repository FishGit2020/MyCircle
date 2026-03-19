# Implementation Plan: Podcast Player MFE

**Branch**: `004-podcast-player` | **Date**: 2026-03-19 | **Spec**: specs/004-podcast-player/spec.md
**Input**: Feature specification from `/specs/004-podcast-player/spec.md`

## Summary

Add a full-featured Podcast Player as a new MFE. Users search the PodcastIndex catalogue, browse trending shows, subscribe to feeds, stream episodes, and manage playback. Audio streaming is delegated entirely to the shell's `GlobalAudioPlayer` so the mini-player persists across route changes. Episode progress, subscriptions, and played state are stored in localStorage; subscription changes fire `WindowEvents.SUBSCRIPTIONS_CHANGED` so the shell can sync to Firestore. The MFE adds the complete integration checklist (routes, nav, widget, command palette, i18n, Dockerfile, dev scripts, tests, e2e, AI tool registry).

## Technical Context

**Language/Version**: TypeScript 5.x, React 18
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, eventBus, i18n, StorageKeys, PageContent), `react-router` (URL routing and deep-link autoplay)
**Storage**: `localStorage` — subscriptions, progress, played state, playback speed, now-playing; Firestore sync via shell on `SUBSCRIPTIONS_CHANGED`
**Testing**: Vitest + React Testing Library; all Apollo queries mocked via `MockedProvider`
**Target Platform**: Web (mobile-first, responsive); PWA shortcut included
**Project Type**: New MFE package in pnpm monorepo
**Performance Goals**: Search results debounced at 300 ms; trending cached server-side 3600 s; episode list renders in <16 ms (no canvas/WebGL)
**Constraints**: No direct `@apollo/client` imports; no `<audio>` tag in MFE (shell-owned); no polling; HTML descriptions must be sanitised before render; audio streaming depends on `enclosureUrl` from PodcastIndex (third-party CDN)
**Scale/Scope**: ~6 new components, 1 hook file, 4 GraphQL queries, 1 Cloud Function resolver, 40+ i18n keys across 3 locales, 20+ shell integration points

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | No direct `@apollo/client` imports; all hooks via `@mycircle/shared`; `<audio>` element lives in shell's `GlobalAudioPlayer`, not in MFE |
| II. Complete Integration | ✅ PASS | All 20+ touchpoints covered: routes, nav, widget, command palette, breadcrumbs, i18n (3 locales), Dockerfile, dev scripts, Tailwind content, vitest aliases, e2e tests, AI tool registry, spec file, docs |
| III. GraphQL-First | ✅ PASS | All MFE data via `useQuery` from `@mycircle/shared`; REST only inside Cloud Function resolver (PodcastIndex is a third-party REST-only API — acceptable per §III exception) |
| IV. Inclusive by Default | ✅ PASS | All strings via `t('key')` in 3 locales; all Tailwind classes have `dark:` variants; `aria-label` on all interactive buttons; `type="button"` on all non-submit buttons; touch targets ≥ 44px; wrapped in `<PageContent>` |
| V. Fast Tests, Safe Code | ✅ PASS | All network calls mocked in tests; HTML sanitised before `dangerouslySetInnerHTML`; no assertion timeouts > 5000 ms; `userEvent.setup({ delay: null })` used |
| VI. Simplicity | ✅ PASS | No new charting/media libraries; audio delegated to existing shell player; localStorage for local state; minimal abstractions |

**Post-design re-check**: All gates pass. REST exception for PodcastIndex is within §III's "third-party APIs that do not offer a GraphQL interface" carve-out. No Complexity Tracking needed.

## Project Structure

### Documentation (this feature)

```text
specs/004-podcast-player/
├── plan.md              # This file
├── spec.md              # User stories (US1–US6)
├── research.md          # Phase 0 decisions
├── data-model.md        # Entities, state, localStorage keys, data flows
├── quickstart.md        # Dev setup, integration scenarios, troubleshooting
├── contracts/
│   └── graphql-schema.md   # GraphQL types, queries, eventBus interface
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code

```text
packages/podcast-player/
├── src/
│   ├── components/
│   │   ├── PodcastPlayer.tsx          # Root component — routing, subscription, now-playing
│   │   ├── PodcastSearch.tsx          # Debounced search + results dropdown
│   │   ├── TrendingPodcasts.tsx       # Discovery tab — trending feed grid
│   │   ├── SubscribedPodcasts.tsx     # Subscriptions tab — saved feeds
│   │   ├── EpisodeList.tsx            # Episode list: progress, play, share, queue, mark-played
│   │   ├── InlinePlaybackControls.tsx # Seek bar, speed, sleep, queue panel
│   │   └── PodcastCard.tsx            # Reusable feed card (artwork, title, subscribe)
│   ├── hooks/
│   │   └── usePodcastData.ts          # usePodcastSearch, useTrendingPodcasts, usePodcastEpisodes
│   └── main.tsx                       # MFE entry point

packages/shell/src/
├── components/player/
│   └── GlobalAudioPlayer.tsx         # Shell audio engine — MODIFIED by this MFE:
│                                     #   T051: audio streaming (PODCAST_PLAY_EPISODE handler,
│                                     #         <audio> src/play, AUDIO_PLAYBACK_STATE broadcast)
│                                     #   T052: wired into Layout.tsx
│                                     #   T063: queue management (PODCAST_QUEUE_EPISODE,
│                                     #         AUDIO_REMOVE_FROM_QUEUE)
│                                     #   T069: sleep timer (AUDIO_SET_SLEEP_TIMER, countdown)

functions/src/
├── resolvers/
│   └── podcasts.ts                   # PodcastIndex REST proxy + NodeCache (NEW)
└── schema.ts                         # PodcastFeed, PodcastEpisode, queries/resolvers (MODIFIED)

packages/shared/src/
├── apollo/
│   ├── queries.ts                    # SEARCH_PODCASTS, GET_TRENDING_PODCASTS, etc. (MODIFIED)
│   └── generated.ts                  # pnpm codegen output (REGENERATED)
└── i18n/locales/
    ├── en.ts                         # ~40+ podcasts.* keys (MODIFIED)
    ├── es.ts                         # Unicode escapes (MODIFIED)
    └── zh.ts                         # Unicode escapes (MODIFIED)
```

**Structure Decision**: New top-level MFE package (`packages/podcast-player`). Single-project layout — components + hooks only; no local backend. Cloud Function resolver and shared queries live in their respective packages per monorepo convention. `GlobalAudioPlayer.tsx` in the shell is extended (not replaced) to support podcast audio streaming, queue, and sleep timer.

## Complexity Tracking

> No constitution violations — table omitted.

## Implementation Notes

### Shell Integration Points

All 20+ integration points required when adding a new MFE:

1. `packages/shell/src/App.tsx` — lazy import `PodcastPlayerMF` + routes `/podcasts` and `/podcasts/:podcastId`
2. `packages/shell/vite.config.ts` — federation remote `podcastPlayer: .../podcast-player/assets/remoteEntry.js`
3. `packages/shell/src/remotes.d.ts` — `declare module 'podcastPlayer/PodcastPlayer'`
4. `packages/shell/tailwind.config.js` — `content` includes `packages/podcast-player/src/**/*.tsx`
5. `packages/shell/src/components/layout/WidgetDashboard.tsx` — `WidgetType` + `nowPlaying` widget
6. `packages/shell/src/components/layout/BottomNav.tsx` — podcasts nav item (icon: `podcasts`)
7. `packages/shell/src/components/layout/Layout.tsx` — `NAV_GROUPS` item + `ROUTE_MODULE_MAP` prefetch
8. `packages/shell/src/components/CommandPalette.tsx` — `commandPalette.goToPodcasts` item
9. `packages/shell/src/lib/routeConfig.ts` — `ROUTE_LABEL_KEYS` for breadcrumbs (`/podcasts` → `nav.podcasts`)
10. `packages/shell/test/mocks/` — mock file for `podcastPlayer/PodcastPlayer`
11. Root `vitest.config.ts` AND `packages/shell/vitest.config.ts` — alias for `podcastPlayer/PodcastPlayer`
12. Existing shell test counts — update widget/nav counts in snapshot/count assertions
13. `e2e/podcasts.spec.ts` — e2e Playwright test
14. `deploy/docker/Dockerfile` — `COPY packages/podcast-player/` in both build and runtime stages
15. `scripts/assemble-firebase.mjs` — copy block + `mfeDirs` array entry
16. `server/production.ts` — `MFE_PREFIXES` array
17. `firestore.rules` — no new subcollections (subscriptions go on existing `users/{uid}`)
18. Root `package.json` — `dev:podcast`, `preview:podcast`, and include in `dev` + `dev:mf` concurrently
19. i18n — `podcasts.*` keys in `en.ts`, `es.ts`, `zh.ts`; `nav.podcasts`, `bottomNav.podcasts`, `commandPalette.goToPodcasts`, `dashboard.podcasts`
20. `docs/architecture.md` + `README.md`
21. `scripts/mcp-tools/mfe-tools.ts` — add `/podcasts` to `navigateTo` page list
22. `vite.config.ts` (podcast-player) — exposes `./PodcastPlayer`, port 3006, shared singletons
23. `docs/specs/004-podcast-player/spec.md` — required by `spec-check` CI gate

### GlobalAudioPlayer Shell Changes

`packages/shell/src/components/player/GlobalAudioPlayer.tsx` is extended by this MFE across four tasks:

- **T051** — Core audio engine: subscribe to `PODCAST_PLAY_EPISODE`, set `<audio>.src = enclosureUrl`, restore position from `PODCAST_PROGRESS`, call `audio.play()`; broadcast `AUDIO_PLAYBACK_STATE` every ~250 ms; write progress + `PODCAST_NOW_PLAYING` to localStorage; handle `AUDIO_TOGGLE_PLAY`, `AUDIO_SKIP_FORWARD/BACK`, `AUDIO_SEEK`, `AUDIO_CHANGE_SPEED`, `AUDIO_CLOSE`
- **T052** — Wire into `Layout.tsx` (rendered once at shell level, always mounted)
- **T063** — Queue management: handle `PODCAST_QUEUE_EPISODE` (append) and `AUDIO_REMOVE_FROM_QUEUE` (splice); expose `queueLength` + `queue` in `AUDIO_PLAYBACK_STATE`
- **T069** — Sleep timer: handle `AUDIO_SET_SLEEP_TIMER`; countdown via `setInterval`; pause on expiry; expose `sleepMinutes` + `sleepRemaining` in `AUDIO_PLAYBACK_STATE`

### GraphQL Resolver Notes

`functions/src/resolvers/podcasts.ts`:
- Auth: `X-Auth-Key: <apiKey>`, `X-Auth-Date: <unixSeconds>`, `Authorization: Podcastindex <sha1(apiKey + apiSecret + unixSeconds)>`
- Endpoints: `/api/1.0/search/byterm`, `/api/1.0/podcasts/trending`, `/api/1.0/podcasts/byfeedid`, `/api/1.0/episodes/byfeedid`
- Caching: NodeCache; trending TTL 3600 s, others 300 s
- Secret: `PODCASTINDEX_CREDS` — combined JSON `{ apiKey, apiSecret }`; set via `printf '...' | npx firebase functions:secrets:set PODCASTINDEX_CREDS`

### Key i18n Keys

```
podcasts.title, podcasts.search, podcasts.trending, podcasts.subscriptions
podcasts.subscribe, podcasts.unsubscribe, podcasts.episodes, podcasts.noSubscriptions
podcasts.playEpisode, podcasts.pauseEpisode, podcasts.showNotes, podcasts.shareEpisode
podcasts.shareCopied, podcasts.shareText, podcasts.markPlayed, podcasts.markUnplayed
podcasts.completed, podcasts.addToQueue, podcasts.removeFromQueue, podcasts.queueEmpty
podcasts.queue, podcasts.speed, podcasts.skipForward, podcasts.skipBack
podcasts.nowPlaying, podcasts.seekPosition, podcasts.sleepTimer, podcasts.sleepOff
podcasts.showMore, podcasts.noResults, podcasts.error
nav.podcasts, bottomNav.podcasts, dashboard.podcasts, commandPalette.goToPodcasts
```
