# Feature Specification: Worship Song Library — Setlist Management

**Feature Branch**: `007-worship-songs`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "build worship song library with chord charts, transposition, and setlist management, check exited MFE and new features if needed"

## Existing Capabilities (Audit)

The `worship-songs` MFE already fully implements:
- Song library with create, edit, delete, search, filter, and pagination
- ChordPro chord chart rendering with inline chord display
- Transposition: semitone +/- controls, target key picker, capo calculator
- Auto-scroll (adjustable speed), metronome (BPM), print, copy, and download

**Gap identified**: Setlist management is entirely absent — no data model, no UI, no operations. This spec covers adding setlist management as the new feature.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create and Manage Setlists (Priority: P1)

A worship leader builds a setlist for an upcoming service by selecting songs from the library, giving the setlist a name and date, and arranging the songs in the planned order. They can revisit and update the setlist before the service.

**Why this priority**: The core use case. Without setlists, the song library lacks the planning tool that worship teams need to prepare services. All other setlist features depend on having a setlist to work with.

**Independent Test**: Create a new setlist named "Sunday Morning" → add three songs → reorder them → remove one → save. Verify the setlist persists and shows the correct two songs in the new order after reopening.

**Acceptance Scenarios**:

1. **Given** a worship leader is signed in, **When** they tap "New Setlist" and enter a name and optional date, **Then** a new empty setlist is created and appears in their setlists list.
2. **Given** a setlist is open in edit mode, **When** the user searches for a song and taps "Add to setlist," **Then** the song is appended to the setlist's song order.
3. **Given** a setlist has multiple songs, **When** the user taps "Move up" or "Move down" on a song entry, **Then** the song's position in the order changes immediately.
4. **Given** a setlist has multiple songs, **When** the user taps the remove icon on a song entry, **Then** that song is removed from the setlist (the song itself remains in the library).
5. **Given** a setlist exists, **When** the user taps "Delete setlist" and confirms, **Then** the setlist is permanently removed; songs in the library are unaffected.

---

### User Story 2 — Present a Setlist During a Live Service (Priority: P2)

During a worship service, a musician opens a setlist and navigates song-by-song. Each song displays its full chord chart with the same transposition controls available in the standard song viewer. Clear "previous" and "next" controls make it easy to move between songs without leaving the setlist context.

**Why this priority**: Presenting a setlist live is the payoff of the planning workflow. It transforms the setlist from a planning document into an active performance tool.

