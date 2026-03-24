import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation, createLogger, WindowEvents, useLazyQuery, GET_BOOK_CONVERSION_PROGRESS } from '@mycircle/shared';

const logger = createLogger('ConversionStatus');

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && (err.code === 20 || err.name === 'AbortError');
}

const VOICE_SUFFIXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

function getLangCode(language: string): string {
  if (language.startsWith('zh')) return 'cmn-CN';
  if (language.startsWith('es')) return 'es-US';
  return 'en-US';
}

function getDefaultVoice(language: string): string {
  const langCode = getLangCode(language);
  const suffix = langCode === 'en-US' ? 'D' : 'A';
  return `${langCode}-Neural2-${suffix}`;
}

interface ConversionStatusProps {
  bookId: string;
  language: string;
  initialStatus: 'none' | 'processing' | 'paused' | 'complete' | 'error';
  initialProgress: number;
  onComplete: () => void;
  onConvert: (voiceName: string) => Promise<Response | undefined>;
}

export default function ConversionStatus({ bookId, language, initialStatus, initialProgress, onComplete, onConvert }: ConversionStatusProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(initialStatus);
  const [progress, setProgress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(getDefaultVoice(language));
  const [checking, setChecking] = useState(false);
  const [resetting, setResetting] = useState(false);

  const langCode = getLangCode(language);
  const voiceOptions = VOICE_SUFFIXES.map(s => `${langCode}-Neural2-${s}`);

  const [fetchConversionProgress] = useLazyQuery(GET_BOOK_CONVERSION_PROGRESS, { fetchPolicy: 'network-only' });

  const checkStatus = useCallback(async () => {
    try {
      const result = await fetchConversionProgress({ variables: { bookId } });
      const prog = result.data?.bookConversionProgress;
      if (!prog) return;

      if (prog.audioStatus === 'complete') {
        setStatus('complete');
        setProgress(100);
        onComplete();
      } else if (prog.audioStatus === 'error') {
        setStatus('error');
        setError(prog.audioError || t('library.conversionFailed'));
      } else if (prog.audioStatus === 'paused') {
        setStatus('paused');
        setProgress(prog.audioProgress || 0);
      } else if (prog.audioStatus === 'processing') {
        setProgress(prog.audioProgress || 0);
      }
    } catch (err) {
      logger.error('Failed to check conversion status', err);
    }
  }, [bookId, onComplete, t, fetchConversionProgress]);

  // On mount, always sync from server — local state is lost on navigation.
  // initialStatus is just the Apollo cache snapshot; server is the source of truth.
  useEffect(() => {
    checkStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (initialStatus === 'processing' || initialStatus === 'paused') {
      checkStatus();
    } else if (initialStatus === 'complete') {
      onComplete();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckStatus = useCallback(async () => {
    setChecking(true);
    await checkStatus();
    setChecking(false);
  }, [checkStatus]);

  const handleConvert = useCallback(async () => {
    setConverting(true);
    setError(null);
    try {
      const res = await onConvert(selectedVoice);
      if (res && res.status === 429) {
        const data = await res.json();
        if (data.error?.includes('Too many conversions')) {
          setError(t('library.tooManyConversions'));
          setStatus('error');
        } else {
          const usedMB = ((data.used || 0) / 1_000_000).toFixed(1);
          const limitMB = ((data.limit || 0) / 1_000_000).toFixed(1);
          setError(t('library.quotaReached').replace('{used}', usedMB).replace('{limit}', limitMB));
          setStatus('error');
        }
      } else if (res && res.ok) {
        setStatus('processing');
        setProgress(0);
      }
    } catch (err) {
      if (!isAbortError(err)) logger.error('Failed to start conversion', err);
    } finally {
      setConverting(false);
    }
  }, [onConvert, selectedVoice, t]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/reset-conversion/${bookId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatus('none');
        setProgress(0);
        setError(null);
        window.dispatchEvent(new Event(WindowEvents.BOOKS_CHANGED));
      }
    } catch (err) {
      if (!isAbortError(err)) logger.error('Reset conversion failed', err);
    } finally {
      setResetting(false);
    }
  }, [bookId]);

  // Auto-continue when paused (time-budget exhausted, server waiting for client to re-trigger)
  useEffect(() => {
    if (status === 'paused' && !converting) {
      const timer = setTimeout(() => handleConvert(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, converting, handleConvert]);

  const resetButton = (status === 'processing' || status === 'paused' || status === 'error') ? (
    <button
      type="button"
      onClick={handleReset}
      disabled={resetting}
      className="text-xs text-orange-600 dark:text-orange-400 hover:underline min-h-[44px] disabled:opacity-50"
    >
      {resetting ? t('library.resetting') : t('library.resetConversion')}
    </button>
  ) : null;

  const [previewing, setPreviewing] = useState(false);

  const handlePreview = useCallback(async () => {
    setPreviewing(true);
    try {
      const token = await window.__getFirebaseIdToken?.();
      if (!token) return;
      const apiBase = window.__digitalLibraryApiBase?.() || '';
      const res = await fetch(`${apiBase}/digital-library-api/preview-voice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceName: selectedVoice }),
      });
      if (!res.ok) throw new Error('Preview failed');
      const { audio } = await res.json();
      const binary = atob(audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const player = new Audio(url);
      player.onended = () => { setPreviewing(false); URL.revokeObjectURL(url); };
      player.onerror = () => { setPreviewing(false); URL.revokeObjectURL(url); };
      await player.play().catch((err: unknown) => {
        if (!isAbortError(err)) throw err;
        // AbortError is expected when navigating away during playback
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      if (!isAbortError(err)) logger.error('Voice preview failed', err);
      setPreviewing(false);
    }
  }, [selectedVoice]);

  const voicePicker = (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <label htmlFor={`voice-select-${bookId}`} className="text-sm text-gray-600 dark:text-gray-400">
        {t('library.selectVoice')}
      </label>
      <select
        id={`voice-select-${bookId}`}
        value={selectedVoice}
        onChange={(e) => setSelectedVoice(e.target.value)}
        className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 min-h-[44px]"
      >
        {voiceOptions.map(v => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
      <button
          type="button"
          onClick={handlePreview}
          disabled={previewing}
          className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition min-h-[44px] disabled:opacity-50"
          aria-label={t('library.previewVoice')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
          </svg>
          {previewing ? t('library.playing') : t('library.previewVoice')}
        </button>
      <a
        href="https://cloud.google.com/text-to-speech#section-2"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 dark:text-blue-400 hover:underline flex items-center gap-0.5"
      >
        {t('library.browseVoices')}
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </a>
    </div>
  );

  if (status === 'none') {
    return (
      <div>
        {voicePicker}
        <button
          type="button"
          onClick={handleConvert}
          disabled={converting}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium min-h-[44px] disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          {converting ? t('library.converting') : t('library.convertToAudio')}
        </button>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('library.converting')}</span>
          {progress > 0 && (
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
          )}
        </div>
        {progress > 0 && (
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleCheckStatus}
            disabled={checking}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] disabled:opacity-50"
          >
            {checking ? t('library.converting') : t('library.convertingRefresh')}
          </button>
          {resetButton}
        </div>
      </div>
    );
  }

  if (status === 'paused') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('library.continuingConversion')}</span>
          {progress > 0 && (
            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{progress}%</span>
          )}
        </div>
        {progress > 0 && (
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('library.autoContinueHint')}</p>
        {resetButton}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-red-600 dark:text-red-400">{error || t('library.conversionFailed')}</span>
        </div>
        {voicePicker}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] text-left disabled:opacity-50"
          >
            {converting ? t('library.converting') : progress > 0 ? t('library.retryConversion') : t('library.convertToAudio')}
          </button>
          {resetButton}
        </div>
      </div>
    );
  }

  return null;
}
