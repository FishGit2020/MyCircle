import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { AdjustmentPanel } from './AdjustmentPanel';
import { useImageAdjust } from '../hooks/useImageAdjust';

interface PerspectivePreviewProps {
  warpedImage: ImageData;
  enhancedImage: ImageData | null;
  isProcessing: boolean;
  onEnhanceToggle: (enhanced: boolean) => void;
  onSave: (canvas: HTMLCanvasElement) => void;
  onRetake: () => void;
  onAddToDocument?: (canvas: HTMLCanvasElement) => void;
  showAddToDocument?: boolean;
}

export default function PerspectivePreview({
  warpedImage,
  enhancedImage,
  isProcessing,
  onEnhanceToggle,
  onSave,
  onRetake,
  onAddToDocument,
  showAddToDocument = false,
}: PerspectivePreviewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [showAdjust, setShowAdjust] = useState(false);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);

  const { getPreview } = useImageAdjust();

  const baseImage = enhanced && enhancedImage ? enhancedImage : warpedImage;
  const hasAdjustments = brightness !== 0 || contrast !== 0 || rotation !== 0;

  // Render preview with adjustments
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hasAdjustments) {
      const adjusted = getPreview(baseImage, brightness, contrast, rotation);
      canvas.width = adjusted.width;
      canvas.height = adjusted.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(adjusted, 0, 0);
    } else {
      canvas.width = baseImage.width;
      canvas.height = baseImage.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(baseImage, 0, 0);
    }
  }, [baseImage, brightness, contrast, rotation, hasAdjustments, getPreview]);

  const handleToggleEnhance = () => {
    const next = !enhanced;
    setEnhanced(next);
    onEnhanceToggle(next);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas);
  };

  const handleAddToDocument = () => {
    const canvas = canvasRef.current;
    if (canvas && onAddToDocument) onAddToDocument(canvas);
  };

  const handleRotate = useCallback(() => {
    setRotation(prev => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
  }, []);

  const handleReset = useCallback(() => {
    setBrightness(0);
    setContrast(0);
    setRotation(0);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-lg">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          data-testid="preview-canvas"
        />
      </div>

      {/* Adjustment panel (collapsible) */}
      {showAdjust && (
        <div className="w-full max-w-lg">
          <AdjustmentPanel
            brightness={brightness}
            contrast={contrast}
            rotation={rotation}
            onBrightnessChange={setBrightness}
            onContrastChange={setContrast}
            onRotate={handleRotate}
            onReset={handleReset}
          />
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={handleToggleEnhance}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition min-h-[44px] ${
            enhanced
              ? 'bg-blue-500 dark:bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          {isProcessing ? t('docScanner.processing') : (enhanced ? t('docScanner.enhanceColor') : t('docScanner.enhanceBW'))}
        </button>

        <button
          type="button"
          onClick={() => setShowAdjust(prev => !prev)}
          className={`px-4 py-2 rounded-lg font-medium transition min-h-[44px] ${
            showAdjust
              ? 'bg-blue-500 dark:bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label={t('docScanner.adjust')}
          aria-expanded={showAdjust}
        >
          {t('docScanner.adjust')}
        </button>

        <button
          type="button"
          onClick={onRetake}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium min-h-[44px]"
        >
          {t('docScanner.retake')}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-medium disabled:opacity-50 min-h-[44px]"
        >
          {t('docScanner.save')}
        </button>

        {showAddToDocument && (
          <button
            type="button"
            onClick={handleAddToDocument}
            disabled={isProcessing}
            className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition font-medium disabled:opacity-50 min-h-[44px]"
          >
            {t('docScanner.addToDocument')}
          </button>
        )}
      </div>
    </div>
  );
}
