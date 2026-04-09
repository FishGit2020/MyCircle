# Research: Anniversary Tracker MFE

**Branch**: `027-anniversary-mfe` | **Date**: 2026-04-09

## R1: Data Storage — Top-Level vs User-Scoped Collection

**Decision**: Use a top-level `anniversaries/{anniversaryId}` collection with `ownerUid` and `contributorUids` array fields.

**Rationale**: The contributor model requires both owner and contributors to have equal read/write access to anniversary data and its yearly subcollection. Nesting under `users/{ownerUid}/anniversaries/` would require contributors to access another user's subcollection, which is awkward in Firestore rules and breaks the per-user isolation pattern. A top-level collection with ownership fields in Firestore rules is the established pattern for shared data (matches `publicHikingRoutes`, `sharedFiles`).

**Alternatives considered**:
- `users/{uid}/anniversaries/` with cross-user rules: Rejected — complicates rules, requires knowing the owner's uid to construct the path.
- Duplicate data to each contributor's subcollection: Rejected — violates DRY, creates sync issues, wastes storage.

## R2: Yearly Entries — Subcollection vs Array

**Decision**: Use a subcollection `anniversaries/{anniversaryId}/years/{yearNumber}` for yearly entries.

**Rationale**: Each yearly entry can contain multiple pictures (up to 10), notes, activity, and location. Storing these as an array inside the anniversary document would hit Firestore's 1MB document size limit with images metadata. Subcollections scale naturally, support individual year queries, and match the existing pattern (`users/{uid}/hsaExpenses/{id}/receipts/{id}`, `babyMilestones/{id}/photos/{id}`).

**Alternatives considered**:
- Array of yearly objects in anniversary document: Rejected — document size limit with picture metadata, inefficient reads when only one year needed.

## R3: Contributor User Search

**Decision**: Email-based search as primary method using Firebase Admin `getUserByEmail()`, with display name typeahead as enhancement.

**Rationale**: The codebase already uses `getUserByEmail()` for sharing (cloud-files). This is reliable and exact. For name-based search, Firebase Admin's `listUsers()` can be used with server-side filtering, but it's less efficient. The MVP uses email; name search can be added via a GraphQL query that wraps `listUsers()` with a `displayName` prefix filter.

**Alternatives considered**:
- Maintain a searchable `userProfiles` collection: Would require syncing on every profile update; overengineered for this use case.
- Client-side Firestore query on a users collection: Firestore doesn't support `LIKE` queries; prefix-only with `>=`/`<=` is fragile for names.

## R4: Image Upload Flow

**Decision**: Follow the baby-tracker pattern — client compresses images, sends base64 to a GraphQL mutation, backend uploads to Firebase Storage, returns download URL.

**Rationale**: This is the established pattern. The `uploadToStorage()` shared helper in `functions/src/handlers/shared.ts` handles token generation and bucket upload. Storage path: `anniversaries/{anniversaryId}/years/{yearNumber}/{filename}`.

**Alternatives considered**:
- Direct client-to-Storage upload with signed URLs: Requires additional security setup (Storage rules), not the project pattern.
- REST endpoint for uploads: Violates GraphQL-first constitution principle.

## R5: Map Integration

**Decision**: Use the existing `useMapLibre` hook from `@mycircle/shared` with GeoJSON pin markers following the travel-map pattern.

**Rationale**: The shared map hook handles initialization, resize, and cleanup. The travel-map MFE demonstrates pin markers via GeoJSON sources + circle/symbol layers with click handlers. This is proven and maintained.

**Alternatives considered**:
- HTML marker overlays: Less performant for many pins, harder to style consistently.
- New map library: Violates simplicity principle; MapLibre GL is already integrated.

## R6: Widget Countdown Logic

**Decision**: Pure client-side date math — no server calls needed. Calculate days until next occurrence of anniversary date this year (or next year if already passed). Years elapsed = current year minus original year.

**Rationale**: This is trivial date arithmetic with no external dependencies. The widget already receives anniversary data via GraphQL query; countdown is computed at render time.

**Alternatives considered**:
- Server-computed countdown: Unnecessary complexity for simple date math.

## R7: Dev Server Port

**Decision**: Use port `3034` for the anniversary MFE dev server.

**Rationale**: Ports 3001-3033 are already allocated to existing MFEs. Port 3034 is the next available sequential port.

## R8: Firestore Rules Pattern

**Decision**: Rules allow read/write when `request.auth.uid == resource.data.ownerUid` OR `request.auth.uid in resource.data.contributorUids`. Delete restricted to owner only.

**Rationale**: This mirrors the `sharedFiles` pattern with `sharedBy.uid` checks, extended to support an array of contributor UIDs. The subcollection (`years/`) inherits access from the parent anniversary document's ownership/contributor check via a custom function.
