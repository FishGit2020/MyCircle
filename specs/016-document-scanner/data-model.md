# Data Model: Document Scanner Enhancements

**Feature**: 016-document-scanner
**Date**: 2026-03-26

## Entities

### ScanPage

A single processed document image within a multi-page scanning session.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier (UUID or timestamp-based) |
| orderIndex | number | Position in the document tray (0-based) |
| imageData | ImageData | Processed pixel data (post-warp, pre-adjustment) |
| canvasRef | HTMLCanvasElement | Canvas reference for export rendering |
| name | string (optional) | User-assigned page label (default: "Page {N}") |
| brightness | number | Brightness adjustment (-100 to +100, default 0) |
| contrast | number | Contrast adjustment (-100 to +100, default 0) |
| rotation | number | Rotation in degrees (0, 90, 180, 270) |
| enhanced | boolean | Whether B&W enhancement is applied |
| createdAt | number | Timestamp when page was captured |

**Lifecycle**: Created when user completes perspective correction for a page. Lives in memory only (session-scoped). Destroyed when document is exported or session ends.

**Validation rules**:
- `brightness` must be integer in [-100, 100]
- `contrast` must be integer in [-100, 100]
- `rotation` must be one of: 0, 90, 180, 270
- `orderIndex` must be non-negative, unique within tray

---

### DocumentTray

An ordered collection of ScanPages being assembled into a document.

| Field | Type | Description |
|-------|------|-------------|
| pages | ScanPage[] | Ordered array of scanned pages |
| documentName | string | User-editable document name (default: "Scan {date}") |
| createdAt | number | Session start timestamp |

**Lifecycle**: Created when user scans their first page. Lives in memory only. Consumed and destroyed when document is exported.

**State transitions**:
```
empty → has_pages (first page added)
has_pages → has_pages (page added/removed/reordered)
has_pages → exporting (export triggered)
exporting → exported (export complete)
has_pages → empty (all pages removed)
```

**Validation rules**:
- Must have at least 1 page to export
- Maximum 30 pages per document (memory constraint)
- `documentName` max 100 characters

**Operations**:
- `addPage(page: ScanPage)`: Append to end, set orderIndex
- `removePage(id: string)`: Remove and re-index remaining pages
- `reorderPage(fromIndex: number, toIndex: number)`: Move page and re-index
- `replacePage(id: string, newPage: ScanPage)`: Replace page content, preserve order

---

### ScanFile (existing — enhanced)

Represents a saved scan in Cloud Files. Extends the existing `ScanFile` interface.

| Field | Type | Description | New? |
|-------|------|-------------|------|
| name | string | Filename (e.g., "scan-1695043200000.pdf") | Existing |
| url | string | Cloud Files download URL | Existing |
| createdAt | string | ISO timestamp | Existing |
| pageCount | number | Number of pages (1 for JPEG, N for PDF) | **New** |
| fileType | string | MIME type ("image/jpeg" or "application/pdf") | **New** |

**Note**: `pageCount` and `fileType` are derived from the filename extension and stored alongside the file metadata during upload. No schema migration needed — new fields are additive.

---

### BatchModeState

Tracks the state of automatic batch capture mode.

| Field | Type | Description |
|-------|------|-------------|
| enabled | boolean | Whether batch mode is active |
| referenceFrame | ImageData or null | Last captured frame for scene change comparison |
| dwellTimer | number | Milliseconds edges have been stably detected |
| sceneChanged | boolean | Whether a scene change was detected since last capture |
| lastCaptureTime | number | Timestamp of most recent auto-capture |

**Lifecycle**: Created when batch mode is toggled on. Reset on each auto-capture. Destroyed when batch mode is toggled off.

**State transitions**:
```
idle → detecting (batch mode enabled, camera active)
detecting → dwelling (edges detected, dwell timer starts)
dwelling → capturing (dwell timer >= 1500ms)
capturing → cooldown (auto-capture triggered)
cooldown → waiting_scene_change (capture complete, reference frame stored)
waiting_scene_change → detecting (scene change detected)
dwelling → detecting (edges lost before dwell threshold)
```

## Relationships

```
DocumentTray 1──*  ScanPage    (ordered collection)
ScanPage     1──1  ImageData   (pixel data, in-memory only)
ScanFile     1──1  CloudFile   (persisted in Cloud Files)
BatchModeState ──> DocumentTray (auto-captured pages added to tray)
```

## Storage Summary

| Data | Storage | Persistence |
|------|---------|-------------|
| ScanPage / DocumentTray | React state (memory) | Session only |
| BatchModeState | React state (memory) | Session only |
| Exported PDF/JPEG | Cloud Files (Firebase Storage) | Permanent |
| Scan history list | Cloud Files API (via GraphQL) | Permanent |
| Document names | Cloud Files metadata | Permanent |
