import axios from 'axios';
import NodeCache from 'node-cache';

const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';

export const stockCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });

// ─── Company News (Finnhub) ─────────────────────────────

export async function getCompanyNews(apiKey: string, symbol: string, from: string, to: string) {
  const cacheKey = `stock:news:${symbol}:${from}:${to}`;
  const cached = stockCache.get<any[]>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${FINNHUB_BASE}/api/v1/company-news`, {
    params: { symbol, from, to },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });

  const articles = (response.data ?? []).slice(0, 10).map((a: any) => ({
    id: a.id,
    category: a.category || 'company',
    datetime: a.datetime,
    headline: a.headline || '',
    image: a.image || null,
    source: a.source || '',
    summary: a.summary || '',
    url: a.url || '',
    related: a.related || null,
  }));

  stockCache.set(cacheKey, articles, 300);
  return articles;
}

// ─── Stock API helpers (Finnhub) ─────────────────────────────

export async function searchStocks(apiKey: string, query: string) {
  const cacheKey = `stock:search:${query}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${FINNHUB_BASE}/api/v1/search`, {
    params: { q: query },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  const results = response.data.result ?? [];
  stockCache.set(cacheKey, results, 300);
  return results;
}

export async function getStockQuote(apiKey: string, symbol: string) {
  const cacheKey = `stock:quote:${symbol}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${FINNHUB_BASE}/api/v1/quote`, {
    params: { symbol },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 30);
  return response.data;
}

export async function getStockCandles(apiKey: string, symbol: string, resolution: string, from: number, to: number) {
  const cacheKey = `stock:candles:${symbol}:${resolution}:${from}:${to}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${FINNHUB_BASE}/api/v1/stock/candle`, {
    params: { symbol, resolution, from, to },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 300);
  return response.data;
}

// ─── Stock Query Resolvers ────────────────────────────────────

export function createStockQueryResolvers(getFinnhubKey?: () => string) {
  return {
    searchStocks: async (_: any, { query }: { query: string }) => {
      const finnhubKey = getFinnhubKey?.() || '';
      if (!finnhubKey) throw new Error('FINNHUB_API_KEY not configured');
      return await searchStocks(finnhubKey, query);
    },

    stockQuote: async (_: any, { symbol }: { symbol: string }) => {
      const finnhubKey = getFinnhubKey?.() || '';
      if (!finnhubKey) throw new Error('FINNHUB_API_KEY not configured');
      return await getStockQuote(finnhubKey, symbol);
    },

    stockCandles: async (_: any, { symbol, resolution = 'D', from, to }: { symbol: string; resolution?: string; from: number; to: number }) => {
      const finnhubKey = getFinnhubKey?.() || '';
      if (!finnhubKey) throw new Error('FINNHUB_API_KEY not configured');
      return await getStockCandles(finnhubKey, symbol, resolution, from, to);
    },

    companyNews: async (_: any, { symbol, from, to }: { symbol: string; from: string; to: string }) => {
      const finnhubKey = getFinnhubKey?.() || '';
      if (!finnhubKey) throw new Error('FINNHUB_API_KEY not configured');
      return await getCompanyNews(finnhubKey, symbol, from, to);
    },
  };
}
