import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ScanFile } from '../hooks/useScanStorage';

interface ScanHistoryProps {
  scans: ScanFile[];
  isLoading: boolean;
  onDelete: (fileName: string) => void;
}

export default function ScanHistory({ scans, isLoading, onDelete }: ScanHistoryProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {t('docScanner.scanHistory')}...
      </div>
    );
  }

  if (scans.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {t('docScanner.noScansYet')}
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {t('docScanner.scanHistory')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {scans.map(scan => (
          <div key={scan.name} className="relative group">
            <a href={scan.url} target="_blank" rel="noopener noreferrer">
              <img
                src={scan.url}
                alt={scan.name}
                className="w-full aspect-[3/4] object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                loading="lazy"
              />
            </a>
            <button
              type="button"
              onClick={() => {
                if (confirmDelete === scan.name) {
                  onDelete(scan.name);
                  setConfirmDelete(null);
                } else {
                  setConfirmDelete(scan.name);
                }
              }}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={t('docScanner.delete')}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            {confirmDelete === scan.name && (
              <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs px-2 text-center">{t('docScanner.deleteConfirm')}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
