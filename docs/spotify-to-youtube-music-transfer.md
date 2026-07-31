# Spotify → YouTube Music Transfer — Built on MyCircle

A developer guide for building a **playlist transfer** feature as a **new MFE**
inside the existing **MyCircle** app (`C:\Users\youpenghuang\repos\MyCircle`),
reusing its existing infrastructure. Focus: the third-party endpoints, walking
a playlist's songs, publicly usable APIs, usage restrictions, and how to wire
them into MyCircle's GraphQL-first architecture.

---

## 1. Why build it on MyCircle (reuse existing infra)

MyCircle already gives you everything the backend of a transfer app needs, so
you only add a thin new MFE + a few resolvers:

| Concern | Existing MyCircle infra to reuse |
|---------|----------------------------------|
| Frontend shell / routing / auth | React 18 + Vite **Module Federation** shell (`packages/shell`) |
| Data layer | **Apollo GraphQL** via `@mycircle/shared` (GraphQL-first rule) |
| Backend runtime | **Firebase Cloud Functions** (`functions/src`) |
| API secrets | **Firebase Functions secrets** (Secret Manager) |
| Persistence | **Firestore** (per-user collections) + rules |
| Shared UI/utils | `@mycircle/shared` (`<PageContent>`, hooks, i18n, Apollo re-exports) |

**Architectural rule (MyCircle `CLAUDE.md`): GraphQL-first.** MFEs never call
third-party REST directly and never add their own REST endpoint for feature
data. Spotify and YouTube are third-party REST APIs, so you **wrap them in
Cloud Function GraphQL resolvers** (`functions/src/resolvers/*`,
`functions/src/schema.ts`) and the MFE talks only GraphQL through
`@mycircle/shared`.

```
┌───────────────────────────┐         GraphQL (Apollo, via @mycircle/shared)
│  New MFE:                  │  ───────────────────────────────────────────┐
│  packages/playlist-transfer│                                              │
└───────────────────────────┘                                              ▼
                                              ┌───────────────────────────────────┐
                                              │  Cloud Functions (functions/src)   │
                                              │  resolvers/playlistTransfer.ts     │
                                              │   ├─ Spotify REST  (read tracks)   │
                                              │   ├─ YouTube Music (search + add)  │
                                              │   ├─ Firestore  (tokens + jobs)    │
                                              │   └─ Secrets    (client secrets)   │
                                              └───────────────────────────────────┘
```

---

## 2. The core challenge: no official YouTube *Music* write API

Read this first — it drives the whole design.

| Need | Official option | Reality |
|------|-----------------|---------|
| Read Spotify playlists | **Spotify Web API** | Public, free, fully supported. |
| Write YouTube **Music** playlists | *None official* | YouTube Music has **no public API**. |
| Write YouTube playlists | **YouTube Data API v3** | Public; playlists created here **sync into YouTube Music** for the same Google account. Strict quota. |
| Write YouTube Music directly | **`ytmusicapi`** (unofficial) | Reverse-engineered; better music matching, no quota, but unofficial and can break. |

**Two viable "write" paths** (documented in §5 and §6):

- **Path A — Official YouTube Data API v3.** Create playlist + insert videos.
  Downside: hard **quota** ceiling (§5.3) — ~66 songs/day default.
- **Path B — Unofficial `ytmusicapi`.** Native YT Music playlists, real
  music-catalog matching, no quota, but ToS-sensitive and unstable.

Because MyCircle backend is **Node.js Cloud Functions**, Path B's Python
`ytmusicapi` runs best as a **separate Cloud Run / container service** the
resolver calls, or you port the auth flow to a Node equivalent
(`youtube-music-ts` / `node-youtube-music`). Path A is pure Node + REST and
drops straight into a resolver.

---

## 3. Spotify Web API — reading the playlist (the "source")

### 3.1 Register & auth

1. Create an app at **https://developer.spotify.com/dashboard**.
2. Get `Client ID` + `Client Secret`; set a Redirect URI.
   - Redirect URI should point at a MyCircle Cloud Function callback (add a
     `firebase.json` hosting rewrite **before** the catch-all — see MFE rule 6),
     e.g. `/api/spotify/callback → spotifyOAuth`.
3. Use the **Authorization Code flow** (needed for private playlists).

**Scopes:** `playlist-read-private`, `playlist-read-collaborative`.

**Auth endpoints:**

