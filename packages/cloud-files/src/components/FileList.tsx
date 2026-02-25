import { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FileItem, SharedFileItem } from '../types';
import FileCard from './FileCard';

interface FileListProps {
  files: (FileItem | SharedFileItem)[];
  emptyMessage: string;
  isShared?: boolean;
  onShare?: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
}

export default function FileList({ files, emptyMessage, isShared, onShare, onDelete }: FileListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return files;
    const q = search.toLowerCase();
    return files.filter(f => f.fileName.toLowerCase().includes(q));
  }, [files, search]);

  return (
    <div>
      {files.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('cloudFiles.searchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              aria-label={t('cloudFiles.searchPlaceholder')}
            />
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('cloudFiles.fileCount').replace('{count}', String(files.length))}
          </span>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {search.trim() ? t('cloudFiles.noResults') : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((file) => {
            const shared = file as SharedFileItem;
            return (
              <FileCard
                key={file.id}
                fileName={file.fileName}
                contentType={file.contentType}
                size={file.size}
                downloadUrl={file.downloadUrl}
                date={isShared ? shared.sharedAt : (file as FileItem).uploadedAt}
                sharedBy={isShared ? shared.sharedBy?.displayName : undefined}
                onShare={!isShared && onShare ? () => onShare(file.id) : undefined}
                onDelete={onDelete ? () => onDelete(file.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
