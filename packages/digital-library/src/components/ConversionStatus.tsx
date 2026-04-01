import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation, createLogger, WindowEvents, useLazyQuery, useMutation, useQuery, GET_BOOK_CONVERSION_PROGRESS, RESET_BOOK_CONVERSION, CANCEL_BOOK_CONVERSION, PREVIEW_VOICE, GET_TTS_QUOTA } from '@mycircle/shared';

const logger = createLogger('ConversionStatus');

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && (err.code === 20 || err.name === 'AbortError');
}

const VOICE_SUFFIXES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

// Chirp3 HD: named voices (en-US only; other locales have limited/different sets)
const CHIRP3_HD_VOICES_EN = [
  'Achernar', 'Aoede', 'Autonoe', 'Callirrhoe', 'Charon', 'Despina',
  'Enceladus', 'Fenrir', 'Gacrux', 'Iapetus', 'Kore', 'Laomedeia',
  'Leda', 'Orus', 'Puck', 'Pulcherrima', 'Rasalased', 'Sadachbia',
  'Sadaltager', 'Schedar', 'Sulafar', 'Umbriel', 'Vindemiatrix', 'Zubenelgenubi',
];

function getLangCode(language: string): string {
  if (language.startsWith('zh')) return 'cmn-CN';
  if (language.startsWith('es')) return 'es-US';
  return 'en-US';
}

function getDefaultVoice(language: string): string {
  const langCode = getLangCode(language);
  const suffix = langCode === 'en-US' ? 'D' : 'A';
  return `${langCode}-Wavenet-${suffix}`;
}

type QuotaTier = 'wavenetStandard' | 'neural2Polyglot' | 'chirp3';

interface VoiceGroup {
  label: string;
  voices: string[];
  tier: QuotaTier;
}

function getVoiceGroups(langCode: string): VoiceGroup[] {
  const abSuffixes = VOICE_SUFFIXES.map(s => `${langCode}-Wavenet-${s}`);
  const stdSuffixes = VOICE_SUFFIXES.map(s => `${langCode}-Standard-${s}`);
  const n2Suffixes = VOICE_SUFFIXES.map(s => `${langCode}-Neural2-${s}`);
  const chirp3Voices = langCode === 'en-US'
    ? CHIRP3_HD_VOICES_EN.map(n => `en-US-Chirp3-HD-${n}`)
    : [];
  const polyglotVoices = langCode === 'en-US' ? ['en-US-Polyglot-1'] : [];

  return [
    { label: 'WaveNet', voices: abSuffixes, tier: 'wavenetStandard' },
    { label: 'Standard', voices: stdSuffixes, tier: 'wavenetStandard' },
    { label: 'Neural2', voices: n2Suffixes, tier: 'neural2Polyglot' },
    ...(chirp3Voices.length > 0 ? [{ label: 'Chirp3 HD', voices: chirp3Voices, tier: 'chirp3' as QuotaTier }] : []),
    ...(polyglotVoices.length > 0 ? [{ label: 'Polyglot Preview', voices: polyglotVoices, tier: 'neural2Polyglot' as QuotaTier }] : []),
  ];
}

function formatChars(chars: number): string {
  if (chars >= 1_000_000) return `${(chars / 1_000_000).toFixed(1)}M`;
  if (chars >= 1_000) return `${(chars / 1_000).toFixed(0)}K`;
  return String(chars);
}

function getTierForVoice(voiceName: string): QuotaTier {
  if (voiceName.includes('Wavenet') || voiceName.includes('Standard')) return 'wavenetStandard';
  if (voiceName.includes('Chirp3')) return 'chirp3';
  return 'neural2Polyglot';
}

interface TierQuota { used: number; limit: number; remaining: number }
interface QuotaData {
  wavenetStandard?: TierQuota;
  neural2Polyglot?: TierQuota;
  chirp3?: TierQuota;
}

