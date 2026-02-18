import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Podcast } from '../hooks/usePodcastData';

interface PodcastCardProps {
  podcast: Podcast;
  onSelect: (podcast: Podcast) => void;
  isSubscribed: boolean;
  onToggleSubscribe: (podcast: Podcast) => void;
}

function PodcastCard({
  podcast,
  onSelect,
  isSubscribed,
  onToggleSubscribe,
}: PodcastCardProps) {
  const { t } = useTranslation();

  const episodeCountText = podcast.episodeCount != null
    ? t('podcasts.episodeCount').replace('{count}', String(podcast.episodeCount))
    : null;

  return (
    <div
      className="podcast-player-fade-in group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(podcast)}
      role="button"
      tabIndex={0}
      aria-label={`${podcast.title} - ${podcast.author}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(podcast);
        }
      }}
    >
      <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {podcast.artwork ? (
          <img
            src={podcast.artwork}
            alt={podcast.title}
            width={300}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-16 h-16 text-gray-300 dark:text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          {podcast.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {podcast.author}
        </p>

        {podcast.categories && typeof podcast.categories === 'string' && (podcast.categories as string).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(podcast.categories as string).split(', ').slice(0, 2).map(cat => (
              <span
                key={cat}
                className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 truncate max-w-[80px]"
              >
                {cat}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          {episodeCountText != null && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              aria-label={episodeCountText}
            >
              {episodeCountText}
            </span>
          )}

          <button
            onClick={e => {
              e.stopPropagation();
              onToggleSubscribe(podcast);
            }}
            className={`text-xs font-medium px-2.5 py-1 rounded-full transition ${
              isSubscribed
                ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50'
            }`}
            aria-label={
              isSubscribed
                ? `${t('podcasts.unsubscribe')} ${podcast.title}`
                : `${t('podcasts.subscribe')} ${podcast.title}`
            }
          >
            {isSubscribed ? t('podcasts.unsubscribe') : t('podcasts.subscribe')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PodcastCard);
