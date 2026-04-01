# Quickstart: Radio Station Enhancements (022)

**Branch**: `022-radio-enhancements`
**Date**: 2026-04-01

---

## Setup

```bash
git checkout 022-radio-enhancements
pnpm install
pnpm build:shared
```

---

## Run in Dev

```bash
pnpm dev:shell & pnpm dev:radio-station
```

Navigate to `http://localhost:4200/radio` after both dev servers start.

---

## Key Files to Modify

| File | Change |
|------|--------|
| `functions/src/schema.ts` | Add `RadioTag` type, `radioTags` query, `voteRadioStation` mutation; extend `radioStations` with `tag` and `country` args |
| `functions/src/resolvers/radioStations.ts` | Add `tag`/`country` params to `radioStations` resolver + cache key; add `radioTags` resolver; add `voteRadioStation` mutation resolver |
| `packages/shared/src/apollo/queries.ts` | Add `$tag`/`$country` vars to `GET_RADIO_STATIONS`; add `GET_RADIO_TAGS`; add `VOTE_RADIO_STATION` mutation |
| `packages/shared/src/utils/eventBus.ts` | Add `RADIO_RECENT` and `RADIO_VOTED` to `StorageKeys` |
| `packages/radio-station/src/types.ts` | Add `RadioTag`, `RecentlyPlayedEntry` interfaces |
| `packages/radio-station/src/hooks/useRadioStations.ts` | Add `tag`/`country` filter state + refetch args; add `vote` action |
| `packages/radio-station/src/hooks/useRecentlyPlayed.ts` | **New file** — manage `localStorage[StorageKeys.RADIO_RECENT]` |
| `packages/radio-station/src/hooks/useSleepTimer.ts` | **New file** — countdown timer hook |
| `packages/radio-station/src/components/FilterBar.tsx` | **New file** — genre + country filter dropdowns |
| `packages/radio-station/src/components/StationDetail.tsx` | **New file** — slide-over detail panel |
| `packages/radio-station/src/components/RadioStation.tsx` | Add Recent tab; wire FilterBar, StationDetail, sleep timer |
| `packages/radio-station/src/components/StationCard.tsx` | Add vote button; add info/detail trigger |
| `packages/radio-station/src/components/PlayerBar.tsx` | Add sleep timer control (menu + countdown) |
| `packages/shared/src/i18n/locales/en.ts` | Add new `radio.*` keys |
| `packages/shared/src/i18n/locales/es.ts` | Add new keys (Unicode escapes) |
| `packages/shared/src/i18n/locales/zh.ts` | Add new keys (Unicode escapes) |

---

## New i18n Keys

```
radio.tabs.recent              "Recent"
radio.recent.empty             "Start exploring to build your history"
radio.filter.genre             "Genre"
radio.filter.country           "Country"
radio.filter.all               "All"
radio.filter.clearAll          "Clear filters"
radio.detail.title             "Station Info"
radio.detail.language          "Language"
radio.detail.codec             "Codec"
radio.detail.bitrate           "{kbps} kbps"
radio.detail.votes             "{count} votes"
radio.detail.tags              "Tags"
radio.detail.homepage          "Visit homepage"
radio.vote                     "Vote"
radio.voted                    "Voted"
radio.voteSignIn               "Sign in to vote"
radio.sleep.title              "Sleep Timer"
radio.sleep.set                "Set timer"
radio.sleep.cancel             "Cancel timer"
radio.sleep.countdown          "Stops in {min}m {sec}s"
radio.sleep.15min              "15 minutes"
radio.sleep.30min              "30 minutes"
radio.sleep.45min              "45 minutes"
radio.sleep.60min              "60 minutes"
```

---

## New StorageKeys

```typescript
// In packages/shared/src/utils/eventBus.ts
RADIO_RECENT: 'radio-recent',   // RecentlyPlayedEntry[]
RADIO_VOTED: 'radio-voted',     // string[] — voted station UUIDs (session)
```

---

## After Making Changes

```bash
pnpm codegen          # after schema/query changes
pnpm build:shared     # rebuild shared after i18n/type/query changes
pnpm lint             # must pass
pnpm test:run         # must pass
pnpm typecheck        # must pass
cd functions && npx tsc --noEmit  # check functions backend separately
```

---

## Integration Test Scenarios

### US1 — Genre + Country Filter
1. Open `/radio` Browse tab
2. Select "Jazz" from genre dropdown → list shows only jazz stations
3. Select "United States" from country dropdown → list narrows further
4. Clear genre → shows all US stations
5. Clear country → full unfiltered list returns

### US2 — Recently Played
1. Play 3 different stations in sequence
2. Navigate away, return to `/radio`
3. Open "Recent" tab → see 3 stations in reverse order
4. Tap first station → it starts playing from the Recent tab

### US3 — Station Detail
1. Tap the info button on any station card
2. Detail panel slides in showing language, codec, bitrate, tags, vote count
3. Tap Play inside panel → station starts playing, panel stays open
4. Tap favorite inside panel → heart fills, panel stays open
5. Dismiss panel → return to list scroll position

### US4 — Sleep Timer
1. Start any station → player bar appears
2. Open sleep timer menu → select 15 minutes
3. Countdown appears in player bar: "Stops in 14m 59s"
4. Click Cancel → countdown disappears, music continues
5. Test: set 1 min timer, wait → music stops automatically

### US5 — Vote
1. Signed-in user: tap vote button on any station card
2. Vote count increments, button shows voted state
3. Tap again → nothing happens (already voted)
4. Sign out, sign back in → voted state clears (session-level)
5. Signed-out user: tap vote → prompted to sign in
