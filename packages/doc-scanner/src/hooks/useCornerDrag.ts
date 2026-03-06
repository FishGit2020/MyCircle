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
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = useCallback((e: React.PointerEvent, cornerIndex: number) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActiveCorner(cornerIndex);
    if (canvasRect) {
      const scaleX = imageSize.width / canvasRect.width;
      const scaleY = imageSize.height / canvasRect.height;
      const imgX = (e.clientX - canvasRect.left) * scaleX;
      const imgY = (e.clientY - canvasRect.top) * scaleY;
      offsetRef.current = {
        x: corners[cornerIndex].x - imgX,
        y: corners[cornerIndex].y - imgY,
      };
    }
  }, [corners, canvasRect, imageSize]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (activeCorner === null || !canvasRect) return;

    const scaleX = imageSize.width / canvasRect.width;
    const scaleY = imageSize.height / canvasRect.height;
    const imgX = (e.clientX - canvasRect.left) * scaleX + offsetRef.current.x;
    const imgY = (e.clientY - canvasRect.top) * scaleY + offsetRef.current.y;

    const clampedX = Math.max(0, Math.min(imageSize.width - 1, Math.round(imgX)));
    const clampedY = Math.max(0, Math.min(imageSize.height - 1, Math.round(imgY)));

    setCorners(prev => {
      const next = [...prev];
      next[activeCorner] = { x: clampedX, y: clampedY };
      return next;
    });
  }, [activeCorner, canvasRect, imageSize]);

  const handlePointerUp = useCallback(() => {
    setActiveCorner(null);
  }, []);

  return { corners, setCorners, activeCorner, handlePointerDown, handlePointerMove, handlePointerUp };
}
