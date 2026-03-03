import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, createLogger } from '@mycircle/shared';

const logger = createLogger('ConversionStatus');

interface ConversionStatusProps {
  bookId: string;
  initialStatus: 'none' | 'processing' | 'complete' | 'error';
  initialProgress: number;
  onComplete: () => void;
  onConvert: () => void;
}

export default function ConversionStatus({ bookId, initialStatus, initialProgress, onComplete, onConvert }: ConversionStatusProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollProgress = useCallback(async () => {
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/progress/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setStatus(data.audioStatus);
      setProgress(data.audioProgress || 0);
      if (data.audioError) setError(data.audioError);

      if (data.audioStatus === 'complete' || data.audioStatus === 'error') {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (data.audioStatus === 'complete') onComplete();
      }
    } catch (err) {
      logger.error('Failed to poll progress', err);
    }
  }, [bookId, onComplete]);

  useEffect(() => {
    if (status === 'processing') {
      intervalRef.current = setInterval(pollProgress, 5000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [status, pollProgress]);

  if (status === 'none') {
    return (
      <button
        type="button"
        onClick={onConvert}
        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium min-h-[44px]"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
        </svg>
        {t('library.convertToAudio')}
      </button>
    );
  }

  if (status === 'processing') {
    return (
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">{t('library.converting')}</span>
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={t('library.conversionProgress')}
            />
          </div>
        </div>
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 flex-shrink-0" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-600 dark:text-red-400">{t('library.conversionFailed')}</span>
        {error && <span className="text-xs text-gray-500 dark:text-gray-400">({error})</span>}
        <button
          type="button"
          onClick={onConvert}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[44px]"
        >
          {t('library.convertToAudio')}
        </button>
      </div>
    );
  }

  return null;
}
