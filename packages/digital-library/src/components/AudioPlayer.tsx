import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation, StorageKeys, WindowEvents, eventBus, MFEvents, subscribeToMFEvent } from '@mycircle/shared';
import type { AudioSource, AudioPlaybackStateEvent, AudioTrack } from '@mycircle/shared';

interface Chapter {
  index: number;
  title: string;
  audioUrl?: string;
  audioDuration?: number;
}

interface AudioPlayerProps {
  chapters: Chapter[];
  bookTitle: string;
  bookId?: string;
  coverUrl?: string;
  autoPlay?: boolean;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const SLEEP_TIMER_OPTIONS = [0, 5, 15, 30, 45, 60];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface BookProgress {
  position: number;
  duration: number;
  chapter: number;
}

export default function AudioPlayer({ chapters, bookTitle, bookId, coverUrl, autoPlay }: AudioPlayerProps) {
  const { t } = useTranslation();
  const [currentChapter, setCurrentChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [bookProgress, setBookProgress] = useState<Record<string, BookProgress>>({});
  const sleepMenuRef = useRef<HTMLDivElement>(null);

  const audioChapters = chapters.filter(ch => ch.audioUrl);

  // Build AudioTrack[] for the collection
  const audioTracks: AudioTrack[] = audioChapters.map(ch => ({
    id: `${bookId || 'book'}-${ch.index}`,
    url: ch.audioUrl!,
    title: ch.title,
  }));

  const current = audioChapters[currentChapter];

  // Load book progress from localStorage
  const loadBookProgress = useCallback(() => {
    if (!bookId) return;
    try {
      const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
      if (!raw) return;
      const progress = JSON.parse(raw);
      setBookProgress(progress);
    } catch { /* ignore */ }
  }, [bookId]);

  // Restore saved chapter + position on mount
  useEffect(() => {
    if (!bookId) return;
    loadBookProgress();
    try {
      const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
      if (!raw) return;
      const progress = JSON.parse(raw);
      const saved = progress[bookId];
      if (saved && saved.chapter >= 0 && saved.chapter < audioChapters.length) {
        setCurrentChapter(saved.chapter);
      }
    } catch { /* ignore */ }
  }, [bookId, audioChapters.length, loadBookProgress]);

  // Listen for progress updates to refresh chapter progress display
  useEffect(() => {
    const handler = () => loadBookProgress();
    window.addEventListener('book-audio-progress-changed', handler);
    return () => window.removeEventListener('book-audio-progress-changed', handler);
  }, [loadBookProgress]);

  // Auto-play on mount when requested (e.g. from widget "Continue" button)
  const shouldAutoPlayRef = React.useRef(autoPlay);
  const currentChapterRef = React.useRef(currentChapter);
  currentChapterRef.current = currentChapter;
  useEffect(() => {
    if (!shouldAutoPlayRef.current) return;
    shouldAutoPlayRef.current = false;
    // Defer so restored chapter index from localStorage is applied first
    const id = setTimeout(() => {
      eventBus.publish(MFEvents.AUDIO_PLAY, buildAudioSource(currentChapterRef.current));
    }, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Subscribe to playback state from GlobalAudioPlayer
  useEffect(() => {
    const unsub = subscribeToMFEvent<AudioPlaybackStateEvent>(
      MFEvents.AUDIO_PLAYBACK_STATE,
      (data) => {
        if (data.type !== 'book') return;
        setPlaying(data.isPlaying);
        setCurrentTime(data.currentTime);
        setDuration(data.duration);
        setSpeed(data.playbackSpeed);
        setSleepRemaining(data.sleepRemaining);
        if (data.trackIndex !== currentChapter) {
          setCurrentChapter(data.trackIndex);
        }
      },
    );
    return unsub;
  }, [currentChapter]);

  // Close sleep menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(e.target as Node)) {
        setShowSleepMenu(false);
      }
    }
    if (showSleepMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSleepMenu]);

  const buildAudioSource = useCallback((chapterIdx: number): AudioSource => ({
    type: 'book',
    track: audioTracks[chapterIdx],
    collection: {
      id: bookId || 'book',
      title: bookTitle,
      artwork: coverUrl,
      tracks: audioTracks,
    },
    trackIndex: chapterIdx,
    navigateTo: bookId ? `/library/${bookId}?tab=listen&autoPlay=1` : '/library',
    progressKey: StorageKeys.BOOK_AUDIO_PROGRESS,
    nowPlayingKey: StorageKeys.BOOK_NOW_PLAYING,
    lastPlayedKey: StorageKeys.BOOK_LAST_PLAYED,
    lastPlayedEvent: WindowEvents.BOOK_LAST_PLAYED_CHANGED,
    canQueue: true,
    canShare: true,
    skipSeconds: 10,
  }), [audioTracks, bookId, bookTitle, coverUrl]);

  const togglePlay = useCallback(() => {
    if (playing) {
      eventBus.publish(MFEvents.AUDIO_TOGGLE_PLAY);
    } else {
      // GlobalAudioPlayer's loadSourceProgress() restores position from localStorage automatically
      eventBus.publish(MFEvents.AUDIO_PLAY, buildAudioSource(currentChapter));
      setPlaying(true); // optimistic
    }
  }, [playing, currentChapter, buildAudioSource]);

  const goToChapter = useCallback((index: number) => {
    setCurrentChapter(index);
    eventBus.publish(MFEvents.AUDIO_PLAY, buildAudioSource(index));
    setPlaying(true); // optimistic
  }, [buildAudioSource]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    eventBus.publish(MFEvents.AUDIO_SEEK, { time: Number(e.target.value) });
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    eventBus.publish(MFEvents.AUDIO_CHANGE_SPEED, { speed: newSpeed });
  }, []);

  const skipForward = useCallback(() => {
    eventBus.publish(MFEvents.AUDIO_SEEK, { time: Math.min(currentTime + 10, duration) });
  }, [currentTime, duration]);

  const skipBack = useCallback(() => {
    eventBus.publish(MFEvents.AUDIO_SEEK, { time: Math.max(currentTime - 10, 0) });
  }, [currentTime]);

  const handleSleepTimer = useCallback((minutes: number) => {
    eventBus.publish(MFEvents.AUDIO_SET_SLEEP_TIMER, { minutes });
    setShowSleepMenu(false);
  }, []);

  const handleShare = useCallback(async () => {
    const chapterName = current?.title || bookTitle;
    const shareText = `${bookTitle} - ${chapterName}`;
    const appLink = `${window.location.origin}/library${bookId ? `/${bookId}` : ''}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: chapterName, text: shareText, url: appLink });
        return;
      } catch { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${appLink}`);
    } catch { /* ignore */ }
  }, [current, bookTitle, bookId]);

  // Get the saved progress for this book (single entry: chapter + position + duration)
  const savedProgress = bookId ? bookProgress[bookId] : undefined;

  // Check if the saved chapter matches and is complete (position near end)
  const isChapterComplete = useCallback((chapterIdx: number): boolean => {
    if (!savedProgress || savedProgress.chapter !== chapterIdx) return false;
    return savedProgress.duration > 0 && savedProgress.position >= savedProgress.duration - 5;
  }, [savedProgress]);

  // Get chapter progress as fraction (0-1), only for the chapter that has saved progress
  const getChapterProgressFraction = useCallback((chapterIdx: number): number => {
    if (!savedProgress || savedProgress.chapter !== chapterIdx) return 0;
    if (savedProgress.duration > 0) return Math.min(savedProgress.position / savedProgress.duration, 1);
    return 0;
  }, [savedProgress]);

  if (audioChapters.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex flex-col gap-3 h-full">
      <div className="space-y-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate flex-1">
          {current?.title || bookTitle}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
          {currentChapter + 1}/{audioChapters.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px]">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
          aria-label="Audio progress"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => currentChapter > 0 && goToChapter(currentChapter - 1)}
          disabled={currentChapter === 0}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.prevChapter')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Skip back 10s */}
        <button
          type="button"
          onClick={skipBack}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.skipBack')}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
            <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">10</text>
          </svg>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={playing ? t('library.pause') : t('library.play')}
        >
          {playing ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Skip forward 10s */}
        <button
          type="button"
          onClick={skipForward}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.skipForward')}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
            <text x="12" y="15.5" textAnchor="middle" fontSize="7" fontWeight="bold" fill="currentColor">10</text>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => currentChapter < audioChapters.length - 1 && goToChapter(currentChapter + 1)}
          disabled={currentChapter >= audioChapters.length - 1}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-30 min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label={t('library.nextChapter')}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Speed + Sleep Timer + Share + Download */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Speed */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('library.speed')}:</span>
            <select
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 text-gray-700 dark:text-gray-300 min-h-[44px]"
              aria-label={t('library.speed')}
            >
              {SPEED_OPTIONS.map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </div>

          {/* Sleep timer */}
          <div className="relative" ref={sleepMenuRef}>
            <button
              type="button"
              onClick={() => setShowSleepMenu(!showSleepMenu)}
              className={`p-2 rounded-lg transition min-h-[44px] min-w-[44px] flex items-center justify-center ${
                sleepRemaining > 0
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={t('library.sleepTimer')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              {sleepRemaining > 0 && (
                <span className="absolute -top-1 -right-1 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                  {Math.ceil(sleepRemaining / 60)}
                </span>
              )}
            </button>
            {showSleepMenu && (
              <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                {SLEEP_TIMER_OPTIONS.map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleSleepTimer(mins)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition min-h-[44px] ${
                      mins === 0 && sleepRemaining === 0
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {mins === 0 ? t('library.sleepOff') : `${mins} min`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            type="button"
            onClick={handleShare}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center"
            aria-label={t('library.shareChapter')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>

          {/* Download */}
          {current?.audioUrl && (
            <a
              href={current.audioUrl}
              download={`${bookTitle} - ${current.title}.mp3`}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline min-h-[44px] flex items-center"
            >
              {t('library.download')}
            </a>
          )}
        </div>
      </div>

      </div>
      {/* Chapter list */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-1">
          {audioChapters.map((ch, idx) => {
            const progress = getChapterProgressFraction(idx);
            const complete = isChapterComplete(idx);
            return (
              <button
                key={ch.index}
                type="button"
                onClick={() => goToChapter(idx)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition min-h-[44px] ${
                  idx === currentChapter
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="truncate flex-1">{ch.title}</span>
                  {complete && (
                    <span className="text-green-500 dark:text-green-400 flex-shrink-0" title={t('library.chapterComplete')}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                  )}
                </div>
                {progress > 0 && !complete && (
                  <div className="mt-1 h-1 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all"
                      style={{ width: `${Math.round(progress * 100)}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
