# Feature Specification: Cloud Files Manager Enhancements

**Feature Branch**: `012-file-manager`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "Upload, browse, share, and manage personal files in Firebase Storage, check existed MFe to avoid conflicts. add new features."

## Background & Context

The `cloud-files` MFE already exists and provides the following baseline capabilities:

- Upload files to personal cloud storage
- Browse personal files in a list view (My Files tab)
- Browse files shared with you (Shared Files tab)
- Share a file globally (makes it visible to all app users in the Shared tab)
- Download files
- Delete own files

This specification covers **new features** to be added on top of the existing MFE. It does not duplicate or replace what is already built.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Search and Filter Files (Priority: P1)

A user has accumulated many files and wants to quickly find a specific one without scrolling through all of them. They type a keyword in a search bar and the list immediately narrows to matching files. They can also filter by file type (images, documents, PDFs) to group related files.

**Why this priority**: Search is the most impactful usability improvement once a user has more than a handful of files. It unblocks every subsequent file operation.

**Independent Test**: Can be tested by uploading 10+ files of different types, typing a partial filename in the search bar, and verifying only matching files appear. Delivers immediate value — the full feature is testable without folders or previews.

**Acceptance Scenarios**:

1. **Given** the user is on My Files with at least 5 files, **When** they type a partial filename in the search box, **Then** only files whose names contain the typed text are shown, and the count updates in real time.
2. **Given** the user selects "Images" in the file-type filter, **When** the list updates, **Then** only image files are visible; non-image files are hidden.
3. **Given** an active search with no matches, **When** the user clears the search box, **Then** all files are restored immediately.
4. **Given** the user has both "My Files" and "Shared Files" tabs, **When** they search in the Shared tab, **Then** only shared files matching the query are shown.

---

### User Story 2 - Folder Organization (Priority: P2)

A user wants to organize their files into named folders (e.g., "Work", "Personal", "Photos"). They can create folders, move files into them, and navigate the folder hierarchy to browse their stored content.

**Why this priority**: Folders are the primary organizational unit for file management and become essential as file counts grow. Depends only on the file list being loaded — no other new features required.

**Independent Test**: Can be tested by creating a folder, uploading a file, moving the file to that folder, then navigating into the folder and confirming the file appears there.

**Acceptance Scenarios**:

1. **Given** the user is on My Files, **When** they create a new folder named "Work", **Then** a "Work" folder appears in the file list.
2. **Given** a file and a folder both exist, **When** the user moves the file into the folder, **Then** the file no longer appears in the root list and is visible inside the folder.
3. **Given** the user is inside a folder, **When** they click the breadcrumb for the root level, **Then** they return to the top-level file list.
4. **Given** the user tries to delete a non-empty folder, **When** they confirm the deletion, **Then** the folder and all its contents are permanently removed after an explicit confirmation step.
5. **Given** the user tries to create a folder with a duplicate name in the same level, **When** they submit, **Then** an error is shown and the duplicate is not created.

---

### User Story 3 - File Preview (Priority: P3)

A user wants to preview image files and PDF documents inline without leaving the app or opening a new tab. Clicking a preview icon opens a modal or panel showing the file content at a comfortable size.

**Why this priority**: Preview reduces friction for common file types and eliminates the need to download first. It is independent of search and folders and can be added or omitted without affecting other stories.

**Independent Test**: Can be tested by uploading an image and a PDF, clicking the preview action, and verifying the content renders correctly in the preview panel.

**Acceptance Scenarios**:

1. **Given** the user has an image file (JPEG, PNG, GIF, WebP), **When** they click the preview icon, **Then** a full-size preview of the image opens in an overlay with a close button.
2. **Given** the user has a PDF file, **When** they click the preview icon, **Then** an embedded PDF viewer opens inside the app showing the document.
3. **Given** the user has a file type that does not support preview (e.g., ZIP, DOCX), **Then** no preview icon is shown; only download is available.
4. **Given** the preview is open, **When** the user presses Escape or clicks outside the modal, **Then** the preview closes and the file list is visible again.

---

### User Story 4 - Rename Files (Priority: P4)

A user wants to correct a filename or give it a more descriptive name after uploading. They click a rename action on the file card, edit the name inline, and confirm.

**Why this priority**: Rename is a basic file management operation that adds completeness. It is self-contained and low-risk.

**Independent Test**: Can be tested by uploading a file, renaming it to a new name, and verifying the new name persists after a page refresh.

**Acceptance Scenarios**:

1. **Given** the user clicks the rename action on a file, **When** an editable field appears with the current name pre-filled, **Then** they can change the name and confirm to save it.
2. **Given** the user submits an empty rename, **Then** an error is shown and the original filename is preserved.
3. **Given** the user presses Escape during rename, **Then** the original filename is restored and no change is saved.

---

### User Story 5 - Targeted File Sharing (Priority: P5)

A user wants to share a file with a specific person rather than making it visible to all app users. They enter the recipient's email address and the file becomes accessible only to that recipient in their Shared Files tab.

**Why this priority**: The current global sharing is an all-or-nothing approach. Targeted sharing is a meaningful privacy improvement but is more complex, so it comes after foundational organization features.

**Independent Test**: Can be tested by sharing a file with a specific test user's email, signing in as that user, and confirming the file appears in their Shared tab but not in another user's Shared tab.

**Acceptance Scenarios**:

