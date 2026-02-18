/**
 * Production entry point for Docker self-hosted deployment.
 *
 * Extends the dev server (Apollo + AI chat) with:
 *   - /health endpoint
 *   - /stock/* proxy (Finnhub)
 *   - /podcast/* proxy (PodcastIndex)
 *   - Static file serving (dist/firebase/)
 *   - SPA fallback for all MFE routes
 *   - Per-IP rate limiting
 */
import 'dotenv/config';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import NodeCache from 'node-cache';
import { createApp } from './index.js';

const PORT = Number(process.env.PORT) || 3000;

// ─── External API base URLs ──────────────────────────────────────────
const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
const PODCASTINDEX_BASE = process.env.PODCASTINDEX_BASE_URL || 'https://api.podcastindex.org';

// ─── Rate limiter ────────────────────────────────────────────────────
const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

function checkRateLimit(ip: string, limit: number, windowSec: number): boolean {
  const key = `rate:${ip}:${windowSec}`;
  const current = rateLimitCache.get<number>(key) || 0;
  if (current >= limit) return true;
  rateLimitCache.set(key, current + 1, windowSec);
  return false;
}

function getClientIp(req: express.Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}

// ─── Caches ──────────────────────────────────────────────────────────
const stockCache = new NodeCache();
const podcastCache = new NodeCache();

