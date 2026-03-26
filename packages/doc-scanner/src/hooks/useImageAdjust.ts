import { useCallback, useRef } from 'react';
import { applyAllAdjustments } from '../utils/imageAdjust';

export interface UseImageAdjustReturn {
  applyAdjustments: (
    imageData: ImageData,
    brightness: number,
    contrast: number,
    rotation: 0 | 90 | 180 | 270
  ) => ImageData;
  getPreview: (
    imageData: ImageData,
    brightness: number,
    contrast: number,
    rotation: 0 | 90 | 180 | 270
  ) => HTMLCanvasElement;
}

export function useImageAdjust(): UseImageAdjustReturn {
  const rafRef = useRef<number | null>(null);
  const cacheRef = useRef<{
    key: string;
    canvas: HTMLCanvasElement;
  } | null>(null);

  const getPreview = useCallback(
    (
      imageData: ImageData,
      brightness: number,
      contrast: number,
      rotation: 0 | 90 | 180 | 270
    ): HTMLCanvasElement => {
      // Cache key to avoid redundant recomputation
      const key = `${brightness}:${contrast}:${rotation}`;
      if (cacheRef.current && cacheRef.current.key === key) {
        return cacheRef.current.canvas;
      }

      // Cancel any pending RAF
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const canvas = applyAllAdjustments(imageData, brightness, contrast, rotation);
      cacheRef.current = { key, canvas };
      return canvas;
    },
    []
  );

  const applyAdjustments = useCallback(
    (
      imageData: ImageData,
      brightness: number,
      contrast: number,
      rotation: 0 | 90 | 180 | 270
    ): ImageData => {
      const canvas = applyAllAdjustments(imageData, brightness, contrast, rotation);
      const ctx = canvas.getContext('2d')!;
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    },
    []
  );

  return { applyAdjustments, getPreview };
}
