# Research: Polls Enhancements (021)

**Phase**: 0 — Pre-Design Research
**Date**: 2026-03-31
**Branch**: `021-polls-enhancements`

---

## Decision 1: Vote Record Storage

**Question**: Where should per-user vote records be stored to enable duplicate-vote prevention and vote-change?

**Decision**: Firestore subcollection `polls/{pollId}/votes/{uid}`

**Rationale**:
- Using the voter's UID as the document ID makes each vote record naturally unique per (user, poll) pair — Firestore guarantees document ID uniqueness within a collection, so writing a second vote from the same user on the same poll simply overwrites the existing document.
- Reading a user's vote is a single point read (`getDoc`), not a query — O(1) cost regardless of poll size.
- The subcollection is co-located with the poll, keeping related data together and enabling efficient cleanup when a poll is hard-deleted in future.
- Atomic vote changes (remove old, add new) are implemented as a Firestore transaction that reads the poll document, adjusts `options[].votes` counters, and writes the vote record in one atomic operation.

**Alternatives Considered**:
- *Top-level `userVotes/{uid}_{pollId}` collection*: Rejected — compound ID keys are error-prone and cannot leverage Firestore's document-ID uniqueness guarantee as cleanly.
- *Field on the poll document (`voterIds: string[]`)*: Rejected — Firestore arrays have a max document size of 1 MiB; for polls with thousands of voters this would hit limits and cannot be atomically checked + written without a transaction on the full document.
- *GraphQL mutation + Cloud Function*: Rejected for this feature — see Decision 2.

---

## Decision 2: Data Layer — Continue Firestore Bridge or Migrate to GraphQL

**Question**: The existing polls MFE uses Firestore directly via `window.__pollSystem` (not GraphQL). Should the enhancements migrate to GraphQL (per Constitution Principle III) or extend the existing Firestore bridge?

**Decision**: Extend the existing Firestore bridge for this enhancement cycle; document the constitutional deviation.

**Rationale**:
- The entire polls MFE — all five components, the `usePolls` hook, and all Firebase functions — is built on the Firestore bridge pattern. Migrating to GraphQL would require: new schema types + resolvers in `functions/src/schema.ts`, new Apollo queries/mutations in `packages/shared`, codegen, and a full rewrite of `usePolls` and all components. This is a separate feature (a refactor) of equal or greater scope than the enhancements themselves.
- Adding vote records, search, and export does not introduce a new architectural pattern — it extends an already-deviated one. Treating the migration as in-scope here would violate the spec's Simplicity principle (Constitution Principle VI).
- The deviation is already present in the codebase. Extending it consistently is preferable to a partially-migrated MFE where some operations use GraphQL and others use the bridge.
- **Action required**: The GraphQL migration of the polls MFE should be filed as a separate technical-debt task.

**Complexity Tracking Entry**: See plan.md Complexity Tracking table — "Firestore bridge (non-GraphQL) data access".

---

## Decision 3: Vote-Change Atomicity

**Question**: When a user changes their vote, how do we ensure the old option's count decrements and the new option's count increments atomically, without a race condition?

**Decision**: Use a Firestore **transaction** that reads the current poll options array, adjusts both counters in memory, writes the updated options array, and upserts the vote record document — all in one atomic operation.

**Rationale**:
- Firestore transactions are the standard mechanism for read-modify-write operations. They retry automatically on contention, giving correct results under concurrent voting.
- Alternative (two separate `updateDoc` calls) would leave a window where the counts are inconsistent if the second call fails.
- The existing `votePoll` function already uses a non-atomic `getDoc` + `updateDoc` pair (a known gap). The new `changeVote` function will use `runTransaction` as the reference pattern; the new `castVote` function will also be upgraded to use a transaction.

---

## Decision 4: Search and Filter — Client-side vs Server-side

**Question**: Should keyword search filter polls in the browser (client-side) or via a Firestore query (server-side)?

**Decision**: Client-side filtering over the real-time subscription result set.

**Rationale**:
- The `subscribeToPolls` subscription already receives all non-deleted polls in real time. Filtering this in-memory array is O(n) and imperceptible at community scale (dozens to low hundreds of polls).
- Firestore does not natively support full-text search (`where` clauses require exact or prefix matches). Server-side keyword search would require either Algolia/Typesense integration (new dependency) or fetching all polls anyway.
- Status filters (Active, Expired, My Polls) are also computed client-side from `expiresAt` and `createdBy` fields already present in the local poll list.
- Scale assumption: Per the spec's Assumptions section, this feature targets community-group scale (hundreds of polls). Client-side filtering is sufficient.

---

## Decision 5: Export Format

**Question**: What file format should poll results export use?

**Decision**: CSV, downloaded client-side via a data URI (no server round-trip required).

**Rationale**:
- CSV is universally openable (Excel, Google Sheets, Numbers, any text editor). JSON is more developer-friendly but less accessible to non-technical users.
- All data needed for export is already present in the local poll state (question, options, vote counts). No API call is required.
- Client-side `Blob` + `URL.createObjectURL` is the standard browser download pattern — no new dependency needed.
- The export feature is creator-only and low-frequency, so performance is not a concern.

---

## Decision 6: Firestore Security Rules Update

**Question**: What Firestore rules are needed for the new `votes` subcollection?

**Decision**:
```
match /polls/{pollId}/votes/{uid} {
  allow read: if request.auth != null && request.auth.uid == uid;
  allow write: if request.auth != null && request.auth.uid == uid;
}
```

**Rationale**:
- A user should only be able to read and write their own vote record — reading another user's vote could reveal identity on anonymous-feeling polls.
- The poll creator does not need to read individual vote records (they only need aggregate counts, which are on the poll document itself).
- `write` covers both `create` and `update`, enabling both first-time voting and vote changes with a single rule.

---

## Summary: No Unresolved Clarifications

All NEEDS CLARIFICATION items from the spec have been resolved above. The plan can proceed to Phase 1 design.
