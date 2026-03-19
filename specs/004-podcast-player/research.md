# Research: Podcast Player MFE

**Branch**: `004-podcast-player` | **Phase**: 0 | **Date**: 2026-03-19

---

## 1. Data Source — PodcastIndex API

**Decision**: Use [PodcastIndex.org](https://podcastindex.org) REST API via a Cloud Function proxy.

**Rationale**:
- Open, free, no listen-cap restrictions unlike Spotify or Apple Podcasts APIs
- Provides search, trending, per-feed metadata, and per-feed episode list in a single SDK-free integration
- Authentication is an API-key HMAC-SHA1 header (stateless, safe to implement on the server side)

**Alternatives considered**:
- iTunes Search API — read-only, no trending, no episode list endpoint
- Spotify Podcasts API — requires OAuth, much heavier setup, limits free tier
- Direct RSS parsing — requires a proxy to avoid CORS; no catalogue search capability

**Caveats**:
- `enclosureUrl` points to the podcast's own CDN; stream quality and availability are outside our control
- Max 100 episodes returned per `GET /episodes/byfeedid` call (API hard limit)

**Server-side caching** (NodeCache TTLs, `functions/src/resolvers/podcasts.ts`):
- Trending: 3600 s (1 h) — changes slowly
- Search results: 300 s (5 min)
- Single feed metadata: 300 s
- Episodes: 300 s

---

## 2. Audio Streaming Architecture

**Decision**: Delegate all audio playback to the shell's `GlobalAudioPlayer` component via the eventBus.

**Rationale**:
- A persistent, route-agnostic player (bottom bar) is only achievable if the `<audio>` element lives in the shell and survives MFE navigation
- Module Federation isolates each MFE in its own JS context; putting an `<audio>` tag inside the MFE would cause it to be destroyed when the user leaves `/podcasts`
- The eventBus (`@mycircle/shared`) provides a clean, typed pub/sub channel between MFE and shell

**Communication protocol** (all events defined in `MFEvents`):
| Direction | Event | Payload |
|-----------|-------|---------|
| MFE → Shell | `PODCAST_PLAY_EPISODE` | `{ episode: Episode, podcast: Podcast }` |
| MFE → Shell | `AUDIO_TOGGLE_PLAY` | — |
| MFE → Shell | `AUDIO_SKIP_FORWARD` | — |
| MFE → Shell | `AUDIO_SKIP_BACK` | — |
| MFE → Shell | `AUDIO_SEEK` | `{ time: number }` |
| MFE → Shell | `AUDIO_CHANGE_SPEED` | `{ speed: number }` |
| MFE → Shell | `AUDIO_SET_SLEEP_TIMER` | `{ minutes: number }` |
| MFE → Shell | `PODCAST_QUEUE_EPISODE` | `{ episode, podcast }` |
| MFE → Shell | `AUDIO_REMOVE_FROM_QUEUE` | `{ index: number }` |
| MFE → Shell | `AUDIO_CLOSE` | — |
| Shell → MFE | `AUDIO_PLAYBACK_STATE` | `AudioPlaybackStateEvent` |
| Shell → MFE | `PODCAST_CLOSE_PLAYER` | — |

**InlinePlaybackControls**: mirrors the global player within the podcast detail view; subscribes to `AUDIO_PLAYBACK_STATE` for live seek/time data.

**Alternatives considered**:
- MFE-owned `<audio>` element with persist-on-navigate trick — not viable with Module Federation's lazy unloading
- Shared singleton audio context — would require importing from shell (breaks Federated Isolation principle)

---

## 3. Subscription Persistence

**Decision**: localStorage-primary, Firestore-synced via the shell on `SUBSCRIPTIONS_CHANGED`.

**Rationale**:
- Works offline and for unauthenticated users
- Shell already owns Firestore SDK; MFE dispatching `WindowEvents.SUBSCRIPTIONS_CHANGED` is sufficient
- No direct Firestore writes from the MFE (avoids duplicating SDK instantiation)

**Storage key**: `StorageKeys.PODCAST_SUBSCRIPTIONS` → `JSON.stringify([...ids])` (array of feed ID strings)

**Alternatives considered**:
- Direct Firestore from MFE — violates Federated Isolation (shell owns Firebase SDK)
- Firestore-only — breaks offline/unauthenticated usage

---

## 4. Episode Progress & Played State

**Decision**: localStorage only (no server sync).

**Rationale**:
- Progress is per-device; cross-device sync is out of scope for this feature
- `StorageKeys.PODCAST_PROGRESS` stores `{ [episodeId]: { position, duration } }` — written by `GlobalAudioPlayer` every few seconds
- `StorageKeys.PODCAST_PLAYED_EPISODES` stores `[...ids]` — written by EpisodeList on manual mark-as-played or auto-complete (position ≥ duration − 5 s)

---

## 5. HTML Sanitisation

**Decision**: Client-side DOMParser sanitisation for episode descriptions/show-notes.

**Rationale**:
- PodcastIndex descriptions commonly contain HTML (links, bold, italic)
- Stripping `<script>`, `<iframe>`, inline `style`, `on*` event handlers, and `<form>` elements is sufficient against XSS
- Links are force-set to `target="_blank" rel="noopener noreferrer"`

**Implementation**: `sanitizeHtml()` utility duplicated in `PodcastPlayer.tsx` and `EpisodeList.tsx` (both components render untrusted HTML).

---

## 6. GraphQL vs REST

**Decision**: GraphQL for all MFE data; REST is only in the Cloud Function resolver.

**Rationale**: Constitution §III requires GraphQL-first for MFE data. PodcastIndex is a third-party REST API — acceptable exception lives inside the server-side resolver, never inside the MFE.

Queries used by this MFE:
- `SEARCH_PODCASTS` — debounced podcast search
- `GET_TRENDING_PODCASTS` — discovery tab
- `GET_PODCAST_EPISODES` — episode list for a feed
- `GET_PODCAST_FEED` — feed metadata hydration for direct URL access

---

## 7. URL Deep-linking & Autoplay

**Decision**: Route `/podcasts/:feedId` + query params `?autoplay=true&episode=<id>`.

**Rationale**:
- Shareable links need to encode both the podcast (feedId) and the specific episode
- `?autoplay=true` is a convention matching the `EpisodeList` share URL format
- Autoplay params are cleared after firing to prevent re-triggering on React re-renders

---

## 8. Authentication Gate for Subscriptions Tab

**Decision**: Poll `window.__getFirebaseIdToken()` every 5 s to detect sign-in state.

**Rationale**:
- Shell exposes Firebase auth via `window.__getFirebaseIdToken` (cross-MFE window global pattern per CLAUDE.md)
- The Subscriptions tab is only meaningful to authenticated users (Firestore sync requires a UID)
- 5 s polling is imperceptible and avoids a cross-MFE event for auth state

**Alternatives considered**:
- Auth event on eventBus — not currently wired in shared; would be a new dependency
- `window.__currentUid` read on mount — misses sign-in/sign-out that occurs while the page is open