```
GET  https://accounts.spotify.com/authorize      # consent, returns ?code
POST https://accounts.spotify.com/api/token       # code -> access_token + refresh_token
```

Token body (`application/x-www-form-urlencoded`):

```
grant_type=authorization_code
code=<CODE>
redirect_uri=<REDIRECT_URI>
client_id=<ID>
client_secret=<SECRET>
```

- Access tokens last **1 hour**; store the `refresh_token` in **Firestore**
  (`users/{uid}/integrations/spotify`) and refresh server-side in the resolver.
- Put `SPOTIFY_CLIENT_SECRET` in a **Firebase secret** (never in the MFE):
  `printf "value" | npx firebase functions:secrets:set SPOTIFY_CLIENT_SECRET`
  then grant the compute SA `secretmanager.secretAccessor` (see MyCircle rules).

### 3.2 Key endpoints

Base URL: `https://api.spotify.com/v1` · Header: `Authorization: Bearer <token>`

| Purpose | Method & Endpoint |
|---------|-------------------|
| User's playlists | `GET /me/playlists?limit=50&offset=0` |
| Playlist metadata | `GET /playlists/{playlist_id}` |
| **Playlist tracks** | `GET /playlists/{playlist_id}/tracks?limit=100&offset=0` |
| Single track | `GET /tracks/{id}` |

### 3.3 Walking the list of songs per playlist (pagination)

Spotify caps `limit` at **100 tracks/page**. Loop with `offset` or follow the
`next` URL until it is `null`. Do this **in the resolver** and expose a clean
GraphQL shape to the MFE.

```ts
// functions/src/resolvers/playlistTransfer.ts (sketch)
async function getPlaylistTracks(playlistId: string, token: string) {
  const fields =
    "next,items(track(id,name,artists(name),album(name),duration_ms,external_ids(isrc)))";
  let url =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks` +
    `?limit=100&offset=0&fields=${encodeURIComponent(fields)}`;
  const tracks: SpotifyTrack[] = [];
  while (url) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Spotify ${res.status}`);
    const data = await res.json();
    for (const { track: t } of data.items) {
      if (!t) continue;                       // removed / region-locked
      tracks.push({
        id: t.id,
        title: t.name,
        artists: t.artists.map((a: any) => a.name),
        album: t.album.name,
        durationMs: t.duration_ms,
        isrc: t.external_ids?.isrc ?? null,   // best cross-platform match key
      });
    }
    url = data.next;                          // full next-page URL, or null
  }
  return tracks;
}
```

**Tips:** use `fields` to trim payload; capture **ISRC** for accurate matching;
handle `track == null` and local files (`is_local: true`, no ISRC).

---

## 4. Matching songs (Spotify → YouTube Music)

Runs server-side in the resolver, per track:

1. Query `"{title} {primaryArtist}"` — best general query.
2. Prefer results whose duration is within **±5s** of `durationMs`.
3. Prefer official "song" result types over user uploads.
4. Score = title similarity + artist match − duration delta; reject below a
   threshold and return the track as **unmatched** for a review step in the MFE.
5. When ISRC is present, prefer it as the primary match signal.

---

## 5. YouTube — Path A: Official YouTube Data API v3

### 5.1 Setup

1. Google Cloud project → enable **YouTube Data API v3**.
2. OAuth 2.0 consent + credentials; scope `https://www.googleapis.com/auth/youtube`.
3. Store the Google refresh token in Firestore; client secret as a Firebase secret
   (`GOOGLE_OAUTH_CLIENT_SECRET`).

### 5.2 Key endpoints

Base URL: `https://www.googleapis.com/youtube/v3`

| Purpose | Method & Endpoint | Quota cost |
|---------|-------------------|-----------|
| Search a video | `GET /search?part=snippet&q=<query>&type=video&maxResults=5` | **100 units** |
| Create playlist | `POST /playlists?part=snippet,status` | 50 units |
| Add video to playlist | `POST /playlistItems?part=snippet` | 50 units |
| List playlist items | `GET /playlistItems?part=snippet&playlistId=<id>` | 1 unit |

Create-playlist body:

```json
{ "snippet": { "title": "My Transferred Playlist", "description": "From Spotify" },
  "status": { "privacyStatus": "private" } }
```

Add-item body:

```json
{ "snippet": { "playlistId": "<PLAYLIST_ID>",
    "resourceId": { "kind": "youtube#video", "videoId": "<VIDEO_ID>" } } }
```

