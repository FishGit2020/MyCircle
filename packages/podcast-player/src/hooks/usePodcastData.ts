import { useState, useEffect, useRef } from 'react';
import {
  useQuery,
  SEARCH_PODCASTS,
  GET_TRENDING_PODCASTS,
  GET_PODCAST_EPISODES,
} from '@mycircle/shared';
import type { Podcast, Episode, PodcastSearchResult } from '@mycircle/shared';

// Re-export types for backward compatibility
export type { Podcast, Episode, PodcastSearchResult };

// --- GraphQL Response Types ---

interface SearchPodcastsResponse {
  searchPodcasts: {
    feeds: Podcast[];
    count: number;
  };
}

interface TrendingPodcastsResponse {
  trendingPodcasts: {
    feeds: Podcast[];
    count: number;
  };
}

interface PodcastEpisodesResponse {
  podcastEpisodes: {
    items: Episode[];
    count: number;
  };
}

// --- Hook: usePodcastSearch ---

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function usePodcastSearch(query: string): FetchState<PodcastSearchResult> {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('');
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const { data, loading, error } = useQuery<SearchPodcastsResponse>(SEARCH_PODCASTS, {
    variables: { query: debouncedQuery },
    skip: debouncedQuery.length < 2,
    fetchPolicy: 'cache-first',
  });

  if (debouncedQuery.length < 2) {
    return { data: null, loading: false, error: null };
  }

  return {
    data: data?.searchPodcasts ?? null,
    loading,
    error: error?.message ?? null,
  };
}

// --- Hook: useTrendingPodcasts ---

export function useTrendingPodcasts() {
  const { data, loading, error, refetch } = useQuery<TrendingPodcastsResponse>(
    GET_TRENDING_PODCASTS,
    { fetchPolicy: 'cache-and-network' }
  );

  return {
    data: data?.trendingPodcasts?.feeds ?? null,
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
  };
}

// --- Hook: usePodcastEpisodes ---

export function usePodcastEpisodes(feedId: string | number | null) {
  const { data, loading, error } = useQuery<PodcastEpisodesResponse>(GET_PODCAST_EPISODES, {
    variables: { feedId: feedId! },
    skip: feedId === null,
    fetchPolicy: 'cache-and-network',
  });

  return {
    data: data?.podcastEpisodes?.items ?? null,
    loading,
    error: error?.message ?? null,
  };
}
