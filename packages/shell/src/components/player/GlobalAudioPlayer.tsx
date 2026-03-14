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
import type { PodcastPlayEpisodeEvent, AudioSource, AudioPlaybackStateEvent } from '@mycircle/shared';

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const SLEEP_TIMER_OPTIONS = [0, 5, 15, 30, 45, 60]; // minutes, 0 = off

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

/** Save progress to the source-specific localStorage key */
function saveSourceProgress(source: AudioSource, position: number, audioDuration: number) {
  try {
    const raw = localStorage.getItem(source.progressKey);
    const progress = raw ? JSON.parse(raw) : {};
    if (source.type === 'book') {
      progress[source.collection.id] = { position, duration: audioDuration, chapter: source.trackIndex };
    } else {
      progress[source.track.id] = { position, duration: audioDuration };
    }
    localStorage.setItem(source.progressKey, JSON.stringify(progress));
    if (source.type === 'book') {
      window.dispatchEvent(new Event('book-audio-progress-changed'));
      // Track chapter completion in played-chapters set
      if (audioDuration > 0 && position >= audioDuration - 5) {
        markChapterPlayed(source.collection.id, source.trackIndex);
      }
    } else {
      window.dispatchEvent(new Event('podcast-progress-changed'));
    }
  } catch { /* */ }
}

/** Mark a chapter as played (completed) and persist to localStorage */
function markChapterPlayed(bookId: string, chapterIndex: number) {
  try {
    const raw = localStorage.getItem(StorageKeys.BOOK_PLAYED_CHAPTERS);
    const all: Record<string, number[]> = raw ? JSON.parse(raw) : {};
    const chapters = all[bookId] || [];
    if (!chapters.includes(chapterIndex)) {
      all[bookId] = [...chapters, chapterIndex].sort((a, b) => a - b);
      localStorage.setItem(StorageKeys.BOOK_PLAYED_CHAPTERS, JSON.stringify(all));
      window.dispatchEvent(new Event(WindowEvents.BOOK_PLAYED_CHAPTERS_CHANGED));
    }
  } catch { /* */ }
}

/** Load saved position for a source */
function loadSourceProgress(source: AudioSource): number {
  try {
    const raw = localStorage.getItem(source.progressKey);
    if (!raw) return 0;
    const progress = JSON.parse(raw);
    if (source.type === 'book') {
      const saved = progress[source.collection.id];
      if (saved && saved.chapter === source.trackIndex && saved.position > 0) return saved.position;
    } else {
      const saved = progress[source.track.id];
      if (saved && saved.position > 0 && saved.duration > 0 && saved.position < saved.duration - 5) return saved.position;
    }
  } catch { /* */ }
  return 0;
}

/** Save last-played data for cross-device sync */
function saveLastPlayed(source: AudioSource, position: number) {
  try {
    if (source.type === 'podcast') {
      // Podcast format (backward compatible with existing NowPlayingWidget)
      const data = {
        episode: {
          id: source.track.id,
          title: source.track.title,
          enclosureUrl: source.track.url,
          image: source.collection.artwork,
        },
        podcast: {
          id: source.collection.id,
          title: source.collection.title,
          artwork: source.collection.artwork,
        },
        position,
        savedAt: Date.now(),
      };
      localStorage.setItem(source.lastPlayedKey, JSON.stringify(data));
    } else if (source.type === 'book') {
      const data = {
        bookId: source.collection.id,
        bookTitle: source.collection.title,
        artwork: source.collection.artwork,
        chapterTitle: source.track.title,
        chapterIndex: source.trackIndex,
        position,
        savedAt: Date.now(),
      };
      localStorage.setItem(source.lastPlayedKey, JSON.stringify(data));
    }
    window.dispatchEvent(new Event(source.lastPlayedEvent));
  } catch { /* ignore */ }
}

