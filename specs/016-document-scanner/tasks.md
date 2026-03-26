# Tasks: Document Scanner Enhancements

**Input**: Design documents from `/specs/016-document-scanner/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: Install dependency and define shared types used across all user stories

- [x] T001 Add `jspdf` dependency to `packages/doc-scanner/package.json` and run `pnpm install`
- [x] T002 Create ScanPage type interface and shared types in `packages/doc-scanner/src/types.ts` (ScanPage, DocumentTray state, BatchModeState, ScanFile enhanced interface per data-model.md)
- [x] T003 Add all new i18n keys for US1-US4 to `packages/shared/src/locales/en.ts` (docScanner.addPage, exportPdf, pageTray, brightness, contrast, rotate, reset, batchMode, searchScans, rename, etc.)
- [x] T004 [P] Add all new i18n keys to `packages/shared/src/locales/es.ts` (Spanish translations matching en.ts keys)
- [x] T005 [P] Add all new i18n keys to `packages/shared/src/locales/zh.ts` (Chinese translations matching en.ts keys)
- [x] T006 Rebuild shared package: `pnpm build:shared`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core hooks that multiple user stories depend on — MUST complete before story implementation

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create `useDocumentTray` hook in `packages/doc-scanner/src/hooks/useDocumentTray.ts` — implements addPage, removePage, reorderPage, replacePage, updateAdjustments, documentName, clear, pageCount per contracts/component-interfaces.md
- [x] T008 Create PageTray component in `packages/doc-scanner/src/components/PageTray.tsx` — horizontal scrollable thumbnail strip with page number badges, delete buttons, active page highlight, "+" add button, pointer-event-based drag reorder per contracts/component-interfaces.md
- [x] T009 Update DocScanner main component state machine in `packages/doc-scanner/src/components/DocScanner.tsx` — add `useDocumentTray` integration, add "Add to Document" flow alongside existing "Save" flow, add beforeunload warning when tray has unsaved pages (FR-027), wire PageTray into all non-capture states

**Checkpoint**: Foundation ready — page tray state management works, pages can be added/removed/reordered

---

## Phase 3: User Story 1 — Multi-Page PDF Export (Priority: P1) MVP

**Goal**: Users can scan multiple pages and export as a single PDF file

**Independent Test**: Scan 2+ pages, reorder them in the tray, export as PDF, verify PDF opens with correct page order in browser viewer

### Implementation for User Story 1

- [x] T010 [US1] Create `usePdfExport` hook in `packages/doc-scanner/src/hooks/usePdfExport.ts` — wraps jspdf to generate multi-page PDF from ScanPage array; each page rendered as JPEG image on a PDF page sized to match image aspect ratio; returns Blob; tracks isExporting and error state per contracts
- [x] T011 [US1] Update `useScanStorage` hook in `packages/doc-scanner/src/hooks/useScanStorage.ts` — add support for uploading PDF blobs (convert to base64, use `application/pdf` content type, filename `scan-{timestamp}.pdf`); extend ScanFile interface with pageCount and fileType fields
- [x] T012 [US1] Update PerspectivePreview component in `packages/doc-scanner/src/components/PerspectivePreview.tsx` — add "Add to Document" button alongside existing "Save" button; show button when `showAddToDocument` prop is true; call `onAddToDocument(canvas)` on click per contracts
- [x] T013 [US1] Update ResultView component in `packages/doc-scanner/src/components/ResultView.tsx` — add PDF/JPEG format toggle, "Export PDF" button with loading spinner, page count display; wire `onExportPdf`, `isPdfExporting`, `exportFormat`, `onFormatChange` props per contracts
- [x] T014 [US1] Wire PDF export end-to-end in `packages/doc-scanner/src/components/DocScanner.tsx` — connect usePdfExport hook to ResultView; on export: generate PDF blob → trigger download → auto-save to Cloud Files via useScanStorage; handle single-page JPEG vs multi-page PDF based on format selection

**Checkpoint**: User Story 1 fully functional — multi-page scanning and PDF export works end-to-end

---

## Phase 4: User Story 2 — Image Adjustment Controls (Priority: P2)

**Goal**: Users can adjust brightness, contrast, and rotation on scanned pages before export

**Independent Test**: Capture a document, open adjustment panel, drag brightness/contrast sliders and verify real-time preview updates, rotate image, export and verify adjustments are baked into output

### Implementation for User Story 2

- [x] T015 [P] [US2] Create `imageAdjust` utility functions in `packages/doc-scanner/src/utils/imageAdjust.ts` — `applyBrightness(imageData, value)`: add constant to RGB channels clamped 0-255; `applyContrast(imageData, value)`: contrast formula per research.md R6; `applyRotation(canvas, degrees)`: ctx.rotate with translated origin; `applyAllAdjustments(imageData, brightness, contrast, rotation)`: combined pipeline
- [x] T016 [P] [US2] Create `useImageAdjust` hook in `packages/doc-scanner/src/hooks/useImageAdjust.ts` — wraps imageAdjust utils; provides `applyAdjustments` (returns new ImageData) and `getPreview` (returns canvas with adjustments applied); uses requestAnimationFrame throttling for real-time preview (<200ms per SC-003)
- [x] T017 [US2] Create AdjustmentPanel component in `packages/doc-scanner/src/components/AdjustmentPanel.tsx` — brightness slider (-100 to +100), contrast slider (-100 to +100), rotate button (cycles 0/90/180/270), reset button; all with dark mode, aria-labels, touch targets >=44px per contracts
- [x] T018 [US2] Integrate AdjustmentPanel into PerspectivePreview in `packages/doc-scanner/src/components/PerspectivePreview.tsx` — add "Adjust" toggle button; when open, render AdjustmentPanel below preview; apply adjustments to preview canvas in real time via useImageAdjust; pass final adjusted ImageData when saving/adding to document
- [x] T019 [US2] Wire adjustments into page tray and export in `packages/doc-scanner/src/components/DocScanner.tsx` — store brightness/contrast/rotation per ScanPage in document tray; apply adjustments when generating PDF pages in usePdfExport; apply adjustments when exporting single JPEG

**Checkpoint**: User Stories 1 AND 2 both work independently — adjustments applied to both JPEG and PDF exports

---

## Phase 5: User Story 3 — Batch Scanning Mode (Priority: P3)

**Goal**: Auto-capture documents in rapid succession with scene change detection

**Independent Test**: Enable batch mode, place 3 documents in sequence, verify all 3 are auto-captured and added to page tray without manual capture taps

### Implementation for User Story 3

- [x] T020 [P] [US3] Create `sceneDiff` utility in `packages/doc-scanner/src/utils/sceneDiff.ts` — `computeFrameDiff(frameA, frameB)`: downsample both to 160px width, convert to grayscale (reuse existing toGrayscale), compute mean absolute pixel difference, return percentage (0-100); `isSceneChanged(diff, threshold)`: returns true if diff > 15% per research.md R5
- [x] T021 [US3] Create `useBatchCapture` hook in `packages/doc-scanner/src/hooks/useBatchCapture.ts` — manages batch state machine (idle→detecting→dwelling→capturing→cooldown→waiting_scene_change per data-model.md); polls video element every 500ms for scene change via sceneDiff; runs edge detection on each poll; tracks dwell timer (1500ms threshold); exposes batchEnabled, toggleBatch, dwellProgress, sceneChanged, startMonitoring, stopMonitoring per contracts
- [x] T022 [US3] Update CameraCapture component in `packages/doc-scanner/src/components/CameraCapture.tsx` — add batch mode toggle switch (top-right corner), dwell progress indicator (circular progress around capture button), page count badge showing tray size, visual "Batch Mode Active" indicator; wire batchMode, onBatchModeToggle, pageCount, autoCaptureProgress props per contracts
- [x] T023 [US3] Wire batch capture into DocScanner in `packages/doc-scanner/src/components/DocScanner.tsx` — integrate useBatchCapture hook; on auto-capture: run full pipeline (edge detect → auto-adjust corners → warp → add to tray) without manual corner adjustment; provide undo-last-capture button; manual capture still available in batch mode (FR-017)

**Checkpoint**: All user stories 1-3 functional — batch mode auto-captures and feeds into multi-page PDF export

---

## Phase 6: User Story 4 — Enhanced Scan History & Organization (Priority: P4)

**Goal**: Scans grouped by date, searchable, renamable, with page-count badges

**Independent Test**: Create several scans across sessions, verify date grouping, search by name, rename a document, verify page-count badge on multi-page PDFs

### Implementation for User Story 4

- [x] T024 [P] [US4] Update `useScanStorage` hook in `packages/doc-scanner/src/hooks/useScanStorage.ts` — add `renameScan(oldName, newName)` method (calls Cloud Files rename or re-upload with new name); parse fileType from filename extension; derive pageCount (1 for .jpg, stored metadata for .pdf); expose searchQuery filter and date grouping helper
- [x] T025 [US4] Update ScanHistory component in `packages/doc-scanner/src/components/ScanHistory.tsx` — add search input field at top (filters by document name in real time); group scans by date headers ("Today", "Yesterday", "March 20, 2026" using locale-aware date formatting); show page-count badge on PDF thumbnails; add inline rename (tap name label → editable input → confirm); wire onRename, searchQuery, onSearchChange props per contracts

**Checkpoint**: All 4 user stories independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Dark mode, accessibility, edge cases, and final validation

- [x] T026 [P] Audit all new components for dark mode variants in `packages/doc-scanner/src/components/` — verify every Tailwind color class has a `dark:` counterpart (PageTray, AdjustmentPanel, updated CameraCapture, ResultView, ScanHistory sections)
- [x] T027 [P] Audit all new interactive elements for accessibility in `packages/doc-scanner/src/components/` — verify `aria-label` on sliders, buttons, toggle; `type="button"` on all non-submit buttons; touch targets >=44px; keyboard navigation for PageTray reorder (arrow keys)
- [x] T028 Add navigation guard in `packages/doc-scanner/src/components/DocScanner.tsx` — `beforeunload` event listener when document tray has pages; prompt user to confirm leaving; remove listener when tray is empty or after export (FR-027)
- [x] T029 Add PDF fallback in `packages/doc-scanner/src/hooks/usePdfExport.ts` — if jspdf fails or browser lacks support, fall back to downloading individual JPEG files (edge case from spec)
- [x] T030 Add 30-page limit validation in `packages/doc-scanner/src/hooks/useDocumentTray.ts` — prevent addPage when pages.length >= 30; show toast/message via i18n key; add 5MB size estimate warning before PDF export
- [x] T031 Run `pnpm build:shared && pnpm lint && pnpm test:run && pnpm typecheck` and fix any failures
- [x] T032 Run `cd functions && npx tsc --noEmit` to verify backend typecheck (pre-existing mammoth type errors only — no new regressions) (no backend changes expected but verify no regressions)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 (Phase 3): Can start after Phase 2 — no dependencies on other stories
  - US2 (Phase 4): Can start after Phase 2 — independent of US1 (but integrates with tray if both done)
  - US3 (Phase 5): Can start after Phase 2 — depends on US1's document tray being functional (Phase 2 provides this)
  - US4 (Phase 6): Can start after Phase 2 — independent of US1/US2/US3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependencies on other stories
- **US2 (P2)**: Can start after Phase 2 — independent of US1. If both complete, adjustments integrate with PDF export
- **US3 (P3)**: Can start after Phase 2 — uses document tray (Phase 2) to add auto-captured pages
- **US4 (P4)**: Can start after Phase 2 — independent of all other stories

### Within Each User Story

- Utilities before hooks (e.g., imageAdjust.ts before useImageAdjust.ts)
- Hooks before components (e.g., usePdfExport before ResultView updates)
- Components before integration (e.g., AdjustmentPanel before PerspectivePreview integration)
- Integration/wiring task last (DocScanner.tsx updates)

### Parallel Opportunities

- **Phase 1**: T004 and T005 (es.ts and zh.ts i18n) can run in parallel
- **Phase 4**: T015 and T016 (imageAdjust utility and hook) can run in parallel
- **Phase 5**: T020 (sceneDiff utility) can run in parallel with Phase 4 work
- **Phase 6**: T024 (useScanStorage update) can run in parallel with Phase 5 work
- **Phase 7**: T026 and T027 (dark mode and a11y audits) can run in parallel
- **Cross-phase**: US2 and US4 are fully independent and can be developed in parallel after Phase 2

---

## Parallel Example: User Story 2

```bash
# Launch utilities and hooks in parallel (different files, no dependencies):
Task: "Create imageAdjust utility functions in packages/doc-scanner/src/utils/imageAdjust.ts"
Task: "Create useImageAdjust hook in packages/doc-scanner/src/hooks/useImageAdjust.ts"

# Then sequentially: component → integration
Task: "Create AdjustmentPanel component in packages/doc-scanner/src/components/AdjustmentPanel.tsx"
Task: "Integrate AdjustmentPanel into PerspectivePreview"
Task: "Wire adjustments into page tray and export"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T009)
3. Complete Phase 3: User Story 1 — Multi-Page PDF Export (T010-T014)
4. **STOP and VALIDATE**: Scan 2+ pages, export PDF, verify in browser viewer
5. Deploy/demo if ready — this alone delivers the core value

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add US1 (PDF Export) → Test independently → Deploy/Demo (MVP!)
3. Add US2 (Image Adjustments) → Test independently → Deploy/Demo
4. Add US3 (Batch Mode) → Test independently → Deploy/Demo
5. Add US4 (History Enhancements) → Test independently → Deploy/Demo
6. Polish phase → Final validation → PR ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: US1 (PDF Export) + US3 (Batch Mode) — these share the tray
   - Developer B: US2 (Image Adjustments) + US4 (History) — fully independent
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All new UI strings must be in all 3 locale files (en, es, zh) — done in Phase 1
- No backend/GraphQL changes needed for any story
- jspdf is the only new dependency
