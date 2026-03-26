import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import CameraCapture from './CameraCapture';
import EdgeOverlay from './EdgeOverlay';
import PerspectivePreview from './PerspectivePreview';
import ResultView from './ResultView';
import ScanHistory from './ScanHistory';
import { PageTray } from './PageTray';
import { useEdgeDetection } from '../hooks/useEdgeDetection';
import { useScanStorage } from '../hooks/useScanStorage';
import { useDocumentTray } from '../hooks/useDocumentTray';
import { usePdfExport } from '../hooks/usePdfExport';
import { useBatchCapture } from '../hooks/useBatchCapture';
import { estimateOutputSize } from '../utils/perspectiveTransform';
import type { Point } from '../utils/contourTrace';

type ScanState = 'capture' | 'detect' | 'adjust' | 'preview' | 'result';

export default function DocScanner() {
  const { t } = useTranslation();
  const [state, setState] = useState<ScanState>('capture');
  const [capturedImage, setCapturedImage] = useState<ImageData | null>(null);
  const [adjustedCorners, setAdjustedCorners] = useState<Point[] | null>(null);
  const [resultImage, setResultImage] = useState<ImageData | null>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePageId, setActivePageId] = useState<string | null>(null);

  const {
    detectEdges, warpPerspective, enhanceBW,
    corners, warpedImage, enhancedImage, isProcessing,
  } = useEdgeDetection();

  const { scans, isLoading: scansLoading, saveStatus, saveScan, savePdf, deleteScan, renameScan } = useScanStorage();

  const tray = useDocumentTray();
  const { exportPdf, isExporting: isPdfExporting } = usePdfExport();

  // Auto-capture handler for batch mode — adds page directly to tray
  const handleAutoCapture = useCallback((imageData: ImageData) => {
    // In batch mode, skip manual corner adjustment — use full image
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext('2d')!.putImageData(imageData, 0, 0);
    tray.addPage(imageData, canvas);
  }, [tray]);

  const batch = useBatchCapture(handleAutoCapture);

  // Beforeunload warning when tray has pages (FR-027)
  useEffect(() => {
    if (tray.pageCount === 0) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [tray.pageCount]);

  // Handle capture → detect
  const handleCapture = useCallback((imageData: ImageData) => {
    setCapturedImage(imageData);
    setState('detect');
    detectEdges(imageData);
  }, [detectEdges]);

  // When edges detected → adjust
  useEffect(() => {
    if (state === 'detect' && corners !== undefined && !isProcessing) {
      const defaultCorners: Point[] = capturedImage
        ? [
            { x: Math.round(capturedImage.width * 0.1), y: Math.round(capturedImage.height * 0.1) },
            { x: Math.round(capturedImage.width * 0.9), y: Math.round(capturedImage.height * 0.1) },
            { x: Math.round(capturedImage.width * 0.9), y: Math.round(capturedImage.height * 0.9) },
            { x: Math.round(capturedImage.width * 0.1), y: Math.round(capturedImage.height * 0.9) },
          ]
        : [];

      setAdjustedCorners(corners || defaultCorners);
      setState('adjust');
    }
  }, [state, corners, isProcessing, capturedImage]);

  // Handle confirm corners → warp
  const handleConfirmCorners = useCallback((crns: Point[]) => {
    if (!capturedImage) return;
    setState('preview');
    const { width, height } = estimateOutputSize(crns);
    warpPerspective(capturedImage, crns, width, height);
  }, [capturedImage, warpPerspective]);

  // Handle enhance toggle
  const handleEnhanceToggle = useCallback((enhanced: boolean) => {
    if (enhanced && warpedImage) {
      const clone = new ImageData(
        new Uint8ClampedArray(warpedImage.data),
        warpedImage.width,
        warpedImage.height
      );
      enhanceBW(clone);
    }
  }, [warpedImage, enhanceBW]);

  // Handle save (single page) → result
  const handleSave = useCallback(async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setResultImage(imgData);
    resultCanvasRef.current = canvas;
    setState('result');
    await saveScan(canvas);
  }, [saveScan]);

  // Handle "Add to Document" — adds page to tray and returns to capture
  const handleAddToDocument = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    tray.addPage(imgData, canvas);
    // Return to capture mode for next page
    setState('capture');
    setCapturedImage(null);
    setAdjustedCorners(null);
  }, [tray]);

  // Reset to capture (preserves tray)
  const handleScanAnother = useCallback(() => {
    setState('capture');
    setCapturedImage(null);
    setAdjustedCorners(null);
    setResultImage(null);
  }, []);

  // Handle finishing multi-page document → go to result with tray data
  const handleFinishDocument = useCallback(() => {
    if (tray.pageCount === 0) return;
    // Use the last page image as the result preview
    const lastPage = tray.pages[tray.pages.length - 1];
    setResultImage(lastPage.imageData);
    setState('result');
  }, [tray.pages, tray.pageCount]);

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    if (tray.pageCount === 0) return;
    try {
      const blob = await exportPdf(tray.pages, tray.documentName);
      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tray.documentName.replace(/[^a-zA-Z0-9-_ ]/g, '')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      // Auto-save to Cloud Files
      await savePdf(blob, tray.pageCount);
    } catch {
      // Fallback: download individual JPEG files
      for (let i = 0; i < tray.pages.length; i++) {
        const page = tray.pages[i];
        const canvas = document.createElement('canvas');
        canvas.width = page.imageData.width;
        canvas.height = page.imageData.height;
        canvas.getContext('2d')!.putImageData(page.imageData, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${tray.documentName}-page${i + 1}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }, 'image/jpeg', 0.85);
      }
    }
  }, [tray.pages, tray.pageCount, tray.documentName, exportPdf, savePdf]);

  // Page tray interactions
  const handleTraySelect = useCallback((pageId: string) => {
    setActivePageId(pageId);
  }, []);

  const handleTrayAddPage = useCallback(() => {
    setState('capture');
    setCapturedImage(null);
    setAdjustedCorners(null);
  }, []);

  const showPageTray = tray.pageCount > 0 && state !== 'result';

  return (
    <PageContent maxWidth="4xl">
      <div className="py-4 px-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('docScanner.title')}
        </h1>

        {state === 'capture' && (
          <div className="flex flex-col items-center gap-6">
            <CameraCapture
              onCapture={handleCapture}
              batchMode={batch.batchEnabled}
              onBatchModeToggle={batch.toggleBatch}
              pageCount={tray.pageCount}
              autoCaptureProgress={batch.dwellProgress}
            />
            {tray.pageCount > 0 && (
              <button
                type="button"
                className="w-full max-w-md py-3 px-4 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-medium rounded-lg transition-colors min-h-[44px]"
                onClick={handleFinishDocument}
              >
                {t('docScanner.exportPdf')} ({tray.pageCount} {t('docScanner.pageCount', { count: tray.pageCount })})
              </button>
            )}
            <ScanHistory scans={scans} isLoading={scansLoading} onDelete={deleteScan} onRename={renameScan} />
          </div>
        )}

        {state === 'detect' && (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
            <p className="text-gray-600 dark:text-gray-400">{t('docScanner.detecting')}</p>
          </div>
        )}

        {state === 'adjust' && capturedImage && adjustedCorners && (
          <div>
            {!corners && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-300 text-sm text-center">
                {t('docScanner.noDocumentDetected')}
              </div>
            )}
            <EdgeOverlay
              imageData={capturedImage}
              initialCorners={adjustedCorners}
              onConfirm={handleConfirmCorners}
              onRetake={handleScanAnother}
            />
          </div>
        )}

        {state === 'preview' && (
          <div>
            {isProcessing && !warpedImage ? (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
                <p className="text-gray-600 dark:text-gray-400">{t('docScanner.processing')}</p>
              </div>
            ) : warpedImage ? (
              <PerspectivePreview
                warpedImage={warpedImage}
                enhancedImage={enhancedImage}
                isProcessing={isProcessing}
                onEnhanceToggle={handleEnhanceToggle}
                onSave={handleSave}
                onRetake={handleScanAnother}
                onAddToDocument={handleAddToDocument}
                showAddToDocument={true}
              />
            ) : null}
          </div>
        )}

        {state === 'result' && resultImage && (
          <ResultView
            imageData={resultImage}
            saveStatus={saveStatus}
            onScanAnother={handleScanAnother}
            pageCount={tray.pageCount}
            pages={tray.pages}
            onClearTray={tray.clear}
            onExportPdf={handleExportPdf}
            isPdfExporting={isPdfExporting}
          />
        )}

        {/* Page tray — shown in all states except result */}
        {showPageTray && (
          <div className="mt-4">
            <PageTray
              pages={tray.pages}
              activePageId={activePageId}
              onReorder={tray.reorderPage}
              onSelect={handleTraySelect}
              onDelete={tray.removePage}
              onAddPage={handleTrayAddPage}
              maxReached={tray.maxReached}
            />
          </div>
        )}
      </div>
    </PageContent>
  );
}
