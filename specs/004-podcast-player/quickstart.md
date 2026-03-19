# Quickstart: Podcast Player MFE

**Branch**: `004-podcast-player` | **Date**: 2026-03-19

---

## Prerequisites

- Node.js 20+, pnpm 9+
- Firebase CLI: `npm install -g firebase-tools`
- `PODCASTINDEX_CREDS` secret must be set in Firebase (combined JSON `{ "apiKey": "...", "apiSecret": "..." }`)
- To set the secret locally: `printf '{"apiKey":"KEY","apiSecret":"SECRET"}' | npx firebase functions:secrets:set PODCASTINDEX_CREDS`

---

## Dev Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build shared (required before starting any MFE)
pnpm build:shared

# 3. Start all services (shell + podcast-player + other MFEs)
pnpm dev

# Or start only shell + podcast-player
pnpm --filter @mycircle/shell dev &
pnpm --filter @mycircle/podcast-player dev
```

The podcast-player MFE runs on **port 3006**.
Open `http://localhost:3000/podcasts` to see the integrated view.

---

## Running Tests

```bash
# Run all tests + lint + typecheck (required before pushing)
pnpm lint && pnpm test:run && pnpm typecheck

# Run only podcast-player tests
pnpm --filter @mycircle/podcast-player test:run

# Run in watch mode
pnpm --filter @mycircle/podcast-player test
```

---

## Manual Integration Scenarios

### Scenario A: Search + Play

1. Open `http://localhost:3000/podcasts`
2. Type "history" in the search box — results appear after ~300 ms
3. Click any result → episode list loads
4. Click the ▶ play button on any episode → global bottom bar appears + inline controls render
5. Seek bar advances as audio plays

### Scenario B: Direct URL Deep-link

1. With a known feed ID, open `http://localhost:3000/podcasts/12345`
   — Should render feed metadata fetched via `GET_PODCAST_FEED` query
2. Open `http://localhost:3000/podcasts/12345?autoplay=true&episode=67890`
   — Should auto-start that episode once episodes load

### Scenario C: Subscribe + Subscriptions Tab

1. Sign in to the app
2. Subscribe to a podcast — verify "Subscriptions (1)" tab appears
3. Switch to Subscriptions tab — subscribed feed appears
4. Refresh page — subscriptions persist (localStorage)

### Scenario D: Episode Management

1. Play an episode → seek near the end (last 5 s) → "Completed" badge should appear
2. Click "Mark as played" manually → badge appears; click again → clears
3. Click "Add to queue" on a second episode → queue counter badge increments
4. Open queue panel → episode listed with × remove button

### Scenario E: Sleep Timer

1. Start playing an episode
2. Open sleep timer menu in inline controls → select "5 min"
3. Badge shows "5" on sleep icon
4. At 0 min, playback pauses automatically

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/podcast-player/src/components/PodcastPlayer.tsx` | Root MFE component — routing, subscription management, now-playing sync |
| `packages/podcast-player/src/components/EpisodeList.tsx` | Episode list with progress, play/pause, share, mark-as-played, queue |
| `packages/podcast-player/src/components/InlinePlaybackControls.tsx` | Seek bar, speed, sleep, queue panel — subscribes to shell broadcasts |
| `packages/podcast-player/src/hooks/usePodcastData.ts` | Apollo hooks: search, trending, episodes |
| `packages/podcast-player/src/components/TrendingPodcasts.tsx` | Discovery tab — trending feed grid |
| `packages/podcast-player/src/components/SubscribedPodcasts.tsx` | Subscriptions tab — user's saved feeds |
| `packages/podcast-player/src/components/PodcastSearch.tsx` | Debounced search input + results |
| `packages/shell/src/components/player/GlobalAudioPlayer.tsx` | Shell audio engine — owns `<audio>`, handles all playback events |
| `functions/src/resolvers/podcasts.ts` | Cloud Function resolvers — calls PodcastIndex REST API |
| `functions/src/schema.ts` (lines ~273–429) | GraphQL types and query definitions |
| `packages/shared/src/apollo/queries.ts` (lines ~287–354) | Client-side query documents |

---

## Adding a New Query

1. Add type + resolver to `functions/src/schema.ts`
2. Add query document to `packages/shared/src/apollo/queries.ts`
3. Run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`
4. Commit the regenerated file
5. Import the new query from `@mycircle/shared` (never from `@apollo/client` directly)

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `R is not a function` in browser console | MFE imported directly from `@apollo/client` | Change import to `@mycircle/shared` |
| Audio doesn't start | `enclosureUrl` empty or null | Check PodcastIndex episode data; enclosure might be missing |
| Subscriptions tab not visible | User not authenticated | Sign in; tab visibility gates on `window.__getFirebaseIdToken` |
| Inline controls don't appear | `nowPlayingPodcast.id` ≠ `selectedPodcast.id` | Ensure `podcast` is passed in `PODCAST_PLAY_EPISODE` event payload |
| Search returns no results | Query < 2 chars or debounce in progress | Wait for 300 ms debounce; check network tab |
| `pnpm codegen` fails | `functions/` has TypeScript errors | Run `cd functions && npx tsc --noEmit` first |