// ─── PodcastIndex auth headers ───────────────────────────────────────
function getPodcastIndexHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000);
  // SHA-1 required by PodcastIndex API auth spec (https://podcastindex-org.github.io/docs-api/#auth)
  // Not used for password hashing or security-critical integrity checks — safe to use here.
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${ts}`).digest('hex');
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(ts),
    'Authorization': hash,
    'User-Agent': 'MyCircle/1.0',
  };
}

// ─── MFE prefixes (must match assemble-firebase.mjs) ─────────────────
const MFE_PREFIXES = [
  'city-search', 'weather-display', 'stock-tracker', 'podcast-player',
  'ai-assistant', 'bible-reader', 'worship-songs', 'notebook', 'baby-tracker',
  'child-development', 'chinese-learning', 'english-learning',
];

async function startProduction() {
  const { app, httpServer, apolloServer } = await createApp();

  const STATIC_ROOT = resolve('dist/firebase');

  // ─── Health check ─────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Stock proxy (Finnhub) ────────────────────────────────────────
  app.get('/stock/:route', cors(), async (req, res) => {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'FINNHUB_API_KEY not configured' });
      return;
    }

    const ip = getClientIp(req);
    if (checkRateLimit(ip, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const route = req.params.route;
    const baseUrl = `${FINNHUB_BASE}/api/v1`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (route) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search?q=${encodeURIComponent(q)}`;
        cacheKey = `stock:search:${q}`;
        cacheTTL = 300;
        break;
      }
      case 'quote': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/quote?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:quote:${symbol}`;
        cacheTTL = 30;
        break;
      }
      case 'profile': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/stock/profile2?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:profile:${symbol}`;
        cacheTTL = 3600;
        break;
      }
      case 'candles': {
        const symbol = req.query.symbol as string;
        const resolution = (req.query.resolution as string) || 'D';
        const from = req.query.from as string;
        const to = req.query.to as string;
        if (!symbol || !from || !to) { res.status(400).json({ error: 'symbol, from, to parameters required' }); return; }
        url = `${baseUrl}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;
        cacheKey = `stock:candles:${symbol}:${resolution}:${from}:${to}`;
        cacheTTL = 300;
        break;
      }
      default:
        res.status(404).json({ error: `Unknown stock route: ${route}` });
        return;
    }

    const cached = stockCache.get<any>(cacheKey);
    if (cached) { res.json(cached); return; }

    try {
      const response = await axios.get(url, {
        headers: { 'X-Finnhub-Token': apiKey },
        timeout: 10000,
      });
      stockCache.set(cacheKey, response.data, cacheTTL);
      res.json(response.data);
    } catch (err: any) {
      console.error('Stock proxy error:', route, err.message);
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.error || err.message || 'Failed to fetch stock data',
      });
    }
  });

  // ─── Podcast proxy (PodcastIndex) ──────────────────────────────────
  app.get('/podcast/:route', cors(), async (req, res) => {
    const apiKey = process.env.PODCASTINDEX_API_KEY;
    const apiSecret = process.env.PODCASTINDEX_API_SECRET;
    if (!apiKey || !apiSecret) {
      res.status(500).json({ error: 'PodcastIndex API credentials not configured' });
      return;
    }

    const ip = getClientIp(req);
    if (checkRateLimit(ip, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const route = req.params.route;
    const baseUrl = `${PODCASTINDEX_BASE}/api/1.0`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (route) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search/byterm?q=${encodeURIComponent(q)}`;
        cacheKey = `podcast:search:${q}`;
        cacheTTL = 300;
        break;
      }
      case 'trending': {
        url = `${baseUrl}/podcasts/trending?max=20`;
        cacheKey = 'podcast:trending';
        cacheTTL = 3600;
        break;
      }
      case 'episodes': {
        const feedId = req.query.feedId as string;
        if (!feedId) { res.status(400).json({ error: 'feedId parameter required' }); return; }
        url = `${baseUrl}/episodes/byfeedid?id=${encodeURIComponent(feedId)}&max=20`;
        cacheKey = `podcast:episodes:${feedId}`;
        cacheTTL = 600;
        break;
      }
      default:
        res.status(404).json({ error: `Unknown podcast route: ${route}` });
        return;
    }

    const cached = podcastCache.get<any>(cacheKey);
    if (cached) { res.json(cached); return; }

    try {
      const headers = getPodcastIndexHeaders(apiKey, apiSecret);
      const response = await axios.get(url, { headers, timeout: 10000 });
      const data = response.data;
      // Normalize categories from object to string
      if (data?.feeds) {
        data.feeds = data.feeds.map((feed: any) => ({
          ...feed,
          categories: feed.categories && typeof feed.categories === 'object'
            ? Object.values(feed.categories).join(', ')
            : feed.categories ?? null,
        }));
      }
      podcastCache.set(cacheKey, data, cacheTTL);
      res.json(data);
    } catch (err: any) {
      console.error('Podcast proxy error:', route, err.message);
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.description || err.message || 'Failed to fetch podcast data',
      });
    }
  });

  // ─── Static file serving ──────────────────────────────────────────
  app.use(express.static(STATIC_ROOT, {
    maxAge: '1y',
    immutable: true,
    setHeaders(res, filePath) {
      // JS modules need CORS for Module Federation
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      // Never cache service worker or remote entry points
      if (filePath.endsWith('sw.js') || filePath.endsWith('remoteEntry.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // ─── SPA fallback ─────────────────────────────────────────────────
  app.get('*', (req, res) => {
    const prefix = req.path.split('/')[1];
    if (MFE_PREFIXES.includes(prefix)) {
      const mfeIndex = join(STATIC_ROOT, prefix, 'index.html');
      if (existsSync(mfeIndex)) {
        return res.sendFile(mfeIndex);
      }
    }
    res.sendFile(join(STATIC_ROOT, 'index.html'));
  });

  // ─── Start listening ──────────────────────────────────────────────
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MyCircle production server running on port ${PORT}`);
    console.log(`  Health:    http://localhost:${PORT}/health`);
    console.log(`  GraphQL:   http://localhost:${PORT}/graphql`);
    console.log(`  Static:    ${STATIC_ROOT}`);
  });

  // ─── Graceful shutdown ────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    await apolloServer.stop();
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    // Force exit after 10s if connections hang
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startProduction().catch((err) => {
  console.error('Failed to start production server:', err);
  process.exit(1);
});
