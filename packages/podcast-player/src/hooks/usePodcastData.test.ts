import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  SEARCH_PODCASTS: 'SEARCH_PODCASTS_QUERY',
  GET_TRENDING_PODCASTS: 'GET_TRENDING_PODCASTS_QUERY',
  GET_PODCAST_EPISODES: 'GET_PODCAST_EPISODES_QUERY',
}));

import { usePodcastSearch, useTrendingPodcasts, usePodcastEpisodes } from './usePodcastData';

describe('usePodcastSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null data when query is too short (< 2 chars)', () => {
    const { result } = renderHook(() => usePodcastSearch('a'));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null data when query is empty', () => {
    const { result } = renderHook(() => usePodcastSearch(''));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debounces search query and returns results', () => {
    const mockSearchResult = {
      feeds: [
        {
          id: 1,
          title: 'Test Podcast',
          author: 'Author',
          artwork: 'https://example.com/art.jpg',
          description: 'desc',
          feedUrl: 'https://example.com/feed.xml',
          episodeCount: 10,
          categories: {},
        },
      ],
      count: 1,
    };

    mockUseQuery.mockReturnValue({
      data: { searchPodcasts: mockSearchResult },
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastSearch('test'));

    // Before debounce, query should be skipped
    expect(mockUseQuery).toHaveBeenCalledWith(
      'SEARCH_PODCASTS_QUERY',
      expect.objectContaining({ skip: true })
    );

    // Advance timers to trigger debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // After debounce fires, results should be available
    expect(result.current.data).toEqual(mockSearchResult);
  });

  it('returns loading state from useQuery after debounce fires', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastSearch('test'));

    // Before debounce, the early guard returns loading: false
    // because debouncedQuery is still '' (< 2 chars)
    expect(result.current.loading).toBe(false);

    // After debounce fires, useQuery's loading state is exposed
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.loading).toBe(true);
  });

  it('returns error from useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Search failed' },
    });

    const { result } = renderHook(() => usePodcastSearch('test'));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.error).toBe('Search failed');
  });

  it('clears debounced query when input goes below 2 chars', () => {
    const { result, rerender } = renderHook(
      ({ q }) => usePodcastSearch(q),
      { initialProps: { q: 'test' } }
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Now shorten the query to less than 2 chars
    rerender({ q: 'a' });

    expect(result.current.data).toBeNull();
  });
});

describe('useTrendingPodcasts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns trending podcasts data', () => {
    const mockFeeds = [
      {
        id: 1,
        title: 'Trending Pod',
        author: 'Author',
        artwork: 'https://example.com/art.jpg',
        description: 'desc',
        feedUrl: 'https://example.com/feed.xml',
        episodeCount: 50,
        categories: {},
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { trendingPodcasts: { feeds: mockFeeds, count: 1 } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useTrendingPodcasts());

    expect(result.current.data).toEqual(mockFeeds);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns null when no data is available', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useTrendingPodcasts());

    expect(result.current.data).toBeNull();
  });

  it('returns loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useTrendingPodcasts());

    expect(result.current.loading).toBe(true);
  });

  it('returns error message', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Network error' },
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useTrendingPodcasts());

    expect(result.current.error).toBe('Network error');
  });

  it('provides refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useTrendingPodcasts());
    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('uses cache-and-network fetch policy', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderHook(() => useTrendingPodcasts());

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_TRENDING_PODCASTS_QUERY',
      expect.objectContaining({ fetchPolicy: 'cache-and-network' })
    );
  });
});

describe('usePodcastEpisodes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns episodes for a given feed ID', () => {
    const mockEpisodes = [
      {
        id: 10,
        title: 'Episode 1',
        description: 'desc',
        datePublished: 1700000000,
        duration: 1800,
        enclosureUrl: 'https://example.com/ep1.mp3',
        enclosureType: 'audio/mpeg',
        image: '',
        feedId: 1,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { podcastEpisodes: { items: mockEpisodes, count: 1 } },
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastEpisodes(1));

    expect(result.current.data).toEqual(mockEpisodes);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('skips query when feedId is null', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastEpisodes(null));

    expect(result.current.data).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_PODCAST_EPISODES_QUERY',
      expect.objectContaining({ skip: true })
    );
  });

  it('returns null when no episode data is available', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastEpisodes(1));

    expect(result.current.data).toBeNull();
  });

  it('returns loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });

    const { result } = renderHook(() => usePodcastEpisodes(1));

    expect(result.current.loading).toBe(true);
  });

  it('returns error message', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Failed to load episodes' },
    });

    const { result } = renderHook(() => usePodcastEpisodes(1));

    expect(result.current.error).toBe('Failed to load episodes');
  });

  it('accepts string feed ID', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    });

    renderHook(() => usePodcastEpisodes('abc-123'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_PODCAST_EPISODES_QUERY',
      expect.objectContaining({
        variables: { feedId: 'abc-123' },
        skip: false,
      })
    );
  });
});
