import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
  useTranslation,
  subscribeToMFEvent,
  eventBus,
  MFEvents,
  StorageKeys,
  WindowEvents,
} from '@mycircle/shared';
import type { Episode, Podcast, PodcastPlayEpisodeEvent, PodcastPlaybackStateEvent } from '@mycircle/shared';

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const SLEEP_TIMER_OPTIONS = [0, 5, 15, 30, 45, 60]; // minutes, 0 = off

// Progress tracking helpers
interface EpisodeProgress {
  position: number;
  duration: number;
}
type ProgressMap = Record<string, EpisodeProgress>;

function loadProgress(): ProgressMap {
  try {
    const stored = localStorage.getItem(StorageKeys.PODCAST_PROGRESS);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveProgress(map: ProgressMap) {
  try { localStorage.setItem(StorageKeys.PODCAST_PROGRESS, JSON.stringify(map)); } catch { /* */ }
}

function loadSpeed(): number {
  try {
    const s = localStorage.getItem(StorageKeys.PODCAST_SPEED);
    if (s) { const n = parseFloat(s); if (PLAYBACK_SPEEDS.includes(n)) return n; }
  } catch { /* */ }
  return 1;
}

function saveSpeed(speed: number) {
  try { localStorage.setItem(StorageKeys.PODCAST_SPEED, String(speed)); } catch { /* */ }
}

function saveLastPlayed(episode: Episode, podcast: Podcast | null, position: number) {
  try {
    const data = {
      episode: { id: episode.id, title: episode.title, enclosureUrl: episode.enclosureUrl, image: episode.image },
      podcast: podcast ? { id: podcast.id, title: podcast.title, artwork: podcast.artwork } : null,
      position,
      savedAt: Date.now(),
    };
    localStorage.setItem(StorageKeys.PODCAST_LAST_PLAYED, JSON.stringify(data));
    window.dispatchEvent(new Event(WindowEvents.LAST_PLAYED_CHANGED));
  } catch { /* ignore */ }
}

interface QueueItem {
  episode: Episode;
  podcast: Podcast | null;
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

export interface GlobalAudioPlayerProps {
  onPlayerStateChange?: (active: boolean) => void;
  onPlayerVisibilityChange?: (visible: boolean) => void;
}

export default function GlobalAudioPlayer({ onPlayerStateChange, onPlayerVisibilityChange }: GlobalAudioPlayerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(loadSpeed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Queue
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const queueRef = useRef<HTMLDivElement>(null);

  // Share
  const [shareCopied, setShareCopied] = useState(false);

  // Sleep timer
  const [sleepMinutes, setSleepMinutes] = useState(0); // 0 = off
  const [sleepRemaining, setSleepRemaining] = useState(0); // seconds remaining
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const sleepMenuRef = useRef<HTMLDivElement>(null);
  const lastProgressSave = useRef(0);

  // Route-based hiding: hide visual bar when on the matching podcast page
  const isOnMatchingPodcastPage = !!(
    podcast &&
    episode &&
    location.pathname === `/podcasts/${podcast.id}`
  );

  // Notify Layout when player is active but visually hidden
  useEffect(() => {
    if (episode) {
      onPlayerVisibilityChange?.(!isOnMatchingPodcastPage);
    } else {
      onPlayerVisibilityChange?.(false);
    }
  }, [episode, isOnMatchingPodcastPage, onPlayerVisibilityChange]);

  // Subscribe to play/close/queue events from Podcast MFE
  useEffect(() => {
    const unsubPlay = subscribeToMFEvent<PodcastPlayEpisodeEvent>(
      MFEvents.PODCAST_PLAY_EPISODE,
      (data) => {
        setEpisode(data.episode);
        setPodcast(data.podcast);
      }
    );

    const unsubQueue = subscribeToMFEvent<PodcastPlayEpisodeEvent>(
      MFEvents.PODCAST_QUEUE_EPISODE,
      (data) => {
        setQueue(prev => {
          // Don't add duplicates
          if (prev.some(q => q.episode.id === data.episode.id)) return prev;
          return [...prev, { episode: data.episode, podcast: data.podcast }];
        });
      }
    );

    const unsubClose = subscribeToMFEvent(
      MFEvents.PODCAST_CLOSE_PLAYER,
      () => {
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setEpisode(null);
        setPodcast(null);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setQueue([]);
        setSleepMinutes(0);
        setSleepRemaining(0);
        try { localStorage.removeItem(StorageKeys.PODCAST_NOW_PLAYING); } catch { /* */ }
      }
    );

    return () => {
      unsubPlay();
      unsubQueue();
      unsubClose();
    };
  }, []);

  // Notify parent of player state changes
  useEffect(() => {
    onPlayerStateChange?.(episode !== null);
  }, [episode, onPlayerStateChange]);

  // Load and play when episode changes — restore saved position
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !episode) return;

    // Persist now-playing state so dashboard widget can hydrate on mount
    try {
      localStorage.setItem(StorageKeys.PODCAST_NOW_PLAYING, JSON.stringify({ episode, podcast }));
    } catch { /* ignore */ }

    // Save last-played for cross-device sync (on episode change)
    saveLastPlayed(episode, podcast, 0);

    audio.src = episode.enclosureUrl;
    audio.playbackRate = playbackSpeed;

    // Restore saved progress
    const progress = loadProgress();
    const saved = progress[String(episode.id)];
    if (saved && saved.position > 0 && saved.duration > 0 && saved.position < saved.duration - 5) {
      audio.currentTime = saved.position;
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

  // Attach event listeners — re-run when episode changes (bug fix)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      // Throttle progress saves to every 5 seconds
      if (episode && audio.currentTime - lastProgressSave.current > 5) {
        lastProgressSave.current = audio.currentTime;
        const map = loadProgress();
        map[String(episode.id)] = { position: audio.currentTime, duration: audio.duration || 0 };
        saveProgress(map);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      // Mark episode as complete
      if (episode) {
        const map = loadProgress();
        map[String(episode.id)] = { position: audio.duration, duration: audio.duration };
        saveProgress(map);
      }
      // Auto-play next from queue
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          setEpisode(next.episode);
          setPodcast(next.podcast);
          return rest;
        }
        // No more episodes — clear now-playing persistence
        try { localStorage.removeItem(StorageKeys.PODCAST_NOW_PLAYING); } catch { /* */ }
        return prev;
      });
    };
    const onDurationChange = () => setDuration(audio.duration);
    const onPause = () => {
      // Save progress on pause
      if (episode && audio.currentTime > 0) {
        const map = loadProgress();
        map[String(episode.id)] = { position: audio.currentTime, duration: audio.duration || 0 };
        saveProgress(map);
        // Save last-played for cross-device sync
        saveLastPlayed(episode, podcast, audio.currentTime);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('pause', onPause);
    };
  }, [episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
        setShowSpeedMenu(false);
      }
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target as Node)) {
        setShowSleepMenu(false);
      }
      if (queueRef.current && !queueRef.current.contains(event.target as Node)) {
        setShowQueue(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!episode) return;

    function handleKeyDown(e: KeyboardEvent) {
      const audio = audioRef.current;
      if (!audio) return;

      // Only handle when not inside an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === 'Escape') {
        handleClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [episode]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleSeekKeyboard = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      audio.currentTime = Math.min(audio.currentTime + 5, duration);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      audio.currentTime = Math.max(audio.currentTime - 5, 0);
    }
  }, [duration]);

  const changeSpeed = useCallback((speed: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.playbackRate = speed;
    }
    setPlaybackSpeed(speed);
    saveSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      // Save progress before closing
      if (episode && audio.currentTime > 0) {
        const map = loadProgress();
        map[String(episode.id)] = { position: audio.currentTime, duration: audio.duration || 0 };
        saveProgress(map);
        // Save last-played for cross-device sync (on close)
        saveLastPlayed(episode, podcast, audio.currentTime);
      }
      audio.pause();
      audio.src = '';
    }
    setEpisode(null);
    setPodcast(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setSleepMinutes(0);
    setSleepRemaining(0);
    try { localStorage.removeItem(StorageKeys.PODCAST_NOW_PLAYING); } catch { /* */ }
  }, [episode, podcast]);

  // Sleep timer countdown
  useEffect(() => {
    if (sleepMinutes <= 0 || !isPlaying) {
      setSleepRemaining(0);
      return;
    }
    setSleepRemaining(sleepMinutes * 60);
    const interval = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev <= 1) {
          // Time's up — pause playback
          const audio = audioRef.current;
          if (audio) audio.pause();
          setIsPlaying(false);
          setSleepMinutes(0);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [sleepMinutes, isPlaying]);

  // Queue helpers
  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    setSleepMinutes(minutes);
    setShowSleepMenu(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!episode) return;
    const timeStr = formatTime(currentTime);
    const podcastName = podcast?.title || '';
    const shareText = t('podcasts.shareText')
      .replace('{episode}', episode.title)
      .replace('{podcast}', podcastName)
      .replace('{time}', timeStr);
    const appLink = podcast ? `${window.location.origin}/podcasts/${podcast.id}` : window.location.origin;

    if (navigator.share) {
      try {
        await navigator.share({ title: episode.title, text: shareText, url: appLink });
        return;
      } catch { /* user cancelled or share failed — fall through to clipboard */ }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${appLink}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [episode, podcast, currentTime, t]);

  // Navigate to podcast detail page when tapping info area
  const handleInfoClick = useCallback(() => {
    if (!podcast) return;
    navigate(`/podcasts/${podcast.id}`, { state: { podcast } });
  }, [podcast, navigate]);

  // Broadcast playback state to MFE when on matching podcast page
  // Use refs to avoid stale closures in the timeupdate listener
  const stateRef = useRef({ isPlaying, playbackSpeed, sleepMinutes, sleepRemaining, queueLength: queue.length });
  stateRef.current = { isPlaying, playbackSpeed, sleepMinutes, sleepRemaining, queueLength: queue.length };

  useEffect(() => {
    if (!isOnMatchingPodcastPage || !episode) return;
    const audio = audioRef.current;

    const broadcastState = () => {
      const state: PodcastPlaybackStateEvent = {
        isPlaying: stateRef.current.isPlaying,
        currentTime: audio?.currentTime ?? 0,
        duration: audio?.duration ?? 0,
        playbackSpeed: stateRef.current.playbackSpeed,
        sleepMinutes: stateRef.current.sleepMinutes,
        sleepRemaining: stateRef.current.sleepRemaining,
        queueLength: stateRef.current.queueLength,
      };
      eventBus.publish(MFEvents.PODCAST_PLAYBACK_STATE, state);
    };

    // Immediate broadcast for initial hydration
    broadcastState();

    // Broadcast on timeupdate (~4x/sec)
    if (audio) {
      audio.addEventListener('timeupdate', broadcastState);
      audio.addEventListener('play', broadcastState);
      audio.addEventListener('pause', broadcastState);
      return () => {
        audio.removeEventListener('timeupdate', broadcastState);
        audio.removeEventListener('play', broadcastState);
        audio.removeEventListener('pause', broadcastState);
      };
    }
  }, [isOnMatchingPodcastPage, episode?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to command events from MFE (InlinePlaybackControls)
  useEffect(() => {
    if (!isOnMatchingPodcastPage) return;

    const unsubs = [
      subscribeToMFEvent(MFEvents.PODCAST_TOGGLE_PLAY, () => togglePlayPause()),
      subscribeToMFEvent<{ time: number }>(MFEvents.PODCAST_SEEK, (data) => {
        const audio = audioRef.current;
        if (audio) audio.currentTime = data.time;
      }),
      subscribeToMFEvent(MFEvents.PODCAST_SKIP_FORWARD, () => skipForward()),
      subscribeToMFEvent(MFEvents.PODCAST_SKIP_BACK, () => skipBack()),
      subscribeToMFEvent<{ speed: number }>(MFEvents.PODCAST_CHANGE_SPEED, (data) => changeSpeed(data.speed)),
      subscribeToMFEvent<{ minutes: number }>(MFEvents.PODCAST_SET_SLEEP_TIMER, (data) => startSleepTimer(data.minutes)),
      subscribeToMFEvent<{ index: number }>(MFEvents.PODCAST_REMOVE_FROM_QUEUE, (data) => removeFromQueue(data.index)),
    ];

    return () => unsubs.forEach(unsub => unsub());
  }, [isOnMatchingPodcastPage, togglePlayPause, skipForward, skipBack, changeSpeed, startSleepTimer, removeFromQueue]);

  if (!episode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const artworkSrc = episode.image || podcast?.artwork || '';

  // Audio element is ALWAYS rendered at the same tree position to prevent
  // React from destroying/recreating it on route changes (which kills playback).
  return (
    <>
      <audio ref={audioRef} preload="metadata" className="hidden" />
      {isOnMatchingPodcastPage ? null : (
    <div
      className="podcast-player-slide-up fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg"
      role="region"
      aria-label={t('podcasts.nowPlaying')}
    >

      {/* Progress bar (clickable + keyboard accessible) */}
      <div
        className="h-1 bg-gray-200 dark:bg-gray-700 cursor-pointer group"
        onClick={handleSeek}
        onKeyDown={handleSeekKeyboard}
        role="slider"
        tabIndex={0}
        aria-label={t('podcasts.seekPosition')}
        aria-valuenow={Math.round(currentTime)}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
      >
        <div
          className="h-full bg-blue-500 dark:bg-blue-400 transition-all duration-150 group-hover:bg-blue-600 dark:group-hover:bg-blue-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-4 px-4 py-3 max-w-screen-xl mx-auto">
        {/* Artwork + info (clickable → navigate to podcast page) */}
        <button
          type="button"
          onClick={handleInfoClick}
          disabled={!podcast}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition p-1 -m-1 disabled:hover:bg-transparent"
          aria-label={t('podcasts.viewPodcast')}
        >
          {artworkSrc && (
            <img
              src={artworkSrc}
              alt=""
              className="w-12 h-12 rounded-md object-cover flex-shrink-0"
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
        </button>

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

        {/* Time + speed + sleep + queue */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[90px] text-center"
            aria-live="polite"
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Speed menu */}
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

          {/* Sleep timer */}
          <div className="relative" ref={sleepMenuRef}>
            <button
              onClick={() => setShowSleepMenu(!showSleepMenu)}
              className={`p-1.5 rounded transition ${
                sleepMinutes > 0
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label={t('podcasts.sleepTimer')}
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
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                {SLEEP_TIMER_OPTIONS.map(mins => (
                  <button
                    key={mins}
                    onClick={() => startSleepTimer(mins)}
                    className={`w-full text-left px-3 py-1.5 text-sm transition ${
                      mins === sleepMinutes
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {mins === 0 ? t('podcasts.sleepOff') : `${mins} min`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Queue button */}
          <div className="relative" ref={queueRef}>
            <button
              onClick={() => setShowQueue(!showQueue)}
              className={`p-1.5 rounded transition ${
                queue.length > 0
                  ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
              aria-label={t('podcasts.queue')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
              </svg>
              {queue.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[9px] font-bold text-white bg-blue-500 rounded-full flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>
            {showQueue && (
              <div className="absolute bottom-full mb-2 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-[240px] max-h-[300px] overflow-y-auto">
                <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {t('podcasts.queue')} ({queue.length})
                  </span>
                </div>
                {queue.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-500 dark:text-gray-400 text-center">
                    {t('podcasts.queueEmpty')}
                  </p>
                ) : (
                  queue.map((item, i) => (
                    <div key={`${item.episode.id}-${i}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <p className="text-xs text-gray-800 dark:text-gray-200 truncate flex-1">{item.episode.title}</p>
                      <button
                        onClick={() => removeFromQueue(i)}
                        className="p-0.5 text-gray-400 hover:text-red-500 transition flex-shrink-0"
                        aria-label={t('podcasts.removeFromQueue')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={handleShare}
            className={`p-1.5 rounded transition ${
              shareCopied
                ? 'text-green-500 dark:text-green-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
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
          {/* Artwork + title (clickable → navigate to podcast page) */}
          <button
            type="button"
            onClick={handleInfoClick}
            disabled={!podcast}
            className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition disabled:active:bg-transparent"
            aria-label={t('podcasts.viewPodcast')}
          >
            {artworkSrc && (
              <img
                src={artworkSrc}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0"
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
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={skipBack}
              className="p-2.5 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
              aria-label={t('podcasts.skipBack')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
            </button>

            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-500 text-white rounded-full active:bg-blue-600 transition"
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
              className="p-2.5 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
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

            {/* Mobile sleep indicator */}
            {sleepRemaining > 0 && (
              <button
                onClick={() => setSleepMinutes(0)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded"
                aria-label={t('podcasts.sleepTimer')}
              >
                {Math.ceil(sleepRemaining / 60)}m
              </button>
            )}

            {/* Mobile queue indicator */}
            {queue.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded">
                Q:{queue.length}
              </span>
            )}

            {/* Mobile share */}
            <button
              onClick={handleShare}
              className={`p-2 rounded-full transition ${shareCopied ? 'text-green-500' : 'text-gray-400 active:bg-gray-100 dark:active:bg-gray-700'}`}
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
              className="p-2 text-gray-400 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
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
      )}
    </>
  );
}
