# Implementation Plan: Document Scanner Enhancements

**Branch**: `016-document-scanner` | **Date**: 2026-03-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-document-scanner/spec.md`

## Summary

Enhance the existing Doc Scanner MFE with multi-page PDF export (using jspdf), image adjustment controls (brightness/contrast/rotation), batch scanning mode (auto-capture with scene change detection), and scan history improvements (date grouping, search, rename). All processing remains client-side. One new dependency (jspdf). No backend/GraphQL changes needed.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Tailwind CSS, jspdf (new), `@mycircle/shared` (Apollo re-exports, i18n, StorageKeys, PageContent)
**Storage**: Cloud Files (Firebase Storage) for exported PDFs/JPEGs; React state (memory) for session page tray
**Testing**: Vitest, React Testing Library
**Target Platform**: Web (mobile-first responsive), Chrome/Safari/Firefox/Edge
**Project Type**: Micro-frontend (existing MFE enhancement)
**Performance Goals**: PDF export <10s for 10 pages; adjustment preview <200ms; batch dwell 1.5s
**Constraints**: Client-side only (no server round-trips for processing); 5MB Cloud Files upload limit; session-scoped page tray (no draft persistence)
**Scale/Scope**: Single MFE package (`packages/doc-scanner`), ~8 new files, ~12 modified files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | PASS | Enhancement to existing MFE. No direct `@apollo/client` imports. jspdf is a local dependency only. |
| II. Complete Integration | PASS | No new MFE — enhancing existing one. i18n keys added to all 3 locales. No new routes/nav/widget changes needed. |
| III. GraphQL-First Data Layer | PASS | No new data operations. Cloud Files upload uses existing bridge API. Scan history already uses Cloud Files API via shell bridge. No REST endpoints added. |
| IV. Inclusive by Default | PASS | All new strings use `t('key')`. All new UI has `dark:` variants. Touch targets ≥ 44px. Aria labels on sliders, buttons. Mobile-first layout. |
| V. Fast Tests, Safe Code | PASS | Unit tests mock canvas/ImageData. No network calls in tests. No user-supplied content rendered as HTML (ImageData only). |
| VI. Simplicity | PASS | One new dependency (jspdf). No external state management. No abstractions beyond what's needed. Page tray is a simple useState array. |

**Post-Phase 1 re-check**: All principles still pass. No REST endpoints, no external state libraries, no new MFE integration points. Design stays within existing patterns.

## Project Structure

### Documentation (this feature)

```text
specs/016-document-scanner/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: technology decisions
├── data-model.md        # Phase 1: entity definitions
├── quickstart.md        # Phase 1: setup guide
├── contracts/
│   └── component-interfaces.md  # Phase 1: component prop contracts
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
packages/doc-scanner/src/
├── components/
│   ├── DocScanner.tsx           # MODIFY: add page tray state, batch mode, new transitions
│   ├── CameraCapture.tsx        # MODIFY: add batch mode toggle, dwell progress indicator
│   ├── EdgeOverlay.tsx          # UNCHANGED
│   ├── PerspectivePreview.tsx   # MODIFY: add "Add to Document" button, adjustment panel
│   ├── ResultView.tsx           # MODIFY: add PDF export, format selector, page count
│   ├── ScanHistory.tsx          # MODIFY: add date grouping, search, rename
│   ├── PageTray.tsx             # NEW: horizontal scrollable page thumbnail strip
│   └── AdjustmentPanel.tsx      # NEW: brightness/contrast sliders, rotate button
├── hooks/
│   ├── useCamera.ts             # UNCHANGED
│   ├── useEdgeDetection.ts      # UNCHANGED
│   ├── useCornerDrag.ts         # UNCHANGED
│   ├── useScanStorage.ts        # MODIFY: support PDF content type, rename method
│   ├── useDocumentTray.ts       # NEW: page collection CRUD + reorder
│   ├── usePdfExport.ts          # NEW: jspdf wrapper for multi-page PDF generation
│   ├── useImageAdjust.ts        # NEW: brightness/contrast/rotation preview + apply
│   └── useBatchCapture.ts       # NEW: auto-capture dwell timer + scene change detection
├── utils/
│   ├── imageAdjust.ts           # NEW: brightness/contrast/rotation pixel algorithms
│   ├── sceneDiff.ts             # NEW: frame differencing for scene change detection
│   └── [existing utils unchanged]
└── workers/
    └── [unchanged]
```

**Structure Decision**: All new code lives within the existing `packages/doc-scanner/src/` structure, following the established `components/`, `hooks/`, `utils/` organization. No new top-level directories. No backend changes.

## Complexity Tracking

No constitution violations. No complexity justifications needed.
