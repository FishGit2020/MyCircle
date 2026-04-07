# Feature Specification: Synology NAS Integration for Digital Library Audio Offload

**Feature Branch**: `025-nas-audio-offload`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Synology NAS Integration for Digital Library Audio Offload"

## Overview

Users of the Digital Library accumulate large volumes of TTS-converted audiobook files in cloud storage. Over time, storage costs and capacity limits become a concern. This feature allows users to configure a personal Synology NAS as a cold storage archive — offloading converted audio chapters to free up cloud space, and restoring them on demand when playback is needed. The cloud storage service remains the only playback source; the NAS is never accessed directly by the app.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure NAS Connection (Priority: P1)

As a user with a Synology NAS, I want to connect my NAS to MyCircle from the Setup page so that the app can use it as an audio archive target.

**Why this priority**: Without a configured connection, no archiving or restoring is possible. This is the foundational step for all other NAS functionality.

**Independent Test**: Navigate to Setup > NAS tab, enter credentials, and confirm a "connected" status is shown — delivers value by itself as it verifies the integration works before any audio is moved.

**Acceptance Scenarios**:

1. **Given** I am on the Setup page, **When** I navigate to the NAS tab, **Then** I see a form with fields for NAS address, username, password, and destination folder (defaulting to `/MyCircle`).
2. **Given** I have filled in valid NAS credentials, **When** I click "Save & Test", **Then** the system tests the connection, saves the configuration, and shows a green "connected" status with the last tested timestamp.
3. **Given** I have a saved NAS connection, **When** I click "Retest", **Then** the system re-tests the connection and updates the status indicator accordingly.
4. **Given** I have a saved NAS connection, **When** I click "Remove", **Then** the configuration is deleted and the form resets to empty state.
5. **Given** I enter an incorrect NAS address or password, **When** I click "Save & Test", **Then** the system shows a red "error" status with a descriptive error message.

---

### User Story 2 - Offload Audio Chapter to NAS (Priority: P2)

As a user with a configured NAS, I want to offload a converted audio chapter from cloud storage to my NAS to free up space, while keeping a record that the audio still exists.

**Why this priority**: This is the primary value of the feature — reclaiming cloud storage space without losing the investment in TTS conversion.

**Independent Test**: With a NAS connected and a book with converted audio, click "Offload to NAS" on a chapter — confirms the audio is removed from cloud storage and a "NAS archived" indicator appears on the chapter.

**Acceptance Scenarios**:

1. **Given** a chapter has been converted to audio and a NAS is connected, **When** I click "Offload to NAS" on that chapter, **Then** the audio is transferred to the NAS and removed from cloud storage, and the chapter shows a "NAS" archive indicator instead of the play button.
2. **Given** the offload is in progress, **When** I view the chapter list, **Then** I see a loading indicator on that chapter.
3. **Given** a chapter has been offloaded, **When** I view the book, **Then** the chapter's audio status shows it is archived on NAS (not available for direct playback).
4. **Given** an offload fails mid-transfer, **When** the error occurs, **Then** the chapter's state is unchanged (audio still accessible in cloud storage) and an error message is displayed.

---

### User Story 3 - Batch Offload All Audio for a Book (Priority: P2)

As a user, I want to offload all audio chapters for an entire book in one action to save time when archiving a completed book.

**Why this priority**: Books typically have many chapters; individual offloading would be tedious. Batch action multiplies the value of Story 2.

**Independent Test**: With a NAS connected and a fully-converted book, click "Offload All to NAS" — confirms all chapters are archived in sequence without manual repetition.

**Acceptance Scenarios**:

1. **Given** a book has multiple audio chapters and a NAS is connected, **When** I click "Offload All to NAS", **Then** all chapters with audio are transferred sequentially to NAS and removed from cloud storage.
2. **Given** a batch offload is running, **When** one chapter fails, **Then** the remaining chapters continue processing, and a summary of successes and failures is shown at the end.
3. **Given** no NAS is configured, **When** I view the book's chapter list, **Then** the "Offload All to NAS" button is not shown.

---

### User Story 4 - Restore Audio Chapter from NAS (Priority: P3)

As a user, I want to restore a NAS-archived audio chapter back to cloud storage so I can play it again without re-running the TTS conversion process.

**Why this priority**: Restoration is the recovery path — important for usability, but less frequent than archiving. Requires Stories 1 and 2 to be meaningful.

**Independent Test**: With a NAS-archived chapter, click "Restore from NAS" — confirms the audio becomes playable again from cloud storage without triggering a new TTS conversion.

**Acceptance Scenarios**:

