# Implementation Plan: Radio Station Enhancements

**Branch**: `022-radio-enhancements` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/022-radio-enhancements/spec.md`

## Summary

Enhance the existing `radio-station` MFE with five prioritized improvements: genre/country filtering (P1), recently played history (P2), station detail panel (P3), sleep timer (P4), and voting (P5). All data operations route through the existing GraphQL service — `radioStations` query gains `tag`/`country` args, two new backend queries/mutations are added (`radioTags`, `voteRadioStation`), and client-only features (recent history, sleep timer) use localStorage and React state respectively. No new packages required.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18 (same as existing radio-station MFE)
**Primary Dependencies**: `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, PageContent, eventBus, WindowEvents, MFEvents), `@originjs/vite-plugin-federation` (MFE — existing), Firebase Cloud Functions (backend resolvers — existing)
**Storage**: `localStorage` — `RADIO_FAVORITES` (existing), `RADIO_RECENT` (new), `RADIO_VOTED` (new). Sleep timer: React state only (ephemeral, not persisted)
**Testing**: Vitest + React Testing Library (existing pattern)
**Target Platform**: Web (mobile-first, existing deployment)
**Performance Goals**: Station list re-renders within 3 seconds after filter change (matches SC-005)
**Constraints**: No direct browser calls to Radio Browser API — all calls proxied via Cloud Function (Constitution III). No new npm packages.
**Scale/Scope**: ~50 stations per request, ~50 genre tags, ~200 countries derived from result set, 20-entry recent history cap

## Constitution Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ Pass | Enhancing existing MFE; no direct `@apollo/client` imports |
| II. Complete Integration | ✅ Pass | No new MFE; existing shell integration unchanged; i18n updated in all 3 locales |
| III. GraphQL-First | ✅ Pass with justified REST | `radioTags` and `voteRadioStation` call Radio Browser API via Cloud Function (acceptable: third-party API — see Complexity Tracking) |
| IV. Inclusive by Default | ✅ Pass | All new strings use `t('key')`, all 3 locales, dark mode variants required, semantic HTML |
| V. Fast Tests, Safe Code | ✅ Pass | Unit tests mock GraphQL and localStorage; sleep timer mocked with `vi.useFakeTimers()` |
| VI. Simplicity | ✅ Pass | No new packages; minimal new files; country filter derived from result set not a new query |

## Project Structure

### Documentation (this feature)

```text
specs/022-radio-enhancements/
├── plan.md              ← This file
├── spec.md              ← Feature specification
├── research.md          ← Phase 0 decisions
├── data-model.md        ← Entities and storage schema
├── quickstart.md        ← Dev setup and test scenarios
├── contracts/
│   └── graphql-radio.md ← GraphQL contract changes
└── tasks.md             ← Phase 2 output (/speckit.tasks command)
```

### Source Code

```text
# Backend (Cloud Functions)
functions/src/
├── schema.ts                        ← Add RadioTag type, radioTags query, voteRadioStation mutation;
│                                       extend radioStations with tag/country args
└── resolvers/
    └── radioStations.ts             ← Extend resolver with tag/country; add radioTags + voteRadioStation

# Shared package
packages/shared/src/
├── apollo/
│   └── queries.ts                   ← Update GET_RADIO_STATIONS; add GET_RADIO_TAGS, VOTE_RADIO_STATION
└── utils/
    └── eventBus.ts                  ← Add RADIO_RECENT and RADIO_VOTED StorageKeys

# i18n (all 3 locales)
packages/shared/src/i18n/locales/
├── en.ts                            ← ~20 new radio.* keys
├── es.ts                            ← ~20 new keys (Unicode escapes)
└── zh.ts                            ← ~20 new keys (Unicode escapes)

# Radio Station MFE
packages/radio-station/src/
├── types.ts                         ← Add RadioTag, RecentlyPlayedEntry interfaces
├── hooks/
│   ├── useRadioStations.ts          ← Add tag/country filter state + refetch args; add vote action
│   ├── useRecentlyPlayed.ts         ← NEW: recently played localStorage management
│   └── useSleepTimer.ts             ← NEW: countdown timer hook
└── components/
    ├── FilterBar.tsx                ← NEW: genre + country filter dropdowns
    ├── StationDetail.tsx            ← NEW: slide-over detail panel
    ├── RadioStation.tsx             ← Add Recent tab, wire FilterBar, StationDetail, sleep timer
    ├── StationCard.tsx              ← Add vote button + info trigger
    └── PlayerBar.tsx                ← Add sleep timer control (menu + countdown display)
```

**Structure Decision**: Enhancement to existing MFE — no new package or shell integration point. All changes are contained within `packages/radio-station/`, `packages/shared/`, and `functions/src/resolvers/radioStations.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| REST calls in Cloud Function (radioTags, voteRadioStation) | Radio Browser API does not offer a GraphQL interface | No GraphQL wrapper exists; calling REST from Cloud Function is explicitly allowed by Constitution III for third-party APIs |

## Implementation Notes

### US1 — Genre/Country Filters
- `FilterBar.tsx` receives `tags: RadioTag[]`, `countries: string[]`, `activeTag`, `activeCountry`, and `onChange` callbacks
- Countries derived in `useRadioStations.ts` from the current `stations` result: `[...new Set(stations.map(s => s.country).filter(Boolean))].sort()`
- When a filter changes, call `refetch({ query, tag, country, limit: 50 })`
- Active filter indicators: pill badges with individual clear (×) buttons
- Cache key in resolver must include all three params: `` `search:${query}:${tag}:${country}:${limit}` ``

### US2 — Recently Played
- `useRecentlyPlayed.ts` exposes `{ recentStations, addToRecent, clearRecent }`
- `addToRecent(station)` called inside `useRadioPlayer.play()` right after `eventBus.publish(MFEvents.AUDIO_PLAY, ...)`
- `RadioStation.tsx` Tab type expands to `'browse' | 'favorites' | 'recent'`
- Recent tab renders `StationCard` components from `recentStations`; play() calls `useRadioPlayer.play()` with the stored station snapshot

### US3 — Station Detail
- `StationDetail.tsx`: fixed overlay panel, `translate-x-full` → `translate-x-0` CSS transition on open
- Triggered from `StationCard` info button (ⓘ icon) or station name click
- `RadioStation.tsx` holds `selectedStation: RadioStation | null` state
- Panel includes: name, country, language, codec, bitrate, votes, tag pills, homepage link (conditional), Play + Favorite buttons

### US4 — Sleep Timer
- `useSleepTimer.ts`: `{ active, secondsLeft, start(minutes), cancel }` — starts `setInterval` on `start`, clears on `cancel` or when `secondsLeft` reaches 0
- `PlayerBar.tsx` receives `sleepTimer` prop and `onSleepTimerStart`/`onSleepTimerCancel` callbacks
- On expiry: `onExpire` callback fires → `stop()` in `useRadioPlayer`
- When `isPlaying` becomes false (manual stop): `useEffect` cancels timer automatically

### US5 — Vote
- `useRadioStations.ts` adds `vote(uuid: string): Promise<boolean>` using `VOTE_RADIO_STATION` mutation
- Voted UUIDs stored in `localStorage[StorageKeys.RADIO_VOTED]` as `string[]`
- `isVoted(uuid)` check prevents re-voting in same session
- `StationCard` and `StationDetail` both show vote count + vote button
- Auth gate: if `!window.__currentUid`, show sign-in prompt (existing shell pattern)
