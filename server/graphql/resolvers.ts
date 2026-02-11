import axios from 'axios';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { getCurrentWeather, getForecast, getHourlyForecast } from '../api/weather.js';
import { searchCities, reverseGeocode } from '../api/geocoding.js';
import { getCacheKey, getCachedData, setCachedData } from '../middleware/cache.js';
import { pubsub, WEATHER_UPDATE } from './pubsub.js';

// Caches for stock and podcast data
const stockCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
const podcastCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

// ─── Stock API helpers (Finnhub) ─────────────────────────────

async function searchStocksAPI(query: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY not configured');

  const cacheKey = `stock:search:${query}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get('https://finnhub.io/api/v1/search', {
    params: { q: query },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  const results = response.data.result ?? [];
  stockCache.set(cacheKey, results, 300);
  return results;
}

async function getStockQuote(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY not configured');

  const cacheKey = `stock:quote:${symbol}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get('https://finnhub.io/api/v1/quote', {
    params: { symbol },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 30);
  return response.data;
}

async function getStockCandles(symbol: string, resolution: string, from: number, to: number) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY not configured');

  const cacheKey = `stock:candles:${symbol}:${resolution}:${from}:${to}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get('https://finnhub.io/api/v1/stock/candle', {
    params: { symbol, resolution, from, to },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 300);
  return response.data;
}

// ─── Podcast API helpers (PodcastIndex) ──────────────────────

function getPodcastIndexHeaders(): Record<string, string> {
  const apiKey = process.env.PODCASTINDEX_API_KEY;
  const apiSecret = process.env.PODCASTINDEX_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('PodcastIndex API credentials not configured');

  const ts = Math.floor(Date.now() / 1000);
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${ts}`).digest('hex');
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(ts),
    'Authorization': hash,
    'User-Agent': 'MyCircle/1.0',
  };
}

async function searchPodcastsAPI(query: string) {
  const cacheKey = `podcast:search:${query}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders();
  const response = await axios.get('https://api.podcastindex.org/api/1.0/search/byterm', {
    params: { q: query },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 300);
  return response.data;
}

async function getTrendingPodcastsAPI() {
  const cacheKey = 'podcast:trending';
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders();
  const response = await axios.get('https://api.podcastindex.org/api/1.0/podcasts/trending', {
    params: { max: 20 },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 3600);
  return response.data;
}

async function getPodcastEpisodesAPI(feedId: number) {
  const cacheKey = `podcast:episodes:${feedId}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders();
  const response = await axios.get('https://api.podcastindex.org/api/1.0/episodes/byfeedid', {
    params: { id: feedId, max: 20 },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 600);
  return response.data;
}

// Store active subscriptions
const activeSubscriptions = new Map<string, NodeJS.Timer>();

export const resolvers = {
  Query: {
    weather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const cacheKeyPrefix = getCacheKey(lat, lon, 'all');

      // Try to get cached data
      const cachedCurrent = getCachedData(getCacheKey(lat, lon, 'current'));
      const cachedForecast = getCachedData(getCacheKey(lat, lon, 'forecast'));
      const cachedHourly = getCachedData(getCacheKey(lat, lon, 'hourly'));

      if (cachedCurrent && cachedForecast && cachedHourly) {
        return {
          current: cachedCurrent,
          forecast: cachedForecast,
          hourly: cachedHourly
        };
      }

      // Fetch all data in parallel
      const [current, forecast, hourly] = await Promise.all([
        getCurrentWeather(lat, lon),
        getForecast(lat, lon),
        getHourlyForecast(lat, lon)
      ]);

      // Cache the results
      setCachedData(getCacheKey(lat, lon, 'current'), current);
      setCachedData(getCacheKey(lat, lon, 'forecast'), forecast);
      setCachedData(getCacheKey(lat, lon, 'hourly'), hourly);

      return { current, forecast, hourly };
    },

    currentWeather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const cacheKey = getCacheKey(lat, lon, 'current');
      const cached = getCachedData(cacheKey);

      if (cached) {
        return cached;
      }

      const data = await getCurrentWeather(lat, lon);
      setCachedData(cacheKey, data);
      return data;
    },

    forecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const cacheKey = getCacheKey(lat, lon, 'forecast');
      const cached = getCachedData(cacheKey);

      if (cached) {
        return cached;
      }

      const data = await getForecast(lat, lon);
      setCachedData(cacheKey, data);
      return data;
    },

    hourlyForecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      const cacheKey = getCacheKey(lat, lon, 'hourly');
      const cached = getCachedData(cacheKey);

      if (cached) {
        return cached;
      }

      const data = await getHourlyForecast(lat, lon);
      setCachedData(cacheKey, data);
      return data;
    },

    searchCities: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
      return await searchCities(query, limit);
    },

    reverseGeocode: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      return await reverseGeocode(lat, lon);
    },

    // ─── Stock Resolvers ────────────────────────────────────

    searchStocks: async (_: any, { query }: { query: string }) => {
      return await searchStocksAPI(query);
    },

    stockQuote: async (_: any, { symbol }: { symbol: string }) => {
      return await getStockQuote(symbol);
    },

    stockCandles: async (_: any, { symbol, resolution = 'D', from, to }: { symbol: string; resolution?: string; from: number; to: number }) => {
      return await getStockCandles(symbol, resolution, from, to);
    },

    // ─── Podcast Resolvers ──────────────────────────────────

    searchPodcasts: async (_: any, { query }: { query: string }) => {
      return await searchPodcastsAPI(query);
    },

    trendingPodcasts: async () => {
      return await getTrendingPodcastsAPI();
    },

    podcastEpisodes: async (_: any, { feedId }: { feedId: number }) => {
      return await getPodcastEpisodesAPI(feedId);
    },
  },

  Subscription: {
    weatherUpdates: {
      subscribe: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const subscriptionKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

        // Clear any existing interval for this location
        if (activeSubscriptions.has(subscriptionKey)) {
          clearInterval(activeSubscriptions.get(subscriptionKey)!);
        }

        // Function to fetch and publish weather updates
        const publishWeatherUpdate = async () => {
          try {
            const current = await getCurrentWeather(lat, lon);

            pubsub.publish(WEATHER_UPDATE, {
              weatherUpdates: {
                lat,
                lon,
                current,
                timestamp: new Date().toISOString()
              }
            });

            console.log(`Published weather update for ${lat}, ${lon}`);
          } catch (error) {
            console.error('Error publishing weather update:', error);
          }
        };

        // Publish immediately
        await publishWeatherUpdate();

        // Set up interval to publish every 10 minutes (600000 ms)
        const interval = setInterval(publishWeatherUpdate, 600000);
        activeSubscriptions.set(subscriptionKey, interval);

        // Return async iterator (v3 API uses asyncIterableIterator)
        return pubsub.asyncIterableIterator([WEATHER_UPDATE]);
      },

      resolve: (payload: any, { lat, lon }: { lat: number; lon: number }) => {
        // Only send updates for the subscribed location
        if (
          Math.abs(payload.weatherUpdates.lat - lat) < 0.01 &&
          Math.abs(payload.weatherUpdates.lon - lon) < 0.01
        ) {
          return payload.weatherUpdates;
        }
        return null;
      }
    }
  }
};

// Cleanup function to clear all intervals
export function cleanupSubscriptions() {
  activeSubscriptions.forEach((interval) => clearInterval(interval));
  activeSubscriptions.clear();
}