1. **Given** a chapter is archived on NAS (not in cloud storage), **When** I click "Restore from NAS", **Then** the audio is copied back to cloud storage and the chapter shows the play button again.
2. **Given** a restore is in progress, **When** I view the chapter, **Then** I see a loading indicator.
3. **Given** a restore completes successfully, **When** I view the chapter, **Then** the NAS archive indicator remains visible alongside the play button (indicating audio exists in both locations).
4. **Given** the NAS is unreachable during a restore, **When** the error occurs, **Then** the chapter's state is unchanged and an error message is shown.

---

### Edge Cases

- What happens when the NAS becomes unreachable after a partial batch offload? The completed chapters remain archived; incomplete chapters retain their cloud audio; a partial results summary is shown.
- What happens when the destination folder on the NAS does not exist? The system creates the folder automatically before uploading.
- What happens when a chapter has no converted audio and "Offload to NAS" is attempted? The button is not shown for chapters without audio.
- What happens when the NAS is disconnected (credentials removed) while some chapters are NAS-archived? The archived chapters remain in that state and show a "NAS archived (no connection)" indicator; restore is unavailable until a connection is re-established.
- What happens when a user tries to play a NAS-archived chapter? A prompt explains the audio is archived and offers a "Restore from NAS" action.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to add a NAS connection from the Setup page by providing a NAS address, username, password, and destination folder.
- **FR-002**: The system MUST test the NAS connection upon saving and display a clear success or error status.
- **FR-003**: Users MUST be able to re-test or remove a saved NAS connection at any time.
- **FR-004**: The system MUST never expose stored NAS credentials via the user interface or any data response — only a boolean "credentials saved" indicator is permissible.
- **FR-005**: Users MUST be able to offload a single audio chapter to the NAS, removing it from cloud storage upon success.
- **FR-006**: Users MUST be able to offload all audio chapters for a book in a single batch action.
- **FR-007**: The system MUST track per-chapter archive status (whether archived on NAS, and the path on NAS) independently of whether audio is currently in cloud storage.
- **FR-008**: The chapter list MUST visually distinguish between: audio available for playback, audio archived on NAS only, and audio not yet converted.
- **FR-009**: Users MUST be able to restore a NAS-archived chapter back to cloud storage without re-running TTS conversion.
- **FR-010**: After restoration, the chapter MUST be immediately playable from cloud storage.
- **FR-011**: Offload and restore operations MUST handle failures gracefully — leaving the chapter in its pre-operation state if the transfer fails.
- **FR-012**: Batch offload MUST process chapters sequentially and return a partial results summary if some chapters fail.
- **FR-013**: NAS-related actions (offload, restore, batch offload) MUST only be visible when a NAS connection is configured.
- **FR-014**: NAS credentials MUST be stored per user account and not shared between users.

### Key Entities

- **NAS Connection Config**: Represents a user's configured NAS — includes address, username, destination folder, connection status, and last tested timestamp. Credentials are stored but never returned to the client.
- **Chapter Archive Record**: Tracks whether a specific book chapter's audio has been offloaded to NAS, and if so, its path on the NAS. Independent of current cloud storage state.
- **Archive Operation Result**: The outcome of a single chapter offload or restore — includes success/failure and any error message.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can configure and successfully test a NAS connection in under 2 minutes.
- **SC-002**: A single chapter offload completes in under 60 seconds for typical audiobook chapter sizes.
- **SC-003**: A single chapter restore completes in under 60 seconds for typical chapter sizes.
- **SC-004**: Batch offload for a 20-chapter book completes without timing out.
- **SC-005**: 100% of offload operations either complete successfully or leave the chapter in its original state — no data loss.
- **SC-006**: Users can verify NAS archive status for every chapter without navigating away from the book view.
- **SC-007**: NAS credentials are never visible in any user-facing interface or data response.

## Assumptions

- The user's Synology NAS is accessible from the internet (externally reachable via a public URL or DDNS).
- The NAS model supports FileStation with its standard web API.
- Per-chapter audio files are under 50MB on average (typical TTS output for a single chapter).
- NAS credentials are stored with the same security guarantees as existing per-user connection credentials in the project.
- A user may only have one NAS connection configured at a time.
- Book-level audio status is unchanged when chapters are offloaded — the audio still exists, just in cold storage.
- After a successful restore, the NAS archive record is preserved (audio exists in both locations) — the user may offload again at any time.

## Out of Scope

- Streaming audio directly from NAS (NAS is cold storage only; cloud storage is always the playback source).
- Automatic or scheduled offload based on time since last played.
- NAS as a backup for books that have never been converted to audio.
- Support for NAS devices from brands other than Synology.
- Multiple NAS connections per user.
- Folder browsing UI for selecting the destination folder on the NAS.
