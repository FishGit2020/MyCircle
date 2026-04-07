import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { HSAReceipt } from '../types';
import ReceiptUpload from './ReceiptUpload';

interface ReceiptGridProps {
  receipts: HSAReceipt[];
  uploading: boolean;
  trashing: boolean;
  deleting: boolean;
  onUpload: (file: File) => void;
  onTrash: (receiptId: string) => void;
  onRestore: (receiptId: string) => void;
  onPermanentlyDelete: (receiptId: string) => void;
}

function ReceiptThumbnail({ receipt }: { receipt: HSAReceipt }) {
  if (receipt.contentType.startsWith('image/')) {
    return (
      <img
        src={receipt.url}
        alt={receipt.fileName}
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-1">
      <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">PDF</span>
    </div>
  );
}

export default function ReceiptGrid({
  receipts,
  uploading,
  trashing,
  deleting,
  onUpload,
  onTrash,
  onRestore,
  onPermanentlyDelete,
}: ReceiptGridProps) {
  const { t } = useTranslation();
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [confirmPermDelete, setConfirmPermDelete] = useState<string | null>(null);

  const activeReceipts = receipts.filter(r => !r.trashedAt);
  const trashedReceipts = receipts.filter(r => !!r.trashedAt);

  const handleEmptyRecycleBin = () => {
    trashedReceipts.forEach(r => onPermanentlyDelete(r.id));
  };

  return (
    <div className="space-y-4">
      {/* Section header */}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('hsaExpenses.receipts' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        {activeReceipts.length > 0 && (
          <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500 font-normal">
            ({activeReceipts.length})
          </span>
        )}
      </p>

      {/* Active receipts grid */}
      {activeReceipts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activeReceipts.map(receipt => (
            <div
              key={receipt.id}
              className="relative group rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 overflow-hidden"
            >
              {/* Preview */}
              <div className="w-full h-24">
                <ReceiptThumbnail receipt={receipt} />
              </div>

              {/* Filename */}
              <div className="px-2 py-1.5 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate" title={receipt.fileName}>
                  {receipt.fileName}
                </p>
              </div>

              {/* Action buttons — always visible on mobile, hover on desktop */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                {/* Download */}
                <a
                  href={receipt.url}
                  download={receipt.fileName}
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 shadow-sm transition"
                  aria-label={t('hsaExpenses.downloadReceipt' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                {/* Trash */}
                <button
                  type="button"
                  onClick={() => onTrash(receipt.id)}
                  disabled={trashing}
                  className="flex items-center justify-center w-7 h-7 rounded-md bg-white/90 dark:bg-gray-800/90 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm transition"
                  aria-label={t('hsaExpenses.moveToTrash' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone */}
      <ReceiptUpload uploading={uploading} onUpload={onUpload} />

      {/* Recycle Bin section */}
      {trashedReceipts.length > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <button
            type="button"
            onClick={() => setRecycleBinOpen(prev => !prev)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition min-h-[44px]"
            aria-expanded={recycleBinOpen}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            {t('hsaExpenses.recycleBin' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">({trashedReceipts.length})</span>
            <svg
              className={`w-4 h-4 ml-auto transition-transform ${recycleBinOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {recycleBinOpen && (
            <div className="mt-2 space-y-3">
              {/* Empty Recycle Bin button */}
              <button
                type="button"
                onClick={handleEmptyRecycleBin}
                disabled={deleting}
                className="text-xs text-red-500 dark:text-red-400 hover:underline disabled:opacity-50"
              >
                {t('hsaExpenses.emptyRecycleBin' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {trashedReceipts.map(receipt => (
                  <div
                    key={receipt.id}
                    className="relative group rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 overflow-hidden opacity-60"
                  >
                    {/* Preview (dimmed) */}
                    <div className="w-full h-24">
                      <ReceiptThumbnail receipt={receipt} />
                    </div>

                    {/* Filename */}
                    <div className="px-2 py-1.5 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-500 truncate" title={receipt.fileName}>
                        {receipt.fileName}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      {/* Restore */}
                      <button
                        type="button"
                        onClick={() => onRestore(receipt.id)}
                        className="flex items-center justify-center w-7 h-7 rounded-md bg-white/90 dark:bg-gray-800/90 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 shadow-sm transition"
                        aria-label={t('hsaExpenses.restore' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      </button>
                      {/* Permanent delete */}
                      <button
                        type="button"
                        onClick={() => setConfirmPermDelete(receipt.id)}
                        disabled={deleting}
                        className="flex items-center justify-center w-7 h-7 rounded-md bg-white/90 dark:bg-gray-800/90 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm transition disabled:opacity-50"
                        aria-label={t('hsaExpenses.permanentlyDelete' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm permanent delete dialog */}
      {confirmPermDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmPermDelete(null); }}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-xl p-6">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
              {t('hsaExpenses.permanentlyDelete' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('hsaExpenses.confirmPermDelete' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmPermDelete(null)}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                {t('hsaExpenses.cancel' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
              <button
                type="button"
                onClick={() => {
                  onPermanentlyDelete(confirmPermDelete);
                  setConfirmPermDelete(null);
                }}
                disabled={deleting}
                className="min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
              >
                {t('hsaExpenses.permanentlyDelete' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
