import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { isAllowedFileType, isFileTooLarge } from '../utils/fileHelpers';

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);

    if (!isAllowedFileType(file.type)) {
      setUploadError(t('cloudFiles.unsupportedType'));
      return;
    }
    if (isFileTooLarge(file.size)) {
      setUploadError(t('cloudFiles.fileTooLarge'));
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      setUploadError(t('cloudFiles.uploadError'));
    } finally {
      setUploading(false);
    }
  }, [onUpload, t]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [handleFile]);

  return (
    <div className="mb-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-6 text-center transition-colors
          ${dragActive
            ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-cyan-300 dark:hover:border-cyan-600'
          }
        `}
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-300">{t('cloudFiles.uploading')}</span>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('cloudFiles.dragDropHint')}{' '}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
              >
                {t('cloudFiles.browseFiles')}
              </button>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('cloudFiles.maxFileSize')}</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleChange}
          aria-label={t('cloudFiles.upload')}
        />
      </div>
      {uploadError && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-2">{uploadError}</p>
      )}
    </div>
  );
}
