import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface PerspectivePreviewProps {
  warpedImage: ImageData;
  enhancedImage: ImageData | null;
  isProcessing: boolean;
  onEnhanceToggle: (enhanced: boolean) => void;
  onSave: (canvas: HTMLCanvasElement) => void;
  onRetake: () => void;
}

export default function PerspectivePreview({
  warpedImage,
  enhancedImage,
  isProcessing,
  onEnhanceToggle,
  onSave,
  onRetake,
}: PerspectivePreviewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [enhanced, setEnhanced] = useState(false);

  const displayImage = enhanced && enhancedImage ? enhancedImage : warpedImage;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = displayImage.width;
    canvas.height = displayImage.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(displayImage, 0, 0);
  }, [displayImage]);

  const handleToggleEnhance = () => {
    const next = !enhanced;
    setEnhanced(next);
    onEnhanceToggle(next);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) onSave(canvas);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-lg">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          data-testid="preview-canvas"
        />
      </div>

      <div className="flex gap-3 flex-wrap justify-center">
        <button
          type="button"
          onClick={handleToggleEnhance}
          disabled={isProcessing}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            enhanced
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
          } disabled:opacity-50`}
        >
          {isProcessing ? t('docScanner.processing') : (enhanced ? t('docScanner.enhanceColor') : t('docScanner.enhanceBW'))}
        </button>

        <button
          type="button"
          onClick={onRetake}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
        >
          {t('docScanner.retake')}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-medium disabled:opacity-50"
        >
          {t('docScanner.save')}
        </button>
      </div>
    </div>
  );
}
