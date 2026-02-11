import React from 'react';
import { useTranslation } from '@weather/shared';
import type { Podcast } from '../hooks/usePodcastData';

interface PodcastCardProps {
  podcast: Podcast;
  onSelect: (podcast: Podcast) => void;
  isSubscribed: boolean;
  onToggleSubscribe: (podcast: Podcast) => void;
}

export default function PodcastCard({
  podcast,
  onSelect,
  isSubscribed,
  onToggleSubscribe,
}: PodcastCardProps) {
  const { t } = useTranslation();

  const episodeCountText = t('podcasts.episodeCount').replace(
    '{count}',
    String(podcast.episodeCount)
  );

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

        <div className="flex items-center justify-between mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {episodeCountText}
          </span>

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
