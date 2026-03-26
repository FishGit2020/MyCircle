# Quickstart: Document Scanner Enhancements

**Feature**: 016-document-scanner
**Date**: 2026-03-26

## Prerequisites

- Node.js 18+, pnpm 8+
- Existing MyCircle monorepo cloned and dependencies installed (`pnpm install`)
- Shared package built (`pnpm build:shared`)

## Setup

```bash
# Switch to feature branch
git checkout 016-document-scanner

# Install new dependency (jspdf for PDF generation)
cd packages/doc-scanner
pnpm add jspdf
cd ../..

# Rebuild shared (if i18n keys were added)
pnpm build:shared
```

## Development

```bash
# Start doc-scanner MFE in dev mode (standalone)
pnpm --filter @mycircle/doc-scanner dev

# Or start full app with all MFEs
pnpm dev
```

## Key Files to Modify

### New files to create:
- `packages/doc-scanner/src/components/PageTray.tsx` — Page thumbnail strip with drag reorder
- `packages/doc-scanner/src/components/AdjustmentPanel.tsx` — Brightness/contrast/rotation controls
- `packages/doc-scanner/src/hooks/useDocumentTray.ts` — Page collection state management
- `packages/doc-scanner/src/hooks/usePdfExport.ts` — jspdf wrapper for multi-page PDF generation
- `packages/doc-scanner/src/hooks/useImageAdjust.ts` — Brightness/contrast pixel manipulation
- `packages/doc-scanner/src/hooks/useBatchCapture.ts` — Auto-capture and scene change detection
- `packages/doc-scanner/src/utils/imageAdjust.ts` — Brightness/contrast/rotation algorithms

### Existing files to modify:
- `packages/doc-scanner/src/components/DocScanner.tsx` — Add page tray state, batch mode, new state transitions
- `packages/doc-scanner/src/components/PerspectivePreview.tsx` — Add "Add to Document" button, adjustment panel
- `packages/doc-scanner/src/components/ResultView.tsx` — Add PDF export option, format selector
- `packages/doc-scanner/src/components/CameraCapture.tsx` — Add batch mode toggle, dwell indicator
- `packages/doc-scanner/src/components/ScanHistory.tsx` — Add date grouping, search, rename
- `packages/doc-scanner/src/hooks/useScanStorage.ts` — Support PDF uploads, rename API
- i18n locale files: `packages/shared/src/locales/en.ts`, `es.ts`, `zh.ts` — New keys for all new UI strings

## Testing

```bash
# Run doc-scanner tests
pnpm --filter @mycircle/doc-scanner test:run

# Run full test suite
pnpm test:run

# Lint and typecheck
pnpm lint && pnpm typecheck
```

## Verification

After implementation, verify:

1. **PDF export**: Scan 2+ pages → Export PDF → Open in browser PDF viewer
2. **Adjustments**: Capture doc → Adjust brightness/contrast → Verify changes in export
3. **Batch mode**: Toggle on → Place documents → Verify auto-capture
4. **History**: Check date grouping, search filter, rename functionality
5. **Dark mode**: Toggle dark mode → Verify all new UI elements have dark variants
6. **i18n**: Switch language → Verify all new strings are translated
7. **Accessibility**: Tab through all new controls → Verify keyboard navigation and aria labels

## Architecture Notes

- All processing is client-side (no backend changes needed)
- jspdf is the only new dependency
- No GraphQL schema changes required
- Cloud Files upload API already supports PDF content type
- Page tray state is session-scoped (not persisted)
- Existing Web Worker infrastructure is NOT used for new features (main-thread processing)
