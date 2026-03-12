import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents, subscribeToMFEvent, MFEvents, eventBus } from '@mycircle/shared';
import type { Episode, Podcast } from '@mycircle/shared';

// Display state for NowPlayingWidget (podcast-only)
interface NowPlayingDisplay {
  type: 'podcast';
  title: string;       // episode title
  subtitle: string;    // podcast title
  artwork?: string;
  navigateTo: string;
  savedAt: number;
  episode?: Episode;
  podcast?: Podcast | null;
}

function loadPodcastDisplay(): NowPlayingDisplay | null {
  try {
    // Load played episodes to filter them out
    let playedIds: Set<string> = new Set();
    try {
      const raw = localStorage.getItem(StorageKeys.PODCAST_PLAYED_EPISODES);
      if (raw) playedIds = new Set(JSON.parse(raw));
    } catch { /* ignore */ }

    // Try now-playing first, then last-played
    const nowPlaying = localStorage.getItem(StorageKeys.PODCAST_NOW_PLAYING);
    if (nowPlaying) {
      const data = JSON.parse(nowPlaying);
      if (data.episode && !playedIds.has(data.episode.id)) {
        return {
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast
            ? `/podcasts/${data.podcast.id}?autoplay=true&episode=${data.episode.id}`
            : '/podcasts',
          savedAt: 0, // now-playing has no savedAt; treat as older than last-played
          episode: data.episode,
          podcast: data.podcast,
        };
      }
    }
    const lastPlayed = localStorage.getItem(StorageKeys.PODCAST_LAST_PLAYED);
    if (lastPlayed) {
      const data = JSON.parse(lastPlayed);
      if (data.episode && !playedIds.has(data.episode.id)) {
        return {
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast
            ? `/podcasts/${data.podcast.id}?autoplay=true&episode=${data.episode.id}`
            : '/podcasts',
          savedAt: data.savedAt || 0,
          episode: data.episode as Episode,
          podcast: data.podcast as Podcast,
        };
      }
    }
  } catch { /* ignore */ }
  return null;
}

function loadProgressPct(episodeId?: string): number {
  if (!episodeId) return 0;
  try {
    const raw = localStorage.getItem(StorageKeys.PODCAST_PROGRESS);
    if (raw) {
      const map = JSON.parse(raw) as Record<string, { position: number; duration: number }>;
      const p = map[episodeId];
      if (p && p.duration > 0) return Math.round((p.position / p.duration) * 100);
    }
  } catch { /* ignore */ }
  return 0;
}

const NowPlayingWidget = React.memo(function NowPlayingWidget() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [display, setDisplay] = React.useState<NowPlayingDisplay | null>(null);
  const [isActivelyPlaying, setIsActivelyPlaying] = React.useState(false);
  const [hasSubscriptions, setHasSubscriptions] = React.useState(false);
  const [progressPct, setProgressPct] = React.useState(0);

  useEffect(() => {
    function loadSubs() {
      try {
        const stored = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
        if (stored) {
          const subs = JSON.parse(stored);
          setHasSubscriptions(Array.isArray(subs) && subs.length > 0);
        } else {
          setHasSubscriptions(false);
        }
      } catch { /* ignore */ }
    }
    loadSubs();
    window.addEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, loadSubs);
    return () => window.removeEventListener(WindowEvents.SUBSCRIPTIONS_CHANGED, loadSubs);
  }, []);

  // Hydrate display from persisted podcast data only
  const hydrateDisplay = React.useCallback(() => {
    const d = loadPodcastDisplay();
    setDisplay(d);
    setProgressPct(loadProgressPct(d?.episode?.id));
  }, []);

  useEffect(() => {
    hydrateDisplay();

    // Live updates from podcast play/close events
    const unsubPlay = subscribeToMFEvent<{ episode: Episode; podcast: Podcast | null }>(
      MFEvents.PODCAST_PLAY_EPISODE,
      (data) => {
        setDisplay({
          type: 'podcast',
          title: data.episode.title,
          subtitle: data.podcast?.title || '',
          artwork: data.episode.image || data.podcast?.artwork,
          navigateTo: data.podcast
            ? `/podcasts/${data.podcast.id}?autoplay=true&episode=${data.episode.id}`
            : '/podcasts',
          savedAt: Date.now(),
          episode: data.episode,
          podcast: data.podcast,
        });
        setIsActivelyPlaying(true);
      }
    );

    const unsubClose = subscribeToMFEvent(MFEvents.PODCAST_CLOSE_PLAYER, () => setIsActivelyPlaying(false));

    // Re-hydrate when last-played data changes (e.g. on login)
    function handleLastPlayedChanged() { hydrateDisplay(); }
    window.addEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);

    function handleProgressChanged() {
      const d = loadPodcastDisplay();
      setProgressPct(loadProgressPct(d?.episode?.id));
    }
    window.addEventListener('podcast-progress-changed', handleProgressChanged);

    return () => {
      unsubPlay();
      unsubClose();
      window.removeEventListener(WindowEvents.LAST_PLAYED_CHANGED, handleLastPlayedChanged);
      window.removeEventListener('podcast-progress-changed', handleProgressChanged);
    };
  }, [hydrateDisplay]);

  const handleContinue = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!display) return;

    // URL params (?autoplay=true&episode=...) are the primary autoplay mechanism.
    // The MFE reads them on mount. Keep eventBus as fallback for when the MFE is already mounted.
    navigate(display.navigateTo);

    if (display.episode && display.podcast) {
      eventBus.publish(MFEvents.PODCAST_PLAY_EPISODE, { episode: display.episode, podcast: display.podcast });
    }
  }, [navigate, display]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isActivelyPlaying
            ? 'bg-purple-500 text-white animate-pulse'
            : 'bg-purple-50 dark:bg-purple-900/30 text-purple-500'
        }`}>
          {isActivelyPlaying ? (
            <div className="flex items-end gap-0.5 h-4" aria-hidden="true">
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms', animationDuration: '600ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms', animationDuration: '600ms' }} />
              <span className="w-1 bg-white rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms', animationDuration: '600ms' }} />
            </div>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {isActivelyPlaying ? t('widgets.nowPlaying') : t('widgets.podcastsTitle')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {isActivelyPlaying
              ? t('widgets.nowPlayingDesc')
              : display
                ? t('widgets.continueWhereLeft')
                : t('widgets.discoverAndListen')}
          </p>
        </div>
      </div>
      {display ? (
        <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-lg p-2.5">
          <div className="flex items-center gap-2">
            {display.artwork && (
              <img
                src={display.artwork}
                alt=""
                className="w-10 h-10 rounded object-cover flex-shrink-0 ring-2 ring-purple-300 dark:ring-purple-600"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{display.title}</p>
              <p className="text-xs text-purple-600 dark:text-purple-400 truncate">{display.subtitle}</p>
            </div>
            <button
              type="button"
              onClick={handleContinue}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-purple-500 dark:bg-purple-600 rounded-full hover:bg-purple-600 dark:hover:bg-purple-500 transition active:scale-95"
              aria-label={t('widgets.continueListening')}
            >
              {t('widgets.continueListening')}
            </button>
          </div>
          {progressPct > 0 && (
            <div className="mt-2 h-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          )}
        </div>
      ) : hasSubscriptions ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.nothingPlaying')}</p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.discoverPodcasts')}</p>
      )}
    </div>
  );
});

export default NowPlayingWidget;
