# GraphQL Contract: Podcast Player

**Source**: `functions/src/schema.ts` (queries) + `packages/shared/src/apollo/queries.ts` (client queries)

---

## Types

```graphql
type PodcastFeed {
  id: ID!
  title: String!
  author: String
  artwork: String
  description: String
  categories: String
  episodeCount: Int
  language: String
}

type PodcastEpisode {
  id: ID!
  title: String!
  description: String
  datePublished: Int
  duration: Int
  enclosureUrl: String
  image: String
  feedId: ID
}

type PodcastSearchResponse {
  feeds: [PodcastFeed!]!
  count: Int!
}

type PodcastTrendingResponse {
  feeds: [PodcastFeed!]!
  count: Int!
}

type PodcastEpisodesResponse {
  items: [PodcastEpisode!]!
  count: Int!
}
```

---

## Queries

### searchPodcasts

```graphql
query SearchPodcasts($query: String!) {
  searchPodcasts(query: $query) {
    feeds {
      id
      title
      author
      artwork
      description
      episodeCount
      language
    }
    count
  }
}
```

**Variables**: `{ query: string }` — minimum 2 characters; debounced 300 ms client-side
**Caching**: `fetchPolicy: 'cache-first'`
**Used by**: `usePodcastSearch()` hook → `PodcastSearch.tsx`

---

### trendingPodcasts

```graphql
query GetTrendingPodcasts {
  trendingPodcasts {
    feeds {
      id
      title
      author
      artwork
      description
      episodeCount
    }
    count
  }
}
```

**Caching**: `fetchPolicy: 'cache-and-network'`; server TTL 3600 s
**Used by**: `useTrendingPodcasts()` hook → `TrendingPodcasts.tsx`

---

### podcastEpisodes

```graphql
query GetPodcastEpisodes($feedId: ID!) {
  podcastEpisodes(feedId: $feedId) {
    items {
      id
      title
      description
      datePublished
      duration
      enclosureUrl
      image
      feedId
    }
    count
  }
}
```

**Variables**: `{ feedId: string | number }` — PodcastIndex feed ID
**Caching**: `fetchPolicy: 'cache-and-network'`
**Used by**: `usePodcastEpisodes()` hook → `PodcastPlayer.tsx`
**Constraint**: PodcastIndex returns at most 100 episodes per feed

---

### podcastFeed

```graphql
query GetPodcastFeed($feedId: ID!) {
  podcastFeed(feedId: $feedId) {
    id
    title
    author
    artwork
    description
    episodeCount
    language
  }
}
```

**Variables**: `{ feedId: string }` — used for direct URL hydration (`/podcasts/:feedId`)
**Caching**: `fetchPolicy: 'cache-first'`
**Used by**: `PodcastPlayer.tsx` (skipped when router state carries the feed object)

---

## EventBus Interface

The MFE communicates with `GlobalAudioPlayer` (shell) via typed events on `eventBus` from `@mycircle/shared`.

### MFE → Shell (commands)

| `MFEvents` key | Payload type | Effect |
|----------------|-------------|--------|
| `PODCAST_PLAY_EPISODE` | `PodcastPlayEpisodeEvent` | Load `enclosureUrl`, restore seek position, begin playback |
| `AUDIO_TOGGLE_PLAY` | — | Toggle play/pause |
| `AUDIO_SKIP_FORWARD` | — | Seek +15 s |
| `AUDIO_SKIP_BACK` | — | Seek −15 s |
| `AUDIO_SEEK` | `{ time: number }` | Jump to absolute position (seconds) |
| `AUDIO_CHANGE_SPEED` | `{ speed: number }` | Set playback rate (0.5–2×) |
| `AUDIO_SET_SLEEP_TIMER` | `{ minutes: number }` | Set/clear sleep countdown |
| `PODCAST_QUEUE_EPISODE` | `{ episode: Episode, podcast: Podcast \| null }` | Append to shell queue |
| `AUDIO_REMOVE_FROM_QUEUE` | `{ index: number }` | Remove by queue index |
| `AUDIO_CLOSE` | — | Stop playback and hide player |

### Shell → MFE (state broadcasts)

| `MFEvents` key | Payload type | Consumer |
|----------------|-------------|----------|
| `AUDIO_PLAYBACK_STATE` | `AudioPlaybackStateEvent` | `InlinePlaybackControls` |
| `PODCAST_PLAY_EPISODE` | `PodcastPlayEpisodeEvent` | `PodcastPlayer` (now-playing sync) |
| `PODCAST_CLOSE_PLAYER` | — | `PodcastPlayer` (clear now-playing) |

### `AudioPlaybackStateEvent` shape

```ts
interface AudioPlaybackStateEvent {
  type: 'podcast' | 'book';
  isPlaying: boolean;
  currentTime: number;       // seconds
  duration: number;          // seconds
  playbackSpeed: number;     // 0.5 | 1 | 1.25 | 1.5 | 2
  sleepMinutes: number;      // 0 = off
  sleepRemaining: number;    // seconds remaining
  trackIndex: number;        // queue position
  totalTracks: number;
  trackTitle: string;
  queueLength: number;
  queue: Array<{ id: string | number; title: string }>;
}
```

---

## Window Events (shell sync)

| `WindowEvents` constant | Dispatched by | Handled by |
|------------------------|---------------|------------|
| `SUBSCRIPTIONS_CHANGED` | `PodcastPlayer.handleToggleSubscribe()` | Shell: syncs `subscribedIds` → Firestore `users/{uid}.podcastSubscriptions[]` |
| `PODCAST_PLAYED_CHANGED` | `EpisodeList.togglePlayed()` | `EpisodeList`: re-reads `PODCAST_PLAYED_EPISODES` |
