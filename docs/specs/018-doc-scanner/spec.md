# Feature Spec: Doc Scanner

**Status**: Implemented
**Package**: `packages/doc-scanner`
**Route**: `/doc-scanner`
**Port**: 3021

## Summary

Document scanning application using the device camera with automatic edge detection, perspective correction, and black-and-white enhancement. Scanned documents can be saved to Cloud Files. Processing is performed client-side using Canvas API and Web Workers for performance.

## Key Features

- Camera capture with live preview
- Automatic edge detection for document boundaries
- Manual corner adjustment via draggable overlay (EdgeOverlay)
- Perspective correction (4-point transform)
- Black-and-white enhancement for clean document output
- Scan history for reviewing previous scans
- Result preview before saving
- Integration with Cloud Files for saving scanned documents

## Data Sources

- **Camera API**: `getUserMedia` for live camera feed
- **Canvas API**: Image processing (perspective transform, B&W conversion)
- **Web Worker**: Off-main-thread image processing in `workers/` directory
- **Cross-MFE**: Saves scanned documents to Cloud Files

## Integration Points

- **Shell route**: `/doc-scanner` in App.tsx (requires auth)
- **Widget**: `docScanner` in widgetConfig.ts
- **Nav group**: Workspace (`nav.group.workspace`)
- **i18n namespace**: `nav.docScanner`, `docScanner.*`
- **Cross-MFE**: Cloud Files bridge for saving scanned documents

## Tech Stack

- React 18, TypeScript, Tailwind CSS
- Canvas API for image manipulation and perspective correction
- Web Workers for off-main-thread processing (`workers/` directory)
- MediaDevices API (`getUserMedia`) for camera access
- Custom hooks for scanner state management
- Utility functions in `utils/` directory

## Testing

- Unit tests: `packages/doc-scanner/src/**/*.test.{ts,tsx}`
- E2E: `e2e/doc-scanner.spec.ts`
