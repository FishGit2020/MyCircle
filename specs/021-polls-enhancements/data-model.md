# Data Model: Polls Enhancements (021)

**Phase**: 1 — Design
**Date**: 2026-03-31
**Branch**: `021-polls-enhancements`

---

## Existing Entities (Unchanged)

### Poll (Firestore: `polls/{pollId}`)

| Field       | Type               | Notes                                          |
|-------------|-------------------|------------------------------------------------|
| `id`        | string             | Firestore document ID                          |
| `question`  | string             | Poll question text                             |
| `options`   | PollOption[]       | Array of voting options with aggregate counts  |
| `createdBy` | string             | UID of creating user                           |
| `isPublic`  | boolean            | Whether poll is visible to all users           |
| `expiresAt` | string \| null     | ISO-8601 datetime or null (no expiry)          |
| `createdAt` | number             | Epoch ms timestamp                             |
| `updatedAt` | number             | Epoch ms timestamp                             |
| `isDeleted` | boolean (optional) | Soft-delete flag; absent = not deleted         |
| `deletedAt` | number (optional)  | Epoch ms timestamp of soft delete              |

**Unchanged** — no new fields added to the poll document.

### PollOption (embedded in Poll.options[])

| Field   | Type   | Notes                        |
|---------|--------|------------------------------|
| `id`    | string | Stable identifier for option |
| `text`  | string | Display text                 |
| `votes` | number | Aggregate vote count         |

**Unchanged** — vote counts continue to live on the option as aggregate counts.

---

## New Entity: VoteRecord

### Firestore: `polls/{pollId}/votes/{uid}`

Document ID is the voter's UID, guaranteeing uniqueness per (user, poll) pair.

| Field       | Type   | Notes                                  |
|-------------|--------|----------------------------------------|
| `optionId`  | string | ID of the option the user voted for    |
| `votedAt`   | number | Epoch ms timestamp of the (last) vote  |

**Key properties**:
- Writing a VoteRecord for a UID that already has one is an upsert — this is how vote-change is implemented without a separate "delete old record" step.
- The subcollection is co-located with the poll for efficient cleanup.
- No voter identity is exposed across users — Firestore rules restrict read/write to the owner UID only (see research.md Decision 6).

---

## Updated TypeScript Interfaces

The following changes apply to `packages/poll-system/src/types.ts`:

```typescript
// No changes to Poll or PollOption

// Updated Vote interface — was only optionId + votedAt (local state)
// Now also used as the Firestore document shape
export interface VoteRecord {
  optionId: string;  // which option was selected
  votedAt: number;   // epoch ms
}

// New: local state shape for the hook
export interface UserVoteMap {
  [pollId: string]: string | undefined;  // pollId → optionId voted for
}
```

---

## State Transitions

### Vote lifecycle for a single (user, poll) pair

```
[No vote]
    │
    │  castVote(pollId, optionId)
    ▼
[Voted: optionId = A]
    │
    │  changeVote(pollId, oldOptionId=A, newOptionId=B)
    ▼
[Voted: optionId = B]
```

- `castVote`: Creates the VoteRecord document; increments `options[optionId].votes` on the poll. Implemented as a Firestore transaction.
- `changeVote`: Upserts the VoteRecord document (new optionId); decrements old option votes; increments new option votes. Implemented as a Firestore transaction.
- Once a poll expires, vote operations are rejected client-side (expiration check in PollDetail) and server-side (Firestore rules can enforce this in future, currently enforced in client logic only).

---

## Firestore Rules Changes

**File**: `firestore.rules`

```
// Existing polls rules — unchanged
match /polls/{pollId} {
  allow read: if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null && resource.data.createdBy == request.auth.uid;

  // NEW: Vote records subcollection — user can only read/write their own vote
  match /votes/{uid} {
    allow read, write: if request.auth != null && request.auth.uid == uid;
  }
}
```

---

## Validation Rules

| Rule | Enforcement Point |
|------|------------------|
| User must be authenticated to vote | `window.__pollSystem.vote()` — throws if no `auth.currentUser` |
| User cannot vote on expired poll | `PollDetail` — disabled state check on options; `votePoll` checks expiry |
| User cannot vote twice (new) | `castVote` transaction — checks if VoteRecord doc already exists; rejects if found |
| Only creator can delete | Firestore rules (`resource.data.createdBy == request.auth.uid`) |
| Poll must have ≥ 2 options | `PollForm` — submit disabled until condition met |
| Question must be non-empty | `PollForm` — submit disabled; HTML required attribute |

---

## Search & Filter — Derived State (No New Storage)

Search and filter are computed client-side from the live poll list. No new Firestore fields or indexes are required.

| Filter | Derivation |
|--------|-----------|
| Active | `expiresAt === null \|\| new Date(expiresAt) > Date.now()` |
| Expired | `expiresAt !== null && new Date(expiresAt) <= Date.now()` |
| My Polls | `createdBy === window.__currentUid` |
| Keyword search | `poll.question.toLowerCase().includes(query.toLowerCase())` |

---

## Export — No New Storage

Export generates a CSV string in-memory from the current poll state and triggers a browser download. No server round-trip or new Firestore fields required.

CSV columns: `Option`, `Votes`, `Percentage`
CSV header rows include: `Question`, `Status`, `Total Votes`, `Export Date`
