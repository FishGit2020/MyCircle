import React from 'react';
import { useTranslation } from '@weather/shared';
import type { Episode } from '../hooks/usePodcastData';

interface EpisodeListProps {
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  currentEpisodeId: string | number | null;
  isPlaying: boolean;
  onPlayEpisode: (episode: Episode) => void;
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
}: EpisodeListProps) {
  const { t } = useTranslation();

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
      {episodes.map(episode => {
        const isCurrent = episode.id === currentEpisodeId;
        const isCurrentlyPlaying = isCurrent && isPlaying;

        return (
          <div
            key={episode.id}
            role="listitem"
            className={`flex items-center gap-3 p-3 rounded-lg border transition cursor-pointer ${
              isCurrent
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }`}
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
              </div>
            </div>

            {isCurrent && isCurrentlyPlaying && (
              <div className="flex items-center gap-0.5 flex-shrink-0" aria-hidden="true">
                <span className="w-0.5 h-3 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse" />
                <span className="w-0.5 h-4 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-75" />
                <span className="w-0.5 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse delay-150" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
