import { useState, useCallback, useRef } from 'react';
import type { Point } from '../utils/contourTrace';

interface UseCornerDragReturn {
  corners: Point[];
  setCorners: (corners: Point[]) => void;
  activeCorner: number | null;
  handlePointerDown: (e: React.PointerEvent, cornerIndex: number) => void;
  handlePointerMove: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
}

export function useCornerDrag(
  initialCorners: Point[],
  canvasRect: { width: number; height: number; left: number; top: number } | null,
  imageSize: { width: number; height: number }
): UseCornerDragReturn {
  const [corners, setCorners] = useState<Point[]>(initialCorners);
  const [activeCorner, setActiveCorner] = useState<number | null>(null);

  // Use refs to avoid stale closures in pointer event handlers
  const activeCornerRef = useRef<number | null>(null);
  const canvasRectRef = useRef(canvasRect);
  const imageSizeRef = useRef(imageSize);
  const cornersRef = useRef(corners);

  canvasRectRef.current = canvasRect;
  imageSizeRef.current = imageSize;
  cornersRef.current = corners;

  const handlePointerDown = useCallback((e: React.PointerEvent, cornerIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    activeCornerRef.current = cornerIndex;
    setActiveCorner(cornerIndex);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const idx = activeCornerRef.current;
    const rect = canvasRectRef.current;
    const imgSize = imageSizeRef.current;
    if (idx === null || !rect) return;

    const scaleX = imgSize.width / rect.width;
    const scaleY = imgSize.height / rect.height;
    const imgX = (e.clientX - rect.left) * scaleX;
    const imgY = (e.clientY - rect.top) * scaleY;

    const clampedX = Math.max(0, Math.min(imgSize.width - 1, Math.round(imgX)));
    const clampedY = Math.max(0, Math.min(imgSize.height - 1, Math.round(imgY)));

    setCorners(prev => {
      const next = [...prev];
      next[idx] = { x: clampedX, y: clampedY };
      return next;
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    activeCornerRef.current = null;
    setActiveCorner(null);
  }, []);

  return { corners, setCorners, activeCorner, handlePointerDown, handlePointerMove, handlePointerUp };
}
