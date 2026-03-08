import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  searchPodcastsAPI,
  podcastCache,
  createPodcastQueryResolvers,
} from '../../resolvers/podcasts.js';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('podcast resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    podcastCache.flushAll();
  });

  // ─── searchPodcastsAPI ────────────────────────────────────────

  it('searchPodcastsAPI normalizes category objects to comma-separated strings', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        feeds: [
          {
            id: 1,
            title: 'Test Podcast',
            categories: { 55: 'News', 59: 'Politics' },
          },
        ],
      },
    });

    const result = await searchPodcastsAPI('key', 'secret', 'test');

    expect(result.feeds[0].categories).toBe('News, Politics');
  });

  it('searchPodcastsAPI handles null categories', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        feeds: [{ id: 2, title: 'No Cat Podcast', categories: null }],
      },
    });

    const result = await searchPodcastsAPI('key', 'secret', 'nocats');
    expect(result.feeds[0].categories).toBeNull();
  });

  it('searchPodcastsAPI sends correct PodcastIndex auth headers', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { feeds: [] } });

    await searchPodcastsAPI('my-api-key', 'my-secret', 'query');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/search/byterm'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Auth-Key': 'my-api-key',
          'User-Agent': 'MyCircle/1.0',
        }),
      }),
    );
  });

  it('searchPodcastsAPI caches results', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { feeds: [] } });

    await searchPodcastsAPI('key', 'secret', 'cached-query');
    await searchPodcastsAPI('key', 'secret', 'cached-query');

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  // ─── createPodcastQueryResolvers error handling ───────────────

  it('resolver throws when credentials are not configured', async () => {
    const resolvers = createPodcastQueryResolvers(() => ({ apiKey: '', apiSecret: '' }));

    await expect(resolvers.searchPodcasts(null, { query: 'test' }))
      .rejects.toThrow('PodcastIndex API credentials not configured');
  });

  it('resolver throws when getPodcastKeys returns undefined', async () => {
    const resolvers = createPodcastQueryResolvers(undefined);

    await expect(resolvers.trendingPodcasts())
      .rejects.toThrow('PodcastIndex API credentials not configured');
  });
});
