import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation, subscribeToMFEvent, eventBus, MFEvents } from '@mycircle/shared';
import type { PodcastPlaybackStateEvent, Episode, Podcast } from '@mycircle/shared';

const PLAYBACK_SPEEDS = [0.5, 1, 1.25, 1.5, 2];
const SLEEP_TIMER_OPTIONS = [0, 5, 15, 30, 45, 60];

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

interface InlinePlaybackControlsProps {
  episode: Episode;
  podcast: Podcast | null;
}

export default function InlinePlaybackControls({ episode, podcast }: InlinePlaybackControlsProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<PodcastPlaybackStateEvent>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    playbackSpeed: 1,
    sleepMinutes: 0,
    sleepRemaining: 0,
    queueLength: 0,
  });
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Subscribe to playback state broadcasts from GlobalAudioPlayer
  useEffect(() => {
    const unsub = subscribeToMFEvent<PodcastPlaybackStateEvent>(
      MFEvents.PODCAST_PLAYBACK_STATE,
      (data) => setState(data),
    );
    return unsub;
  }, []);

  const togglePlay = useCallback(() => {
    eventBus.publish(MFEvents.PODCAST_TOGGLE_PLAY);
  }, []);

  const skipForward = useCallback(() => {
    eventBus.publish(MFEvents.PODCAST_SKIP_FORWARD);
  }, []);

  const skipBack = useCallback(() => {
    eventBus.publish(MFEvents.PODCAST_SKIP_BACK);
  }, []);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!state.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    eventBus.publish(MFEvents.PODCAST_SEEK, { time: fraction * state.duration });
  }, [state.duration]);

  const handleSeekKeyboard = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!state.duration) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      eventBus.publish(MFEvents.PODCAST_SEEK, { time: Math.min(state.currentTime + 5, state.duration) });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      eventBus.publish(MFEvents.PODCAST_SEEK, { time: Math.max(state.currentTime - 5, 0) });
    }
  }, [state.currentTime, state.duration]);

  const changeSpeed = useCallback((speed: number) => {
    eventBus.publish(MFEvents.PODCAST_CHANGE_SPEED, { speed });
    setShowSpeedMenu(false);
  }, []);

  const startSleepTimer = useCallback((minutes: number) => {
    eventBus.publish(MFEvents.PODCAST_SET_SLEEP_TIMER, { minutes });
    setShowSleepMenu(false);
  }, []);

  const handleClose = useCallback(() => {
    eventBus.publish(MFEvents.PODCAST_CLOSE_PLAYER);
  }, []);

  const handleShare = useCallback(async () => {
    const timeStr = formatTime(state.currentTime);
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
      } catch { /* user cancelled */ }
    }

    try {
      await navigator.clipboard.writeText(`${shareText}\n${appLink}`);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch { /* clipboard not available */ }
  }, [episode, podcast, state.currentTime, t]);

  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const artworkSrc = episode.image || podcast?.artwork || '';

  return (
    <div
      className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
      role="region"
      aria-label={t('podcasts.nowPlaying')}
    >
      {/* Episode info */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {artworkSrc && (
          <img
            src={artworkSrc}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 shadow-sm"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {episode.title}
          </p>
          {podcast && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {podcast.title}
            </p>
          )}
        </div>
      </div>

      {/* Seek bar */}
      <div className="px-4 pt-2">
        <div
          className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer group"
          onClick={handleSeek}
          onKeyDown={handleSeekKeyboard}
          role="slider"
          tabIndex={0}
          aria-label={t('podcasts.seekPosition')}
          aria-valuenow={Math.round(state.currentTime)}
          aria-valuemin={0}
          aria-valuemax={Math.round(state.duration)}
          aria-valuetext={`${formatTime(state.currentTime)} of ${formatTime(state.duration)}`}
        >
          <div
            className="h-full bg-blue-500 dark:bg-blue-400 rounded-full transition-all duration-150 group-hover:bg-blue-600 dark:group-hover:bg-blue-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {formatTime(state.currentTime)}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
            {formatTime(state.duration)}
          </span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4 py-3">
        <button
          type="button"
          onClick={skipBack}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={t('podcasts.skipBack')}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
          </svg>
          <span className="sr-only">-15s</span>
        </button>

        <button
          type="button"
          onClick={togglePlay}
          className="p-4 bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-500 transition shadow-md"
          aria-label={state.isPlaying ? t('podcasts.pauseEpisode') : t('podcasts.playEpisode')}
        >
          {state.isPlaying ? (
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
          onClick={skipForward}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={t('podcasts.skipForward')}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
          </svg>
          <span className="sr-only">+15s</span>
        </button>
      </div>

      {/* Secondary controls */}
      <div className="flex items-center justify-center gap-2 px-4 pb-4">
        {/* Speed */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            aria-label={t('podcasts.speed')}
          >
            {state.playbackSpeed}x
          </button>
          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[80px] z-10">
              {PLAYBACK_SPEEDS.map(speed => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => changeSpeed(speed)}
                  className={`w-full text-left px-3 py-1.5 text-sm transition ${
                    speed === state.playbackSpeed
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
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`p-1.5 rounded-full transition ${
              state.sleepMinutes > 0
                ? 'text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            aria-label={t('podcasts.sleepTimer')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
            {state.sleepRemaining > 0 && (
              <span className="absolute -top-1 -right-1 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                {Math.ceil(state.sleepRemaining / 60)}
              </span>
            )}
          </button>
          {showSleepMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
              {SLEEP_TIMER_OPTIONS.map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => startSleepTimer(mins)}
                  className={`w-full text-left px-3 py-1.5 text-sm transition ${
                    mins === state.sleepMinutes
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

        {/* Queue count */}
        {state.queueLength > 0 && (
          <span className="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-full">
            {t('podcasts.queue')} ({state.queueLength})
          </span>
        )}

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className={`p-1.5 rounded-full transition ${
            shareCopied
              ? 'text-green-500 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
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

        {/* Close */}
        <button
          type="button"
          onClick={handleClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label={t('podcasts.closePlayer')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