### 5.3 The quota problem (critical restriction)

- Default quota: **10,000 units/day**.
- Each search = 100; add song ≈ search (100) + insert (50) = **150 units**.
- That's only **~66 songs/day** on default quota — a single 200-song playlist
  exhausts it.
- You can request a quota increase from Google (audit required), not guaranteed.
- **In MyCircle:** persist transfer **jobs** in Firestore
  (`users/{uid}/transferJobs/{jobId}` with per-track status) so a large transfer
  can **resume across days** without re-searching already-matched tracks. This
  is the main reason to prefer Path B.

---

## 6. YouTube — Path B: `ytmusicapi` (unofficial, recommended for quality)

`ytmusicapi` (Python) talks to YouTube Music's private web endpoints — no quota,
real music-catalog matching. Docs: `https://ytmusicapi.readthedocs.io`.

### 6.1 Auth

```bash
ytmusicapi browser   # paste request headers from music.youtube.com -> browser.json
# or
ytmusicapi oauth     # device-code OAuth -> oauth.json (more durable)
```

Store the resulting auth blob as a **Firebase secret** and hydrate it in the
service at runtime.

### 6.2 Core methods (the effective "endpoints")

```python
from ytmusicapi import YTMusic
yt = YTMusic("oauth.json")

results = yt.search("Bohemian Rhapsody Queen", filter="songs")   # find
video_id = results[0]["videoId"]

playlist_id = yt.create_playlist("Transferred", "From Spotify",  # create
                                 privacy_status="PRIVATE")         # PRIVATE|PUBLIC|UNLISTED

yt.add_playlist_items(playlist_id, [video_id_1, video_id_2, ...]) # add (batch)
```

| Method | Purpose |
|--------|---------|
| `search(q, filter="songs")` | Find a track (`videos`, `albums` too). |
| `create_playlist(title, desc, privacy_status)` | New playlist → ID. |
| `add_playlist_items(pid, [videoIds])` | Batch-add tracks (chunk ~50). |
| `get_library_playlists()` | List existing playlists. |
| `remove_playlist_items(...)` | Undo / dedupe. |

### 6.3 Integrating Path B with MyCircle (Node backend)

MyCircle Functions are Node/TypeScript, so run the Python lib **out of process**:

- **Option 1 (recommended):** deploy a tiny **Cloud Run** service (FastAPI +
  `ytmusicapi`) exposing `/search`, `/create-playlist`, `/add-items`. The
  MyCircle resolver calls it over HTTPS (server-to-server, auth via a shared
  secret / IAM). GraphQL-first rule is satisfied — the MFE still only calls
  GraphQL; the resolver is the one calling the third-party service.
- **Option 2:** use a Node port (`youtube-music-ts` / `node-youtube-music`) so
  everything stays inside `functions/`. Less battle-tested than `ytmusicapi`.

### 6.4 Restrictions / caveats

- **Unofficial** — not endorsed by Google; may break on any YT Music change.
- Auth headers/tokens expire; the `oauth` flow is more durable — refresh it.
- Respect rate limits: add small delays, batch `add_playlist_items`.
- Only move a user's **own** playlists into **their** account; don't violate ToS.

---

## 7. GraphQL surface (what the MFE actually calls)

Extend `functions/src/schema.ts`, then `pnpm codegen` (regenerates
`packages/shared/src/apollo/generated.ts` — **commit it**). Sketch:

```graphql
type SpotifyPlaylist { id: ID!, name: String!, trackCount: Int! }
type MatchResult { spotifyTrackId: ID!, title: String!, matchedVideoId: String, matched: Boolean! }
type TransferJob { id: ID!, status: String!, total: Int!, done: Int!, unmatched: [MatchResult!]! }

type Query {
  spotifyPlaylists: [SpotifyPlaylist!]!
  spotifyPlaylistTracks(playlistId: ID!): [MatchResult!]!
  transferJob(id: ID!): TransferJob!
}
type Mutation {
  startSpotifyAuth: String!                          # returns consent URL
  transferPlaylist(playlistId: ID!, privacy: String!): TransferJob!
}
```

MFE consumes these with `useQuery`/`useMutation` **imported from
`@mycircle/shared`** (never `@apollo/client` directly — breaks Module
Federation).

---

## 8. Usage restrictions summary

