import { useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FileItem, SharedFileItem } from '../types';

interface FilePreviewModalProps {
  file: FileItem | SharedFileItem | null;
  onClose: () => void;
}

export default function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!file) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [file, onClose]);

  if (!file) return null;

  const isImage = file.contentType.startsWith('image/');
  const isPdf = file.contentType === 'application/pdf';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('cloudFiles.preview')}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate mr-4">{file.fileName}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cloudFiles.closePreview')}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-0">
          {isImage ? (
            <img
              src={file.downloadUrl}
              alt={file.fileName}
              className="max-h-full max-w-full object-contain rounded"
            />
          ) : isPdf ? (
            <iframe
              src={file.downloadUrl}
              title={file.fileName}
              className="w-full h-[70vh] border-0 rounded"
            />
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('cloudFiles.previewNotSupported')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
