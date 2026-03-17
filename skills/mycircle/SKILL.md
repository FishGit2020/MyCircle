---
name: mycircle
description: Access MyCircle family dashboard data via GraphQL API
triggers:
  - baby
  - baby size
  - how big is my baby
  - due date
  - pregnancy
  - notes
  - my notes
  - daily log
  - journal
  - worship songs
  - song search
env:
  MYCIRCLE_API_KEY:
    description: API key for MyCircle GraphQL API (generated via generate-api-key.mjs)
    required: true
  MYCIRCLE_BASE_URL:
    description: Base URL for MyCircle
    default: https://mycircle-dash.web.app
---

# MyCircle Skill

Access your MyCircle family dashboard data via text (iMessage → OpenClaw → MyCircle GraphQL).

All endpoints use the single GraphQL endpoint at `$MYCIRCLE_BASE_URL/graphql` with `X-API-Key` header authentication.

---

## Baby Info

Get current pregnancy progress — gestational week, size comparisons (fruit/animal/vegetable), measurements.

```bash
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"{ babyInfo { dueDate currentWeek currentDay weeksRemaining fruit animal vegetable length weight } }"}' \
  | jq '.data.babyInfo'
```

**Example response:**
```json
{
  "dueDate": "2026-04-15",
  "currentWeek": 32,
  "currentDay": 3,
  "weeksRemaining": 8,
  "fruit": "small papaya",
  "animal": "cocker spaniel",
  "vegetable": "jicama",
  "length": "16.69 in (42.4 cm)",
  "weight": "60.03 oz (1702 g)"
}
```

**Suggested reply format:** "Week {currentWeek} — the size of a {fruit}! {length}, {weight}. {weeksRemaining} weeks to go."

---

## Notes

Search and list personal notes.

```bash
# List recent notes (default limit: 20)
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"{ notes(limit: 10) { id title content updatedAt } }"}' \
  | jq '.data.notes'

# Search notes by keyword
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"{ notes(search: \"grocery\", limit: 5) { id title content updatedAt } }"}' \
  | jq '.data.notes'
```

---

## Worship Songs

Search the shared worship song library by title, artist, or tag. Uses the existing `worshipSongsList` query.

```bash
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"{ worshipSongsList(search: \"amazing\", limit: 10) { songs { id title artist originalKey tags } totalCount } }"}' \
  | jq '.data.worshipSongsList'
```

---

## Daily Log

Create a daily journal entry.

```bash
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"mutation { createDailyLog(input: { content: \"Felt great today. Baby kicked a lot!\" }) { id date content } }"}' \
  | jq '.data.createDailyLog'

# With explicit date
curl -s -X POST "$MYCIRCLE_BASE_URL/graphql" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $MYCIRCLE_API_KEY" \
  -d '{"query":"mutation { createDailyLog(input: { content: \"Doctor appointment went well.\", date: \"2026-03-15\" }) { id date content } }"}' \
  | jq '.data.createDailyLog'
```

---

## Authentication

All requests use API key auth via the `X-API-Key` header. The key is hashed (SHA-256) server-side and looked up in Firestore `apiKeys/{hash}` to resolve to a user ID.

Rate limit: 30 requests/minute per user.

Generate a key:
```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
node scripts/generate-api-key.mjs --uid=<your-firebase-uid>
```
