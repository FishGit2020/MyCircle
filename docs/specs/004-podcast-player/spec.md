# Feature Spec: Podcast Player

**Status**: Implemented
**Package**: `packages/podcast-player`
**Route**: `/podcasts`, `/podcasts/:podcastId`
**Port**: 3006

## Summary

Podcast discovery and playback platform with subscription management, episode queuing, and Media Session API integration for OS-level playback controls. Features trending podcasts, search, and clip sharing. Audio playback is managed by the shell's GlobalAudioPlayer.

## Key Features

- Podcast search and discovery with trending charts
- Subscription management (subscribe/unsubscribe) with Firestore sync
- Episode list with inline playback controls
- Episode queue management
- Media Session API for OS-level controls (lock screen, notification bar)
- Share episode clips
- Tabbed interface: Discover / Subscribed
- Deep-link to specific podcast via `/podcasts/:podcastId`

## Data Sources

- **Cloud Function**: `/podcast/**` proxy to PodcastIndex API
- **GraphQL**: `GET_PODCAST_FEED` query
- **localStorage**: `StorageKeys.PODCAST_SUBSCRIPTIONS` for subscription IDs
- **Firestore sync**: Subscriptions restored via `restoreUserData` on sign-in
- **MFE event**: Publishes `MFEvents.PODCAST_PLAY_EPISODE` for shell audio player

## Integration Points

- **Shell route**: `/podcasts`, `/podcasts/:podcastId` in App.tsx
- **Widget**: `nowPlaying` in widgetConfig.ts
- **Nav group**: Daily (`nav.group.daily`)
- **i18n namespace**: `nav.podcasts`, `podcasts.*`
- **Cloud Function**: `/podcast/**` -> `podcastProxy`
- **Shell component**: GlobalAudioPlayer handles actual audio playback

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- PodcastIndex API via Cloud Function proxy (uses `PODCASTINDEX_CREDS` secret)
- GraphQL for podcast feed data
- Media Session API for native playback controls
- HTML sanitization for podcast descriptions
- Custom hooks: `usePodcastEpisodes`

## Testing

- Unit tests: `packages/podcast-player/src/**/*.test.{ts,tsx}`
- E2E: `e2e/podcasts.spec.ts`, `e2e/podcast-categories.spec.ts`, `e2e/podcast-player-persistence.spec.ts`, `e2e/share-episode.spec.ts`
