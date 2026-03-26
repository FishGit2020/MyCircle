# Component Interface Contracts: Document Scanner Enhancements

**Feature**: 016-document-scanner
**Date**: 2026-03-26

These contracts define the interfaces between components in the enhanced doc-scanner MFE. All interfaces extend or modify the existing component prop patterns.

## PageTray Component

New component displaying the ordered list of scanned pages.

```typescript
interface PageTrayProps {
  pages: ScanPage[];
  activePageId: string | null;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSelect: (pageId: string) => void;
  onDelete: (pageId: string) => void;
  onAddPage: () => void;
}
```

**Rendering**: Horizontal scrollable strip of page thumbnails. Each thumbnail shows:
- Page number badge (top-left)
- Thumbnail image (aspect 3:4)
- Delete button (top-right, visible on hover/long-press)
- Active page highlighted with border
- "+" button at end to add new page

---

## AdjustmentPanel Component

New component providing image adjustment sliders.

```typescript
interface AdjustmentPanelProps {
  brightness: number;           // -100 to 100
  contrast: number;             // -100 to 100
  rotation: number;             // 0, 90, 180, 270
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onRotate: () => void;         // Increments by 90 degrees
  onReset: () => void;          // Resets all to defaults
}
```

**Rendering**: Collapsible panel below preview image with:
- Brightness slider with label and numeric value
- Contrast slider with label and numeric value
- Rotate button (clockwise icon)
- Reset button

---

## PerspectivePreview (enhanced)

Existing component with added adjustment support.

```typescript
// Additions to existing PerspectivePreviewProps
interface PerspectivePreviewProps {
  // ... existing props unchanged ...
  onSave: (canvas: HTMLCanvasElement) => void;
  onAddToDocument: (canvas: HTMLCanvasElement) => void;  // NEW: adds page to tray
  showAddToDocument: boolean;                             // NEW: show multi-page button
}
```

---

## ResultView (enhanced)

Existing component with PDF export option.

```typescript
// Additions to existing ResultViewProps
interface ResultViewProps {
  // ... existing props unchanged ...
  pageCount: number;                    // NEW: total pages in document
  onExportPdf: () => void;             // NEW: triggers PDF export
  isPdfExporting: boolean;             // NEW: PDF generation in progress
  exportFormat: 'jpeg' | 'pdf';        // NEW: selected export format
  onFormatChange: (format: 'jpeg' | 'pdf') => void;  // NEW
}
```

---

## CameraCapture (enhanced)

Existing component with batch mode toggle.

```typescript
// Additions to existing CameraCaptureProps
interface CameraCaptureProps {
  // ... existing props unchanged ...
  batchMode: boolean;                   // NEW: batch mode state
  onBatchModeToggle: (enabled: boolean) => void;  // NEW
  pageCount: number;                    // NEW: shows page count in tray
  autoCaptureProgress: number;          // NEW: 0-100, dwell timer progress
}
```

---

## ScanHistory (enhanced)

Existing component with grouping and search.

```typescript
// Additions to existing ScanHistoryProps
interface ScanHistoryProps {
  // ... existing props unchanged ...
  onRename: (fileName: string, newName: string) => void;  // NEW
  searchQuery: string;                                       // NEW
  onSearchChange: (query: string) => void;                  // NEW
}
```

---

## Hook Contracts

### usePdfExport

New hook for PDF generation.

```typescript
interface UsePdfExportReturn {
  exportPdf: (pages: ScanPage[], documentName: string) => Promise<Blob>;
  isExporting: boolean;
  error: string | null;
}
```

### useImageAdjust

New hook for brightness/contrast/rotation processing.

```typescript
interface UseImageAdjustReturn {
  applyAdjustments: (
    imageData: ImageData,
    brightness: number,
    contrast: number,
    rotation: number
  ) => ImageData;
  getPreview: (
    imageData: ImageData,
    brightness: number,
    contrast: number,
    rotation: number
  ) => HTMLCanvasElement;
}
```

### useBatchCapture

New hook for batch mode logic.

```typescript
interface UseBatchCaptureReturn {
  batchEnabled: boolean;
  toggleBatch: (enabled: boolean) => void;
  dwellProgress: number;           // 0-100
  sceneChanged: boolean;
  startMonitoring: (videoElement: HTMLVideoElement) => void;
  stopMonitoring: () => void;
}
```

### useDocumentTray

New hook for page tray state management.

```typescript
interface UseDocumentTrayReturn {
  pages: ScanPage[];
  addPage: (imageData: ImageData, canvas: HTMLCanvasElement) => void;
  removePage: (id: string) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  replacePage: (id: string, imageData: ImageData, canvas: HTMLCanvasElement) => void;
  updateAdjustments: (id: string, adjustments: Partial<ScanPage>) => void;
  documentName: string;
  setDocumentName: (name: string) => void;
  clear: () => void;
  pageCount: number;
}
```
