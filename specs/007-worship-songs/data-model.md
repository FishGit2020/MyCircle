# Data Model: Worship Song Library — Setlist Management

**Branch**: `007-worship-songs` | **Date**: 2026-03-20

---

## Existing Entities (unchanged)

### WorshipSong (existing — `worshipSongs` collection)

| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore auto-ID |
| title | string | Required |
| artist | string | Optional |
| originalKey | string | e.g., "G", "Eb" |
| format | `'chordpro' \| 'text'` | Determines rendering |
| content | string | Stored in Cloud Storage for large songs |
| notes | string | Optional per-song notes |
| youtubeUrl | string? | Optional |
| bpm | number? | Optional |
| tags | string[]? | Optional |
| createdAt | ISO timestamp | |
| updatedAt | ISO timestamp | |
| createdBy | string? | uid |

---

## New Entities

### Setlist (new — `worshipSetlists` collection)

Firestore document stored in the top-level `worshipSetlists` collection. Access is scoped by `createdBy` field in security rules.

| Field | Type | Notes |
|-------|------|-------|
| id | string | Firestore auto-ID |
| name | string | Required, non-empty |
| serviceDate | string? | Optional ISO date or label (e.g., "2026-03-22") |
| entries | SetlistEntry[] | Ordered array; preserves running order |
| createdAt | ISO timestamp | Set on create |
| updatedAt | ISO timestamp | Updated on every mutation |
| createdBy | string | uid — required for auth scoping |

**Validation rules**:
- `name` MUST be non-empty (trimmed length > 0)
- `entries` array MAY be empty (e.g., newly created setlist)
- `entries` array length SHOULD NOT exceed 50 (practical limit, not enforced at schema)
- `createdBy` MUST match the authenticated user's uid (enforced in resolver)

---

### SetlistEntry (embedded array element — no separate collection)

Stored as elements of `Setlist.entries[]` in the same Firestore document.

| Field | Type | Notes |
|-------|------|-------|
| songId | string | Reference to `worshipSongs/{id}` |
| position | number | 0-based integer; determines running order |
| snapshotTitle | string | Song title captured at time of adding |
| snapshotKey | string | `originalKey` captured at time of adding |

**Validation rules**:
- `songId` MUST be a non-empty string
- `position` values MUST be unique within a setlist (no duplicates)
- `position` values after reorder MUST be contiguous 0-based integers
- `snapshotTitle` and `snapshotKey` MUST be non-empty (use song data at time of add)

**Duplicate policy**: The same `songId` MAY appear more than once in `entries` (a song can open and close a service). Each occurrence has a distinct `position`.

---

### ComparisonSetlistSession (UI-only — no persistence)

Transient state held in `SetlistPresenter` component. Not stored in Firestore or localStorage.

| Field | Type | Notes |
|-------|------|-------|
| currentIndex | number | 0-based index into the setlist entries array |
| semitonesBySongId | Record<string, number> | Per-song transposition for this session only |

---

## GraphQL Schema Extensions

### New Types

```graphql
type SetlistEntry {
  songId: ID!
  position: Int!
  snapshotTitle: String!
  snapshotKey: String!
}

type Setlist {
  id: ID!
  name: String!
  serviceDate: String
  entries: [SetlistEntry!]!
  createdAt: String!
  updatedAt: String!
  createdBy: String!
}
```

### New Queries

```graphql
# List all setlists for the authenticated user, ordered by updatedAt desc
worshipSetlists: [Setlist!]!

# Fetch a single setlist by ID (auth required — only createdBy user can read)
worshipSetlist(id: ID!): Setlist
```

### New Mutations

```graphql
# Create a new setlist (auth required)
addWorshipSetlist(input: WorshipSetlistInput!): Setlist!

# Update name, serviceDate, and/or entries (auth required, only owner)
updateWorshipSetlist(id: ID!, input: WorshipSetlistUpdateInput!): Setlist!

# Delete a setlist (auth required, only owner)
deleteWorshipSetlist(id: ID!): Boolean!
```

### New Input Types

```graphql
input SetlistEntryInput {
  songId: ID!
  position: Int!
  snapshotTitle: String!
  snapshotKey: String!
}

input WorshipSetlistInput {
  name: String!
  serviceDate: String
  entries: [SetlistEntryInput!]
}

input WorshipSetlistUpdateInput {
  name: String
  serviceDate: String
  entries: [SetlistEntryInput!]
}
```

---

## Relationships

```
WorshipSong (1) ──────────< SetlistEntry (N) — via songId
                              (part of Setlist.entries[])

Setlist (1) ──────────────< SetlistEntry (N) — embedded array

User (auth) ──────────────< Setlist (N) — via createdBy field
```

**Referential integrity**: Firestore does not enforce foreign keys. A `SetlistEntry.songId` may reference a deleted song. The resolver returns `null` for the resolved `WorshipSong` in that case, and the MFE shows a placeholder (FR-012).

---

## State Transitions

### Setlist Lifecycle

```
CREATE (name, optional date) → [empty setlist, entries=[]]
     ↓
ADD SONGS (append entries, capture snapshot fields)
     ↓
REORDER (update position values, re-sort entries array)
     ↓
REMOVE SONG (remove entry, recompute positions)
     ↓
DELETE setlist (remove Firestore document entirely)
```

### Setlist Entry Position Invariant

After any mutation to `entries`, the resolver MUST ensure:
- Positions are 0-based consecutive integers: `[0, 1, 2, ..., n-1]`
- The array is sorted by `position` ascending before saving
- On add: new entry gets `position = entries.length` (appended to end)
- On remove: entries after the removed position are decremented by 1
- On move-up: swap positions with the entry above (position - 1)
- On move-down: swap positions with the entry below (position + 1)
