# Data Model: Synology NAS Integration for Digital Library Audio Offload

**Branch**: `025-nas-audio-offload` | **Date**: 2026-04-02

---

## Entities

### 1. NAS Connection Config

**Firestore path**: `users/{uid}/nasConnection/config`

Stores the user's NAS connection settings. Mirrors the existing `sqlConnection/config` document structure.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `nasUrl` | `string` | Yes | Full base URL of the NAS (e.g. `https://mynas.synology.me:5001`) |
| `username` | `string` | Yes | DSM user account with FileStation access |
| `password` | `string` | Yes | Stored encrypted at rest; never returned via GraphQL |
| `destFolder` | `string` | Yes | Root destination folder on NAS (default: `/MyCircle`) |
| `status` | `string` | Yes | `'connected' \| 'error' \| 'unknown'` |
| `lastTestedAt` | `string` | No | ISO 8601 timestamp of last successful/failed test |
| `updatedAt` | `string` | No | ISO 8601 timestamp of last save |

**Validation rules** (Zod, applied in resolver):
- `nasUrl`: valid URL, max 500 chars
- `username`: non-empty string, max 100 chars
- `password`: optional on update (omit to keep existing), max 200 chars when provided
- `destFolder`: non-empty string starting with `/`, max 200 chars, default `/MyCircle`

**Access rules**: Read/write only by the owning user (`request.auth.uid == userId`).

---

### 2. BookChapter (extended)

**Firestore path**: `books/{bookId}/chapters/{chapterId}`

Extends the existing `BookChapter` document with two new optional fields.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `nasArchived` | `boolean` | No | `true` when chapter audio has been offloaded to NAS. Defaults to `false` if absent. |
| `nasPath` | `string` | No | Full path of the audio file on the NAS (e.g. `/MyCircle/books/{bookId}/chapter-0.mp3`). Set when `nasArchived = true`. |

**Existing fields** (unchanged):
- `id`, `index`, `title`, `href`, `characterCount`
- `audioUrl`: public Firebase Storage download URL. `null` when chapter is NAS-only.
- `audioDuration`: integer seconds. Preserved through offload/restore cycles.
- `audioStoragePath`: Firebase Storage path. Cleared on offload; re-set on restore.

**State transitions**:

```
not converted → converted (audioUrl set)
             ↓
     converted → nas-only (audioUrl cleared, nasArchived=true, nasPath set)
             ↓
     nas-only → restored (audioUrl re-set, nasArchived stays true, nasPath stays)
             ↓
     restored → nas-only (re-offload; same as converted → nas-only)
```

---

### 3. NAS Archive Result (transient, GraphQL-only)

Returned by `archiveChapterToNas` and `archiveBookToNas`. Not stored in Firestore.

| Field | Type | Notes |
|-------|------|-------|
| `bookId` | `ID!` | Book being processed |
| `chapterIndex` | `Int!` | Chapter index within the book |
| `success` | `Boolean!` | Whether this chapter's operation succeeded |
| `nasPath` | `String` | Set if `success = true` |
| `error` | `String` | Error message if `success = false` |

---

## GraphQL Schema Extensions

### New Types

```graphql
type NasConnectionStatus {
  nasUrl: String!
  destFolder: String!
  status: String!           # 'connected' | 'error' | 'unknown'
  lastTestedAt: String
  hasCredentials: Boolean!
}

input NasConnectionInput {
  nasUrl: String!
  username: String!
  password: String          # Optional on update; omit to keep existing
  destFolder: String!
}

type NasArchiveResult {
  bookId: ID!
  chapterIndex: Int!
  success: Boolean!
  nasPath: String
  error: String
}
```

### BookChapter Extension

```graphql
type BookChapter {
  id: ID!
  index: Int!
  title: String!
  href: String!
  characterCount: Int!
  audioUrl: String
  audioDuration: Int
  nasArchived: Boolean    # NEW — defaults to false
  nasPath: String         # NEW — null unless archived
}
```

### New Queries

```graphql
nasConnectionStatus: NasConnectionStatus   # Returns null if not configured
```

### New Mutations

```graphql
saveNasConnection(input: NasConnectionInput!): NasConnectionStatus!
testNasConnection: NasConnectionStatus!
deleteNasConnection: Boolean!
archiveChapterToNas(bookId: ID!, chapterIndex: Int!): NasArchiveResult!
archiveBookToNas(bookId: ID!): [NasArchiveResult!]!
restoreChapterFromNas(bookId: ID!, chapterIndex: Int!): BookChapter!
```

---

## Firestore Rules Addition

```
match /users/{userId} {
  // Existing rules unchanged...

  match /nasConnection/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
}
```

---

## In-Memory Cache (functions runtime)

**Type**: `Map<uid, { config: NasConnectionConfig | null; expiry: number }>`
**TTL**: 60 seconds (matches `sqlClient.ts` pattern)
**Scope**: Per Cloud Function instance (not shared across instances)
**Purpose**: Avoid repeated Firestore reads for NAS config within the same function invocation window. Cleared explicitly on `saveNasConnection`, `testNasConnection`, and `deleteNasConnection`.
