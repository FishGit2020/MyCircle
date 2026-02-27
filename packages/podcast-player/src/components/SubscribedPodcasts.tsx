import React from 'react';
import { useQuery, GET_PODCAST_FEED, useTranslation } from '@mycircle/shared';
import type { Podcast } from '../hooks/usePodcastData';

interface SubscribedPodcastsProps {
  subscribedIds: Set<string>;
  onSelectPodcast: (podcast: Podcast) => void;
  onUnsubscribe: (podcast: Podcast) => void;
}

function SubscribedPodcastCard({
  feedId,
  onSelect,
  onUnsubscribe,
}: {
  feedId: string;
  onSelect: (podcast: Podcast) => void;
  onUnsubscribe: (podcast: Podcast) => void;
}) {
  const { t } = useTranslation();
  const { data, loading } = useQuery(GET_PODCAST_FEED, {
    variables: { feedId },
    fetchPolicy: 'cache-first',
  });

  const feed = data?.podcastFeed as Podcast | undefined;

  if (loading) {
    return (
      <div className="animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
        <div className="p-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!feed) return null;

  const episodeCountText = t('podcasts.episodeCount').replace(
    '{count}',
    String(feed.episodeCount ?? 0)
  );

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(feed)}
      role="button"
      tabIndex={0}
      aria-label={`${feed.title} - ${feed.author}`}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(feed);
        }
      }}
    >
      <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
        {feed.artwork ? (
          <img
            src={feed.artwork}
            alt={feed.title}
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
          {feed.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
          {feed.author}
        </p>

        <div className="flex items-center justify-between mt-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {episodeCountText}
          </span>

          <button
            onClick={e => {
              e.stopPropagation();
              onUnsubscribe(feed);
            }}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
            aria-label={`${t('podcasts.unsubscribe')} ${feed.title}`}
          >
            {t('podcasts.unsubscribe')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscribedPodcasts({
  subscribedIds,
  onSelectPodcast,
  onUnsubscribe,
}: SubscribedPodcastsProps) {
  const { t } = useTranslation();
  const ids = Array.from(subscribedIds);

  if (ids.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
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
        <p className="text-gray-500 dark:text-gray-400 font-medium">
          {t('podcasts.noSubscriptions')}
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          {t('podcasts.addSome')}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {t('podcasts.subscriptions')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {ids.map(id => (
          <SubscribedPodcastCard
            key={id}
            feedId={id}
            onSelect={onSelectPodcast}
            onUnsubscribe={onUnsubscribe}
          />
        ))}
      </div>
    </div>
  );
}
