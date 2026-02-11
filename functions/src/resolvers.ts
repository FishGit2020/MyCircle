import axios from 'axios';
import crypto from 'crypto';
import NodeCache from 'node-cache';

// Simple in-memory cache
const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const stockCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
const podcastCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

function getCacheKey(lat: number, lon: number, type: string): string {
  return `${type}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

// Types
interface WeatherCondition {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface CurrentWeather {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  weather: WeatherCondition[];
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  dt: number;
  timezone: number;
  sunrise?: number;
  sunset?: number;
  visibility?: number;
}

interface ForecastDay {
  dt: number;
  temp: { min: number; max: number; day: number; night: number };
  weather: WeatherCondition[];
  humidity: number;
  wind_speed: number;
  pop: number;
}

interface HourlyForecast {
  dt: number;
  temp: number;
  weather: WeatherCondition[];
  pop: number;
  wind_speed: number;
}

interface City {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

// Weather API functions
function createWeatherClient(apiKey: string) {
  return axios.create({
    baseURL: 'https://api.openweathermap.org/data/2.5',
    timeout: 5000,
    params: {
      appid: apiKey,
      units: 'metric'
    }
  });
}

function createGeoClient(apiKey: string) {
  return axios.create({
    baseURL: 'https://api.openweathermap.org/geo/1.0',
    timeout: 5000,
    params: {
      appid: apiKey
    }
  });
}

async function getCurrentWeather(apiKey: string, lat: number, lon: number): Promise<CurrentWeather> {
  const client = createWeatherClient(apiKey);
  const response = await client.get('/weather', { params: { lat, lon } });
  const data = response.data;

  return {
    temp: Math.round(data.main.temp),
    feels_like: Math.round(data.main.feels_like),
    temp_min: Math.round(data.main.temp_min),
    temp_max: Math.round(data.main.temp_max),
    pressure: data.main.pressure,
    humidity: data.main.humidity,
    weather: data.weather,
    wind: data.wind,
    clouds: data.clouds,
    dt: data.dt,
    timezone: data.timezone,
    sunrise: data.sys?.sunrise,
    sunset: data.sys?.sunset,
    visibility: data.visibility,
  };
}

async function getForecast(apiKey: string, lat: number, lon: number): Promise<ForecastDay[]> {
  const client = createWeatherClient(apiKey);
  const response = await client.get('/forecast', { params: { lat, lon, cnt: 40 } });
  const data = response.data;

  const dailyData = new Map<string, any[]>();
  data.list.forEach((item: any) => {
    const date = new Date(item.dt * 1000).toDateString();
    if (!dailyData.has(date)) {
      dailyData.set(date, []);
    }
    dailyData.get(date)!.push(item);
  });

  return Array.from(dailyData.values()).slice(0, 7).map(dayData => ({
    dt: dayData[0].dt,
    temp: {
      min: Math.round(Math.min(...dayData.map(d => d.main.temp_min))),
      max: Math.round(Math.max(...dayData.map(d => d.main.temp_max))),
      day: Math.round(dayData.find(d => {
        const hour = new Date(d.dt * 1000).getHours();
        return hour >= 12 && hour <= 15;
      })?.main.temp || dayData[0].main.temp),
      night: Math.round(dayData.find(d => {
        const hour = new Date(d.dt * 1000).getHours();
        return hour >= 0 && hour <= 3;
      })?.main.temp || dayData[dayData.length - 1].main.temp)
    },
    weather: dayData[Math.floor(dayData.length / 2)].weather,
    humidity: Math.round(dayData.reduce((sum, d) => sum + d.main.humidity, 0) / dayData.length),
    wind_speed: dayData[0].wind.speed,
    pop: Math.max(...dayData.map(d => d.pop))
  }));
}

async function getHourlyForecast(apiKey: string, lat: number, lon: number): Promise<HourlyForecast[]> {
  const client = createWeatherClient(apiKey);
  const response = await client.get('/forecast', { params: { lat, lon, cnt: 16 } });

  return response.data.list.map((item: any) => ({
    dt: item.dt,
    temp: Math.round(item.main.temp),
    weather: item.weather,
    pop: item.pop,
    wind_speed: item.wind.speed
  }));
}

async function searchCities(apiKey: string, query: string, limit: number = 5): Promise<City[]> {
  const client = createGeoClient(apiKey);
  const response = await client.get('/direct', { params: { q: query, limit } });

  return response.data.map((item: any) => ({
    id: `${item.lat},${item.lon}`,
    name: item.name,
    country: item.country,
    state: item.state,
    lat: item.lat,
    lon: item.lon
  }));
}

async function reverseGeocode(apiKey: string, lat: number, lon: number): Promise<City | null> {
  const client = createGeoClient(apiKey);
  const response = await client.get('/reverse', { params: { lat, lon, limit: 1 } });

  if (response.data && response.data.length > 0) {
    const item = response.data[0];
    return {
      id: `${item.lat},${item.lon}`,
      name: item.name,
      country: item.country,
      state: item.state,
      lat: item.lat,
      lon: item.lon
    };
  }
  return null;
}

// ─── Stock API helpers (Finnhub) ─────────────────────────────

async function searchStocks(apiKey: string, query: string) {
  const cacheKey = `stock:search:${query}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`https://finnhub.io/api/v1/search`, {
    params: { q: query },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  const results = response.data.result ?? [];
  stockCache.set(cacheKey, results, 300);
  return results;
}

async function getStockQuote(apiKey: string, symbol: string) {
  const cacheKey = `stock:quote:${symbol}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
    params: { symbol },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 30);
  return response.data;
}

async function getStockCandles(apiKey: string, symbol: string, resolution: string, from: number, to: number) {
  const cacheKey = `stock:candles:${symbol}:${resolution}:${from}:${to}`;
  const cached = stockCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`https://finnhub.io/api/v1/stock/candle`, {
    params: { symbol, resolution, from, to },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });
  stockCache.set(cacheKey, response.data, 300);
  return response.data;
}

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
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${ts}`).digest('hex');
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(ts),
    'Authorization': hash,
    'User-Agent': 'MyCircle/1.0',
  };
}

async function searchPodcastsAPI(apiKey: string, apiSecret: string, query: string) {
  const cacheKey = `podcast:search:${query}`;
  const cached = podcastCache.get<any>(cacheKey);
  if (cached) return cached;

  const headers = getPodcastIndexHeaders(apiKey, apiSecret);
  const response = await axios.get(`https://api.podcastindex.org/api/1.0/search/byterm`, {
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
  const response = await axios.get(`https://api.podcastindex.org/api/1.0/podcasts/trending`, {
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
  const response = await axios.get(`https://api.podcastindex.org/api/1.0/podcasts/byfeedid`, {
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
  const response = await axios.get(`https://api.podcastindex.org/api/1.0/episodes/byfeedid`, {
    params: { id: feedId, max: 20 },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 600);
  return response.data;
}

// Resolver factory
export function createResolvers(getApiKey: () => string, getFinnhubKey?: () => string, getPodcastKeys?: () => { apiKey: string; apiSecret: string }) {
  return {
    Query: {
      weather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();

        // Try cache first
        const cachedCurrent = weatherCache.get<CurrentWeather>(getCacheKey(lat, lon, 'current'));
        const cachedForecast = weatherCache.get<ForecastDay[]>(getCacheKey(lat, lon, 'forecast'));
        const cachedHourly = weatherCache.get<HourlyForecast[]>(getCacheKey(lat, lon, 'hourly'));

        if (cachedCurrent && cachedForecast && cachedHourly) {
          return {
            current: cachedCurrent,
            forecast: cachedForecast,
            hourly: cachedHourly
          };
        }

        // Fetch all data in parallel
        const [current, forecast, hourly] = await Promise.all([
          getCurrentWeather(apiKey, lat, lon),
          getForecast(apiKey, lat, lon),
          getHourlyForecast(apiKey, lat, lon)
        ]);

        // Cache the results
        weatherCache.set(getCacheKey(lat, lon, 'current'), current);
        weatherCache.set(getCacheKey(lat, lon, 'forecast'), forecast);
        weatherCache.set(getCacheKey(lat, lon, 'hourly'), hourly);

        return { current, forecast, hourly };
      },

      currentWeather: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        const cacheKey = getCacheKey(lat, lon, 'current');
        const cached = weatherCache.get<CurrentWeather>(cacheKey);

        if (cached) return cached;

        const data = await getCurrentWeather(apiKey, lat, lon);
        weatherCache.set(cacheKey, data);
        return data;
      },

      forecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        const cacheKey = getCacheKey(lat, lon, 'forecast');
        const cached = weatherCache.get<ForecastDay[]>(cacheKey);

        if (cached) return cached;

        const data = await getForecast(apiKey, lat, lon);
        weatherCache.set(cacheKey, data);
        return data;
      },

      hourlyForecast: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        const cacheKey = getCacheKey(lat, lon, 'hourly');
        const cached = weatherCache.get<HourlyForecast[]>(cacheKey);

        if (cached) return cached;

        const data = await getHourlyForecast(apiKey, lat, lon);
        weatherCache.set(cacheKey, data);
        return data;
      },

      searchCities: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
        const apiKey = getApiKey();
        return await searchCities(apiKey, query, limit);
      },

      reverseGeocode: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        return await reverseGeocode(apiKey, lat, lon);
      },

      // ─── Stock Resolvers ────────────────────────────────────

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

      // ─── Podcast Resolvers ──────────────────────────────────

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
    }
  };
}
