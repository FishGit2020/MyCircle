import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, useMutation, REQUEST_BOOK_ZIP } from '@mycircle/shared';

interface AudioDownloadProps {
  bookId: string;
  bookTitle: string;
  chapters: Array<{ index: number; title: string; audioUrl?: string }>;
  zipStatus: string;
  zipUrl?: string;
  zipSize?: number;
  zipGeneratedAt?: string;
  zipError?: string;
  onRefreshBook: () => Promise<void>;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AudioDownload({
  bookId,
  bookTitle,
  chapters,
  zipStatus,
  zipUrl,
  zipSize,
  zipGeneratedAt,
  zipError,
  onRefreshBook,
}: AudioDownloadProps) {
  const { t } = useTranslation();
  const [requestZip] = useMutation(REQUEST_BOOK_ZIP);
  const [dlProgress, setDlProgress] = useState<{ current: number; total: number } | null>(null);
  const [dlMessage, setDlMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const audioChapters = chapters.filter(ch => ch.audioUrl);

  // Poll every 10 s while ZIP is generating
  useEffect(() => {
    if (zipStatus !== 'processing') return;
    const id = setInterval(() => { onRefreshBook().catch(() => {}); }, 10_000);
    return () => clearInterval(id);
  }, [zipStatus, onRefreshBook]);

  async function handleSequentialDownload() {
    if (audioChapters.length === 0) return;
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;
    setDlMessage(null);
    setDlProgress({ current: 0, total: audioChapters.length });

    for (let i = 0; i < audioChapters.length; i++) {
      if (signal.aborted) break;
      const ch = audioChapters[i];
      setDlProgress({ current: i + 1, total: audioChapters.length });
      try {
        const res = await fetch(ch.audioUrl!, { signal });
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${bookTitle} - Ch${ch.index} ${ch.title}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {
        if (signal.aborted) break;
        setDlMessage(`${t('library.downloadCancelled')}: Ch${ch.index}`);
        setDlProgress(null);
        return;
      }
    }

    if (!signal.aborted) {
      setDlMessage(t('library.downloadComplete'));
    } else {
      setDlMessage(t('library.downloadCancelled'));
    }
    setDlProgress(null);
    abortRef.current = null;
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  return (
    <div className="space-y-4">
      {/* Section A — Sequential Download */}
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t('library.audioDownload')}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('library.sequentialHint')}</p>

        {dlProgress ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {t('library.downloadingChapter', { current: String(dlProgress.current), total: String(dlProgress.total) })}
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-500 dark:bg-blue-400 h-2 rounded-full transition-all"
                style={{ width: `${(dlProgress.current / dlProgress.total) * 100}%` }}
              />
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs text-red-600 dark:text-red-400 hover:underline min-h-[44px] px-2"
            >
              {t('library.cancelDownload')}
            </button>
          </div>
        ) : (
          <>
            {dlMessage && (
              <p className="text-xs text-gray-600 dark:text-gray-400">{dlMessage}</p>
            )}
            <button
              type="button"
              onClick={handleSequentialDownload}
              disabled={audioChapters.length === 0}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
            >
              {t('library.downloadAllChapters')}
            </button>
          </>
        )}
      </div>

      {/* Section B — ZIP Download */}
      <ZipSection
        bookId={bookId}
        zipStatus={zipStatus}
        zipUrl={zipUrl}
        zipSize={zipSize}
        zipGeneratedAt={zipGeneratedAt}
        zipError={zipError}
        onRefreshBook={onRefreshBook}
        requestZipMutation={requestZip}
      />
    </div>
  );
}

function ZipSection({
  bookId,
  zipStatus,
  zipUrl,
  zipSize,
  zipGeneratedAt,
  zipError,
  onRefreshBook,
  requestZipMutation,
}: {
  bookId: string;
  zipStatus: string;
  zipUrl?: string;
  zipSize?: number;
  zipGeneratedAt?: string;
  zipError?: string;
  onRefreshBook: () => Promise<void>;
  requestZipMutation: ReturnType<typeof useMutation>[0];
}) {
  const { t } = useTranslation();
  const [isRequesting, setIsRequesting] = useState(false);

  async function handleGenerate() {
    setIsRequesting(true);
    try {
      await requestZipMutation({ variables: { bookId } });
      await onRefreshBook();
    } finally {
      setIsRequesting(false);
    }
  }

  const formattedDate = zipGeneratedAt
    ? new Date(zipGeneratedAt).toLocaleDateString()
    : '';
  const formattedSize = zipSize != null ? formatBytes(zipSize) : '';

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">ZIP</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400">{t('library.zipHint')}</p>

      {zipStatus === 'none' || !zipStatus ? (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isRequesting}
          className="w-full py-2 px-4 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors flex items-center justify-center gap-2"
        >
          {isRequesting && (
            <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {isRequesting ? t('library.generatingZip') : t('library.generateZip')}
        </button>
      ) : zipStatus === 'processing' ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <svg className="animate-spin h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>{t('library.generatingZip')}</span>
        </div>
      ) : zipStatus === 'ready' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-medium">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{t('library.zipReady')}</span>
            {formattedSize && <span className="text-gray-500 dark:text-gray-400 font-normal">({formattedSize})</span>}
          </div>
          {formattedDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('library.zipGenerated', { date: formattedDate })}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <a
              href={zipUrl}
              download
              className="flex-1 text-center py-2 px-4 rounded-lg bg-green-600 dark:bg-green-500 text-white text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 min-h-[44px] flex items-center justify-center transition-colors"
            >
              {t('library.downloadZip')}
            </a>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isRequesting}
              className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors flex items-center justify-center gap-2"
            >
              {isRequesting && (
                <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isRequesting ? t('library.generatingZip') : t('library.generateNewZip')}
            </button>
          </div>
        </div>
      ) : zipStatus === 'error' ? (
        <div className="space-y-2">
          <p className="text-sm text-red-600 dark:text-red-400">
            {zipError || t('library.zipFailed')}
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isRequesting}
            className="w-full py-2 px-4 rounded-lg bg-red-600 dark:bg-red-500 text-white text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors flex items-center justify-center gap-2"
          >
            {isRequesting && (
              <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {isRequesting ? t('library.generatingZip') : t('library.generateZip')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
