# Feature Specification: Document Scanner Enhancements

**Feature Branch**: `016-document-scanner`
**Created**: 2026-03-26
**Status**: Draft
**Input**: User description: "Camera-based document scanner with perspective correction and PDF export, explore current MFE and add new features."

## Context

The existing Doc Scanner MFE (`packages/doc-scanner`) already provides single-page document scanning with camera capture, automatic edge detection, manual corner adjustment, perspective correction, B&W enhancement, JPEG download/share, Cloud Files auto-save, and scan history. All processing runs client-side via Web Workers.

This specification defines enhancements that add **multi-page PDF export**, **image adjustment controls**, **auto-crop improvements**, and **batch scanning workflow** to transform the scanner from a single-image capture tool into a complete document digitization solution.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Multi-Page PDF Export (Priority: P1)

A user scans a multi-page document (e.g., a contract, tax form, or homework assignment). After scanning each page, they add it to a document batch. Once all pages are collected, they export the entire batch as a single PDF file with each page as a separate PDF page.

**Why this priority**: PDF is the universal document format. Without PDF export, the scanner only produces individual JPEG images, which is inadequate for multi-page documents — the core use case for document scanning. This is the most requested missing capability.

**Independent Test**: Can be fully tested by scanning 2+ pages, reordering them, and exporting as PDF. Delivers immediate value as a complete document digitization workflow.

**Acceptance Scenarios**:

1. **Given** a user has scanned one page, **When** they tap "Add Page", **Then** the scanner resets to capture mode while the scanned page is added to a page tray visible at the bottom of the screen.
2. **Given** a user has 3 pages in the page tray, **When** they tap "Export PDF", **Then** a PDF file is generated containing all 3 pages in order and the download begins automatically.
3. **Given** a user has multiple pages in the tray, **When** they long-press/drag a page thumbnail, **Then** they can reorder pages by dragging to a new position.
4. **Given** a user has pages in the tray, **When** they tap a page thumbnail, **Then** they see a preview with options to delete that page or re-scan it.
5. **Given** a user exports a PDF, **When** the export completes, **Then** the PDF is also auto-saved to Cloud Files (if the user is authenticated).

---

### User Story 2 - Image Adjustment Controls (Priority: P2)

After capturing and correcting a document, a user adjusts brightness, contrast, and rotation to improve readability before saving. This is especially useful for documents photographed in poor lighting or at a slight angle.

**Why this priority**: Real-world captures often have uneven lighting or slight skew that the perspective correction alone cannot fix. Basic adjustments significantly improve output quality and reduce the need to re-scan.

**Independent Test**: Can be tested by capturing a dimly lit document, adjusting brightness/contrast sliders, rotating, and verifying the exported image is more readable than the raw capture.

**Acceptance Scenarios**:

1. **Given** a user is on the preview screen after perspective correction, **When** they tap an "Adjust" button, **Then** brightness and contrast sliders appear below the preview image.
2. **Given** the adjustment panel is open, **When** the user drags the brightness slider, **Then** the preview updates in real time to reflect the brightness change.
3. **Given** the adjustment panel is open, **When** the user taps a rotate button, **Then** the image rotates 90 degrees clockwise, and multiple taps cycle through 0/90/180/270 degrees.
4. **Given** the user has made adjustments, **When** they tap "Reset", **Then** all adjustments revert to their default values.
5. **Given** the user has made adjustments, **When** they tap "Done" or save, **Then** the adjustments are baked into the final exported image (JPEG or PDF page).

---

### User Story 3 - Batch Scanning Mode (Priority: P3)

A user needs to scan many pages quickly (e.g., a stack of receipts). They enable batch mode, which automatically captures and processes each page in rapid succession — the scanner detects when a new document is placed, auto-captures, and queues it, minimizing manual interaction.

**Why this priority**: Power users scanning many documents benefit from reduced tap-per-page overhead. This builds on P1 (multi-page tray) and adds automation for efficiency.

**Independent Test**: Can be tested by enabling batch mode, placing 3 documents in sequence in front of the camera, and verifying all 3 are auto-captured and added to the page tray without manual capture taps.

**Acceptance Scenarios**:

1. **Given** the user is on the capture screen, **When** they toggle "Batch Mode" on, **Then** the scanner enters continuous capture mode with a visible indicator.
2. **Given** batch mode is active and the camera sees a stable document, **When** the document edges are detected for 1.5 seconds, **Then** the scanner auto-captures, processes, and adds the page to the tray.
3. **Given** batch mode just auto-captured a page, **When** the user removes the document and places a new one, **Then** the scanner detects the scene change and begins detecting the new document.
4. **Given** batch mode is active, **When** the user taps the capture button manually, **Then** the current frame is captured immediately regardless of auto-detection state.
5. **Given** batch mode is active, **When** the user toggles batch mode off, **Then** the scanner returns to normal single-capture mode, keeping all pages already in the tray.

---

### User Story 4 - Enhanced Scan History & Organization (Priority: P4)

A user wants to find a previously scanned document from their history. They can search by date, view scans grouped by session, and rename scanned documents for easy retrieval.

**Why this priority**: As users scan more documents, the flat thumbnail grid becomes hard to navigate. Organization features improve the long-term value of the scanner.

**Independent Test**: Can be tested by creating several scans across multiple sessions, renaming one, and verifying they appear grouped by date with searchable names.

**Acceptance Scenarios**:

1. **Given** the user opens scan history, **When** scans from multiple dates exist, **Then** scans are grouped under date headers (e.g., "Today", "Yesterday", "March 20, 2026").
2. **Given** the user has many scans, **When** they type in a search field, **Then** results filter by document name in real time.
3. **Given** the user taps a scan's name label, **When** they enter a new name and confirm, **Then** the scan is renamed and the new name persists.
4. **Given** the user views a multi-page PDF scan, **When** they tap it, **Then** a page-by-page preview opens (not just the first page thumbnail).

