import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { expandApiKeys, ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken, FINNHUB_BASE } from './shared.js';

const stockCache = new NodeCache();

/**
 * Proxy for Finnhub stock API.
 * Routes:
 *   GET /stock/search?q=...
 *   GET /stock/quote?symbol=...
 *   GET /stock/profile?symbol=...
 *   GET /stock/candles?symbol=...&resolution=D&from=...&to=...
 */
export const stockProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['API_KEYS'],
  },
  async (req: Request, res: Response) => {
    expandApiKeys();
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'FINNHUB_API_KEY not configured' });
      return;
    }

    // Require auth — stock proxy uses Finnhub quota
    const stockUid = await verifyAuthToken(req);
    if (!stockUid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 60 req/min per IP
    const stockIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(stockIp, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const path = req.path.replace(/^\/stock\//, '');
    const baseUrl = `${FINNHUB_BASE}/api/v1`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (path) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search?q=${encodeURIComponent(q)}`;
        cacheKey = `stock:search:${q}`;
        cacheTTL = 300; // 5 min
        break;
      }
      case 'quote': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/quote?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:quote:${symbol}`;
        cacheTTL = 30; // 30 sec
        break;
      }
      case 'profile': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/stock/profile2?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:profile:${symbol}`;
        cacheTTL = 3600; // 1 hr
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
        cacheTTL = 300; // 5 min
        break;
      }
      default:
        res.status(404).json({ error: `Unknown stock route: ${path}` });
        return;
    }

    // Check cache
    const cached = stockCache.get<any>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    try {
      const response = await axios.get(url, {
        headers: { 'X-Finnhub-Token': apiKey },
        timeout: 10000,
      });
      stockCache.set(cacheKey, response.data, cacheTTL);
      res.status(200).json(response.data);
    } catch (err: any) {
      logger.error('Stock proxy error', { path, error: err.message });
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.error || err.message || 'Failed to fetch stock data',
      });
    }
  }
);
