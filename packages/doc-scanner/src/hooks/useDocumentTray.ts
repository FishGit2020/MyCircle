import { useState, useCallback } from 'react';
import type { ScanPage } from '../types';
import { MAX_PAGES } from '../types';

export interface UseDocumentTrayReturn {
  pages: ScanPage[];
  addPage: (imageData: ImageData, canvas: HTMLCanvasElement) => boolean;
  removePage: (id: string) => void;
  reorderPage: (fromIndex: number, toIndex: number) => void;
  replacePage: (id: string, imageData: ImageData, canvas: HTMLCanvasElement) => void;
  updateAdjustments: (id: string, adjustments: Partial<Pick<ScanPage, 'brightness' | 'contrast' | 'rotation' | 'enhanced'>>) => void;
  documentName: string;
  setDocumentName: (name: string) => void;
  clear: () => void;
  pageCount: number;
  maxReached: boolean;
}

export function useDocumentTray(): UseDocumentTrayReturn {
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [documentName, setDocumentName] = useState(
    () => `Scan ${new Date().toLocaleDateString()}`
  );

  const addPage = useCallback((imageData: ImageData, canvas: HTMLCanvasElement): boolean => {
    let added = false;
    setPages(prev => {
      if (prev.length >= MAX_PAGES) return prev;
      added = true;
      const newPage: ScanPage = {
        id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        orderIndex: prev.length,
        imageData,
        canvasRef: canvas,
        name: `Page ${prev.length + 1}`,
        brightness: 0,
        contrast: 0,
        rotation: 0,
        enhanced: false,
        createdAt: Date.now(),
      };
      return [...prev, newPage];
    });
    return added;
  }, []);

  const removePage = useCallback((id: string) => {
    setPages(prev =>
      prev
        .filter(p => p.id !== id)
        .map((p, i) => ({ ...p, orderIndex: i }))
    );
  }, []);

  const reorderPage = useCallback((fromIndex: number, toIndex: number) => {
    setPages(prev => {
      if (fromIndex < 0 || fromIndex >= prev.length) return prev;
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      if (fromIndex === toIndex) return prev;

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((p, i) => ({ ...p, orderIndex: i }));
    });
  }, []);

  const replacePage = useCallback((id: string, imageData: ImageData, canvas: HTMLCanvasElement) => {
    setPages(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, imageData, canvasRef: canvas, brightness: 0, contrast: 0, rotation: 0, enhanced: false }
          : p
      )
    );
  }, []);

  const updateAdjustments = useCallback(
    (id: string, adjustments: Partial<Pick<ScanPage, 'brightness' | 'contrast' | 'rotation' | 'enhanced'>>) => {
      setPages(prev =>
        prev.map(p => (p.id === id ? { ...p, ...adjustments } : p))
      );
    },
    []
  );

  const clear = useCallback(() => {
    setPages([]);
    setDocumentName(`Scan ${new Date().toLocaleDateString()}`);
  }, []);

  return {
    pages,
    addPage,
    removePage,
    reorderPage,
    replacePage,
    updateAdjustments,
    documentName,
    setDocumentName: useCallback((name: string) => {
      setDocumentName(name.slice(0, 100));
    }, []),
    clear,
    pageCount: pages.length,
    maxReached: pages.length >= MAX_PAGES,
  };
}
