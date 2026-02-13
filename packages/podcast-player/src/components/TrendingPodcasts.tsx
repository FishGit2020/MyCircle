import React, { useMemo, useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useTrendingPodcasts } from '../hooks/usePodcastData';
import type { Podcast } from '../hooks/usePodcastData';
import PodcastCard from './PodcastCard';

interface TrendingPodcastsProps {
  onSelectPodcast: (podcast: Podcast) => void;
  subscribedIds: Set<string>;
  onToggleSubscribe: (podcast: Podcast) => void;
  initialCategory?: string | null;
}

function extractCategories(podcasts: Podcast[]): string[] {
  const counts = new Map<string, number>();
  for (const p of podcasts) {
    const cats = typeof p.categories === 'string' ? (p.categories as string) : '';
    if (!cats) continue;
    for (const cat of cats.split(', ')) {
      const trimmed = cat.trim();
      if (trimmed) counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1);
    }
  }
  // Sort by frequency, take top 12
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([cat]) => cat);
}

function podcastMatchesCategory(podcast: Podcast, category: string): boolean {
  const cats = typeof podcast.categories === 'string' ? (podcast.categories as string) : '';
  return cats.split(', ').some(c => c.trim() === category);
}

export default function TrendingPodcasts({
  onSelectPodcast,
  subscribedIds,
  onToggleSubscribe,
  initialCategory = null,
}: TrendingPodcastsProps) {
  const { t } = useTranslation();
  const { data: podcasts, loading, error } = useTrendingPodcasts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);

  const categories = useMemo(
    () => (podcasts ? extractCategories(podcasts) : []),
    [podcasts]
  );

  const filteredPodcasts = useMemo(() => {
    if (!podcasts) return [];
    if (!selectedCategory) return podcasts;
    return podcasts.filter(p => podcastMatchesCategory(p, selectedCategory));
  }, [podcasts, selectedCategory]);

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          {t('podcasts.trending')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
              <div className="p-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="flex justify-between">
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-red-300 dark:text-red-600"
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
        <p className="text-sm text-red-500 dark:text-red-400 font-medium">{t('podcasts.error')}</p>
      </div>
    );
  }

  if (!podcasts || podcasts.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        {selectedCategory ? selectedCategory : t('podcasts.trending')}
      </h2>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5" role="list" aria-label={t('podcasts.categories')}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-sm rounded-full font-medium transition ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('podcasts.allCategories')}
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
              className={`px-3 py-1.5 text-sm rounded-full font-medium transition ${
                selectedCategory === cat
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Filtered podcast grid */}
      {filteredPodcasts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredPodcasts.map(podcast => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              onSelect={onSelectPodcast}
              isSubscribed={subscribedIds.has(String(podcast.id))}
              onToggleSubscribe={onToggleSubscribe}
            />
          ))}
        </div>
      ) : selectedCategory ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">{t('podcasts.noInCategory')}</p>
        </div>
      ) : null}
    </div>
  );
}
