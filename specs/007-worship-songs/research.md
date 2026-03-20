# Research: Worship Song Library — Setlist Management

**Branch**: `007-worship-songs` | **Date**: 2026-03-20

---

## Decision 1: GraphQL Schema Extension Strategy

**Decision**: Add setlist types and operations to the existing `functions/src/schema.ts` alongside the existing worship song types. Add a new `functions/src/resolvers/worshipSetlists.ts` file following the `createWorshipSongResolvers()` factory pattern. Register it in `functions/src/resolvers/index.ts`.

**Rationale**: Constitution III (GraphQL-First) is non-negotiable. The existing worship songs resolver (`worshipSongs.ts`) is a clean model: a single `createXxx()` factory returns `{ Query, Mutation }`. Setlist operations follow the same shape with minimal ceremony. No REST, no direct Firestore calls from the MFE.

**Alternatives considered**:
- Storing setlists in localStorage only: Rejected — no cross-device persistence, violates spec US2 "live service" requirement.
- Separate Cloud Function endpoint: Rejected — REST for MFE data violates Constitution III.
- Embedding setlists as a sub-array inside the user's Firestore profile document: Rejected — profile document is managed by the shell and would create cross-concern coupling; also setlists can grow large.

---

## Decision 2: Firestore Collection Layout

**Decision**: Store setlists in a top-level `worshipSetlists` collection with documents keyed by auto-ID. Each document has a `createdBy: uid` field. Entries are stored as a `entries` array (ordered array of `{ songId, position, snapshotTitle, snapshotKey }` objects) within the setlist document.

**Rationale**: Matches the existing `worshipSongs` collection pattern exactly (top-level collection, `createdBy` field for auth scoping, Firestore `orderBy('createdAt')` for list queries). A single document per setlist keeps reads cheap — setlists are small (≤20 songs) so the entries array fits comfortably in one Firestore document (well within the 1MB limit).

**Alternatives considered**:
- Sub-collection `worshipSetlists/{id}/entries/{entryId}`: Unnecessary complexity for ≤20 entries; requires extra reads.
- Storing setlists under `users/{uid}/worshipSetlists/{id}`: Would require custom Firestore security rules scoped to `users/{uid}`. Top-level collection with `createdBy` field works with existing rules pattern.

---

## Decision 3: Setlist Entry Snapshot Fields

**Decision**: Each entry in the `entries` array stores `{ songId, position, snapshotTitle, snapshotKey }`. `snapshotTitle` and `snapshotKey` are captured at the moment the song is added to the setlist.

**Rationale**: Satisfies FR-012 (graceful handling of deleted songs) without a complex join-then-validate flow. If `worshipSong(id)` returns null at present time, the setlist still shows the song name it was built with. The `snapshotKey` is informational — the live transposition in present mode uses the full song data when available.

**Alternatives considered**:
- No snapshot fields — just store `songId`: Rejected — deleted songs would show blank entries.
- Full song content snapshot: Rejected — excessive storage; songs can be large ChordPro files stored in Cloud Storage.

---

## Decision 4: Present Mode Architecture

**Decision**: Present mode is a new `SetlistPresenter` component that wraps the existing `SongViewer` component. It adds a header bar with "Song N of M", prev/next buttons, and an "Exit" button. Transposition state is held in a `Record<string, number>` keyed by `songId` (per-song, per-session — not persisted).

**Rationale**: Reusing `SongViewer` means all existing capabilities (ChordPro rendering, capo calculator, metronome, auto-scroll) work immediately. The spec confirms present mode does NOT need a new full-screen view — just `SongViewer` + navigation header.

**Alternatives considered**:
- Duplicating SongViewer code into SetlistPresenter: Rejected — unnecessary duplication.
- Persisting per-song transposition to localStorage: Rejected — spec FR-008 explicitly requires transposition to NOT persist across sessions.

---

## Decision 5: New Route Structure

**Decision**: Add setlists as a sub-route of `/worship`:
- `/worship` — existing song list (unchanged)
- `/worship/setlists` — setlist list view
- `/worship/setlists/new` — new setlist editor
- `/worship/setlists/:setlistId` — setlist detail/edit view
- `/worship/setlists/:setlistId/present` — present mode

**Rationale**: Setlists live within the worship domain — using sub-routes keeps the navigation coherent and the URL structure legible. The `WorshipSongs.tsx` component already uses URL-driven views (via `useParams` and `useLocation`); the same pattern extends cleanly.

**Alternatives considered**:
- Separate top-level `/setlists` route with its own MFE: Rejected — setlists are intrinsically part of the worship songs feature; a separate MFE adds 20+ integration point overhead for what is essentially a sub-feature.
- Modal-based setlist management: Rejected — present mode needs full-page real estate.

---

## Decision 6: Setlist Export (US3)

**Decision**: Print export calls `window.print()` after rendering a `SetlistPrintView` component (all songs in order, each showing title, artist, key, and ChordPro content). Text export generates a `.txt` file client-side using `Blob` + `URL.createObjectURL()` — exactly the same pattern used by `SongViewer.handleDownloadText`. No new server-side function needed.

**Rationale**: Both export modes are client-side only, consistent with the existing download/print pattern in `SongViewer`. The full song content is already loaded when viewing a setlist in present mode. No new GraphQL operations needed for export.

**Alternatives considered**:
- PDF generation via Cloud Function: Rejected — over-engineering for US3 (P3 priority); browser print-to-PDF covers the use case.
- Sending export via email: Out of scope per spec.

---

## Decision 7: No `pnpm codegen` Schema Change Impact

**Decision**: After extending `functions/src/schema.ts` with setlist types, run `pnpm codegen` to regenerate `packages/shared/src/apollo/generated.ts`. Add new query/mutation constants to `packages/shared/src/apollo/queries.ts`. The MFE imports these via `@mycircle/shared` (Constitution I).

**Rationale**: All schema changes require codegen per CLAUDE.md. The new setlist operations follow the exact same queries.ts + generated.ts pattern as existing worship operations.

---

## Conclusion

All technical unknowns are resolved. Implementation requires:
1. **Schema**: ~50 lines in `functions/src/schema.ts` (new types + queries + mutations)
2. **Resolver**: New `functions/src/resolvers/worshipSetlists.ts` (~120 lines, same pattern as `worshipSongs.ts`)
3. **Shared queries**: ~80 lines in `packages/shared/src/apollo/queries.ts` + codegen
4. **MFE components**: 4 new files in `packages/worship-songs/src/` (SetlistList, SetlistEditor, SetlistPresenter, SetlistPrintView)
5. **Hook**: New `useWorshipSetlists.ts` hook (~100 lines, same pattern as `useWorshipSongs.ts`)
6. **i18n**: ~15 new keys per locale (en/es/zh)
7. **Route wiring**: Extend `WorshipSongs.tsx` with setlist sub-views
