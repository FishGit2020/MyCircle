# Data Model: Pregnancy & Baby Memory Journal (revised)

**Branch**: `009-pregnancy-baby-tracker` | **Phase**: 1 — Design
**Revision**: Extended `packages/baby-tracker`, no new MFE.

---

## Entities

### MilestoneEvent

A personally logged pregnancy or baby milestone moment (e.g., "Felt first kick", "Baby shower", "Birth announcement"). Text-only — no photo attachment.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | Yes | Firestore document ID |
| childId | string \| null | No | Links to child profile; null = pregnancy events before birth |
| title | string | Yes | Max 120 chars |
| eventDate | string | Yes | ISO 8601 date (YYYY-MM-DD); future dates accepted |
| note | string \| null | No | Max 2000 chars |
| createdAt | string | Yes | ISO 8601 timestamp; server-set |
| updatedAt | string | Yes | ISO 8601 timestamp; updated on mutation |

**Firestore collection**: `users/{uid}/milestoneEvents/{eventId}`
**Order**: `eventDate DESC`

---

### JournalPhoto

A photo in the unified album (replaces existing per-stage `BabyPhoto` entity).

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | Yes | Firestore document ID = UUID; also the base of the Storage filename for new uploads |
| childId | string \| null | No | Links to child profile; null = pregnancy photos |
| photoUrl | string | Yes | Cloud Storage download URL |
| storagePath | string | Yes | Used for deletion. New uploads: `users/{uid}/journal-photos/{id}.jpg`. Migrated: original `users/{uid}/baby-photos/{stageId}.jpg` |
| caption | string \| null | No | Max 200 chars |
| photoDate | string | Yes | ISO 8601 date (user-provided or upload timestamp) |
| stageLabel | string \| null | No | Set by migration script only (e.g., "Weeks 1–3"). Null for all new uploads |
| createdAt | string | Yes | ISO 8601 timestamp; server-set |

**Firestore collection**: `users/{uid}/journalPhotos/{photoId}`
**Order**: `photoDate DESC`
**Cloud Storage** (new uploads): `users/{uid}/journal-photos/{photoId}.jpg`
**Cloud Storage** (migrated): unchanged at `users/{uid}/baby-photos/{stageId}.jpg`

#### Migration from BabyPhoto

Old `users/{uid}/babyMilestones/{stageId}` → New `users/{uid}/journalPhotos/{uuid}`:

| Old field | New field | Transform |
|-----------|-----------|-----------|
| photoUrl | photoUrl | copy as-is |
| caption | caption | copy as-is |
| uploadedAt (Timestamp) | photoDate | `.toMillis()` → ISO date |
| — | storagePath | `users/{uid}/baby-photos/{stageId}.jpg` |
| — | stageLabel | stage name from `developmentStages` lookup (e.g., "Weeks 1–3") |
| — | childId | null (legacy, pre-child-profile era) |
| — | id | new UUID |

---

### InfantAchievement

A record that a specific child achieved a known infant developmental milestone.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| id | string | Yes | Firestore document ID |
| childId | string | Yes | Required — achievements always belong to a child |
| milestoneId | string | Yes | References `Milestone.id` from `@mycircle/child-development` (e.g., `physical-0_3m-01`) |
| achievedDate | string | Yes | ISO 8601 date |
| note | string \| null | No | Max 500 chars |
| createdAt | string | Yes | ISO 8601 timestamp; server-set |
| updatedAt | string | Yes | ISO 8601 timestamp; updated on edit |

**Firestore collection**: `users/{uid}/milestoneAchievements/{achievementId}`
**Uniqueness**: `(childId, milestoneId)` — enforced via upsert in resolver
**Scope**: Only milestones from age bands `0-3m`, `3-6m`, `6-9m`, `9-12m`, `12-18m` (115 milestones)

---

## GraphQL Schema Additions

```graphql
# ── Milestone Events ──────────────────────────────────────────────────────────

type MilestoneEvent {
  id: ID!
  childId: String
  title: String!
  eventDate: String!
  note: String
  createdAt: String!
  updatedAt: String!
}

input MilestoneEventInput {
  childId: String
  title: String!
  eventDate: String!
  note: String
}

input MilestoneEventUpdateInput {
  title: String
  eventDate: String
  note: String
}

# ── Journal Photos ─────────────────────────────────────────────────────────────

type JournalPhoto {
  id: ID!
  childId: String
  photoUrl: String!
  storagePath: String!
  caption: String
  stageLabel: String
  photoDate: String!
  createdAt: String!
}

input JournalPhotoInput {
  childId: String
  photoUrl: String!
  storagePath: String!
  caption: String
  stageLabel: String
  photoDate: String!
}

# ── Infant Achievements ────────────────────────────────────────────────────────

type InfantAchievement {
  id: ID!
  childId: String!
  milestoneId: String!
  achievedDate: String!
  note: String
  createdAt: String!
  updatedAt: String!
}

input InfantAchievementInput {
  childId: String!
  milestoneId: String!
  achievedDate: String!
  note: String
}

input InfantAchievementUpdateInput {
  achievedDate: String
  note: String
}

# ── Queries ───────────────────────────────────────────────────────────────────

extend type Query {
  milestoneEvents(childId: String, limit: Int): [MilestoneEvent!]!
  journalPhotos(childId: String, limit: Int): [JournalPhoto!]!
  infantAchievements(childId: String!): [InfantAchievement!]!
}

# ── Mutations ─────────────────────────────────────────────────────────────────

extend type Mutation {
  addMilestoneEvent(input: MilestoneEventInput!): MilestoneEvent!
  updateMilestoneEvent(id: ID!, input: MilestoneEventUpdateInput!): MilestoneEvent!
  deleteMilestoneEvent(id: ID!): Boolean!

  addJournalPhoto(input: JournalPhotoInput!): JournalPhoto!
  deleteJournalPhoto(id: ID!): Boolean!

  addInfantAchievement(input: InfantAchievementInput!): InfantAchievement!
  updateInfantAchievement(id: ID!, input: InfantAchievementUpdateInput!): InfantAchievement!
  deleteInfantAchievement(id: ID!): Boolean!
}
```

---

## Firestore Security Rules (additions)

```
match /users/{uid}/milestoneEvents/{docId} {
  allow read, write: if request.auth.uid == uid;
}
match /users/{uid}/journalPhotos/{docId} {
  allow read, write: if request.auth.uid == uid;
}
match /users/{uid}/milestoneAchievements/{docId} {
  allow read, write: if request.auth.uid == uid;
}
```

---

## Existing Types Being Deprecated

`BabyPhoto` / `babyPhotos` query / `deleteBabyPhoto` mutation — kept alive until migration script has been run. Do not remove from schema until confirmed all users have migrated.

---

## Collapsible Section State (localStorage)

| Key | Type | Default | Controls |
|-----|------|---------|----------|
| `baby_events_expanded` | boolean | false | My Moments section open/closed |
| `baby_photos_expanded` | boolean | false | Photo Album section open/closed |
| `baby_milestones_expanded` | boolean | false | Baby Milestones section open/closed |

Keys to be added to `StorageKeys` in `@mycircle/shared`.
