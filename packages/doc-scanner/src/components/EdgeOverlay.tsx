import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Point } from '../utils/contourTrace';
import { useCornerDrag } from '../hooks/useCornerDrag';

interface EdgeOverlayProps {
  imageData: ImageData;
  initialCorners: Point[];
  onConfirm: (corners: Point[]) => void;
  onRetake: () => void;
}

export default function EdgeOverlay({ imageData, initialCorners, onConfirm, onRetake }: EdgeOverlayProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasRect, setCanvasRect] = useState<{ width: number; height: number; left: number; top: number } | null>(null);

  const imageSize = { width: imageData.width, height: imageData.height };
  const { corners, setCorners, activeCorner, handlePointerDown, handlePointerMove, handlePointerUp } = useCornerDrag(
    initialCorners,
    canvasRect,
    imageSize
  );

  // Update corners when initialCorners change
  useEffect(() => {
    setCorners(initialCorners);
  }, [initialCorners, setCorners]);

  // Draw image and overlay
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);

    // Draw semi-transparent overlay outside the quad
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear the quad area
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.clip();
    ctx.putImageData(imageData, 0, 0);
    ctx.restore();

    // Draw quad outline
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    // Draw corner handles
    corners.forEach((corner, i) => {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 12, 0, Math.PI * 2);
      ctx.fillStyle = i === activeCorner ? '#2563eb' : '#3b82f6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [imageData, corners, activeCorner]);

  // Track canvas rect for pointer calculations
  const updateCanvasRect = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      setCanvasRect({ width: rect.width, height: rect.height, left: rect.left, top: rect.top });
    }
  }, []);

  useEffect(() => {
    updateCanvasRect();
    window.addEventListener('resize', updateCanvasRect);
    return () => window.removeEventListener('resize', updateCanvasRect);
  }, [updateCanvasRect]);

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('docScanner.adjustCorners')}</p>

      <div ref={containerRef} className="relative w-full max-w-lg touch-none">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          data-testid="edge-overlay-canvas"
        />

        {/* Invisible touch targets for corners */}
        {corners.map((corner, i) => {
          if (!canvasRect) return null;
          const scaleX = canvasRect.width / imageSize.width;
          const scaleY = canvasRect.height / imageSize.height;
          return (
            <div
              key={i}
              className="absolute w-11 h-11 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
              style={{
                left: `${corner.x * scaleX}px`,
                top: `${corner.y * scaleY}px`,
              }}
              onPointerDown={(e) => handlePointerDown(e, i)}
              data-testid={`corner-handle-${i}`}
            />
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onRetake}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
        >
          {t('docScanner.retake')}
        </button>
        <button
          type="button"
          onClick={() => onConfirm(corners)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
        >
          {t('docScanner.confirm')}
        </button>
      </div>
    </div>
  );
}
