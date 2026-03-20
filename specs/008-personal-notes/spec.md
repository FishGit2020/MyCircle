# Feature Specification: Personal Notes

**Feature Branch**: `008-personal-notes`
**Created**: 2026-03-20
**Status**: Draft
**Input**: User description: "Personal notes with search, synced per user account"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create and Manage Notes (Priority: P1)

A signed-in user can create a new note, type free-form text content, give it a title, save it, and later edit or delete it. All notes are private to that user and are immediately visible on the notes list after creation. This is the core value: a place to capture and keep personal thoughts.

**Why this priority**: No other feature delivers value without the ability to create and read notes. This is the foundation all other stories build on.

**Independent Test**: Sign in → create a note titled "Meeting recap" with body text → navigate away → return to Notes → verify the note appears in the list → open it → edit the body → save → verify changes persist → delete the note → verify it is gone.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Notes page, **When** they click "New Note", **Then** an empty editor opens where they can type a title and body.
2. **Given** the user has typed content, **When** they save the note, **Then** it appears at the top of their notes list and the content is preserved on reload.
3. **Given** an existing note is open, **When** the user edits the body and saves, **Then** the updated content replaces the old content.
4. **Given** an existing note, **When** the user deletes it after confirmation, **Then** it is removed from the list and no longer accessible.
5. **Given** a user is not signed in, **When** they visit Notes, **Then** they see a prompt to sign in rather than any note data.

---

### User Story 2 — Search Notes (Priority: P2)

A signed-in user can type keywords into a search box and see only notes whose title or body contains those keywords. Results update as the user types. Clearing the search box returns the full list.

**Why this priority**: Search is the key reason notes remain useful as the collection grows. Without it, users must scroll through an unordered list to find anything, making the feature impractical beyond a handful of notes.

**Independent Test**: Create 5 notes with distinct keywords → type one keyword in the search box → verify only matching notes appear → clear the search → verify all 5 notes are listed again.

**Acceptance Scenarios**:

1. **Given** a list of notes, **When** the user types a keyword in the search box, **Then** only notes containing that keyword in the title or body are shown.
2. **Given** a search query is active, **When** the user clears the search box, **Then** all notes are shown again.
3. **Given** a search with no matching notes, **When** the query is entered, **Then** an empty-state message is shown (not an error).
4. **Given** a search query, **When** the user creates a new note matching the query, **Then** the new note appears in the filtered results.

---

### User Story 3 — Sync Across Devices (Priority: P3)

A signed-in user who creates or edits a note on one device sees the updated note automatically when they open the app on another device, without needing to manually refresh.

**Why this priority**: Cross-device sync fulfills the "synced per user account" requirement and makes notes genuinely portable. However, the feature is already useful on a single device, so this is an enhancement rather than a blocker.

**Independent Test**: Create a note on Device A → open Notes on Device B with the same account → verify the note appears within a few seconds without a manual refresh → edit the note on Device B → verify the change is visible on Device A within a few seconds.

**Acceptance Scenarios**:

1. **Given** a user signed in on two devices, **When** they create a note on Device A, **Then** the note appears on Device B within 10 seconds without a manual page refresh.
2. **Given** a note that exists on both devices, **When** the user edits it on Device A, **Then** the updated content is visible on Device B within 10 seconds.
3. **Given** a note is deleted on Device A, **When** Device B is open, **Then** the note is removed from Device B's list within 10 seconds.

---

### Edge Cases

- What happens when a user tries to save a note with an empty title and empty body? (Assume: saving is blocked; a validation message is shown.)
- What happens if the user loses connectivity while editing a note? (Assume: the note is saved locally and synced when connectivity returns; a brief offline indicator is shown.)
- What happens when the search query contains special characters? (Assume: special characters are treated as literal text, no regex injection.)
- What happens if a note becomes very long (thousands of words)? (Assume: display handles long content gracefully with scrolling; no hard character limit below 50,000 characters.)
- What happens when two devices edit the same note simultaneously? (Assume: last-write-wins; no conflict resolution UI needed in V1.)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow signed-in users to create new notes with a title (optional) and body text.
- **FR-002**: System MUST display all of a user's notes in a list, ordered by most recently updated first.
- **FR-003**: Users MUST be able to open a note from the list to read or edit it.
- **FR-004**: System MUST save changes to a note when the user explicitly saves (button or keyboard shortcut).
- **FR-005**: Users MUST be able to delete a note with a confirmation step to prevent accidental deletion.
- **FR-006**: System MUST restrict each user to viewing and editing only their own notes; notes from other accounts must never be accessible.
- **FR-007**: System MUST provide a search input that filters the visible notes list by keyword match against title and body content.
- **FR-008**: Search results MUST update within 1 second of the user stopping typing (debounced client-side filter or fast server search).
- **FR-009**: System MUST sync a user's notes in real time across all signed-in sessions so that changes appear on other devices within 10 seconds without a manual refresh.
- **FR-010**: System MUST show a sign-in prompt to unauthenticated users instead of any note data.
- **FR-011**: System MUST show an empty state with a call to action when the user has no notes yet.

### Key Entities

- **Note**: A personal text document owned by a single user. Key attributes: unique ID, title (optional free-form text), body (free-form text, supports plain text), owner user ID, created timestamp, last-updated timestamp.
- **User**: An authenticated account. Notes are scoped to a user; the user is identified by their account credentials. No extra attributes needed beyond what the existing auth system provides.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create and save a new note in under 30 seconds from first opening the Notes page.
- **SC-002**: Search results appear within 1 second of the user finishing their query for a library of up to 500 notes.
- **SC-003**: Notes created or edited on one device appear on a second signed-in device within 10 seconds with no manual action.
- **SC-004**: 100% of note reads and writes are scoped to the authenticated user — no cross-user data leakage under any tested condition.
- **SC-005**: The notes list and search work correctly for a single user with up to 500 notes without noticeable slowdown.

## Assumptions

- Authentication is handled by the existing MyCircle sign-in system; this feature does not add a new auth mechanism.
- Notes are plain text only (no rich formatting, attachments, or images) in this initial version.
- Notes are sorted by most-recently-updated descending; no manual reordering or pinning is required in V1.
- Last-write-wins is acceptable for simultaneous edits from two devices; no merge/conflict UI is required.
- There is no sharing or collaboration — notes are strictly private to the owning user.
- No note categories, folders, or tags are required in V1.
- The feature is a new MFE (micro-frontend) integrated into the MyCircle shell, following the same integration checklist as existing features.

## Out of Scope

- Rich text formatting (bold, italic, bullet lists, images, attachments)
- Note sharing or collaboration with other users
- Note categories, tags, or folders
- Offline-first storage with full offline editing (basic offline indicator is acceptable)
- Version history or undo beyond the current session
- Export or import of notes (e.g., to/from Markdown or PDF)
