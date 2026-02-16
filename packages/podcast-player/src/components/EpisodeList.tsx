import React, { useState, useMemo } from 'react';
import { useTranslation, StorageKeys, eventBus, MFEvents } from '@mycircle/shared';
import type { Episode } from '../hooks/usePodcastData';
import type { Podcast } from '@mycircle/shared';

interface EpisodeListProps {
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  currentEpisodeId: string | number | null;
  isPlaying: boolean;
  onPlayEpisode: (episode: Episode) => void;
  podcast?: Podcast | null;
}

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

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '--:--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m} min`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function EpisodeList({
  episodes,
  loading,
  error,
  currentEpisodeId,
  isPlaying,
  onPlayEpisode,
  podcast,
}: EpisodeListProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const progress = useMemo(() => loadProgress(), [currentEpisodeId]); // re-read when current episode changes

  const visibleEpisodes = useMemo(
    () => episodes.slice(0, visibleCount),
    [episodes, visibleCount]
  );
  const hasMore = episodes.length > visibleCount;

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <svg
          className="w-10 h-10 mx-auto mb-2 text-red-300 dark:text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <p className="text-sm text-red-500 dark:text-red-400">{t('podcasts.error')}</p>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('podcasts.noResults')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[60vh] overflow-y-auto" role="list" aria-label={t('podcasts.episodes')}>
      {visibleEpisodes.map(episode => {
        const isCurrent = episode.id === currentEpisodeId;
        const isCurrentlyPlaying = isCurrent && isPlaying;
        const isExpanded = expandedId === episode.id;
        const ep = progress[String(episode.id)];
        const hasProgress = ep && ep.position > 0 && ep.duration > 0;
        const progressPercent = hasProgress ? Math.min((ep.position / ep.duration) * 100, 100) : 0;
        const isComplete = hasProgress && ep.position >= ep.duration - 5;

        return (
          <div
            key={episode.id}
            role="listitem"
            className={`rounded-lg border transition ${
              isCurrent
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
          >
            <div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => onPlayEpisode(episode)}
            >
              <button
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition ${
                  isCurrent
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                }`}
                aria-label={
                  isCurrentlyPlaying
                    ? `${t('podcasts.pauseEpisode')}: ${episode.title}`
                    : `${t('podcasts.playEpisode')}: ${episode.title}`
                }
                onClick={e => {
                  e.stopPropagation();
                  onPlayEpisode(episode);
                }}
              >
                {isCurrentlyPlaying ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    isCurrent
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {episode.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(episode.datePublished)}
                  </span>
                  {episode.duration > 0 && (
                    <>
                      <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDuration(episode.duration)}
                      </span>
                    </>
                  )}
                  {isComplete && (
                    <>
                      <span className="text-xs text-gray-300 dark:text-gray-600">|</span>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {t('podcasts.completed')}
                      </span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                {hasProgress && !isComplete && (
                  <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 dark:bg-blue-500 rounded-full transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Show notes toggle */}
                {episode.description && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setExpandedId(isExpanded ? null : episode.id);
                    }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded"
                    aria-label={t('podcasts.showNotes')}
                    aria-expanded={isExpanded}
                  >
                    <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}

                {/* Add to queue */}
                {!isCurrent && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      eventBus.publish(MFEvents.PODCAST_QUEUE_EPISODE, { episode, podcast: podcast ?? null });
                    }}
                    className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition rounded"
                    aria-label={t('podcasts.addToQueue')}
                    title={t('podcasts.addToQueue')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10m-10 4h6" />
                    </svg>
                  </button>
                )}

                {isCurrent && isCurrentlyPlaying && (
                  <div className="flex items-center gap-0.5 flex-shrink-0 ml-1" aria-hidden="true">
                    <span className="w-0.5 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                    <span className="w-0.5 h-4 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-75" />
                    <span className="w-0.5 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-150" />
                  </div>
                )}
              </div>
            </div>

            {/* Expandable show notes */}
            {isExpanded && episode.description && (
              <div className="px-3 pb-3 pt-0 ml-[52px]">
                <div className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-2">
                  <p className="whitespace-pre-line">{episode.description}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
      {hasMore && (
        <button
          onClick={() => setVisibleCount(prev => prev + 20)}
          className="w-full py-2.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
        >
          {t('podcasts.showMore')} ({episodes.length - visibleCount} {t('podcasts.episodes').toLowerCase()})
        </button>
      )}
    </div>
  );
}