1. **Given** the user initiates a share, **When** they enter a valid registered email address and confirm, **Then** only that recipient sees the file in their Shared Files list.
2. **Given** the user enters an email address not registered in the app, **When** they confirm, **Then** an error is shown explaining the recipient was not found.
3. **Given** a file is shared with a specific user, **When** the original owner deletes the file, **Then** the file is removed from the recipient's Shared Files list.
4. **Given** the owner shared a file with someone, **When** they view the file card, **Then** they can see a list of recipients and revoke access for any individual.

---

### User Story 6 - Storage Quota Display (Priority: P6)

A user wants to know how much storage they have used and how much remains, so they can decide whether to delete old files before uploading more.

**Why this priority**: Useful context for power users managing many files, but not blocking for core functionality. Can be surfaced as a simple status bar or progress indicator.

**Independent Test**: Can be tested by uploading files and observing the usage indicator increase and reflect the correct used/total amounts.

**Acceptance Scenarios**:

1. **Given** the user is on My Files, **When** the page loads, **Then** a storage usage indicator shows current used space and total allocated quota (e.g., "12 MB of 500 MB used").
2. **Given** the user uploads a new file, **When** the upload completes, **Then** the usage indicator updates to reflect the increased usage.
3. **Given** the user's used storage exceeds 90% of their quota, **When** they view My Files, **Then** a warning is displayed prompting them to free up space.

---

### Edge Cases

- What happens when a user uploads a file with the same name as an existing file in the same folder? The system must prompt for confirmation to replace or keep both (by appending a number suffix).
- What happens when the user's storage quota is fully exhausted and they try to upload? An explicit error message must appear before the upload is attempted, not after a failed upload attempt.
- How does the system handle a file being deleted by the owner while a recipient has it previewed? The preview closes gracefully with a "File no longer available" message.
- What happens when a folder is moved into one of its own sub-folders? The system must detect the circular reference and reject the operation.
- How does search perform with 500+ files? Results must appear within 1 second of the user stopping typing.
- What happens when a file upload is interrupted mid-way (network drop)? The partial upload is cleaned up automatically; the file does not appear in the list.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to search their files by filename using a text input that filters results in real time as the user types.
- **FR-002**: Users MUST be able to filter files by file type category (images, documents, PDFs, other) independently or in combination with a text search.
- **FR-003**: Users MUST be able to create named folders and navigate into them to view their contents.
- **FR-004**: Users MUST be able to move files from one folder to another, including back to the root level.
- **FR-005**: Users MUST be able to rename any file they own by providing a non-empty, valid filename.
- **FR-006**: The system MUST display an inline preview for image files (JPEG, PNG, GIF, WebP) and PDF files; all other types fall back to download-only.
- **FR-007**: Users MUST be able to share a file with a specific registered user by email address, replacing or supplementing the existing global share action.
- **FR-008**: File owners MUST be able to view the list of users a file has been shared with and revoke access for individual recipients.
- **FR-009**: The system MUST display a storage usage indicator showing used and total quota on the My Files view.
- **FR-010**: The system MUST warn the user when storage usage exceeds 90% of their quota.
- **FR-011**: The system MUST prevent upload when the user's storage quota is fully exhausted and display an actionable error message.
- **FR-012**: The system MUST clean up any partially uploaded file if the upload is interrupted or fails.
- **FR-013**: Users MUST receive a confirmation prompt when deleting a non-empty folder, clearly stating that all contained files will also be deleted.
- **FR-014**: The search and filter controls MUST be available on both the My Files and Shared Files tabs.

### Key Entities *(include if feature involves data)*

- **Folder**: A named container owned by a user. Has a name, parent folder reference (null for root), creation date, and belongs to one user.
- **FileItem** (extended): Existing entity extended with folder reference (which folder it belongs to), rename history is not retained.
- **ShareRecipient**: A record linking a file to a specific recipient user. Attributes: file ID, recipient user ID, shared-by user ID, shared date, access revoked flag.
- **StorageQuota**: Per-user record of total allocated bytes and current used bytes. Updated on each upload/delete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users with 50+ files can locate any specific file in under 15 seconds using search or filter, compared to manual scrolling.
- **SC-002**: 95% of file uploads complete successfully without user-visible errors under normal network conditions.
- **SC-003**: File preview loads and displays content within 3 seconds for files up to 10 MB on a standard mobile connection.
- **SC-004**: Users can complete a file organization workflow (create folder → upload file → move to folder) in under 2 minutes on first use.
- **SC-005**: Storage quota is visible on the My Files page 100% of the time when the user is authenticated, with no additional user action required.
- **SC-006**: Targeted file sharing reaches only the intended recipient — sharing with User A must not make the file visible to User B in any circumstance.
- **SC-007**: Zero instances of orphaned partial uploads remaining visible in the file list after a failed or interrupted upload.

## Assumptions

- The existing `cloud-files` MFE, GraphQL schema (`GET_CLOUD_FILES`, `SHARE_FILE`, `DELETE_FILE`), and Firebase Storage backend will be extended — not replaced.
- Storage quota limits are defined per user account; default quota is 500 MB (can be adjusted per environment).
- Folder hierarchy is limited to 5 levels deep to keep navigation manageable on mobile.
- Targeted sharing is limited to users already registered in the MyCircle app; external email invitations are out of scope.
- File rename only changes the display name in the database; the underlying storage path is not renamed (avoids breaking existing download URLs).
- The existing global share action is retained alongside targeted sharing; the UI presents both options.
- Supported preview types are image/* (browser-renderable) and application/pdf only; no server-side conversion is required.
