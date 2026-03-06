import axios from 'axios';
import crypto from 'crypto';
import NodeCache from 'node-cache';

const PODCASTINDEX_BASE = process.env.PODCASTINDEX_BASE_URL || 'https://api.podcastindex.org';

export const podcastCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ─── Podcast helpers ─────────────────────────────────────────

/** PodcastIndex returns categories as { 55: "News", 59: "Politics" } (object keyed by ID).
 *  GraphQL expects String, so we convert to "News, Politics". */
function normalizePodcastFeeds(data: any) {
  if (data?.feeds) {
    data.feeds = data.feeds.map((feed: any) => ({
      ...feed,
      categories: feed.categories && typeof feed.categories === 'object'
        ? Object.values(feed.categories).join(', ')
        : feed.categories ?? null,
    }));
  }
  return data;
}

// ─── Podcast API helpers (PodcastIndex) ──────────────────────

function getPodcastIndexHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000);
  // CodeQL [js/weak-cryptographic-algorithm]: SHA-1 is required by PodcastIndex API auth spec — not used for password hashing
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${ts}`).digest('hex');
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(ts),
    'Authorization': hash,
    'User-Agent': 'MyCircle/1.0',
  };
}

export async function searchPodcastsAPI(apiKey: string, apiSecret: string, query: string) {
  const cacheKey = `podcast:search:${query}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders(apiKey, apiSecret);
  const response = await axios.get(`${PODCASTINDEX_BASE}/api/1.0/search/byterm`, {
    params: { q: query },
    headers,
    timeout: 10000,
  });
  const result = normalizePodcastFeeds(response.data);
  podcastCache.set(cacheKey, result, 300);
  return result;
}

async function getTrendingPodcastsAPI(apiKey: string, apiSecret: string) {
  const cacheKey = 'podcast:trending';
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders(apiKey, apiSecret);
  const response = await axios.get(`${PODCASTINDEX_BASE}/api/1.0/podcasts/trending`, {
    params: { max: 20 },
    headers,
    timeout: 10000,
  });
  const result = normalizePodcastFeeds(response.data);
  podcastCache.set(cacheKey, result, 3600);
  return result;
}

async function getPodcastFeedAPI(apiKey: string, apiSecret: string, feedId: string | number) {
  const cacheKey = `podcast:feed:${feedId}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders(apiKey, apiSecret);
  const response = await axios.get(`${PODCASTINDEX_BASE}/api/1.0/podcasts/byfeedid`, {
    params: { id: feedId },
    headers,
    timeout: 10000,
  });
  const feed = response.data?.feed;
  if (feed && feed.categories && typeof feed.categories === 'object') {
    feed.categories = Object.values(feed.categories).join(', ');
  }
  podcastCache.set(cacheKey, feed, 600);
  return feed ?? null;
}

async function getPodcastEpisodesAPI(apiKey: string, apiSecret: string, feedId: string | number) {
  const cacheKey = `podcast:episodes:${feedId}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders(apiKey, apiSecret);
  const response = await axios.get(`${PODCASTINDEX_BASE}/api/1.0/episodes/byfeedid`, {
    params: { id: feedId, max: 100 },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 600);
  return response.data;
}

// ─── Podcast Query Resolvers ──────────────────────────────────

export function createPodcastQueryResolvers(getPodcastKeys?: () => { apiKey: string; apiSecret: string }) {
  return {
    searchPodcasts: async (_: any, { query }: { query: string }) => {
      const keys = getPodcastKeys?.();
      if (!keys?.apiKey || !keys?.apiSecret) throw new Error('PodcastIndex API credentials not configured');
      return await searchPodcastsAPI(keys.apiKey, keys.apiSecret, query);
    },

    trendingPodcasts: async () => {
      const keys = getPodcastKeys?.();
      if (!keys?.apiKey || !keys?.apiSecret) throw new Error('PodcastIndex API credentials not configured');
      return await getTrendingPodcastsAPI(keys.apiKey, keys.apiSecret);
    },

    podcastEpisodes: async (_: any, { feedId }: { feedId: string }) => {
      const keys = getPodcastKeys?.();
      if (!keys?.apiKey || !keys?.apiSecret) throw new Error('PodcastIndex API credentials not configured');
      return await getPodcastEpisodesAPI(keys.apiKey, keys.apiSecret, feedId);
    },

    podcastFeed: async (_: any, { feedId }: { feedId: string }) => {
      const keys = getPodcastKeys?.();
      if (!keys?.apiKey || !keys?.apiSecret) throw new Error('PodcastIndex API credentials not configured');
      return await getPodcastFeedAPI(keys.apiKey, keys.apiSecret, feedId);
    },
  };
}
