# Feature Specification: Audiobook Batch Download

**Feature Branch**: `024-audiobook-batch-download`
**Created**: 2026-04-02
**Status**: Draft
**Input**: User description: "Audiobook Download — Google Takeout Style"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download All Chapters Immediately (Priority: P1)

A user has finished reading a book and wants to save all converted audio chapters to their device for offline listening. They trigger a sequential download directly from the book's Listen tab — the app downloads each chapter one at a time, showing progress as it goes. They can cancel mid-way if needed.

**Why this priority**: This is the fastest path to getting audio files off the platform. It requires no server work, delivers immediate value, and works even for users who cannot wait for a ZIP to be prepared.

**Independent Test**: Can be fully tested by opening a book with converted chapters, clicking "Download All Chapters," and verifying each MP3 is saved to the device with progress updating correctly.

**Acceptance Scenarios**:

1. **Given** a book has at least one converted audio chapter, **When** the user clicks "Download All Chapters," **Then** the app downloads each chapter sequentially, showing "Downloading X/Y..." progress, and saves each file named `{Book Title} - Ch{N} {Chapter Title}.mp3`
2. **Given** a sequential download is in progress, **When** the user clicks "Cancel," **Then** the download stops immediately and no further chapters are downloaded
3. **Given** a book has no converted chapters, **When** the user views the download panel, **Then** the "Download All Chapters" button is disabled with an explanatory message
4. **Given** a chapter download fails mid-sequence, **When** the error occurs, **Then** the user sees an error message identifying the failed chapter and can retry

---

### User Story 2 - Request a ZIP for Later Download (Priority: P2)

A user wants a single ZIP file containing the entire audiobook but does not want to wait for it to be assembled. They click "Generate Audiobook ZIP," leave the app, and come back later to download the ready ZIP file with one click.

**Why this priority**: The ZIP workflow handles the largest books without tying up the user's browser or device. It is the right solution for large libraries and repeated downloads. Depends on the download panel UI established in P1.

**Independent Test**: Can be fully tested by requesting a ZIP for a book, waiting for completion, and verifying the download link appears with correct file size and generation timestamp.

**Acceptance Scenarios**:

1. **Given** a book has at least one converted chapter and no ZIP is currently being generated, **When** the user clicks "Generate Audiobook ZIP," **Then** the status changes to "Generating ZIP..." with a spinner and the system begins background preparation
2. **Given** a ZIP is being generated, **When** the user returns to the download panel, **Then** the UI shows the current "processing" state and auto-refreshes every 10 seconds without a page reload
3. **Given** ZIP generation completes successfully, **When** the user views the download panel, **Then** a "ZIP ready" card appears showing file size and the date the ZIP was generated, plus a "Download ZIP" button
4. **Given** a ready ZIP exists, **When** the user clicks "Download ZIP," **Then** the complete ZIP file downloads to their device
5. **Given** ZIP generation fails, **When** the user views the panel, **Then** an error message is shown with a "Retry" button to request a new ZIP

---

### User Story 3 - Regenerate ZIP After Audio Reconversion (Priority: P3)

A user has previously generated a ZIP but has since re-converted the book's audio (e.g., with a different voice or quality setting). They want to generate a fresh ZIP that reflects the latest audio files. The existing ZIP remains downloadable until they explicitly replace it.

**Why this priority**: Adds value for power users who iterate on audio quality, but is a secondary flow on top of the core ZIP generate/download experience.

**Independent Test**: Can be fully tested by verifying that when "ZIP ready" state is shown, a "Generate New ZIP" button is present alongside "Download ZIP," and clicking it re-triggers the generation flow.

**Acceptance Scenarios**:

1. **Given** a ZIP is in "ready" state, **When** the user views the download panel, **Then** both "Download ZIP" and "Generate New ZIP" buttons are visible
2. **Given** the user clicks "Generate New ZIP," **Then** the ZIP status transitions back to "processing" and a new ZIP is built from the current audio files
3. **Given** a new ZIP is ready after regeneration, **When** the user views the panel, **Then** the updated generation date and file size are displayed