/** Save now-playing persistence for widget hydration */
function saveNowPlaying(source: AudioSource) {
  try {
    if (source.type === 'podcast') {
      // Backward compatible format for NowPlayingWidget
      localStorage.setItem(source.nowPlayingKey, JSON.stringify({
        episode: {
          id: source.track.id,
          title: source.track.title,
          enclosureUrl: source.track.url,
          image: source.collection.artwork,
        },
        podcast: {
          id: source.collection.id,
          title: source.collection.title,
          artwork: source.collection.artwork,
        },
      }));
    } else {
      localStorage.setItem(source.nowPlayingKey, JSON.stringify(source));
    }
  } catch { /* ignore */ }
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

  // Generic audio source state
  const [source, setSource] = useState<AudioSource | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(loadSpeed);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);

  // Queue (AudioSource items)
  const [queue, setQueue] = useState<AudioSource[]>([]);
  const [showQueue, setShowQueue] = useState(false);
  const queueRef = useRef<HTMLDivElement>(null);

  // Share
  const [shareCopied, setShareCopied] = useState(false);

  // Sleep timer
  const [sleepMinutes, setSleepMinutes] = useState(0);
  const [sleepRemaining, setSleepRemaining] = useState(0);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const sleepMenuRef = useRef<HTMLDivElement>(null);
  const lastProgressSave = useRef(0);

  // Ref to track current source for stale-closure safety
  const sourceRef = useRef(source);
  sourceRef.current = source;

  // Derived display values
  const artwork = source?.collection.artwork || '';
  const title = source?.track.title || '';
  const subtitle = source?.collection.title || '';
  const hasMultipleTracks = (source?.collection.tracks.length ?? 0) > 1;
  const skipSeconds = source?.skipSeconds;

  // Route-based hiding: only for podcasts on their detail page
  const isOnMatchingPage = !!(
    source?.type === 'podcast' &&
    source.collection.id &&
    location.pathname === `/podcasts/${source.collection.id}`
  );

  // Hide when BookReader Listen tab is active (keep player alive, just CSS hidden)
  const [bookListenActive, setBookListenActive] = useState(false);
  useEffect(() => {
    function handleBookListenTab(e: Event) {
      setBookListenActive((e as CustomEvent).detail === true);
    }
    window.addEventListener(WindowEvents.BOOK_LISTEN_TAB_ACTIVE, handleBookListenTab);
    return () => window.removeEventListener(WindowEvents.BOOK_LISTEN_TAB_ACTIVE, handleBookListenTab);
  }, []);

  // Notify Layout when player is active but visually hidden
  useEffect(() => {
    if (source) {
      onPlayerVisibilityChange?.(!isOnMatchingPage);
    } else {
      onPlayerVisibilityChange?.(false);
    }
  }, [source, isOnMatchingPage, onPlayerVisibilityChange]);

  // Podcast adapter: map PODCAST_PLAY_EPISODE → AudioSource
  useEffect(() => {
    const unsubPlay = subscribeToMFEvent<PodcastPlayEpisodeEvent>(
      MFEvents.PODCAST_PLAY_EPISODE,
      (data) => {
        const { episode, podcast } = data;
        const audioSource: AudioSource = {
          type: 'podcast',
          track: { id: String(episode.id), url: episode.enclosureUrl, title: episode.title },
          collection: {
            id: String(podcast?.id || ''),
            title: podcast?.title || '',
            artwork: episode.image || podcast?.artwork,
            tracks: [{ id: String(episode.id), url: episode.enclosureUrl, title: episode.title }],
          },
          trackIndex: 0,
          navigateTo: podcast ? `/podcasts/${podcast.id}` : '/',
          progressKey: StorageKeys.PODCAST_PROGRESS,
          nowPlayingKey: StorageKeys.PODCAST_NOW_PLAYING,
          lastPlayedKey: StorageKeys.PODCAST_LAST_PLAYED,
          lastPlayedEvent: WindowEvents.LAST_PLAYED_CHANGED,
          canQueue: true,
          canShare: true,
          skipSeconds: 15,
        };
        // Save current source progress before switching
        if (source) {
          const audio = audioRef.current;
          if (audio && audio.currentTime > 0) {
            saveSourceProgress(source, audio.currentTime, audio.duration || 0);
          }
        }
        setSource(audioSource);
      }
    );

    const unsubQueue = subscribeToMFEvent<PodcastPlayEpisodeEvent>(
      MFEvents.PODCAST_QUEUE_EPISODE,
      (data) => {
        const { episode, podcast } = data;
        const audioSource: AudioSource = {
          type: 'podcast',
          track: { id: String(episode.id), url: episode.enclosureUrl, title: episode.title },
          collection: {
            id: String(podcast?.id || ''),
            title: podcast?.title || '',
            artwork: episode.image || podcast?.artwork,
            tracks: [{ id: String(episode.id), url: episode.enclosureUrl, title: episode.title }],
          },
          trackIndex: 0,
          navigateTo: podcast ? `/podcasts/${podcast.id}` : '/',
          progressKey: StorageKeys.PODCAST_PROGRESS,
          nowPlayingKey: StorageKeys.PODCAST_NOW_PLAYING,
          lastPlayedKey: StorageKeys.PODCAST_LAST_PLAYED,
          lastPlayedEvent: WindowEvents.LAST_PLAYED_CHANGED,
          canQueue: true,
          canShare: true,
          skipSeconds: 15,
        };
        setQueue(prev => {
          if (prev.some(q => q.track.id === audioSource.track.id)) return prev;
          return [...prev, audioSource];
        });
      }
    );

    return () => { unsubPlay(); unsubQueue(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Generic AUDIO_PLAY — book and future sources use this directly
  useEffect(() => {
    const unsub = subscribeToMFEvent<AudioSource>(
      MFEvents.AUDIO_PLAY,
      (audioSource) => {
        // Save current source progress before switching
        const audio = audioRef.current;
        if (sourceRef.current && audio && audio.currentTime > 0) {
          saveSourceProgress(sourceRef.current, audio.currentTime, audio.duration || 0);
        }
        setSource(audioSource);
        setQueue([]); // clear queue when switching to a new source type
      }
    );
    return unsub;
  }, []);

  // Close events — both legacy and generic
  useEffect(() => {
    const unsubLegacy = subscribeToMFEvent(MFEvents.PODCAST_CLOSE_PLAYER, () => handleCloseRef.current());
    const unsubGeneric = subscribeToMFEvent(MFEvents.AUDIO_CLOSE, () => handleCloseRef.current());
    return () => { unsubLegacy(); unsubGeneric(); };
  }, []);

  // Notify parent of player state changes
  useEffect(() => {
    onPlayerStateChange?.(source !== null);
  }, [source, onPlayerStateChange]);

  // Load and play when source/track changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !source) return;

    // Persist now-playing for widget hydration
    saveNowPlaying(source);

    // Save last-played for cross-device sync
    saveLastPlayed(source, 0);

    audio.src = source.track.url;
    audio.playbackRate = playbackSpeed;

    // Restore saved progress
    const savedPosition = loadSourceProgress(source);
    if (savedPosition > 0) {
      audio.currentTime = savedPosition;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }

    return () => { audio.pause(); };
  }, [source?.track.id, source?.trackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      const src = sourceRef.current;
      if (src && audio.currentTime - lastProgressSave.current > 5) {
        lastProgressSave.current = audio.currentTime;
        saveSourceProgress(src, audio.currentTime, audio.duration || 0);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => {
      setIsPlaying(false);
      const src = sourceRef.current;
      if (!src) return;

      // Mark as complete
      saveSourceProgress(src, audio.duration, audio.duration);

      // Auto-advance to next track in collection (e.g., next chapter for books)
      if (src.collection.tracks.length > 1 && src.trackIndex < src.collection.tracks.length - 1) {
        const nextIndex = src.trackIndex + 1;
        setSource({
          ...src,
          trackIndex: nextIndex,
          track: src.collection.tracks[nextIndex],
        });
        return;
      }

      // Auto-play next from queue
      setQueue(prev => {
        if (prev.length > 0) {
          const [next, ...rest] = prev;
          setSource(next);
          return rest;
        }
        // Done — clear now-playing
        try { localStorage.removeItem(src.nowPlayingKey); } catch { /* */ }
        return prev;
      });
    };
    const onPause = () => {
      // Sync UI when audio is paused externally (e.g. headphone button, iOS media controls)
      setIsPlaying(false);
      const src = sourceRef.current;
      if (src && audio.currentTime > 0) {
        saveSourceProgress(src, audio.currentTime, audio.duration || 0);
        saveLastPlayed(src, audio.currentTime);
      }
    };
    const onPlay = () => {
      // Sync UI when audio resumes externally (e.g. headphone button, iOS media controls)
      setIsPlaying(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, [source?.track.id, source?.trackIndex]);  

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) setShowSpeedMenu(false);
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target as Node)) setShowSleepMenu(false);
      if (queueRef.current && !queueRef.current.contains(event.target as Node)) setShowQueue(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!source) return;
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') handleCloseRef.current();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [source]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const p = audio.play();
      if (p && typeof p.then === 'function') {
        p.then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  }, [isPlaying]);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !sourceRef.current?.skipSeconds) return;
    audio.currentTime = Math.min(audio.currentTime + sourceRef.current.skipSeconds, audio.duration || 0);
  }, []);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !sourceRef.current?.skipSeconds) return;
    audio.currentTime = Math.max(audio.currentTime - sourceRef.current.skipSeconds, 0);
  }, []);

  const advanceTrack = useCallback((direction: number) => {
    const src = sourceRef.current;
    if (!src || src.collection.tracks.length <= 1) return;
    const newIndex = src.trackIndex + direction;
    if (newIndex < 0 || newIndex >= src.collection.tracks.length) return;
    setSource({ ...src, trackIndex: newIndex, track: src.collection.tracks[newIndex] });
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
    if (e.key === 'ArrowRight') { e.preventDefault(); audio.currentTime = Math.min(audio.currentTime + 5, duration); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); audio.currentTime = Math.max(audio.currentTime - 5, 0); }
  }, [duration]);

  const changeSpeed = useCallback((speed: number) => {
    if (!isFinite(speed) || speed <= 0) return;
    const audio = audioRef.current;
    if (audio) audio.playbackRate = speed;
    setPlaybackSpeed(speed);
    saveSpeed(speed);
    setShowSpeedMenu(false);
  }, []);

  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    const src = sourceRef.current;
    if (audio) {
      if (src && audio.currentTime > 0) {
        saveSourceProgress(src, audio.currentTime, audio.duration || 0);
        saveLastPlayed(src, audio.currentTime);
      }
      audio.pause();
      audio.src = '';
    }
    if (src) {
      try { localStorage.removeItem(src.nowPlayingKey); } catch { /* */ }
    }
    setSource(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setQueue([]);
    setSleepMinutes(0);
    setSleepRemaining(0);
  }, []);

  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  // Sleep timer countdown
  useEffect(() => {
    if (sleepMinutes <= 0 || !isPlaying) { setSleepRemaining(0); return; }
    setSleepRemaining(sleepMinutes * 60);
    const interval = setInterval(() => {
      setSleepRemaining(prev => {
        if (prev <= 1) {
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

  // Media Session API
  useEffect(() => {
    if (!source || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: source.track.title,
      artist: source.collection.title,
      album: source.collection.title,
      artwork: artwork ? [{ src: artwork, sizes: '512x512', type: 'image/jpeg' }] : [],
    });

    navigator.mediaSession.setActionHandler('play', () => {
      const audio = audioRef.current;
      if (audio) audio.play().then(() => setIsPlaying(true)).catch(() => {});
    });
    navigator.mediaSession.setActionHandler('pause', () => {
      const audio = audioRef.current;
      if (audio) { audio.pause(); setIsPlaying(false); }
    });
    navigator.mediaSession.setActionHandler('seekbackward', () => {
      const audio = audioRef.current;
      const secs = sourceRef.current?.skipSeconds || 15;
      if (audio) audio.currentTime = Math.max(audio.currentTime - secs, 0);
    });
    navigator.mediaSession.setActionHandler('seekforward', () => {
      const audio = audioRef.current;
      const secs = sourceRef.current?.skipSeconds || 15;
      if (audio) audio.currentTime = Math.min(audio.currentTime + secs, audio.duration || 0);
    });

    // Add prev/next track handlers for multi-track sources
    if (source.collection.tracks.length > 1) {
      navigator.mediaSession.setActionHandler('previoustrack', () => advanceTrack(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => advanceTrack(+1));
    }

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch { /* some browsers don't support null handlers */ }
    };
  }, [source?.track.id, artwork, advanceTrack]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep Media Session position state in sync
  useEffect(() => {
    if (!source || !('mediaSession' in navigator)) return;
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration) || audio.duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration: audio.duration,
        playbackRate: audio.playbackRate,
        position: Math.min(audio.currentTime, audio.duration),
      });
    } catch { /* ignore */ }
  }, [source?.track.id, currentTime, playbackSpeed]); // eslint-disable-line react-hooks/exhaustive-deps

  const removeFromQueue = useCallback((index: number) => {
    setQueue(prev => prev.filter((_, i) => i !== index));
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    setSleepMinutes(minutes);
    setShowSleepMenu(false);
  }, []);

  const handleShare = useCallback(async () => {
    if (!source || !source.canShare) return;
    const timeStr = formatTime(currentTime);
    const shareText = t('podcasts.shareText')
      .replace('{episode}', source.track.title)
      .replace('{podcast}', source.collection.title)
      .replace('{time}', timeStr);
    const appLink = `${window.location.origin}${source.navigateTo}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: source.track.title, text: shareText, url: appLink });
        return;
      } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${appLink}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* */ }
  }, [source, currentTime, t]);

  const handleInfoClick = useCallback(() => {
    if (!source) return;
    navigate(source.navigateTo);
  }, [source, navigate]);

  // Ref-stable command handlers
  const commandHandlersRef = useRef({ togglePlayPause, skipForward, skipBack, changeSpeed, startSleepTimer, removeFromQueue, advanceTrack });
  commandHandlersRef.current = { togglePlayPause, skipForward, skipBack, changeSpeed, startSleepTimer, removeFromQueue, advanceTrack };

  // Broadcast playback state (generic AUDIO_PLAYBACK_STATE)
  const queueSummary = queue.filter(q => q?.track).map(q => ({ id: q.track.id, title: q.track.title }));
  const stateRef = useRef({ isPlaying, playbackSpeed, sleepMinutes, sleepRemaining, queueLength: queue.length, queue: queueSummary });
  stateRef.current = { isPlaying, playbackSpeed, sleepMinutes, sleepRemaining, queueLength: queue.length, queue: queueSummary };

  useEffect(() => {
    if (!source) return;
    const audio = audioRef.current;

    const broadcastState = () => {
      const src = sourceRef.current;
      if (!src) return;
      const state: AudioPlaybackStateEvent = {
        type: src.type,
        isPlaying: stateRef.current.isPlaying,
        currentTime: audio?.currentTime ?? 0,
        duration: audio?.duration ?? 0,
        playbackSpeed: stateRef.current.playbackSpeed,
        sleepMinutes: stateRef.current.sleepMinutes,
        sleepRemaining: stateRef.current.sleepRemaining,
        trackIndex: src.trackIndex,
        totalTracks: src.collection.tracks.length,
        trackTitle: src.track.title,
        queueLength: stateRef.current.queueLength,
        queue: stateRef.current.queue,
      };
      eventBus.publish(MFEvents.AUDIO_PLAYBACK_STATE, state);
    };

    broadcastState();

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
  }, [source?.track.id, source?.trackIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to generic AUDIO_* command events (always active)
  useEffect(() => {
    const unsubs = [
      subscribeToMFEvent(MFEvents.AUDIO_TOGGLE_PLAY, () => commandHandlersRef.current.togglePlayPause()),
      subscribeToMFEvent<{ time: number }>(MFEvents.AUDIO_SEEK, (data) => {
        const audio = audioRef.current;
        if (audio && data && isFinite(data.time)) audio.currentTime = data.time;
      }),
      subscribeToMFEvent(MFEvents.AUDIO_SKIP_FORWARD, () => commandHandlersRef.current.skipForward()),
      subscribeToMFEvent(MFEvents.AUDIO_SKIP_BACK, () => commandHandlersRef.current.skipBack()),
      subscribeToMFEvent(MFEvents.AUDIO_NEXT_TRACK, () => commandHandlersRef.current.advanceTrack(+1)),
      subscribeToMFEvent(MFEvents.AUDIO_PREV_TRACK, () => commandHandlersRef.current.advanceTrack(-1)),
      subscribeToMFEvent<{ speed: number }>(MFEvents.AUDIO_CHANGE_SPEED, (data) => { if (data?.speed) commandHandlersRef.current.changeSpeed(data.speed); }),
      subscribeToMFEvent<{ minutes: number }>(MFEvents.AUDIO_SET_SLEEP_TIMER, (data) => { if (data) commandHandlersRef.current.startSleepTimer(data.minutes); }),
      subscribeToMFEvent<AudioSource>(MFEvents.AUDIO_QUEUE, (s) => {
        if (!s?.track) return;
        setQueue(prev => {
          if (prev.some(q => q.track.id === s.track.id)) return prev;
          return [...prev, s];
        });
      }),
      subscribeToMFEvent<{ index: number }>(MFEvents.AUDIO_REMOVE_FROM_QUEUE, (data) => { if (data) commandHandlersRef.current.removeFromQueue(data.index); }),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  if (!source) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} preload="metadata" className="hidden" />
      {isOnMatchingPage ? null : (
    <div
      className={`podcast-player-slide-up fixed bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))] md:bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg${bookListenActive ? ' hidden' : ''}`}
      role="region"
      aria-label={t('podcasts.nowPlaying')}
    >
      {/* Progress bar */}
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
        {/* Artwork + info */}
        <button
          type="button"
          onClick={handleInfoClick}
          className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition p-1 -m-1"
          aria-label={t('podcasts.viewPodcast')}
        >
          {artwork && (
            <img src={artwork} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {subtitle}
              {hasMultipleTracks && ` \u2022 ${t('player.chapterOf').replace('{current}', String(source.trackIndex + 1)).replace('{total}', String(source.collection.tracks.length))}`}
            </p>
          </div>
        </button>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Prev track */}
          {hasMultipleTracks && (
            <button
              type="button"
              onClick={() => advanceTrack(-1)}
              disabled={source.trackIndex === 0}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              aria-label={t('player.prevTrack')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Skip back */}
          {skipSeconds && (
            <button
              onClick={skipBack}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={t('podcasts.skipBack')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
              </svg>
              <span className="sr-only">-{skipSeconds}s</span>
            </button>
          )}

          <button
            onClick={togglePlayPause}
            className="p-3 bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 transition shadow-md"
            aria-label={isPlaying ? t('podcasts.pauseEpisode') : t('podcasts.playEpisode')}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>

          {/* Skip forward */}
          {skipSeconds && (
            <button
              onClick={skipForward}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={t('podcasts.skipForward')}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
              </svg>
              <span className="sr-only">+{skipSeconds}s</span>
            </button>
          )}

          {/* Next track */}
          {hasMultipleTracks && (
            <button
              type="button"
              onClick={() => advanceTrack(+1)}
              disabled={source.trackIndex >= source.collection.tracks.length - 1}
              className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30"
              aria-label={t('player.nextTrack')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Time + speed + sleep + queue */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums min-w-[90px] text-center" aria-live="polite">
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

          {/* Queue button (only for sources that support it) */}
          {source.canQueue && (
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
                      <div key={`${item.track.id}-${i}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                        <p className="text-xs text-gray-800 dark:text-gray-200 truncate flex-1">{item.track.title}</p>
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
          )}

          {/* Share button (only for sources that support it) */}
          {source.canShare && (
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
          )}

          <button
            onClick={handleClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label={t('player.closePlayer')}
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
          <button
            type="button"
            onClick={handleInfoClick}
            className="flex items-center gap-3 min-w-0 flex-1 text-left rounded-lg active:bg-gray-100 dark:active:bg-gray-800 transition"
            aria-label={t('podcasts.viewPodcast')}
          >
            {artwork && (
              <img src={artwork} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {skipSeconds && (
              <button
                onClick={skipBack}
                className="p-2.5 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
                aria-label={t('podcasts.skipBack')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>
            )}

            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-500 text-white rounded-full active:bg-blue-600 transition"
              aria-label={isPlaying ? t('podcasts.pauseEpisode') : t('podcasts.playEpisode')}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              )}
            </button>

            {skipSeconds && (
              <button
                onClick={skipForward}
                className="p-2.5 text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
                aria-label={t('podcasts.skipForward')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>
            )}

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

            {sleepRemaining > 0 && (
              <button
                onClick={() => setSleepMinutes(0)}
                className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded"
                aria-label={t('podcasts.sleepTimer')}
              >
                {Math.ceil(sleepRemaining / 60)}m
              </button>
            )}

            {source.canQueue && queue.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded">
                Q:{queue.length}
              </span>
            )}

            {source.canShare && (
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
            )}

            <button
              onClick={handleClose}
              className="p-2 text-gray-400 active:bg-gray-100 dark:active:bg-gray-700 rounded-full transition"
              aria-label={t('player.closePlayer')}
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
