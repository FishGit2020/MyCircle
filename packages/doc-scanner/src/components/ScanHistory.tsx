import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ScanFile } from '../hooks/useScanStorage';

interface ScanHistoryProps {
  scans: ScanFile[];
  isLoading: boolean;
  onDelete: (fileName: string) => void;
  onRename?: (fileName: string, newName: string) => void;
}

interface DateGroup {
  label: string;
  scans: ScanFile[];
}

export default function ScanHistory({ scans, isLoading, onDelete, onRename }: ScanHistoryProps) {
  const { t } = useTranslation();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Filter by search query
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return scans;
    const q = searchQuery.toLowerCase();
    return scans.filter(s => s.name.toLowerCase().includes(q));
  }, [scans, searchQuery]);

  // Group by date
  const groups = useMemo((): DateGroup[] => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const map = new Map<string, ScanFile[]>();
    for (const scan of filtered) {
      const date = new Date(scan.createdAt);
      let label: string;
      if (isSameDay(date, today)) {
        label = t('docScanner.today');
      } else if (isSameDay(date, yesterday)) {
        label = t('docScanner.yesterday');
      } else {
        label = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      }
      const arr = map.get(label) || [];
      arr.push(scan);
      map.set(label, arr);
    }
    return Array.from(map.entries()).map(([label, scans]) => ({ label, scans }));
  }, [filtered, t]);

  const handleStartRename = (scan: ScanFile) => {
    setEditingName(scan.name);
    setEditValue(scan.name.replace(/\.(jpg|pdf)$/, ''));
  };

  const handleConfirmRename = (originalName: string) => {
    if (onRename && editValue.trim()) {
      const ext = originalName.endsWith('.pdf') ? '.pdf' : '.jpg';
      onRename(originalName, editValue.trim() + ext);
    }
    setEditingName(null);
  };

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

      {/* Search input */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('docScanner.searchScans')}
        className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={t('docScanner.searchScans')}
      />

      {groups.map(group => (
        <div key={group.label} className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
            {group.label}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {group.scans.map(scan => (
              <div key={scan.name} className="relative group">
                <a href={scan.url} target="_blank" rel="noopener noreferrer">
                  {scan.fileType === 'application/pdf' ? (
                    <div className="w-full aspect-[3/4] bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center">
                      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                      </svg>
                      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 mt-1">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={scan.url}
                      alt={scan.name}
                      className="w-full aspect-[3/4] object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                      loading="lazy"
                    />
                  )}
                </a>

                {/* Page count badge */}
                {scan.pageCount > 1 && (
                  <span className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] font-bold rounded px-1 leading-4">
                    {scan.pageCount}p
                  </span>
                )}

                {/* Delete button */}
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
                  className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity min-w-[24px] min-h-[24px] flex items-center justify-center"
                  aria-label={t('docScanner.delete')}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Confirm delete overlay */}
                {confirmDelete === scan.name && (
                  <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs px-2 text-center">{t('docScanner.deleteConfirm')}</span>
                  </div>
                )}

                {/* Filename / rename */}
                <div className="mt-1">
                  {editingName === scan.name ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleConfirmRename(scan.name)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleConfirmRename(scan.name);
                        if (e.key === 'Escape') setEditingName(null);
                      }}
                      className="w-full text-[10px] px-1 py-0.5 border border-blue-400 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleStartRename(scan)}
                      className="w-full text-[10px] text-gray-500 dark:text-gray-400 truncate text-left hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                      title={t('docScanner.rename')}
                      aria-label={`${t('docScanner.rename')}: ${scan.name}`}
                    >
                      {scan.name}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}
