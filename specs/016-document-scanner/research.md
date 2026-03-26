# Research: Document Scanner Enhancements

**Feature**: 016-document-scanner
**Date**: 2026-03-26

## R1: Client-Side PDF Generation Library

**Decision**: Use `jspdf` (v2.x)

**Rationale**:
- Most widely used client-side PDF library (30M+ weekly npm downloads)
- Direct canvas-to-PDF support via `addImage()` — ideal for scanned document images
- Lightweight (~300KB gzipped) with no native dependencies
- Works in Web Workers (no DOM dependency for image-based PDFs)
- Supports multi-page documents natively with `addPage()`
- Output as Blob or base64 — compatible with Cloud Files upload API

**Alternatives considered**:
- `pdf-lib`: More powerful (edit existing PDFs, form filling) but heavier (~500KB) and adds complexity not needed for image-to-PDF conversion. Better suited for PDF manipulation, not generation from canvas images.
- `pdfkit`: Node.js-oriented, requires bundler shims for browser use. Not ideal for client-side MFE.
- Canvas-only approach (manual PDF binary construction): Fragile, no standard compliance guarantees, maintenance burden. Not viable for cross-reader compatibility (SC-007).

**Integration note**: Add `jspdf` to `packages/doc-scanner/package.json` only. No catalog entry needed — single consumer.

## R2: Cloud Files PDF Upload Compatibility

**Decision**: Cloud Files upload API supports PDF without changes.

**Rationale**:
- `window.__cloudFiles.upload(fileName, fileBase64, contentType)` accepts any `contentType` string
- Server-side handler validates only that contentType is non-empty (`z.string().min(1)`)
- No MIME type whitelist/blacklist exists
- 5MB size limit is the only constraint — multi-page document PDFs (10 pages of JPEG-quality scans) typically stay under 3-4MB

**Risk**: Large documents (20+ high-res pages) could exceed 5MB. Mitigation: compress JPEG quality to 0.75 for PDF embedding, warn user if estimated size exceeds limit before export.

## R3: Page Tray State Management

**Decision**: In-memory React state array (session-scoped, not persisted).

**Rationale**:
- Spec explicitly states "page tray is session-scoped" — no persistence across refreshes
- A simple `useState<ScanPage[]>` array in DocScanner is sufficient
- Each ScanPage stores: ImageData (processed), canvas reference, adjustment settings, order index
- Reordering uses array splice operations — no external state library needed
- Page count realistically stays under 20 per session — no performance concern with array operations

**Alternatives considered**:
- IndexedDB persistence: Adds complexity for draft recovery. Spec excludes this for v1.
- useReducer: Would add ceremony for what amounts to array CRUD. useState with helper functions is simpler (Constitution VI: Simplicity).
- Zustand/external store: Overkill for single-component state. No cross-component sharing needed.

## R4: Page Reorder Drag-and-Drop

**Decision**: Native pointer events with manual drag tracking (same pattern as `useCornerDrag.ts`).

**Rationale**:
- The MFE already uses pointer events for corner dragging (`useCornerDrag.ts`)
- Page tray is a horizontal strip of thumbnails — simple 1D drag reorder
- Native HTML5 Drag and Drop API has poor mobile/touch support
- No external library needed — consistent with existing patterns and Constitution VI

**Alternatives considered**:
- `@dnd-kit/core`: Full-featured but adds ~40KB dependency for a single horizontal list reorder. Overkill.
- HTML5 Drag and Drop: Poor touch support on mobile, no drag preview customization, inconsistent across browsers.
- `react-beautiful-dnd`: Deprecated by Atlassian, no longer maintained.

## R5: Batch Mode Scene Change Detection

**Decision**: Frame differencing on downsampled grayscale frames.

**Rationale**:
- The MFE already has `toGrayscale()` and downsampling utilities
- Compare consecutive camera frames (downsampled to ~160px width) by computing mean absolute pixel difference
- Threshold: >15% pixel change indicates scene change (document removed/replaced)
- After scene change detected, reset edge detection dwell timer
- Reuses existing image processing pipeline — no new dependencies

**Implementation approach**:
1. Capture reference frame after each auto-capture
2. Every ~500ms, compare current frame to reference
3. If difference exceeds threshold → "scene changed" state
4. When scene changed AND new stable edges detected for 1.5s → auto-capture

**Alternatives considered**:
- Motion detection via optical flow: Too computationally expensive for continuous monitoring
- Background subtraction (MOG2): Requires OpenCV.js (~8MB), violates simplicity principle
- Simple pixel count change: Less robust than mean absolute difference but simpler. MAD is only marginally more complex and significantly more reliable.

## R6: Image Adjustment Implementation

**Decision**: Canvas pixel manipulation with requestAnimationFrame throttling.

**Rationale**:
- Brightness: Add constant to each RGB channel, clamp 0-255
- Contrast: Apply contrast formula `(pixel - 128) * factor + 128` where factor = `(259 * (contrast + 255)) / (255 * (259 - contrast))`
- Rotation: Canvas `ctx.rotate()` with translated origin — no pixel manipulation needed
- Preview updates throttled via requestAnimationFrame to stay within SC-003 (200ms)
- All operations use existing ImageData/canvas patterns in the MFE

**Alternatives considered**:
- CSS filters for preview: Fast but cannot be baked into export (canvas `drawImage` ignores CSS filters). Would need dual path — CSS for preview, pixel ops for export. Added complexity.
- WebGL shaders: Fastest for real-time preview but adds GPU context management complexity. Not justified for simple brightness/contrast.
- OffscreenCanvas in worker: Good for heavy processing but adds latency for preview (message passing overhead). Better to run adjustments on main thread with RAF throttle for real-time feel.

## R7: Worker Infrastructure Status

**Decision**: Keep main-thread processing for all new features. Do not fix worker dispatch.

**Rationale**:
- Research revealed the existing worker is instantiated but **never actually dispatched to** — all operations run on main thread via `setTimeout(..., 50)`
- Fixing worker dispatch is out of scope (spec says existing algorithms are sufficient)
- New features (brightness/contrast, PDF generation) are fast enough on main thread:
  - Brightness/contrast on a single page: <50ms
  - jspdf PDF generation for 10 pages: <2s
- Adding worker dispatch would be a separate refactoring effort

**Future opportunity**: Fix worker dispatch as a separate performance PR. Would benefit edge detection (heaviest operation at ~200ms on mobile).
