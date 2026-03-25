import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { formatFileSize, getFileIcon } from '../utils/fileHelpers';

interface FileCardProps {
  fileName: string;
  contentType: string;
  size: number;
  downloadUrl: string;
  date: string | Date | { toDate?: () => Date };
  sharedBy?: string;
  isOwner?: boolean;
  onShare?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
  onRename?: (newName: string) => void;
  onShareWith?: () => void;
}

function FileIconSvg({ type }: { type: string }) {
  const iconType = getFileIcon(type);
  const colors: Record<string, string> = {
    image: 'text-pink-500 bg-pink-50 dark:bg-pink-900/30',
    video: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
    audio: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
    pdf: 'text-red-500 bg-red-50 dark:bg-red-900/30',
    text: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
    doc: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
    sheet: 'text-green-500 bg-green-50 dark:bg-green-900/30',
    presentation: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
    archive: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30',
    file: 'text-gray-500 bg-gray-50 dark:bg-gray-800',
  };

  return (
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors[iconType] || colors.file}`}>
      {iconType === 'image' ? (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      )}
    </div>
  );
}

export default function FileCard({ fileName, contentType, size, downloadUrl, date, sharedBy, isOwner, onShare, onDelete, onPreview, onRename, onShareWith }: FileCardProps) {
  const { t } = useTranslation();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(fileName);
  const dateObj = typeof date === 'string' ? new Date(date) : typeof (date as any)?.toDate === 'function' ? (date as any).toDate() : date instanceof Date ? date : new Date(); // eslint-disable-line @typescript-eslint/no-explicit-any

  const canPreview = contentType.startsWith('image/') || contentType === 'application/pdf';

  const handleRenameSave = () => {
    const trimmed = renameValue.trim();
    if (!trimmed) { setIsRenaming(false); setRenameValue(fileName); return; }
    onRename?.(trimmed);
    setIsRenaming(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <FileIconSvg type={contentType} />
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRenameSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleRenameSave();
                if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(fileName); }
              }}
              autoFocus
              className="w-full text-sm px-2 py-1 border border-cyan-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              aria-label={t('cloudFiles.renameFile')}
            />
          ) : (
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate" title={fileName}>
              {fileName}
            </h4>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatFileSize(size)} &middot; {dateObj.toLocaleDateString()}
          </p>
          {sharedBy && (
            <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-0.5">
              {t('cloudFiles.sharedBy').replace('{name}', sharedBy)}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap">
        {/* Preview */}
        {canPreview && onPreview && (
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 px-2 py-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors min-h-[44px] min-w-[44px] justify-center"
            aria-label={`${t('cloudFiles.preview')} ${fileName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}
        {/* Download */}
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 px-2 py-1.5 rounded-lg hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors min-h-[44px] min-w-[44px] justify-center"
          aria-label={`${t('cloudFiles.download')} ${fileName}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </a>
        {/* Rename */}
        {onRename && (
          <button
            type="button"
            onClick={() => { setIsRenaming(true); setRenameValue(fileName); }}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] justify-center"
            aria-label={`${t('cloudFiles.rename')} ${fileName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
            </svg>
          </button>
        )}
        {/* Global share */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors min-h-[44px] min-w-[44px] justify-center"
            aria-label={`${t('cloudFiles.share')} ${fileName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
        )}
        {/* Share with specific user */}
        {onShareWith && (
          <button
            type="button"
            onClick={onShareWith}
            className="flex items-center gap-1 text-xs font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 px-2 py-1.5 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors min-h-[44px] min-w-[44px] justify-center"
            aria-label={`${t('cloudFiles.shareWith')} ${fileName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </button>
        )}
        {/* Delete */}
        {onDelete && (isOwner !== false) && (
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 text-xs font-medium text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-auto min-h-[44px] min-w-[44px] justify-center"
            aria-label={`${t('cloudFiles.delete')} ${fileName}`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