| API | Public? | Free? | Auth | Main limit |
|-----|---------|-------|------|-----------|
| **Spotify Web API** | Yes | Yes | OAuth 2.0 (Auth Code) | Rolling-window rate limit; 100 tracks/page; tokens 1h. |
| **YouTube Data API v3** | Yes | Yes | OAuth 2.0 | **10,000 units/day** (search=100) — hard ceiling. |
| **`ytmusicapi`** | Unofficial | Yes | Browser headers / OAuth | No quota, but unstable & ToS-sensitive. |

**Legal/ToS:** move only the user's own playlists, with consent, into their own
account. Don't cache/redistribute catalog metadata beyond ToS. Store all tokens
in Firestore encrypted-at-rest; all client secrets in **Firebase secrets** —
never in the MFE bundle or repo.

---

## 9. Building it as a MyCircle MFE — integration checklist

Follow MyCircle's "Adding New MFE Packages" (20+ integration points). Key ones:

1. **Package:** `packages/playlist-transfer` (mirror `packages/podcast-player`
   layout: `src/components`, `src/hooks`, `src/utils`, `main.tsx`). Wrap pages
   in `<PageContent>` from `@mycircle/shared`.
2. **Spec (required for CI `spec-check`):** create
   `specs/029-playlist-transfer/spec.md` via `pnpm new-spec playlist-transfer`.
3. **Shell wiring:** `App.tsx` (lazy route), `vite.config.ts` (federation
   remote), `remotes.d.ts`, `tailwind.config.js` (content path),
   `WidgetDashboard.tsx`, `BottomNav.tsx`, `Layout.tsx`, `CommandPalette.tsx`,
   `routeConfig.ts`.
4. **Backend:** `functions/src/resolvers/playlistTransfer.ts` +
   register in `resolvers/index.ts`; extend `schema.ts`; run `pnpm codegen`.
   OAuth callbacks as Cloud Functions with `firebase.json` rewrites placed
   **before** the catch-all.
5. **Secrets:** `SPOTIFY_CLIENT_SECRET`, `GOOGLE_OAUTH_CLIENT_SECRET` (and
   `YTMUSIC_AUTH` for Path B) via `printf ... | firebase functions:secrets:set`;
   grant the compute SA `secretmanager.secretAccessor`.
6. **Firestore:** `users/{uid}/integrations/{provider}` (tokens) and
   `users/{uid}/transferJobs/{jobId}` (job + per-track status); add
   `firestore.rules`.
7. **i18n:** every visible string via `t('key')` in all 3 locales (`en`,`es`,`zh`),
   including `nav.*` and `commandPalette.goTo*`; `pnpm build:shared`.
8. **Deployment:** `deploy/docker/Dockerfile`, `scripts/assemble-firebase.mjs`,
   `server/production.ts` (`MFE_PREFIXES`); root `package.json` `dev:*`/`preview:*`
   + `dev`/`dev:mf` concurrently commands.
9. **Validate:** `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck`,
   run `validate_all` (MCP validators), then the standard branch → PR → checks →
   squash-merge flow. Never merge until `ci`, `e2e-gate`, `spec-check` pass.

---

## 10. Quick start checklist

- [ ] Register Spotify app; set redirect to a MyCircle Cloud Function callback.
- [ ] Add `SPOTIFY_CLIENT_SECRET` (+ Google/YTMusic) as Firebase secrets.
- [ ] Scaffold `packages/playlist-transfer` + `specs/029-playlist-transfer/spec.md`.
- [ ] Add `playlistTransfer` resolver: Spotify auth + paginated track read.
- [ ] Choose Path A (YouTube Data API) or Path B (`ytmusicapi` via Cloud Run).
- [ ] Implement search + scoring/matching in the resolver.
- [ ] Persist transfer jobs in Firestore (resumable, per-track status).
- [ ] Extend GraphQL schema + `pnpm codegen`; wire MFE via `@mycircle/shared`.
- [ ] Build a review UI for unmatched tracks.
- [ ] Wire all shell/deploy integration points; run `validate_all`; open PR.

---

*Reference links:*
- Spotify Web API — https://developer.spotify.com/documentation/web-api
- YouTube Data API v3 — https://developers.google.com/youtube/v3
- ytmusicapi docs — https://ytmusicapi.readthedocs.io
- MyCircle rules — `repos/MyCircle/AGENTS.md`, `repos/MyCircle/CLAUDE.md`
