import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { isFileTooLarge } from '../utils/expenseHelpers';

interface ReceiptUploadProps {
  receiptUrl: string | null;
  receiptContentType: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function ReceiptUpload({
  receiptUrl,
  receiptContentType,
  uploading,
  onUpload,
  onDelete,
}: ReceiptUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndUpload = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(t('hsaExpenses.invalidFileType' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        return;
      }
      if (isFileTooLarge(file, 5)) {
        setError(t('hsaExpenses.fileTooLarge' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        return;
      }
      onUpload(file);
    },
    [onUpload, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndUpload(file);
    },
    [validateAndUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Show existing receipt preview
  if (receiptUrl) {
    const isImage = receiptContentType?.startsWith('image/');
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <div className="relative inline-block">
          {isImage ? (
            <img
              src={receiptUrl}
              alt={t('hsaExpenses.receipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
              className="max-w-[200px] max-h-[200px] rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
            />
          ) : (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              {/* PDF icon */}
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-600 dark:text-gray-400">PDF</span>
            </div>
          )}
          <button
            type="button"
            onClick={onDelete}
            className="absolute -top-2 -right-2 min-h-[28px] min-w-[28px] flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow"
            aria-label={t('hsaExpenses.deleteExpense' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Upload zone
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('hsaExpenses.receipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </p>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label={t('hsaExpenses.uploadReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className={`flex flex-col items-center justify-center min-h-[120px] rounded-lg border-2 border-dashed cursor-pointer transition ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
        }`}
      >
        {uploading ? (
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {t('hsaExpenses.saving' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
          </div>
        ) : (
          <>
            <svg className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('hsaExpenses.uploadReceipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              JPEG, PNG, PDF (max 5MB)
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