interface ConversionStatusProps {
  bookId: string;
  language: string;
  initialStatus: 'none' | 'processing' | 'paused' | 'complete' | 'error';
  initialProgress: number;
  onComplete: () => void;
  onConvert: (voiceName: string) => Promise<void>;
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
  const [cancelling, setCancelling] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hoveredTier, setHoveredTier] = useState<QuotaTier | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const langCode = getLangCode(language);
  const voiceGroups = getVoiceGroups(langCode);

  const { data: quotaData } = useQuery(GET_TTS_QUOTA);
  const quota: QuotaData = quotaData?.ttsQuota ?? {};

  const [fetchConversionProgress] = useLazyQuery(GET_BOOK_CONVERSION_PROGRESS, { fetchPolicy: 'network-only' });
  const [resetMutation] = useMutation(RESET_BOOK_CONVERSION);
  const [cancelMutation] = useMutation(CANCEL_BOOK_CONVERSION);
  const [previewMutation] = useMutation(PREVIEW_VOICE);

  // Whether the selected voice's quota tier is exhausted (>= 90% hard cap)
  const selectedTier = getTierForVoice(selectedVoice);
  const selectedQuota = quota[selectedTier];
  const isQuotaExhausted = selectedQuota ? selectedQuota.used >= selectedQuota.limit : false;

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [dropdownOpen]);

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
        setStatus('processing');
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
      await onConvert(selectedVoice);
      setStatus('processing');
      setProgress(0);
    } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!isAbortError(err)) {
        const msg = err?.message || '';
        if (msg.includes('quota') || msg.includes('429')) {
          setError(t('library.tooManyConversions'));
        } else {
          setError(msg || t('library.conversionFailed'));
        }
        setStatus('error');
        logger.error('Failed to start conversion', err);
      }
    } finally {
      setConverting(false);
    }
  }, [onConvert, selectedVoice, t]);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      await cancelMutation({ variables: { bookId } });
      setStatus('none');
      setProgress(0);
      setError(null);
    } catch (err) {
      if (!isAbortError(err)) logger.error('Cancel conversion failed', err);
    } finally {
      setCancelling(false);
    }
  }, [bookId, cancelMutation]);

  const handleReset = useCallback(async () => {
    setResetting(true);
    try {
      await resetMutation({ variables: { bookId } });
      setStatus('none');
      setProgress(0);
      setError(null);
      window.dispatchEvent(new Event(WindowEvents.BOOKS_CHANGED));
    } catch (err) {
      if (!isAbortError(err)) logger.error('Reset conversion failed', err);
    } finally {
      setResetting(false);
    }
  }, [bookId, resetMutation]);

  // Auto-continue when paused (time-budget exhausted, server waiting for client to re-trigger)
  useEffect(() => {
    if (status === 'paused' && !converting) {
      const timer = setTimeout(() => handleConvert(), 2000);
      return () => clearTimeout(timer);
    }
  }, [status, converting, handleConvert]);

  const cancelButton = (status === 'processing' || status === 'paused') ? (
    <button
      type="button"
      onClick={handleCancel}
      disabled={cancelling}
      className="text-xs text-orange-600 dark:text-orange-400 hover:underline min-h-[44px] disabled:opacity-50"
    >
      {cancelling ? t('library.cancelling') : t('library.cancelConversion')}
    </button>
  ) : null;

  const resetButton = status === 'error' ? (
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
      const { data: previewData } = await previewMutation({ variables: { voiceName: selectedVoice } });
      const audio = previewData?.previewVoice;
      if (!audio) throw new Error('Preview failed');
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
        URL.revokeObjectURL(url);
      });
    } catch (err) {
      if (!isAbortError(err)) logger.error('Voice preview failed', err);
      setPreviewing(false);
    }
  }, [selectedVoice, previewMutation]);

  function isTierExhausted(tier: QuotaTier): boolean {
    const q = quota[tier];
    return q ? q.used >= q.limit : false;
  }

  // Tooltip content for a tier on hover
  function tierTooltip(tier: QuotaTier): string {
    const q = quota[tier];
    if (!q) return t('library.ttsQuotaLoading');
    const pct = Math.round((q.used / q.limit) * 100);
    if (q.used >= q.limit) return t('library.ttsQuotaExhausted');
    return t('library.ttsQuotaRemaining')
      .replace('{used}', formatChars(q.used))
      .replace('{limit}', formatChars(q.limit))
      .replace('{pct}', String(pct));
  }

  // Group display name for the selected voice
  const selectedGroup = voiceGroups.find(g => g.voices.includes(selectedVoice));
  const selectedDisplayName = selectedVoice.split('-').slice(-1)[0] || selectedVoice;

  const voicePicker = (
    <div className="flex flex-wrap items-center gap-2 mb-2">
      <label className="text-sm text-gray-600 dark:text-gray-400">
        {t('library.selectVoice')}
      </label>

      {/* Custom dropdown with quota info + hover tooltips */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(v => !v)}
          className={`flex items-center gap-2 text-sm rounded-lg border px-3 py-1.5 min-h-[44px] transition ${
            isQuotaExhausted
              ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}
          aria-haspopup="listbox"
          aria-expanded={dropdownOpen}
        >
          <span className="truncate max-w-[200px]">
            {selectedGroup?.label}: {selectedDisplayName}
          </span>
          {isQuotaExhausted && (
            <span className="text-[10px] bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              {t('library.ttsQuotaExhausted')}
            </span>
          )}
          <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute z-50 mt-1 w-80 max-h-80 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg" role="listbox">
            {voiceGroups.map((group) => {
              const exhausted = isTierExhausted(group.tier);
              const tierQ = quota[group.tier];
              const pct = tierQ ? Math.round((tierQ.used / tierQ.limit) * 100) : 0;
              return (
                <div key={group.label}>
                  {/* Group header with quota bar — shows full tooltip on hover */}
                  <div
                    className="sticky top-0 px-3 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
                    onMouseEnter={() => {
                      clearTimeout(tooltipTimerRef.current);
                      setHoveredTier(group.tier);
                    }}
                    onMouseLeave={() => {
                      tooltipTimerRef.current = setTimeout(() => setHoveredTier(null), 200);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${exhausted ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-300'}`}>
                        {group.label}
                      </span>
                      <span className={`text-[10px] ${exhausted ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {tierQ ? `${formatChars(tierQ.used)} / ${formatChars(tierQ.limit)}` : '...'}
                      </span>
                    </div>
                    {/* Mini quota bar */}
                    {tierQ && (
                      <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            exhausted ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-purple-500'
                          }`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    )}
                    {/* Hover tooltip */}
                    {hoveredTier === group.tier && (
                      <p className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                        {tierTooltip(group.tier)}
                      </p>
                    )}
                  </div>
                  {/* Voice options */}
                  {group.voices.map(v => {
                    const voiceShort = v.split('-').slice(-1)[0] || v;
                    const isSelected = v === selectedVoice;
                    return (
                      <button
                        key={v}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        disabled={exhausted}
                        onClick={() => {
                          setSelectedVoice(v);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-1.5 text-sm transition min-h-[36px] flex items-center gap-2 ${
                          exhausted
                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                            : isSelected
                              ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                        <span className={isSelected ? '' : 'ml-5.5'}>{voiceShort}</span>
                        {exhausted && (
                          <span className="ml-auto text-[10px] text-red-400 dark:text-red-500">{t('library.ttsQuotaExhausted')}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview button — disabled when quota exhausted */}
      <button
        type="button"
        onClick={handlePreview}
        disabled={previewing || isQuotaExhausted}
        className="flex items-center gap-1 px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition min-h-[44px] disabled:opacity-50"
        aria-label={t('library.previewVoice')}
        title={isQuotaExhausted ? t('library.ttsQuotaExhausted') : t('library.previewVoice')}
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
        {isQuotaExhausted && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-2">
            {t('library.quotaReached')
              .replace('{used}', formatChars(selectedQuota?.used ?? 0))
              .replace('{limit}', formatChars(selectedQuota?.limit ?? 0))}
          </p>
        )}
        <button
          type="button"
          onClick={handleConvert}
          disabled={converting || isQuotaExhausted}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm font-medium min-h-[44px] disabled:opacity-50"
          title={isQuotaExhausted ? t('library.ttsQuotaExhausted') : ''}
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
          {cancelButton}
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
        {cancelButton}
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
        {isQuotaExhausted && (
          <p className="text-xs text-red-600 dark:text-red-400">
            {t('library.quotaReached')
              .replace('{used}', formatChars(selectedQuota?.used ?? 0))
              .replace('{limit}', formatChars(selectedQuota?.limit ?? 0))}
          </p>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleConvert}
            disabled={converting || isQuotaExhausted}
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
