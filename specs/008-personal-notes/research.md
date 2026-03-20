# Research: Personal Notes

**Branch**: `008-personal-notes` | **Date**: 2026-03-20

---

## Decision 1: Existing Notebook MFE — Enhance, Don't Duplicate

**Decision**: Extend the existing `packages/notebook` MFE and `functions/src/resolvers/notes.ts` rather than creating a new MFE package.

**Rationale**: A `notebook` MFE at `/notebook` (port 3010) already satisfies virtually every functional requirement in the spec:
- FR-001/003/004/005: Create, open, edit, delete notes ✅
- FR-006: User-scoped private notes (via `users/{uid}/notes` in Firestore) ✅
- FR-007/008: Client-side search filter returning results in < 1 second ✅
- FR-009: Real-time sync via `api.subscribe` ✅
- FR-010/011: Auth guard and empty state ✅

Creating a new `personal-notes` package would violate Constitution Principle VI (Simplicity) by duplicating functionality.

**Alternatives considered**:
- New `personal-notes` MFE: Rejected — duplicates existing notebook; adds a 28th MFE package for no new user value
- Replace notebook entirely: Rejected — notebook has additional public-notes feature used independently

**Impact**: The `008-personal-notes` branch targets enhancements to `packages/notebook`, not a new package.

---

## Decision 2: Migrate Note Writes from `window.__notebook` to GraphQL Mutations

**Decision**: Add `addNote`, `updateNote`, `deleteNote` mutations to the GraphQL schema and resolver, then update `useNotes.ts` to call them via `useMutation` from `@mycircle/shared`.

**Rationale**: The existing `notes.ts` resolver only defines the `notes` query. Write operations go through `window.__notebook` (a window global injected by the shell), which violates Constitution Principle III (GraphQL-First Data Layer). The spec assumes a fresh, constitution-compliant implementation.

**Current state**: `createNotesResolvers()` exposes only `{ Query: { notes } }` — no mutations. The hook `useNotes.ts` reads from the notes query but writes via `window.__notebook.add/update/delete()`.

**Alternatives considered**:
- Keep `window.__notebook` writes: Rejected — violates Constitution III and makes the data path inconsistent
- Add a REST endpoint: Rejected — explicitly forbidden by Constitution III for MFE data

---

## Decision 3: Search Strategy — Client-Side Filter (Keep Existing)

**Decision**: Retain the existing client-side keyword search (applied after fetching the latest 100 notes via the `notes` GraphQL query).

**Rationale**: The existing resolver already loads up to 100 notes ordered by `updatedAt` desc and applies a client-side `.filter()`. This meets SC-002 (results < 1 second for ≤ 500 notes) for typical personal note volumes. Full-text server search (e.g., Algolia, Typesense) would add external dependencies violating Principle VI.

**Limitation**: Search only covers the 100 most recently updated notes. Acceptable for personal use given the assumption that 500 notes is the target scale; fetching all notes is an option if needed.

**Alternatives considered**:
- Firestore full-text search via third-party: Rejected — external dependency, cost, complexity
- Increase limit to 500 in the resolver: Acceptable enhancement; plan as a minor resolver change

---

## Decision 4: Real-Time Sync — Apollo Cache + Firestore Subscribe Pattern

**Decision**: Keep the existing `api.subscribe` mechanism in `useNotes.ts` (which calls `window.__notebook.subscribe` if available), but also implement an Apollo cache-update pattern when mutations complete. The `notes` query uses `fetchPolicy: 'cache-and-network'` to stay fresh.

**Rationale**: The `api.subscribe` already provides real-time update delivery (≤ 10 seconds per SC-003). After migrating writes to GraphQL mutations, `refetchQueries: [GET_NOTES]` on each mutation keeps the Apollo cache current instantly after local writes. Cross-device sync continues via the existing Firestore `onSnapshot` subscription wired through `window.__notebook.subscribe`.

**Alternatives considered**:
- Full Apollo subscriptions (WebSocket): Overkill for personal notes; Firestore onSnapshot already provides real-time push
- Polling only: Rejected — polling every few seconds wastes bandwidth; onSnapshot is more efficient

---

## Decision 5: Note Limit per Query — Increase to 500

**Decision**: Change the resolver `notes` query default and max `limit` from `100` to `500` to satisfy SC-005 (works for up to 500 notes).

**Rationale**: Personal note libraries can grow beyond 100. Fetching all notes on load (up to 500) allows the client-side search to cover the full library. 500 small text documents is within Firestore and bandwidth limits for personal use.

**Alternatives considered**:
- Keep 100, add pagination: More complex UI; unnecessary for personal notes at this scale
- Infinite scroll / cursor-based pagination: Over-engineering for personal productivity tool

---

## Integration Points Already Satisfied (No Changes Needed)

The existing `notebook` package already handles all shell integration:
- Shell routes: `/notebook`, `/notebook/new`, `/notebook/:noteId` — registered in `App.tsx`
- Nav item: in `nav.group.workspace` — registered in `navConfig.ts`
- Command palette, breadcrumbs, BottomNav, Dockerfile, dev scripts — all present
- i18n keys: `notebook.*` namespace in all 3 locales
- Vitest aliases, e2e tests — present in `packages/shell/test/mocks/`

The only integration change needed is adding new i18n keys if any new UI strings are introduced.
