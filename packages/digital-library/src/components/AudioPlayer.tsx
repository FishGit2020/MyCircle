import React, { useState, useCallback, useEffect } from 'react';
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
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ chapters, bookTitle, bookId, coverUrl }: AudioPlayerProps) {
  const { t } = useTranslation();
  const [currentChapter, setCurrentChapter] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  const audioChapters = chapters.filter(ch => ch.audioUrl);

  // Build AudioTrack[] for the collection
  const audioTracks: AudioTrack[] = audioChapters.map(ch => ({
    id: `${bookId || 'book'}-${ch.index}`,
    url: ch.audioUrl!,
    title: ch.title,
  }));

  const current = audioChapters[currentChapter];

  // Restore saved chapter on mount
  useEffect(() => {
    if (!bookId) return;
    try {
      const raw = localStorage.getItem(StorageKeys.BOOK_AUDIO_PROGRESS);
      if (!raw) return;
      const progress = JSON.parse(raw);
      const saved = progress[bookId];
      if (saved && saved.chapter >= 0 && saved.chapter < audioChapters.length) {
        setCurrentChapter(saved.chapter);
      }
    } catch { /* ignore */ }
  }, [bookId, audioChapters.length]);

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
        if (data.trackIndex !== currentChapter) {
          setCurrentChapter(data.trackIndex);
        }
      },
    );
    return unsub;
  }, [currentChapter]);

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
    navigateTo: '/library',
    progressKey: StorageKeys.BOOK_AUDIO_PROGRESS,
    nowPlayingKey: StorageKeys.BOOK_NOW_PLAYING,
    lastPlayedKey: StorageKeys.BOOK_LAST_PLAYED,
    lastPlayedEvent: WindowEvents.BOOK_LAST_PLAYED_CHANGED,
    canQueue: false,
    canShare: false,
    skipSeconds: 10,
  }), [audioTracks, bookId, bookTitle, coverUrl]);

  const togglePlay = useCallback(() => {
    if (playing) {
      eventBus.publish(MFEvents.AUDIO_TOGGLE_PLAY);
    } else {
      // Publish AUDIO_PLAY to start playback via GlobalAudioPlayer
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

  if (audioChapters.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
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
            onChange={(e) => handleSpeedChange(Number(e.target.value))}
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
