import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useTranslation, createLogger, eventBus, MFEvents, StorageKeys, WindowEvents, useQuery, useMutation, GET_CONVERSION_JOBS, GET_CONVERSION_BATCH_JOB, SUBMIT_BATCH_CONVERSION, SUBMIT_CHAPTER_CONVERSIONS, DELETE_CHAPTER_AUDIO, GET_NAS_CONNECTION_STATUS, ARCHIVE_CHAPTER_TO_NAS, ARCHIVE_BOOK_TO_NAS, RESTORE_CHAPTER_FROM_NAS } from '@mycircle/shared';
import type { AudioSource } from '@mycircle/shared';

const logger = createLogger('ChapterConvertList');

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && (err.code === 20 || err.name === 'AbortError');
}

interface Chapter {
  index: number;
  title: string;
  characterCount: number;
  audioUrl?: string;
  audioDuration?: number;
  nasArchived?: boolean;
  nasPath?: string;
}

interface Props {
  bookId: string;
  bookTitle: string;
  coverUrl?: string;
  chapters: Chapter[];
  voiceName: string;
  onChapterConverted: () => void;
  autoPlay?: boolean;
  initialChapter?: number;
}

export default function ChapterConvertList({ bookId, bookTitle, coverUrl, chapters, voiceName, onChapterConverted, autoPlay, initialChapter }: Props) {
  const { t } = useTranslation();
  const [converting, setConverting] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [polling, setPolling] = useState(false);
  const autoPlayedRef = useRef(false);
  const pollAbortRef = useRef(false);

  // Query active conversion jobs (per-chapter legacy + batch)
  const { data: jobsData, refetch: refetchJobs } = useQuery(GET_CONVERSION_JOBS, {
    variables: { bookId },
    fetchPolicy: 'network-only',
  });
  const { data: batchData, refetch: refetchBatch } = useQuery(GET_CONVERSION_BATCH_JOB, {
    variables: { bookId },
    fetchPolicy: 'network-only',
  });
  const [submitConversions] = useMutation(SUBMIT_CHAPTER_CONVERSIONS);
  const [submitBatch] = useMutation(SUBMIT_BATCH_CONVERSION);
  const [deleteChapterAudioMutation] = useMutation(DELETE_CHAPTER_AUDIO);

  // Merge per-chapter jobs + batch job into unified status
  const batchJob = batchData?.conversionBatchJob as { status: string; currentChapter?: number | null; completedChapters: number[]; chapterIndices: number[]; error?: string | null } | null;
  const batchActive = batchJob && (batchJob.status === 'pending' || batchJob.status === 'processing' || batchJob.status === 'paused');

  const activeJobs = useMemo(() => {
    const perChapter = (jobsData?.conversionJobs ?? []) as Array<{ id: string; chapterIndex: number; status: string }>;
    const active = perChapter.filter(j => j.status === 'pending' || j.status === 'processing');

    // Add batch job chapters as active
    if (batchActive && batchJob) {
      const batchCompleted = new Set(batchJob.completedChapters);
      for (const idx of batchJob.chapterIndices) {
        if (!batchCompleted.has(idx) && !active.some(a => a.chapterIndex === idx)) {
          active.push({ id: `batch-${idx}`, chapterIndex: idx, status: idx === batchJob.currentChapter ? 'processing' : 'pending' });
        }
      }
    }
    return active;
  }, [jobsData, batchActive, batchJob]);

  // Per-chapter job status map (latest job per chapter)
  const chapterJobStatus = useMemo(() => {
    const jobs = (jobsData?.conversionJobs ?? []) as Array<{ chapterIndex: number; status: string; error?: string | null }>;
    const map = new Map<number, { status: string; error?: string | null }>();
    for (const j of jobs) {
      if (!map.has(j.chapterIndex)) map.set(j.chapterIndex, { status: j.status, error: j.error });
    }

    // Overlay batch job status
    if (batchJob) {
      const batchCompleted = new Set(batchJob.completedChapters);
      for (const idx of batchJob.chapterIndices) {
        if (batchCompleted.has(idx)) {
          if (!map.has(idx)) map.set(idx, { status: 'complete' });
        } else if (idx === batchJob.currentChapter) {
          map.set(idx, { status: 'processing' });
        } else if (batchJob.status === 'error') {
          map.set(idx, { status: 'error', error: batchJob.error });
        } else if (batchActive) {
          if (!map.has(idx)) map.set(idx, { status: 'pending' });
        }
      }
    }
    return map;
  }, [jobsData, batchJob, batchActive]);

  // Poll for job completion when there are active jobs (every 30s to save quota)
  useEffect(() => {
    if (activeJobs.length === 0 && !batchActive) return;
    const interval = setInterval(async () => {
      setPolling(true);
      try {
        await Promise.all([refetchJobs(), refetchBatch()]);
        await onChapterConverted();
      } finally {
        setPolling(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeJobs.length, batchActive, refetchJobs, refetchBatch, onChapterConverted]);

  const handleManualRefresh = useCallback(async () => {
    setPolling(true);
    try {
      await Promise.all([refetchJobs(), refetchBatch()]);
      await onChapterConverted();
    } finally {
      setPolling(false);
    }
  }, [refetchJobs, refetchBatch, onChapterConverted]);

  const audioChapters = chapters.filter(ch => ch.audioUrl);

  const handlePlay = useCallback((chapterIndex: number) => {
    // Find the index within audio-only chapters
    const audioOnly = chapters.filter(ch => ch.audioUrl);
    const audioIdx = audioOnly.findIndex(ch => ch.index === chapterIndex);
    if (audioIdx === -1) return;

    const tracks = audioOnly.map(ch => ({
      id: `${bookId}-${ch.index}`,
      url: ch.audioUrl!,
      title: ch.title || `${t('library.chapter')} ${ch.index + 1}`,
    }));

    const source: AudioSource = {
      type: 'book',
      track: tracks[audioIdx],
      collection: { id: bookId, title: bookTitle, artwork: coverUrl, tracks },
      trackIndex: audioIdx,
      navigateTo: `/library/${bookId}?tab=listen&autoPlay=1`,
      progressKey: StorageKeys.BOOK_AUDIO_PROGRESS,
      nowPlayingKey: StorageKeys.BOOK_NOW_PLAYING,
      lastPlayedKey: StorageKeys.BOOK_LAST_PLAYED,
      lastPlayedEvent: WindowEvents.BOOK_LAST_PLAYED_CHANGED,
      canQueue: true,
      canShare: true,
      skipSeconds: 10,
    };

    eventBus.publish(MFEvents.AUDIO_PLAY, source);
  }, [chapters, bookId, bookTitle, coverUrl, t]);

  // Auto-play on mount when navigated from widget "Continue listening" button
  useEffect(() => {
    if (!autoPlay || autoPlayedRef.current || audioChapters.length === 0) return;
    autoPlayedRef.current = true;

    // Determine target chapter: URL param > localStorage saved chapter > first chapter
    let targetChapterIndex = initialChapter;
    if (targetChapterIndex == null) {
      try {
        const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
        if (raw) {
          const progress = JSON.parse(raw);
          const saved = progress[bookId];
          if (saved?.chapter != null) targetChapterIndex = saved.chapter;
        }
      } catch { /* ignore */ }
    }

    // Find the chapter's original index in the full chapter list
    const targetOrigIndex = targetChapterIndex != null
      ? audioChapters[targetChapterIndex]?.index
      : audioChapters[0]?.index;

    if (targetOrigIndex != null) {
      // Defer slightly so GlobalAudioPlayer has time to initialize
      const id = setTimeout(() => handlePlay(targetOrigIndex), 150);
      return () => clearTimeout(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioChapters.length]); // mount + when chapters load

  const handleConvert = useCallback(async (chapterIndex: number) => {
    setConverting(chapterIndex); // Optimistic UI — show spinner immediately
    try {
      await submitConversions({
        variables: { bookId, chapterIndices: [chapterIndex], voiceName },
      });
      await refetchJobs();
    } catch (err) {
      if (!isAbortError(err)) logger.error('Chapter conversion failed', err);
    } finally {
      setConverting(null); // Clear optimistic state — activeChapterIndices takes over
    }
  }, [bookId, voiceName, submitConversions, refetchJobs]);

  // Stop polling on unmount
  useEffect(() => {
    return () => { pollAbortRef.current = true; };
  }, []);

  const unconvertedChapters = chapters.filter(ch => !ch.audioUrl);

  const toggleSelect = useCallback((idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selected.size === unconvertedChapters.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unconvertedChapters.map(ch => ch.index)));
    }
  }, [unconvertedChapters, selected.size]);

  const handleConvertSelected = useCallback(async () => {
    if (selected.size === 0) return;
    const indices = [...selected].sort((a, b) => a - b);
    try {
      // Use batch conversion (single worker, sequential processing)
      await submitBatch({
        variables: { bookId, chapterIndices: indices, voiceName },
      });
      await Promise.all([refetchJobs(), refetchBatch()]);
      setSelected(new Set());
    } catch (err) {
      if (!isAbortError(err)) logger.error('Failed to submit conversions', err);
    }
  }, [selected, bookId, voiceName, submitBatch, refetchJobs, refetchBatch]);


  const [deleting, setDeleting] = useState<number | null>(null);

  // NAS integration
  const { data: nasData } = useQuery(GET_NAS_CONNECTION_STATUS);
  const [archiveChapterMutation] = useMutation(ARCHIVE_CHAPTER_TO_NAS);
  const [archiveBookMutation] = useMutation(ARCHIVE_BOOK_TO_NAS);
  const [restoreChapterMutation] = useMutation(RESTORE_CHAPTER_FROM_NAS);
  const nasConnected = nasData?.nasConnectionStatus?.status === 'connected';
  const [nasOffloading, setNasOffloading] = useState<Set<number>>(new Set());
  const [batchOffloading, setBatchOffloading] = useState(false);
  const [nasRestoring, setNasRestoring] = useState<Set<number>>(new Set());

  const handleOffloadToNas = useCallback(async (chapterIndex: number) => {
    setNasOffloading(prev => new Set(prev).add(chapterIndex));
    try {
      await archiveChapterMutation({ variables: { bookId, chapterIndex } });
      await onChapterConverted();
    } catch (err) {
      logger.error('Failed to offload chapter to NAS', err);
    } finally {
      setNasOffloading(prev => { const next = new Set(prev); next.delete(chapterIndex); return next; });
    }
  }, [bookId, archiveChapterMutation, onChapterConverted]);

  const batchPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleOffloadAll = useCallback(async () => {
    setBatchOffloading(true);
    try {
      const result = await archiveBookMutation({ variables: { bookId } });
      const { started, totalChapters } = result.data?.archiveBookToNas ?? {};
      if (started && totalChapters > 0) {
        // Poll for chapter status updates while background offload runs
        batchPollRef.current = setInterval(async () => {
          await onChapterConverted();
        }, 10_000);
      }
    } catch (err) {
      logger.error('Failed to start batch offload to NAS', err);
    } finally {
      setBatchOffloading(false);
    }
  }, [bookId, archiveBookMutation, onChapterConverted]);

  // Stop NAS batch poll when all chapters are archived or component unmounts
  useEffect(() => {
    const allArchived = !chapters.some(c => c.audioUrl && !c.nasArchived);
    if (allArchived && batchPollRef.current) {
      clearInterval(batchPollRef.current);
      batchPollRef.current = null;
    }
    return () => {
      if (batchPollRef.current) {
        clearInterval(batchPollRef.current);
        batchPollRef.current = null;
      }
    };
  }, [chapters]);

  const handleRestoreFromNas = useCallback(async (chapterIndex: number) => {
    setNasRestoring(prev => new Set(prev).add(chapterIndex));
    try {
      await restoreChapterMutation({ variables: { bookId, chapterIndex } });
      await onChapterConverted();
    } catch (err) {
      logger.error('Failed to restore chapter from NAS', err);
    } finally {
      setNasRestoring(prev => { const next = new Set(prev); next.delete(chapterIndex); return next; });
    }
  }, [bookId, restoreChapterMutation, onChapterConverted]);

  const handleDeleteAudio = useCallback(async (chapterIndex: number) => {
    if (!window.confirm(t('library.deleteAudioConfirm'))) return;
    setDeleting(chapterIndex);
    try {
      await deleteChapterAudioMutation({ variables: { bookId, chapterIndex } });
      await onChapterConverted();
    } catch (err) {
      logger.error('Failed to delete chapter audio', err);
    } finally {
      setDeleting(null);
    }
  }, [bookId, onChapterConverted, t, deleteChapterAudioMutation]);

  const convertedCount = audioChapters.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {t('library.chapters')}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t('library.chaptersConverted').replace('{converted}', String(convertedCount)).replace('{total}', String(chapters.length))}
        </span>
      </div>
      {/* Multi-select toolbar */}
      {unconvertedChapters.length > 0 && !activeJobs.length > 0 && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-h-[44px]"
          >
            {selected.size === unconvertedChapters.length ? t('library.deselectAll') : t('library.selectAllUnconverted')}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={handleConvertSelected}
              disabled={converting !== null}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition min-h-[44px] disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              {t('library.convertSelected').replace('{count}', String(selected.size))}
            </button>
          )}
          {activeJobs.length > 0 && (
            <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                {t('library.queueActive').replace('{count}', String(activeJobs.length))}
              </span>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={polling}
                className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 min-h-[44px]"
              >
                {polling ? (
                  <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
                  </svg>
                )}
                {t('library.refreshStatus')}
              </button>
            </span>
          )}
        </div>
      )}
      {/* NAS batch offload toolbar */}
      {nasConnected && chapters.some(c => c.audioUrl && !c.nasArchived) && (
        <div className="flex items-center gap-2 mb-2">
          <button
            type="button"
            onClick={handleOffloadAll}
            disabled={batchOffloading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 border border-orange-200 dark:border-orange-700 rounded-lg transition min-h-[44px] disabled:opacity-50"
          >
            {batchOffloading ? (
              <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
            {t('library.nas.offloadAll')}
          </button>
        </div>
      )}
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {chapters.map(ch => {
          const hasAudio = !!ch.audioUrl;
          const jobStatus = chapterJobStatus.get(ch.index);
          const isPending = jobStatus?.status === 'pending';
          const isProcessing = jobStatus?.status === 'processing' || converting === ch.index;
          const isError = jobStatus?.status === 'error';
          const isActive = isPending || isProcessing;
          return (
            <li key={ch.index} className="flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-gray-800">
              {/* Checkbox for unconverted chapters */}
              {!hasAudio && !isActive && !isError && activeJobs.length === 0 && (
                <input
                  type="checkbox"
                  checked={selected.has(ch.index)}
                  onChange={() => toggleSelect(ch.index)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-purple-600 focus:ring-purple-500 min-h-[44px]"
                  aria-label={`${t('library.selectChapter')} ${ch.title || ch.index + 1}`}
                />
              )}
              {/* Status icon */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" title={t('library.statusProcessing')} />
                ) : isPending ? (
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-label={t('library.statusPending')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : isError ? (
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-label={jobStatus?.error || t('library.statusError')}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                ) : hasAudio ? (
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                )}
              </div>

              {/* Chapter info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white truncate">
                  {ch.title || `${t('library.chapter')} ${ch.index + 1}`}
                </p>
                {ch.characterCount > 0 && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {Math.round(ch.characterCount / 1000)}k {t('library.chars')}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              {isProcessing ? (
                <span className="text-xs text-purple-600 dark:text-purple-400 flex items-center gap-1 px-2.5 py-1">
                  <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  {t('library.statusProcessing')}
                </span>
              ) : isPending ? (
                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 px-2.5 py-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('library.statusPending')}
                </span>
              ) : isError ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[120px]" title={jobStatus?.error || ''}>
                    {t('library.statusError')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleConvert(ch.index)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-h-[44px]"
                  >
                    {t('library.retryConversion')}
                  </button>
                </div>
              ) : ch.nasArchived && !hasAudio ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                    NAS
                  </span>
                  {nasRestoring.has(ch.index) ? (
                    <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 px-2">
                      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      {t('library.nas.restoring')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRestoreFromNas(ch.index)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition min-h-[44px]"
                      aria-label={`${t('library.nas.restore')} ${ch.title}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                      </svg>
                      {t('library.nas.restore')}
                    </button>
                  )}
                </div>
              ) : hasAudio ? (
                <div className="flex items-center gap-1">
                  {ch.nasArchived && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-medium">
                      NAS
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handlePlay(ch.index)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-md transition min-h-[44px]"
                    aria-label={`${t('library.play')} ${ch.title}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                    </svg>
                    {t('library.play')}
                  </button>
                  <a
                    href={ch.audioUrl}
                    download={`${bookTitle} - Ch${ch.index} ${ch.title}.mp3`}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label={`${t('library.downloadChapter')} ${ch.title}`}
                    title={t('library.downloadChapter')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M12 3v13.5m0 0l-4.5-4.5M12 16.5l4.5-4.5" />
                    </svg>
                  </a>
                  {nasConnected && !ch.nasArchived && (
                    nasOffloading.has(ch.index) ? (
                      <span className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1 px-2">
                        <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        {t('library.nas.offloading')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOffloadToNas(ch.index)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-orange-500 dark:hover:text-orange-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label={`${t('library.nas.offload')} ${ch.title}`}
                        title={t('library.nas.offload')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteAudio(ch.index)}
                    disabled={deleting === ch.index}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center disabled:opacity-50"
                    aria-label={`${t('library.deleteAudio')} ${ch.title}`}
                    title={t('library.deleteAudio')}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleConvert(ch.index)}
                  disabled={converting !== null}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition min-h-[44px] disabled:opacity-50"
                  aria-label={`${t('library.convertChapter')} ${ch.title}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  {t('library.convertChapter')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
