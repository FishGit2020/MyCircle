import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { ALLOWED_ORIGINS, checkRateLimit, PODCASTINDEX_BASE } from './shared.js';

const podcastCache = new NodeCache();

/**
 * Generate PodcastIndex API auth headers.
 * Auth requires: X-Auth-Key, X-Auth-Date, Authorization (SHA-1 of key+secret+timestamp)
 */
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

export const podcastProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['PODCASTINDEX_CREDS'],
  },
  async (req: Request, res: Response) => {
    const piCreds = JSON.parse(process.env.PODCASTINDEX_CREDS || '{}');
    const apiKey = piCreds.apiKey;
    const apiSecret = piCreds.apiSecret;
    if (!apiKey || !apiSecret) {
      res.status(500).json({ error: 'PodcastIndex API credentials not configured' });
      return;
    }

    // Rate limit: 60 req/min per IP
    const podcastIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(podcastIp, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const path = req.path.replace(/^\/podcast\//, '');
    const baseUrl = `${PODCASTINDEX_BASE}/api/1.0`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (path) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search/byterm?q=${encodeURIComponent(q)}`;
        cacheKey = `podcast:search:${q}`;
        cacheTTL = 300; // 5 min
        break;
      }
      case 'trending': {
        url = `${baseUrl}/podcasts/trending?max=20`;
        cacheKey = 'podcast:trending';
        cacheTTL = 3600; // 1 hr
        break;
      }
      case 'episodes': {
        const feedId = req.query.feedId as string;
        if (!feedId) { res.status(400).json({ error: 'feedId parameter required' }); return; }
        url = `${baseUrl}/episodes/byfeedid?id=${encodeURIComponent(feedId)}&max=20`;
        cacheKey = `podcast:episodes:${feedId}`;
        cacheTTL = 600; // 10 min
        break;
      }
      default:
        res.status(404).json({ error: `Unknown podcast route: ${path}` });
        return;
    }

    // Check cache
    const cached = podcastCache.get<any>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    try {
      const headers = getPodcastIndexHeaders(apiKey, apiSecret);
      const response = await axios.get(url, { headers, timeout: 10000 });
      // Normalize categories from object to string (PodcastIndex returns { 55: "News" })
      const data = response.data;
      if (data?.feeds) {
        data.feeds = data.feeds.map((feed: any) => ({
          ...feed,
          categories: feed.categories && typeof feed.categories === 'object'
            ? Object.values(feed.categories).join(', ')
            : feed.categories ?? null,
        }));
      }
      podcastCache.set(cacheKey, data, cacheTTL);
      res.status(200).json(data);
    } catch (err: any) {
      logger.error('Podcast proxy error', { path, error: err.message });
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.description || err.message || 'Failed to fetch podcast data',
      });
    }
  }
);
