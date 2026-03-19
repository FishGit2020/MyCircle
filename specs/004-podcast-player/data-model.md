# Data Model: Podcast Player MFE

**Branch**: `004-podcast-player` | **Phase**: 1 | **Date**: 2026-03-19

---

## Entities

### PodcastFeed

Represents a podcast's top-level metadata.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `ID!` | PodcastIndex `feedId` | Stable numeric ID |
| `title` | `String!` | PodcastIndex | Feed display name |
| `author` | `String` | PodcastIndex | Publisher name |
| `artwork` | `String` | PodcastIndex | Cover image URL (CDN) |
| `description` | `String` | PodcastIndex | HTML — must be sanitised before display |
| `categories` | `String` | PodcastIndex | Comma-separated category labels |
| `episodeCount` | `Int` | PodcastIndex | Total episodes (informational; API max 100) |
| `language` | `String` | PodcastIndex | BCP-47 language code |

**GraphQL type**: `PodcastFeed` (`functions/src/schema.ts` line ~273)

---

### PodcastEpisode

Represents a single episode within a feed.

| Field | Type | Source | Notes |
|-------|------|--------|-------|
| `id` | `ID!` | PodcastIndex `id` | Stable numeric ID |
| `title` | `String!` | PodcastIndex | Episode title |
| `description` | `String` | PodcastIndex | HTML — sanitised before display |
| `datePublished` | `Int` | PodcastIndex | Unix timestamp (seconds) |
| `duration` | `Int` | PodcastIndex | Duration in seconds (may be 0 if unknown) |
| `enclosureUrl` | `String` | PodcastIndex | Direct audio URL streamed by `GlobalAudioPlayer` |
| `image` | `String` | PodcastIndex | Episode-specific artwork (falls back to `PodcastFeed.artwork`) |
| `feedId` | `ID` | PodcastIndex | Parent feed reference |

**GraphQL type**: `PodcastEpisode` (`functions/src/schema.ts` line ~286)

---

## Response Wrappers

| Type | Fields | Used by |
|------|--------|---------|
| `PodcastSearchResponse` | `feeds: [PodcastFeed!]!, count: Int!` | `SEARCH_PODCASTS` |
| `PodcastTrendingResponse` | `feeds: [PodcastFeed!]!, count: Int!` | `GET_TRENDING_PODCASTS` |
| `PodcastEpisodesResponse` | `items: [PodcastEpisode!]!, count: Int!` | `GET_PODCAST_EPISODES` |

---

## Client-side State

### React Component State (`PodcastPlayer.tsx`)

| State | Type | Notes |
|-------|------|-------|
| `selectedPodcast` | `Podcast \| null` | Currently viewed podcast |
| `currentEpisode` | `Episode \| null` | Last episode play was triggered for (MFE-local tracking) |
| `isPlaying` | `boolean` | MFE-local play toggle (drives button icon) |
| `subscribedIds` | `Set<string>` | Backed by localStorage `PODCAST_SUBSCRIPTIONS` |
| `isAuthenticated` | `boolean` | Derived from `window.__getFirebaseIdToken` polling |
| `nowPlayingEpisode` | `Episode \| null` | From `PODCAST_PLAY_EPISODE` event / localStorage hydration |
| `nowPlayingPodcast` | `Podcast \| null` | Companion to `nowPlayingEpisode` |
| `activeTab` | `'discover' \| 'subscribed'` | URL-backed (`?tab=subscribed`) |

### Episode List State (`EpisodeList.tsx`)

| State | Type | Notes |
|-------|------|-------|
| `expandedId` | `string \| number \| null` | Currently expanded show-notes row |
| `visibleCount` | `number` | Pagination cursor; starts at 20, +20 per "Show more" |
| `sharedEpisodeId` | `string \| number \| null` | Shows checkmark on share button for 2 s |
| `playedEpisodes` | `Set<string>` | Backed by localStorage `PODCAST_PLAYED_EPISODES` |
| `progress` | `ProgressMap` | Memoised read of `PODCAST_PROGRESS`; re-reads on `currentEpisodeId` change |

