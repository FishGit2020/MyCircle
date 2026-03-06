import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import CameraCapture from './CameraCapture';
import EdgeOverlay from './EdgeOverlay';
import PerspectivePreview from './PerspectivePreview';
import ResultView from './ResultView';
import ScanHistory from './ScanHistory';
import { useEdgeDetection } from '../hooks/useEdgeDetection';
import { useScanStorage } from '../hooks/useScanStorage';
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

  const {
    detectEdges, warpPerspective, enhanceBW,
    corners, warpedImage, enhancedImage, isProcessing,
  } = useEdgeDetection();

  const { scans, isLoading: scansLoading, saveStatus, saveScan, deleteScan } = useScanStorage();

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
      // Clone the warped image data for enhancement
      const clone = new ImageData(
        new Uint8ClampedArray(warpedImage.data),
        warpedImage.width,
        warpedImage.height
      );
      enhanceBW(clone);
    }
  }, [warpedImage, enhanceBW]);

  // Handle save → result
  const handleSave = useCallback(async (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d')!;
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setResultImage(imgData);
    resultCanvasRef.current = canvas;
    setState('result');

    // Auto-save to Cloud Files
    await saveScan(canvas);
  }, [saveScan]);

  // Reset to capture
  const handleScanAnother = useCallback(() => {
    setState('capture');
    setCapturedImage(null);
    setAdjustedCorners(null);
    setResultImage(null);
  }, []);

  return (
    <PageContent maxWidth="4xl">
      <div className="py-4 px-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('docScanner.title')}
        </h1>

        {state === 'capture' && (
          <div className="flex flex-col items-center gap-6">
            <CameraCapture onCapture={handleCapture} />
            <ScanHistory scans={scans} isLoading={scansLoading} onDelete={deleteScan} />
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
              />
            ) : null}
          </div>
        )}

        {state === 'result' && resultImage && (
          <ResultView
            imageData={resultImage}
            saveStatus={saveStatus}
            onScanAnother={handleScanAnother}
          />
        )}
      </div>
    </PageContent>
  );
}