---

### Edge Cases

- What happens when the device has no camera and the user uploads a non-document image (e.g., a photo of a sunset)? The edge detection should fail gracefully and allow the user to manually place corners or skip correction.
- What happens when the user's device runs out of storage mid-PDF-export? The export should fail with a clear error message and not leave a corrupted partial file.
- What happens when the user scans a very large document (e.g., A0 poster) that produces a high-resolution image? Processing should still complete within a reasonable time by downsampling, with a quality/speed indicator.
- What happens when batch mode detects a false positive (e.g., the table surface)? The user should be able to undo the last auto-capture from the tray.
- What happens if the browser does not support the PDF generation approach? The system should fall back to exporting a ZIP of individual JPEG images.
- What happens when the user navigates away mid-scan with unsaved pages in the tray? The system should warn the user about losing unsaved work.

## Requirements *(mandatory)*

### Functional Requirements

**Multi-Page & PDF Export**
- **FR-001**: System MUST allow users to add multiple scanned pages to a document tray before exporting.
- **FR-002**: System MUST generate a PDF file containing all pages in the tray, with each scan as a separate page, maintaining the user-specified order.
- **FR-003**: System MUST allow users to reorder pages in the tray via drag-and-drop.
- **FR-004**: System MUST allow users to delete individual pages from the tray.
- **FR-005**: System MUST allow users to re-scan (replace) a specific page in the tray.
- **FR-006**: System MUST auto-save exported PDFs to Cloud Files when the user is authenticated.
- **FR-007**: System MUST support exporting a single page as either JPEG (existing) or PDF (new).

**Image Adjustments**
- **FR-008**: System MUST provide brightness adjustment with a slider control (range: -100 to +100, default 0).
- **FR-009**: System MUST provide contrast adjustment with a slider control (range: -100 to +100, default 0).
- **FR-010**: System MUST provide 90-degree rotation in clockwise increments.
- **FR-011**: System MUST update the preview image in real time as adjustments are made.
- **FR-012**: System MUST allow users to reset all adjustments to defaults with a single action.
- **FR-013**: Adjustments MUST be applied to the final export (both JPEG and PDF).

**Batch Scanning**
- **FR-014**: System MUST provide a batch mode toggle on the capture screen.
- **FR-015**: In batch mode, the system MUST auto-capture when document edges are stably detected for a configurable dwell time (default 1.5 seconds).
- **FR-016**: In batch mode, the system MUST detect scene changes (document removed/replaced) before attempting the next auto-capture.
- **FR-017**: Manual capture MUST remain available at all times, even in batch mode.
- **FR-018**: System MUST allow undoing the last auto-capture in batch mode.

**Scan History Enhancements**
- **FR-019**: System MUST group scans by date in the history view.
- **FR-020**: System MUST allow users to rename scanned documents.
- **FR-021**: System MUST provide a search/filter field in the scan history.
- **FR-022**: System MUST display a page-count badge on multi-page PDF thumbnails.

**General**
- **FR-023**: All new UI elements MUST support dark mode.
- **FR-024**: All new user-visible strings MUST be internationalized in all 3 locales (en, es, zh).
- **FR-025**: All new interactive elements MUST meet accessibility standards (touch targets >= 44px, aria labels, keyboard navigation).
- **FR-026**: PDF generation MUST happen client-side without server round-trips.
- **FR-027**: System MUST warn users when navigating away with unsaved pages in the tray.

### Key Entities

- **Scan Page**: A single processed document image (warped, optionally enhanced/adjusted). Has an order index, optional name, image data, and adjustment settings (brightness, contrast, rotation).
- **Document Tray**: An ordered collection of Scan Pages being assembled into a document. Temporary state during a scanning session.
- **Scanned Document**: The final exported artifact — either a single JPEG or a multi-page PDF. Has a name, creation date, page count, file size, and Cloud Files reference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can scan a 5-page document and export it as a single PDF in under 3 minutes (including capture, correction, and export time).
- **SC-002**: PDF export for a 10-page document completes in under 10 seconds on a mid-range mobile device.
- **SC-003**: Image adjustments (brightness/contrast) preview updates appear within 200ms of slider movement, perceived as real-time by the user.
- **SC-004**: In batch mode, consecutive page captures require no more than 1 manual tap per page (the capture itself is automatic).
- **SC-005**: Users can find a specific scan from a history of 50+ documents in under 10 seconds using search or date grouping.
- **SC-006**: 95% of auto-captures in batch mode produce usable document scans (no false positives on empty surfaces or partial captures).
- **SC-007**: Exported PDFs open correctly in all major PDF readers (browser built-in, Adobe Acrobat, Apple Preview, Google Drive).

## Assumptions

- PDF generation will use a client-side library (no server processing needed). The specific library choice is an implementation detail.
- The existing edge detection, perspective correction, and B&W enhancement algorithms are sufficient — this spec does not require improving their accuracy.
- Cloud Files integration (via `window.__cloudFiles`) already supports uploading arbitrary file types including PDF.
- Batch mode scene change detection can be implemented using frame differencing on the existing camera feed without additional hardware sensors.
- The page tray is session-scoped (not persisted across browser refreshes). Users must export before leaving. This avoids complex draft persistence logic for a v1.
- Image adjustments (brightness/contrast) will be applied via canvas pixel manipulation, consistent with the existing B&W enhancement approach.
- The existing Web Worker infrastructure can be extended to handle PDF generation and image adjustment processing.