### Inline Playback Controls State (`InlinePlaybackControls.tsx`)

| State | Type | Notes |
|-------|------|-------|
| `state` | `AudioPlaybackStateEvent` | Subscribed from `MFEvents.AUDIO_PLAYBACK_STATE` (shell broadcasts) |
| `showSpeedMenu` | `boolean` | Speed picker dropdown open |
| `showSleepMenu` | `boolean` | Sleep timer dropdown open |
| `showQueue` | `boolean` | Queue panel open |
| `shareCopied` | `boolean` | Share button checkmark flash |

---

## localStorage Keys

| `StorageKeys` constant | Content | Writer | Reader |
|------------------------|---------|--------|--------|
| `PODCAST_SUBSCRIPTIONS` | `string[]` (feed ID strings) | `PodcastPlayer` | `PodcastPlayer`, `SubscribedPodcasts` |
| `PODCAST_NOW_PLAYING` | `{ episode: Episode, podcast: Podcast \| null }` | `GlobalAudioPlayer` (shell) | `PodcastPlayer` (hydration on mount) |
| `PODCAST_PROGRESS` | `{ [episodeId]: { position, duration } }` | `GlobalAudioPlayer` (shell) | `EpisodeList` (progress bars) |
| `PODCAST_PLAYED_EPISODES` | `string[]` (episode ID strings) | `EpisodeList` | `EpisodeList` |
| `PODCAST_SPEED` | `string` (float) | `GlobalAudioPlayer` (shell) | `GlobalAudioPlayer` (restore on mount) |

---

## Data Flow Diagrams

### Search Flow

```
User types query
  → PodcastSearch debounces (300 ms)
  → usePodcastSearch() → useQuery(SEARCH_PODCASTS, { variables: { query } })
  → Apollo → Cloud Function → PodcastIndex /search/byterm
  → PodcastSearchResponse { feeds }
  → PodcastCard grid renders
```

### Episode Playback Flow

```
User clicks play
  → PodcastPlayer.handlePlayEpisode(episode)
  → eventBus.publish(MFEvents.PODCAST_PLAY_EPISODE, { episode, podcast })
  → Shell's GlobalAudioPlayer picks up event
  → Sets <audio>.src = enclosureUrl, calls .play()
  → Restores saved position from PODCAST_PROGRESS
  → Broadcasts MFEvents.AUDIO_PLAYBACK_STATE every ~250 ms
  → InlinePlaybackControls subscribes → seek bar advances
  → GlobalAudioPlayer writes PODCAST_NOW_PLAYING + PODCAST_PROGRESS to localStorage
```

### Subscription Flow

```
User clicks Subscribe
  → PodcastPlayer.handleToggleSubscribe(podcast)
  → Updates subscribedIds Set
  → Writes to localStorage PODCAST_SUBSCRIPTIONS
  → window.dispatchEvent(WindowEvents.SUBSCRIPTIONS_CHANGED)
  → Shell listener syncs to Firestore users/{uid}.podcastSubscriptions[]
```

---

## Validation Rules

- `enclosureUrl`: must be a non-empty string; otherwise episode row renders without a play button (handled by `GlobalAudioPlayer` guard)
- `duration`: may be 0 — `formatDuration(0)` returns `'--:--'`; no progress bar shown
- `datePublished`: may be 0 — `formatDate(0)` returns `''` (no date shown)
- Episode description HTML: sanitised via `sanitizeHtml()` before `dangerouslySetInnerHTML`; PodcastIndex `description` field is untrusted user-generated content

---

## State Transitions — Episode Completion

```
UNPLAYED
  → PROGRESS (position > 0, position < duration − 5 s)
    → COMPLETED (position ≥ duration − 5 s)  [automatic]
  → COMPLETED  [user-initiated via togglePlayed()]
COMPLETED → UNPLAYED  [user-initiated via togglePlayed()]
```
