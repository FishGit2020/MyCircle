# OpenClaw Integration

Text from iMessage (via OpenClaw + BlueBubbles) and interact with MyCircle data through the GraphQL API.

## Architecture

```
iMessage → BlueBubbles → OpenClaw → MyCircle GraphQL (/graphql)
                                        ↓
                                   X-API-Key header
                                        ↓
                                   SHA-256 hash → Firestore apiKeys/{hash} → uid
                                        ↓
                                   GraphQL resolvers (same as web app)
```

All OpenClaw requests go through the **existing** `/graphql` Cloud Function endpoint. No new Cloud Functions or firebase.json rewrites needed.

## Available Operations

| Operation | Type | Description |
|-----------|------|-------------|
| `babyInfo` | Query | Pregnancy progress — week, size comparisons, measurements |
| `notes` | Query | List/search personal notes |
| `worshipSongsList` | Query | Search worship song library (existing) |
| `createDailyLog` | Mutation | Create daily journal entry |

## Setup

### 1. Generate an API Key

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/mycircle-service-account.json
node scripts/generate-api-key.mjs --uid=<your-firebase-uid> --label=openclaw
```

The script:
1. Generates a 32-byte random hex key
2. SHA-256 hashes it
3. Writes `apiKeys/{hash}` → `{ uid, label, createdAt }` to Firestore
4. Prints the raw key (shown once, never stored)

### 2. Configure OpenClaw

Set these environment variables in your OpenClaw skill config:

| Variable | Value |
|----------|-------|
| `MYCIRCLE_API_KEY` | The raw key from step 1 |
| `MYCIRCLE_BASE_URL` | `https://mycircle-dash.web.app` (default) |

### 3. Install the Skill

Copy `skills/mycircle/SKILL.md` into your OpenClaw skills directory.

## Authentication

- **Web app**: Firebase ID token via `Authorization: Bearer <token>` header
- **OpenClaw/API**: Raw API key via `X-API-Key` header → SHA-256 → Firestore lookup → uid

Both auth methods resolve to the same `uid` in the GraphQL context. Resolvers don't need to know which auth method was used.

API key auth is rate-limited at 30 requests/minute per uid (separate from web app rate limits).

## Security

- Raw API keys are **never stored** — only SHA-256 hashes exist in Firestore
- `apiKeys` collection has `allow read, write: if false` in Firestore rules (server-only via Admin SDK)
- API key cache: 5-minute TTL (NodeCache) to reduce Firestore reads
- Rate limit: 30 req/min per uid for API key requests

## Testing

```bash
# Baby info
curl -s -X POST "http://localhost:5001/mycircle-dash/us-central1/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-key>" \
  -d '{"query":"{ babyInfo { currentWeek fruit weight } }"}'

# Notes
curl -s -X POST "http://localhost:5001/mycircle-dash/us-central1/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-key>" \
  -d '{"query":"{ notes(limit: 5) { title content } }"}'

# Worship songs
curl -s -X POST "http://localhost:5001/mycircle-dash/us-central1/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-key>" \
  -d '{"query":"{ worshipSongsList(search: \"amazing\") { songs { title artist } } }"}'

# Daily log
curl -s -X POST "http://localhost:5001/mycircle-dash/us-central1/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-key>" \
  -d '{"query":"mutation { createDailyLog(input: { content: \"Test entry\" }) { id date } }"}'
```