**Independent Test**: Open an existing setlist in "present" mode → navigate to song 2 → transpose it up 2 semitones → tap "Next song" → confirm song 3 appears with default transposition (each song's transposition is independent per session).

**Acceptance Scenarios**:

1. **Given** a setlist is open, **When** the user taps "Start service," **Then** the first song's chord chart is displayed with a visible song position indicator (e.g., "Song 1 of 5").
2. **Given** the user is viewing song 2 of 5 in present mode, **When** they tap "Next," **Then** song 3 loads with its default key (transposition resets per song).
3. **Given** the user is on song 1 in present mode, **When** they transpose it up 2 semitones, **Then** only song 1 is transposed; other songs in the setlist are unaffected.
4. **Given** the user is on the last song in present mode, **When** they tap "Next," **Then** an "End of setlist" indicator is shown and no navigation error occurs.
5. **Given** the user is in present mode, **When** they tap "Exit," **Then** they return to the setlist detail view.

---

### User Story 3 — Export a Setlist (Priority: P3)

A worship leader exports a setlist so they can share the running order with team members who may not have app access — for example, as a printed song sheet or a plain-text summary for a team email.

**Why this priority**: Export is a convenience enhancement. The core planning and presenting value is already delivered by US1 and US2. Export is valuable but can be deferred without blocking the main use case.

**Independent Test**: Open a setlist with 3 songs → tap "Export" → choose "Print" → verify a printable view renders all 3 songs in order, each with title, key, and chord chart. Also verify "Export as text" produces a numbered list of song titles and keys.

**Acceptance Scenarios**:

1. **Given** a setlist has songs, **When** the user taps "Export → Print," **Then** a print-ready view renders all songs in setlist order, each with title, artist, key, and full chord content.
2. **Given** a setlist has songs, **When** the user taps "Export → Text summary," **Then** a downloadable plain-text file is produced with each song listed as a numbered entry showing title, key, and BPM (where available).
3. **Given** a setlist is exported as text, **When** opened in any text editor, **Then** the file is human-readable without any special app or format.

---

### Edge Cases

- What happens when a song referenced by a setlist is deleted from the library? The setlist must display a "Song not found" placeholder for that entry rather than crashing or silently dropping the entry.
- What happens when a setlist has no songs and the user taps "Start service"? The action is disabled with a clear message ("Add songs to begin a service").
- What happens when the user is not signed in? Setlists require authentication — unauthenticated users see a prompt to sign in rather than empty or broken setlist UI.
- What happens when a setlist name is left blank on save? The system requires a non-empty name and shows an inline validation message.
- What happens when the same song is added to a setlist twice? Duplicates are allowed — a song can legitimately appear twice (e.g., as the opening and closing song).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Signed-in users MUST be able to create a named setlist with an optional date or service label.
- **FR-002**: Users MUST be able to add any song from the existing library to a setlist.
- **FR-003**: Users MUST be able to reorder songs within a setlist (move a song up or down one position).
- **FR-004**: Users MUST be able to remove a song from a setlist without deleting it from the library.
- **FR-005**: Users MUST be able to delete an entire setlist; the songs referenced by the setlist MUST remain in the library.
- **FR-006**: The setlists list MUST be accessible from the main Worship Songs navigation (tab or section alongside the song library).
- **FR-007**: In present mode, users MUST be able to navigate forward and backward through the songs in a setlist one at a time.
- **FR-008**: In present mode, transposition changes MUST be per-song and per-session — adjusting one song's key MUST NOT affect other songs, and transposition settings MUST NOT persist after the session ends.
- **FR-009**: The current song position MUST be clearly shown during presentation (e.g., "Song 2 of 5").
- **FR-010**: Users MUST be able to export a setlist as a printable multi-song sheet showing all songs in order with their full content.
- **FR-011**: Users MUST be able to export a setlist as a plain-text summary file (song titles, keys, BPM per song).
- **FR-012**: A setlist entry that references a deleted song MUST display a graceful "Song not found" placeholder rather than a runtime error.

### Key Entities

- **Setlist**: A named, ordered collection of song references belonging to a signed-in user. Attributes: unique ID, name, optional service date/label, ordered list of setlist entries, createdAt, updatedAt, createdBy (user ID).
- **SetlistEntry**: A reference from a setlist to a specific song, with its position in the running order. Attributes: songId, position (integer), snapshotTitle and snapshotKey (captured when added, so the setlist remains readable even if the song is later edited or deleted).
- **WorshipSong** (existing, unchanged): Setlists reference songs by ID only — no changes to the song data model are required.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a new setlist, add 5 songs, and reorder them in under 2 minutes.
- **SC-002**: Navigating between songs in a live service session takes under 1 second per transition on a typical mobile connection.
- **SC-003**: A setlist with up to 20 songs exports as a print-ready view within 3 seconds.
- **SC-004**: Deleting a referenced song causes zero crashes or data errors in any setlist that referenced it — the placeholder is shown 100% of the time.
- **SC-005**: Worship teams can plan and run a complete Sunday service entirely within the Worship Songs feature without needing any external tool.

---

## Assumptions

- Setlists are per-user (scoped to the authenticated user's account). Shared or team setlists are out of scope for this feature.
- The maximum practical setlist size is ~20 songs; no special pagination is required for setlist song entries within the editor or presenter.
- Present mode reuses the existing `SongViewer` component extended with prev/next navigation and a position indicator — a separate full-screen "stage view" is not required.
- Setlist data will follow the same Firestore storage pattern used by existing worship songs (via GraphQL schema extension — consistent with the project's GraphQL-first rule).
- Drag-to-reorder is desirable but not required; move-up/move-down buttons are sufficient for the MVP.
- ChordPro bulk import and shared/collaborative setlists are out of scope.