---

### Edge Cases

- What happens when the user clicks "Generate Audiobook ZIP" twice before the first completes? The button is disabled while processing to prevent duplicate jobs.
- What happens if a book is permanently deleted while a ZIP is being generated? The ZIP job and any partial output are cleaned up along with the book.
- What happens when a sequential download encounters a network interruption? The user sees which chapter failed and can retry.
- How does the system handle books with 0 converted chapters? Both download modes are disabled with an explanatory message.
- What happens when the generated ZIP download link becomes inaccessible? The ZIP status resets to "none" so the user can regenerate.
- What if a ZIP was generated before the latest audio reconversion? The panel shows the ZIP's generation date so the user can judge whether it reflects the current audio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a dedicated download panel within the book's Listen tab containing both download modes
- **FR-002**: System MUST allow users to download all converted chapters as individual MP3 files with filenames that include book title, chapter number, and chapter title
- **FR-003**: System MUST show real-time progress during sequential download, displaying the current chapter number out of the total
- **FR-004**: Users MUST be able to cancel a sequential download in progress at any time
- **FR-005**: System MUST disable the sequential download option when no chapters have been converted to audio
- **FR-006**: System MUST allow users to request server-side ZIP generation for an entire audiobook
- **FR-007**: System MUST prevent duplicate ZIP generation requests — the trigger button must be disabled while a ZIP is already being processed
- **FR-008**: System MUST automatically check for ZIP generation status updates every 10 seconds while generation is in progress, without requiring a page refresh
- **FR-009**: System MUST display ZIP file size and generation timestamp when ZIP is ready
- **FR-010**: System MUST provide a direct one-click download for the ready ZIP file
- **FR-011**: System MUST allow users to request a new ZIP when a previous ZIP already exists, to pick up reconverted audio
- **FR-012**: System MUST display a descriptive error message and a retry option when ZIP generation fails
- **FR-013**: System MUST clean up all ZIP files and ZIP jobs when a book is permanently deleted
- **FR-014**: Generated ZIP files MUST persist until explicitly regenerated or the book is deleted — they survive audio reconversion

### Key Entities

- **Audiobook ZIP Job**: A single ZIP generation request for a book. Tracks status (pending, processing, complete, error), the book it belongs to, and creation timestamp.
- **Book ZIP State**: The current ZIP availability for a book — one of: none, processing, ready, error. Includes download URL, file size in bytes, generation timestamp, and any error message.
- **Chapter Audio File**: A single converted audio chapter. Has an index, title, and download URL. Multiple chapters belong to one book.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can initiate a batch chapter download within 2 interactions (taps or clicks) from the book's Listen tab
- **SC-002**: Sequential download progress updates with every chapter — users always know exactly which chapter is currently downloading
- **SC-003**: ZIP generation status is always current without manual refresh — users never need to reload the page to check readiness
- **SC-004**: A ready ZIP downloads with a single click — no additional dialogs or confirmation steps required
- **SC-005**: ZIP generation handles books of all sizes in the library (up to 363 MB) within the background processing time limit without visible failure
- **SC-006**: 100% of permanently deleted books have associated ZIPs and jobs removed — no orphaned files remain in storage

## Assumptions

- Only authenticated users can access the download panel; unauthenticated access is out of scope.
- The ZIP archive is named `{Book Title} Audiobook.zip`.
- Individual MP3 files inside the ZIP use the same naming pattern as sequential downloads: `{Book Title} - Ch{N} {Chapter Title}.mp3`.
- A ZIP is never automatically invalidated by the system when audio is reconverted — staleness is communicated via the displayed generation date only.
- Sequential download processes chapters in ascending chapter-index order.
- File size shown for a ready ZIP reflects the ZIP archive's actual size, not the sum of raw MP3 sizes.
- Polling every 10 seconds is adequate given expected ZIP generation times; real-time push is not required.
- Deleting a ZIP resets the book's ZIP state to "none," allowing the user to request a fresh one.
