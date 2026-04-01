# Data Model: Radio Station Enhancements (022)

## Existing Entities (unchanged)

### RadioStation
Already defined in schema and types. All fields already present.

| Field | Type | Notes |
|-------|------|-------|
| stationuuid | string | Unique ID from Radio Browser API |
| name | string | Display name |
| url | string | Primary stream URL |
| url_resolved | string | Resolved stream URL (preferred for playback) |
| favicon | string | Station logo URL |
| tags | string | Comma-separated genre tags (e.g. "jazz,smooth jazz") |
| country | string | Full country name |
| language | string | Primary language |
| codec | string | Audio codec (MP3, AAC, OGG, etc.) |
| bitrate | number | Audio bitrate in kbps |
| votes | number | Community vote count |

### Favorite
Stored as `string[]` in `localStorage[StorageKeys.RADIO_FAVORITES]`. Array of `stationuuid` values. Unchanged.

---

## New Entities

### RadioTag
New GraphQL type. Returned by `radioTags` query.

| Field | Type | Notes |
|-------|------|-------|
| name | string | Genre tag name (e.g. "jazz", "classical") |
| stationCount | number | Number of stations with this tag |

### RecentlyPlayedEntry
Stored in `localStorage[StorageKeys.RADIO_RECENT]`. Not a GraphQL type — purely client-side.

| Field | Type | Notes |
|-------|------|-------|
| stationuuid | string | Station unique ID |
| name | string | Station name (snapshot at play time) |
| favicon | string | Station logo URL (snapshot at play time) |
| country | string | Country (snapshot at play time) |
| url | string | Stream URL (snapshot at play time) |
| url_resolved | string | Resolved stream URL (snapshot at play time) |
| playedAt | number | Unix timestamp (ms) when station was last started |

**Storage rules:**
- Capped at 20 entries
- Deduplicated by `stationuuid` — new play updates `playedAt` and moves entry to front
- Ordered descending by `playedAt`

### VotedStations (session-only)
Stored in `localStorage[StorageKeys.RADIO_VOTED]` as `string[]` of `stationuuid` values.
Cleared on sign-out. Used to show voted state and prevent duplicate votes within a session.

| Field | Type | Notes |
|-------|------|-------|
| stationuuid[] | string[] | UUIDs voted in this session |

### SleepTimer (ephemeral React state)
Not persisted. Lives only in `useSleepTimer` hook state.

| Field | Type | Notes |
|-------|------|-------|
| active | boolean | Whether timer is running |
| totalMinutes | number | Original duration selected (15/30/45/60) |
| secondsLeft | number | Remaining seconds in countdown |

---

## Schema Changes Required

### New GraphQL type
```
type RadioTag {
  name: String!
  stationCount: Int!
}
```

### New GraphQL query
```
radioTags(limit: Int = 50): [RadioTag!]!
```

### Modified GraphQL query
```
# Add optional tag and country filter arguments
radioStations(query: String, limit: Int = 50, tag: String, country: String): [RadioStation!]!
```

### New GraphQL mutation
```
voteRadioStation(uuid: String!): Boolean!
```

---

## localStorage Key Summary

| Key | Existing? | Value type | Purpose |
|-----|-----------|------------|---------|
| `RADIO_FAVORITES` (= `'radio-favorites'`) | ✅ existing | `string[]` | Favorite station UUIDs |
| `RADIO_RECENT` (new `StorageKeys` entry) | ❌ new | `RecentlyPlayedEntry[]` | Recent play history |
| `RADIO_VOTED` (new `StorageKeys` entry) | ❌ new | `string[]` | Session-voted station UUIDs |
