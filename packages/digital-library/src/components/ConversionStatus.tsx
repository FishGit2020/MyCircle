import React, { useState, useCallback } from 'react';
import { useTranslation, createLogger } from '@mycircle/shared';

const logger = createLogger('ConversionStatus');

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
  initialStatus: 'none' | 'processing' | 'complete' | 'error';
  initialProgress: number;
  onComplete: () => void;
  onConvert: (voiceName: string) => Promise<Response | undefined>;
}

export default function ConversionStatus({ bookId, language, initialStatus, initialProgress, onComplete, onConvert }: ConversionStatusProps) {
  const { t } = useTranslation();
  const [status, setStatus] = useState(initialStatus);
  const [progress] = useState(initialProgress);
  const [error, setError] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(getDefaultVoice(language));

  const langCode = getLangCode(language);
  const voiceOptions = VOICE_SUFFIXES.map(s => `${langCode}-Neural2-${s}`);

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
      }
    } catch (err) {
      logger.error('Failed to start conversion', err);
    } finally {
      setConverting(false);
    }
  }, [onConvert, selectedVoice, t]);

  const voicePicker = (
    <div className="flex items-center gap-2 mb-2">
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
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600 dark:text-gray-400">{t('library.convertingRefresh')}</span>
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
        <button
          type="button"
          onClick={handleConvert}
          disabled={converting}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] text-left disabled:opacity-50"
        >
          {converting ? t('library.converting') : t('library.convertToAudio')}
        </button>
      </div>
    );
  }

  return null;
}
