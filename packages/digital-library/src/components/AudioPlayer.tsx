import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation, createLogger, StorageKeys } from '@mycircle/shared';

const logger = createLogger('AudioPlayer');

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
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function saveAudioProgress(bookId: string, chapter: number, position: number, duration: number) {
  try {
    const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
    const progress: Record<string, { position: number; duration: number; chapter: number }> = raw ? JSON.parse(raw) : {};
    progress[bookId] = { position, duration, chapter };
    localStorage.setItem(StorageKeys.BOOK_AUDIO_PROGRESS, JSON.stringify(progress));
    window.dispatchEvent(new Event('book-audio-progress-changed'));
  } catch { /* ignore */ }
}

function loadAudioProgress(bookId: string): { position: number; duration: number; chapter: number } | null {
  try {
    const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
    if (!raw) return null;
    const progress = JSON.parse(raw);
    return progress[bookId] || null;
  } catch { return null; }
}

export default function AudioPlayer({ chapters, bookTitle, bookId }: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const lastSaveRef = useRef(0);

  const audioChapters = chapters.filter(ch => ch.audioUrl);
  const current = audioChapters[currentChapter];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Throttled save every 5 seconds
      if (bookId && Date.now() - lastSaveRef.current > 5000) {
        lastSaveRef.current = Date.now();
        saveAudioProgress(bookId, currentChapter, audio.currentTime, audio.duration || 0);
      }
    };
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      // Auto-advance to next chapter
      if (currentChapter < audioChapters.length - 1) {
        setCurrentChapter(prev => prev + 1);
        setPlaying(true);
      } else {
        setPlaying(false);
      }
    };
    const handlePlay = () => setPlaying(true);
    const handlePause = () => {
      setPlaying(false);
      // Save position immediately on pause
      if (bookId) {
        saveAudioProgress(bookId, currentChapter, audio.currentTime, audio.duration || 0);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentChapter, audioChapters.length]);

  // Restore saved position on mount
  useEffect(() => {
    if (!bookId) return;
    const saved = loadAudioProgress(bookId);
    if (saved && saved.chapter >= 0 && saved.chapter < audioChapters.length) {
      setCurrentChapter(saved.chapter);
    }
  }, [bookId, audioChapters.length]);

  // Load new chapter audio when changed
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    audio.src = current.audioUrl;
    audio.playbackRate = speed;

    // Restore saved position for this book
    if (bookId) {
      const saved = loadAudioProgress(bookId);
      if (saved && saved.chapter === currentChapter && saved.position > 0) {
        audio.currentTime = saved.position;
      }
    }

    if (playing) {
      audio.play().catch(err => logger.error('Play failed', err));
    }
  }, [currentChapter, current?.audioUrl]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !current?.audioUrl) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(err => logger.error('Play failed', err));
    }
  }, [playing, current?.audioUrl]);

  const seekTo = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = Number(e.target.value);
  }, []);

  const goToChapter = useCallback((index: number) => {
    setCurrentChapter(index);
    setPlaying(true);
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (audioChapters.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
      <audio ref={audioRef} preload="metadata" />

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
          onChange={seekTo}
          className="flex-1 h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 cursor-pointer"
          aria-label="Audio progress"
        />
        <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[40px] text-right">{formatTime(duration)}</span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
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

      {/* Speed + Download */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('library.speed')}:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 text-gray-700 dark:text-gray-300 min-h-[44px]"
            aria-label={t('library.speed')}
          >
            {SPEED_OPTIONS.map(s => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>

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

      {/* Chapter list */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="max-h-40 overflow-y-auto space-y-1">
          {audioChapters.map((ch, idx) => (
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
              <span className="truncate block">{ch.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
