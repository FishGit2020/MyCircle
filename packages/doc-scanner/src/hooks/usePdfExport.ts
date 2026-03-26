import { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import type { ScanPage } from '../types';
import { applyAllAdjustments } from '../utils/imageAdjust';

export interface UsePdfExportReturn {
  exportPdf: (pages: ScanPage[], documentName: string) => Promise<Blob>;
  isExporting: boolean;
  error: string | null;
}

export function usePdfExport(): UsePdfExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = useCallback(async (pages: ScanPage[], _documentName: string): Promise<Blob> => {
    setIsExporting(true);
    setError(null);

    try {
      if (pages.length === 0) {
        throw new Error('No pages to export');
      }

      // Use first page dimensions to initialize PDF
      const firstPage = pages[0];
      const firstCanvas = pageToCanvas(firstPage);
      const orientation = firstCanvas.width > firstCanvas.height ? 'landscape' : 'portrait';

      const doc = new jsPDF({
        orientation,
        unit: 'px',
        format: [firstCanvas.width, firstCanvas.height],
      });

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        const canvas = pageToCanvas(page);

        if (i > 0) {
          const pageOrientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
          doc.addPage([canvas.width, canvas.height], pageOrientation);
        }

        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        doc.addImage(jpegDataUrl, 'JPEG', 0, 0, canvas.width, canvas.height);
      }

      const blob = doc.output('blob');
      return blob;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'PDF generation failed';
      setError(message);
      throw err;
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportPdf, isExporting, error };
}

/** Render a ScanPage's imageData onto a canvas with adjustments applied. */
function pageToCanvas(page: ScanPage): HTMLCanvasElement {
  const hasAdjustments = page.brightness !== 0 || page.contrast !== 0 || page.rotation !== 0;
  if (hasAdjustments) {
    return applyAllAdjustments(page.imageData, page.brightness, page.contrast, page.rotation);
  }
  const canvas = document.createElement('canvas');
  canvas.width = page.imageData.width;
  canvas.height = page.imageData.height;
  const ctx = canvas.getContext('2d')!;
  ctx.putImageData(page.imageData, 0, 0);
  return canvas;
}
