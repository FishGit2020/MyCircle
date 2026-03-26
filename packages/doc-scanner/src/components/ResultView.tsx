import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ScanPage } from '../types';

interface ResultViewProps {
  imageData: ImageData;
  saveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  onScanAnother: () => void;
  pageCount?: number;
  pages?: ScanPage[];
  onExportPdf?: () => void;
  isPdfExporting?: boolean;
  onClearTray?: () => void;
}

export default function ResultView({
  imageData,
  saveStatus,
  onScanAnother,
  pageCount = 0,
  pages,
  onExportPdf,
  isPdfExporting = false,
  onClearTray,
}: ResultViewProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [exportFormat, setExportFormat] = useState<'jpeg' | 'pdf'>(
    pageCount > 1 ? 'pdf' : 'jpeg'
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d')!;
    ctx.putImageData(imageData, 0, 0);
  }, [imageData]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/jpeg', 0.85);
  }, []);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', 0.85)
    );
    if (!blob) return;

    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Scanned Document' });
          return;
        } catch {
          // User cancelled — fall through to download
        }
      }
    }

    handleDownload();
  }, [handleDownload]);

  const handleScanAnother = useCallback(() => {
    if (onClearTray) onClearTray();
    onScanAnother();
  }, [onScanAnother, onClearTray]);

  const hasMultiplePages = pageCount > 1 && pages && pages.length > 1;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full max-w-lg">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg shadow-lg"
          data-testid="result-canvas"
        />
      </div>

      {/* Page count indicator */}
      {hasMultiplePages && (
        <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
          {t('docScanner.pageCount', { count: pageCount })}
        </div>
      )}

      {/* Auto-save status */}
      <div className="text-sm">
        {saveStatus === 'saving' && (
          <span className="text-blue-600 dark:text-blue-400">{t('docScanner.saving')}</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-green-600 dark:text-green-400">{t('docScanner.saved')}</span>
        )}
        {saveStatus === 'failed' && (
          <span className="text-red-600 dark:text-red-400">{t('docScanner.saveFailed')}</span>
        )}
      </div>

      {/* Format selector for multi-page documents */}
      {hasMultiplePages && (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setExportFormat('jpeg')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition min-h-[36px] ${
              exportFormat === 'jpeg'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t('docScanner.formatJpeg')}
          </button>
          <button
            type="button"
            onClick={() => setExportFormat('pdf')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition min-h-[36px] ${
              exportFormat === 'pdf'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {t('docScanner.formatPdf')}
          </button>
        </div>
      )}

      <div className="flex gap-3 flex-wrap justify-center">
        {/* PDF Export button */}
        {(hasMultiplePages && exportFormat === 'pdf' && onExportPdf) ? (
          <button
            type="button"
            onClick={onExportPdf}
            disabled={isPdfExporting}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition font-medium disabled:opacity-50 min-h-[44px]"
          >
            {isPdfExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                {t('docScanner.exportingPdf')}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {t('docScanner.exportPdf')}
              </>
            )}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('docScanner.download')}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              {t('docScanner.share')}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleScanAnother}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium min-h-[44px]"
        >
          {t('docScanner.scanAnother')}
        </button>
      </div>
    </div>
  );
}
