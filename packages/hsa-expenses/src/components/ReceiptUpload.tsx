import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { isFileTooLarge, isHeicFile, convertHeicToJpeg } from '../utils/expenseHelpers';

interface ReceiptUploadProps {
  uploading: boolean;
  onUpload: (file: File) => void;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export default function ReceiptUpload({ uploading, onUpload }: ReceiptUploadProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateAndUpload = useCallback(
    async (file: File) => {
      setError(null);
      let processedFile = file;
      if (isHeicFile(file)) {
        try {
          processedFile = await convertHeicToJpeg(file);
        } catch {
          setError(t('hsaExpenses.invalidFileType' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
          return;
        }
      }
      if (!ACCEPTED_TYPES.includes(processedFile.type)) {
        setError(t('hsaExpenses.invalidFileType' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        return;
      }
      if (isFileTooLarge(processedFile, 5)) {
        setError(t('hsaExpenses.fileTooLarge' as any)); // eslint-disable-line @typescript-eslint/no-explicit-any
        return;
      }
      onUpload(processedFile);
    },
    [onUpload, t],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) void validateAndUpload(file);
    },
    [validateAndUpload],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void validateAndUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  if (uploading) {
    return (
      <div className="flex items-center justify-center gap-2 min-h-[80px] rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t('hsaExpenses.saving' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Drag-and-drop / click zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label={t('hsaExpenses.addReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className={`flex flex-col items-center justify-center min-h-[80px] rounded-lg border-2 border-dashed cursor-pointer transition ${
          dragOver
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
        }`}
      >
        <svg className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('hsaExpenses.addReceipt' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">JPEG, PNG, PDF, HEIC (max 5MB)</p>
      </div>

      {/* Take Photo button */}
      <button
        type="button"
        onClick={() => cameraInputRef.current?.click()}
        aria-label={t('hsaExpenses.takePhoto' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
        className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
        </svg>
        {t('hsaExpenses.takePhoto' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf,image/heic,image/heif,.heic,.heif"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
