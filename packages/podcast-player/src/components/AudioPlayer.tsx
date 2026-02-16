import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import type { Episode, Podcast } from '../hooks/usePodcastData';

interface AudioPlayerProps {
  episode: Episode | null;
  podcast: Podcast | null;
  onClose: () => void;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const PROGRESS_SAVE_INTERVAL = 5000; // Save progress every 5 seconds

function loadSavedSpeed(): number {
  try {
    const saved = localStorage.getItem(StorageKeys.PODCAST_SPEED);
    if (saved) {
      const speed = parseFloat(saved);
      if (PLAYBACK_SPEEDS.includes(speed)) return speed;
    }
  } catch { /* ignore */ }
  return 1;
}

function loadSavedProgress(episodeId: number): number {
  try {
    const saved = localStorage.getItem(StorageKeys.PODCAST_PROGRESS);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.episodeId === episodeId && typeof data.currentTime === 'number') {
        return data.currentTime;
      }
    }
  } catch { /* ignore */ }
  return 0;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ episode, podcast, onClose }: AudioPlayerProps) {
  const { t } = useTranslation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(loadSavedSpeed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !episode) return;

    audio.src = episode.enclosureUrl;
    audio.playbackRate = playbackSpeed;

    // Restore saved progress for this episode
    const savedTime = loadSavedProgress(episode.id);
    if (savedTime > 0) {
      audio.currentTime = savedTime;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }

    return () => {
      audio.pause();
    };
  }, [episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist playback progress periodically
  useEffect(() => {
    if (!episode) return;
    const interval = setInterval(() => {
      const audio = audioRef.current;
      if (audio && audio.currentTime > 0) {
        try {
          localStorage.setItem(
            StorageKeys.PODCAST_PROGRESS,
            JSON.stringify({ episodeId: episode.id, currentTime: audio.currentTime })
          );
        } catch { /* ignore */ }
      }
    }, PROGRESS_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);
    const onDurationChange = () => setDuration(audio.duration);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('durationchange', onDurationChange);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('durationchange', onDurationChange);
    };
  }, [episode?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, audio.duration || 0);
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = fraction * duration;
  }, [duration]);

  const changeSpeed = useCallback((speed: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
    try {
      localStorage.setItem(StorageKeys.PODCAST_SPEED, String(speed));
    } catch { /* ignore */ }
  }, []);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio && episode) {
      // Save final progress before closing
      try {
        localStorage.setItem(
          StorageKeys.PODCAST_PROGRESS,
          JSON.stringify({ episodeId: episode.id, currentTime: audio.currentTime })
        );
      } catch { /* ignore */ }
      audio.pause();
      audio.src = '';
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    onClose();
  }, [onClose, episode]);

  const handleShare = useCallback(async () => {
    if (!episode) return;
    const timeStr = formatTime(currentTime);
    const podcastName = podcast?.title || '';
    const shareText = t('podcasts.shareText')
      .replace('{episode}', episode.title)
      .replace('{podcast}', podcastName)
      .replace('{time}', timeStr);

    if (navigator.share) {
      try {
        await navigator.share({ title: episode.title, text: shareText, url: episode.enclosureUrl });
        return;
      } catch { /* user cancelled or share failed — fall through to clipboard */ }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${episode.enclosureUrl}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [episode, podcast, currentTime, t]);

  if (!episode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const artworkSrc = episode.image || podcast?.artwork || '';

  return (
    <div
      className="podcast-player-slide-up fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      role="region"
      aria-label={t('podcasts.nowPlaying')}
    >
      <audio ref={audioRef} preload="metadata" className="hidden" />

      {/* Progress bar (clickable) */}
      <div
        className="h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group"
        onClick={handleSeek}
        role="progressbar"
        aria-label={t('podcasts.seekPosition')}
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuetext={`${formatTime(currentTime)} / ${formatTime(duration)}`}
      >
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-150 group-hover:bg-blue-600 dark:group-hover:bg-blue-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3 max-w-screen-xl mx-auto">
        {/* Artwork + info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {artworkSrc && (
            <img
              src={artworkSrc}
              alt=""
              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {episode.title}
            </p>
            {podcast && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {podcast.title}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={skipBack}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('podcasts.skipBack')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
            <span className="sr-only">-15s</span>
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3 bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 transition shadow-md"
            aria-label={isPlaying ? t('podcasts.pauseEpisode') : t('podcasts.playEpisode')}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={skipForward}
            className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('podcasts.skipForward')}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
            <span className="sr-only">+15s</span>
          </button>
        </div>

        {/* Time + speed */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[90px] text-center">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <div className="relative" ref={speedMenuRef}>
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label={t('podcasts.speed')}
            >
              {playbackSpeed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[80px]">
                {PLAYBACK_SPEEDS.map(speed => (
                  <button
                    key={speed}
                    onClick={() => changeSpeed(speed)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition ${
                      speed === playbackSpeed
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className={`p-1.5 rounded-full transition ${
              shareCopied
                ? 'text-green-500 dark:text-green-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
            aria-label={shareCopied ? t('podcasts.shareCopied') : t('podcasts.shareEpisode')}
          >
            {shareCopied ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            )}
          </button>

          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('podcasts.closePlayer')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden px-3 py-2">
        <div className="flex items-center gap-3">
          {artworkSrc && (
            <img
              src={artworkSrc}
              alt=""
              className="w-10 h-10 rounded object-cover flex-shrink-0"
              loading="lazy"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {episode.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={skipBack}
              className="p-1.5 text-gray-600 dark:text-gray-300"
              aria-label={t('podcasts.skipBack')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="p-2 bg-blue-500 text-white rounded-full"
              aria-label={isPlaying ? t('podcasts.pauseEpisode') : t('podcasts.playEpisode')}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={skipForward}
              className="p-1.5 text-gray-600 dark:text-gray-300"
              aria-label={t('podcasts.skipForward')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
            </button>

            <button
              onClick={() => {
                const nextIndex = (PLAYBACK_SPEEDS.indexOf(playbackSpeed) + 1) % PLAYBACK_SPEEDS.length;
                changeSpeed(PLAYBACK_SPEEDS[nextIndex]);
              }}
              className="px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded"
              aria-label={t('podcasts.speed')}
            >
              {playbackSpeed}x
            </button>

            <button
              onClick={handleShare}
              className={`p-1.5 ${shareCopied ? 'text-green-500' : 'text-gray-400'}`}
              aria-label={shareCopied ? t('podcasts.shareCopied') : t('podcasts.shareEpisode')}
            >
              {shareCopied ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400"
              aria-label={t('podcasts.closePlayer')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
