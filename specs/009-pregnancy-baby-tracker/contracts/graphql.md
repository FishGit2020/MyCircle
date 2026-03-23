# GraphQL & HTTP Contracts: Baby Memory Journal

**Branch**: `009-pregnancy-baby-tracker`
**Revision**: Extends `packages/baby-tracker`; no new MFE.

All queries and mutations are authenticated — requests without a valid Firebase ID token return `UNAUTHENTICATED`.

---

## Queries

### `milestoneEvents`

```graphql
query GetMilestoneEvents($childId: String, $limit: Int) {
  milestoneEvents(childId: $childId, limit: $limit) {
    id
    childId
    title
    eventDate
    note
    createdAt
    updatedAt
  }
}
```

| Argument | Default | Notes |
|----------|---------|-------|
| childId | null | null returns all the user's events regardless of child |
| limit | 200 | Capped at 500; ordered `eventDate DESC` |

---

### `journalPhotos`

```graphql
query GetJournalPhotos($childId: String, $limit: Int) {
  journalPhotos(childId: $childId, limit: $limit) {
    id
    childId
    photoUrl
    storagePath
    caption
    stageLabel
    photoDate
    createdAt
  }
}
```

| Argument | Default | Notes |
|----------|---------|-------|
| childId | null | null returns all photos |
| limit | 200 | Capped at 500; ordered `photoDate DESC` |

---

### `infantAchievements`

```graphql
query GetInfantAchievements($childId: String!) {
  infantAchievements(childId: $childId) {
    id
    childId
    milestoneId
    achievedDate
    note
    createdAt
    updatedAt
  }
}
```

`childId` is required — achievements are always child-scoped.

---

## Mutations

### `addMilestoneEvent`

```graphql
mutation AddMilestoneEvent($input: MilestoneEventInput!) {
  addMilestoneEvent(input: $input) {
    id childId title eventDate note createdAt updatedAt
  }
}
```

**Errors**: `BAD_USER_INPUT` if `title` is empty or `eventDate` is not a valid ISO date.

### `updateMilestoneEvent`

```graphql
mutation UpdateMilestoneEvent($id: ID!, $input: MilestoneEventUpdateInput!) {
  updateMilestoneEvent(id: $id, input: $input) {
    id title eventDate note updatedAt
  }
}
```

**Errors**: `NOT_FOUND` if doc does not exist or belongs to a different user.

### `deleteMilestoneEvent`

```graphql
mutation DeleteMilestoneEvent($id: ID!) {
  deleteMilestoneEvent(id: $id)
}
```

Returns `true` on success, `false` if not found.

---

### `addJournalPhoto`

Called after a successful photo upload via the HTTP handler. Stores metadata in Firestore.

```graphql
mutation AddJournalPhoto($input: JournalPhotoInput!) {
  addJournalPhoto(input: $input) {
    id childId photoUrl storagePath caption stageLabel photoDate createdAt
  }
}
```

### `deleteJournalPhoto`

```graphql
mutation DeleteJournalPhoto($id: ID!) {
  deleteJournalPhoto(id: $id)
}
```

Deletes both the Firestore doc and the Cloud Storage binary at `storagePath`. Returns `true`/`false`.

---

### `addInfantAchievement`

**Upsert semantics**: if a record for `(childId, milestoneId)` already exists, replaces it.

```graphql
mutation AddInfantAchievement($input: InfantAchievementInput!) {
  addInfantAchievement(input: $input) {
    id childId milestoneId achievedDate note createdAt updatedAt
  }
}
```

### `updateInfantAchievement`

```graphql
mutation UpdateInfantAchievement($id: ID!, $input: InfantAchievementUpdateInput!) {
  updateInfantAchievement(id: $id, input: $input) {
    id milestoneId achievedDate note updatedAt
  }
}
```

### `deleteInfantAchievement`

```graphql
mutation DeleteInfantAchievement($id: ID!) {
  deleteInfantAchievement(id: $id)
}
```

---

## HTTP Handler: Journal Photo Upload

**Endpoint**: `/journal-photos/upload`
(Firebase Hosting rewrite → `journalPhotoUpload` Cloud Function; add before the `**` catch-all in `firebase.json`)

**Method**: `POST application/json`
**Auth**: `Authorization: Bearer {idToken}` header

**Request body**:
```json
{
  "imageBase64": "<base64-encoded image>",
  "childId": "<string|null>",
  "caption": "<string|null>",
  "photoDate": "<ISO date string|null>"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| imageBase64 | Yes | Max 5 MB decoded; JPEG/PNG/WEBP |
| childId | No | null for pregnancy photos |
| caption | No | Max 200 chars |
| photoDate | No | Defaults to upload timestamp if omitted |

**Response (success)**:
```json
{
  "photoUrl": "https://storage.googleapis.com/...",
  "storagePath": "users/{uid}/journal-photos/{uuid}.jpg",
  "photoId": "{uuid}"
}
```

**Response (error)**: `{ "error": "..." }` with HTTP 400 / 401 / 413 / 500.

MFE calls via `window.__journalPhotos.upload(file, options)` (shell wrapper). After success, MFE calls `addJournalPhoto` mutation with the returned values.

---

## Migration Script Contract

**Script**: `scripts/migrate-baby-photos.mjs`
**Runtime**: Node.js, Firebase Admin SDK
**Invocation**: `node scripts/migrate-baby-photos.mjs --uid=<uid>` or `--all` for all users

**What it does**:
1. For each `users/{uid}/babyMilestones/{stageId}` doc:
   - Skip if a `journalPhotos` doc with `storagePath: users/{uid}/baby-photos/{stageId}.jpg` already exists (idempotent)
   - Create new `users/{uid}/journalPhotos/{uuid}` doc with fields mapped per `data-model.md`
2. Does NOT move Cloud Storage files (keeps existing URLs valid)
3. Does NOT delete old `babyMilestones` docs (leave for manual cleanup after verification)
4. Prints a summary: `Migrated N photos for user {uid}`

**Expected run time**: < 1 s per user for typical photo counts (≤ 10 photos).
