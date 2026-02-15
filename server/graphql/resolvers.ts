import axios from 'axios';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { getCurrentWeather, getForecast, getHourlyForecast } from '../api/weather.js';
import { searchCities, reverseGeocode } from '../api/geocoding.js';
import { getCacheKey, getCachedData, setCachedData } from '../middleware/cache.js';
import { pubsub, WEATHER_UPDATE } from './pubsub.js';

// Caches for stock, crypto, podcast, weather, and bible data
const stockCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
const cryptoCache = new NodeCache({ stdTTL: 60, checkperiod: 20 });
const podcastCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const weatherExtraCache = new NodeCache({ stdTTL: 600, checkperiod: 60 });
const bibleCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://archive-api.open-meteo.com';
const YOUVERSION_API_BASE = process.env.YOUVERSION_API_BASE_URL || 'https://api.youversion.com/v1';

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

// ─── Crypto API helpers (CoinGecko — free, no API key) ───────

async function getCryptoPrices(ids: string[], vsCurrency: string = 'usd') {
  const key = `crypto:${ids.sort().join(',')}:${vsCurrency}`;
  const cached = cryptoCache.get<any[]>(key);
  if (cached) return cached;

  const response = await axios.get(`${COINGECKO_BASE}/api/v3/coins/markets`, {
    params: {
      vs_currency: vsCurrency,
      ids: ids.join(','),
      order: 'market_cap_desc',
      sparkline: true,
      price_change_percentage: '24h',
    },
    timeout: 10000,
  });

  const results = response.data.map((coin: any) => ({
    id: coin.id,
    symbol: coin.symbol,
    name: coin.name,
    image: coin.image,
    current_price: coin.current_price,
    market_cap: coin.market_cap,
    market_cap_rank: coin.market_cap_rank,
    price_change_percentage_24h: coin.price_change_percentage_24h,
    total_volume: coin.total_volume,
    sparkline_7d: coin.sparkline_in_7d?.price ?? [],
  }));

  cryptoCache.set(key, results, 60);
  return results;
}

// ─── Air Quality (OpenWeatherMap) ─────────────────────────────

async function getAirQuality(lat: number, lon: number) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) throw new Error('OPENWEATHER_API_KEY not configured');

  const cacheKey = `aqi:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherExtraCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${OPENWEATHER_BASE}/data/2.5/air_pollution`, {
    params: { lat, lon, appid: apiKey },
    timeout: 5000,
  });

  const item = response.data.list?.[0];
  if (!item) return null;

  const result = {
    aqi: item.main.aqi,
    co: item.components.co,
    no: item.components.no,
    no2: item.components.no2,
    o3: item.components.o3,
    so2: item.components.so2,
    pm2_5: item.components.pm2_5,
    pm10: item.components.pm10,
  };

  weatherExtraCache.set(cacheKey, result, 600);
  return result;
}

// ─── Historical Weather via Open-Meteo (free, no API key) ──────

function wmoCodeToDescription(code: number): { description: string; icon: string } {
  if (code === 0) return { description: 'Clear sky', icon: '01d' };
  if (code <= 3) return { description: code === 1 ? 'Mainly clear' : code === 2 ? 'Partly cloudy' : 'Overcast', icon: code <= 1 ? '02d' : '04d' };
  if (code <= 48) return { description: 'Fog', icon: '50d' };
  if (code <= 55) return { description: 'Drizzle', icon: '09d' };
  if (code <= 65) return { description: 'Rain', icon: '10d' };
  if (code <= 75) return { description: 'Snow', icon: '13d' };
  if (code <= 82) return { description: 'Rain showers', icon: '09d' };
  if (code === 95) return { description: 'Thunderstorm', icon: '11d' };
  if (code <= 99) return { description: 'Thunderstorm with hail', icon: '11d' };
  return { description: 'Unknown', icon: '03d' };
}

async function getHistoricalWeather(lat: number, lon: number, date: string) {
  const cacheKey = `historical:${lat.toFixed(2)}:${lon.toFixed(2)}:${date}`;
  const cached = weatherExtraCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${OPEN_METEO_BASE}/v1/archive`, {
    params: {
      latitude: lat,
      longitude: lon,
      start_date: date,
      end_date: date,
      daily: 'temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max,precipitation_sum',
      timezone: 'auto',
    },
    timeout: 10000,
  });

  const daily = response.data.daily;
  if (!daily || !daily.time || daily.time.length === 0) return null;

  const weatherCode = daily.weathercode?.[0] ?? 0;
  const { description, icon } = wmoCodeToDescription(weatherCode);
  const result = {
    date: daily.time[0],
    temp_max: Math.round(daily.temperature_2m_max[0]),
    temp_min: Math.round(daily.temperature_2m_min[0]),
    precipitation: daily.precipitation_sum?.[0] ?? 0,
    wind_speed_max: daily.windspeed_10m_max?.[0] ?? 0,
    weather_description: description,
    weather_icon: icon,
  };

  weatherExtraCache.set(cacheKey, result, 86400);
  return result;
}

// ─── Earnings Calendar (Finnhub) ─────────────────────────────

async function getEarningsCalendar(from: string, to: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY not configured');

  const cacheKey = `earnings:${from}:${to}`;
  const cached = stockCache.get<any[]>(cacheKey);
  if (cached) return cached;

  const response = await axios.get('https://finnhub.io/api/v1/calendar/earnings', {
    params: { from, to },
    headers: { 'X-Finnhub-Token': apiKey },
    timeout: 10000,
  });

  const events = (response.data.earningsCalendar ?? []).map((e: any) => ({
    date: e.date,
    epsActual: e.epsActual ?? null,
    epsEstimate: e.epsEstimate ?? null,
    revenueActual: e.revenueActual ?? null,
    revenueEstimate: e.revenueEstimate ?? null,
    symbol: e.symbol,
    hour: e.hour ?? null,
    quarter: e.quarter ?? null,
    year: e.year ?? null,
  }));

  stockCache.set(cacheKey, events, 600);
  return events;
}

// ─── Bible API helpers (YouVersion) ──────────────────────────

// USFM book abbreviations for all 66 canonical books
const BOOK_ABBREVIATIONS: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM', 'Deuteronomy': 'DEU',
  'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR',
  'Nehemiah': 'NEH', 'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Proverbs': 'PRO',
  'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG', 'Isaiah': 'ISA', 'Jeremiah': 'JER',
  'Lamentations': 'LAM', 'Ezekiel': 'EZK', 'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOL',
  'Amos': 'AMO', 'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM',
  'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC', 'Malachi': 'MAL',
  'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK', 'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM',
  '1 Corinthians': '1CO', '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
  'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', 'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB',
  'James': 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};

function convertToUsfmRef(reference: string): string {
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return reference;
  const [, bookName, chapter, verseStart, verseEnd] = match;
  const usfm = BOOK_ABBREVIATIONS[bookName];
  if (!usfm) return reference;
  if (verseStart && verseEnd) return `${usfm}.${chapter}.${verseStart}-${usfm}.${chapter}.${verseEnd}`;
  if (verseStart) return `${usfm}.${chapter}.${verseStart}`;
  return `${usfm}.${chapter}`;
}

const youversionVersionsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

async function getYouVersionBibles(): Promise<{ id: number; abbreviation: string; title: string }[]> {
  const apiKey = process.env.YOUVERSION_APP_KEY;
  if (!apiKey) throw new Error('YOUVERSION_APP_KEY not configured');

  const cacheKey = 'youversion:bibles:en';
  const cached = youversionVersionsCache.get<any[]>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${YOUVERSION_API_BASE}/bibles`, {
    params: { 'language_ranges[]': 'en', all_available: true },
    headers: { 'x-yvp-app-key': apiKey },
    timeout: 10000,
  });

  const bibles = (response.data.data || response.data || []).map((b: any) => ({
    id: b.id,
    abbreviation: b.abbreviation || b.abbr || '',
    title: b.title || b.name || '',
  }));

  youversionVersionsCache.set(cacheKey, bibles);
  return bibles;
}

async function getYouVersionPassage(bibleId: number, reference: string) {
  const apiKey = process.env.YOUVERSION_APP_KEY;
  if (!apiKey) throw new Error('YOUVERSION_APP_KEY not configured');

  const usfmRef = convertToUsfmRef(reference);
  const cacheKey = `youversion:passage:${bibleId}:${usfmRef}`;
  const cached = bibleCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(
    `${YOUVERSION_API_BASE}/bibles/${bibleId}/passages/${encodeURIComponent(usfmRef)}`,
    {
      params: { format: 'text' },
      headers: { 'x-yvp-app-key': apiKey },
      timeout: 10000,
    }
  );

  const data = response.data;
  const result = {
    text: (data.content || data.text || '').trim(),
    reference: data.reference || reference,
    translation: data.bible_abbreviation || data.translation || String(bibleId),
    verseCount: data.verse_count || data.verses?.length || 0,
    copyright: data.copyright || null,
  };

  bibleCache.set(cacheKey, result, 3600);
  return result;
}

const DEFAULT_YOUVERSION_BIBLE_ID = 111; // NIV 2011

const DAILY_VERSES = [
  { text: "For I know the plans I have for you, declares the LORD, plans to prosper you and not to harm you, plans to give you hope and a future.", reference: "Jeremiah 29:11" },
  { text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", reference: "Proverbs 3:5-6" },
  { text: "I can do all this through him who gives me strength.", reference: "Philippians 4:13" },
  { text: "The LORD is my shepherd, I lack nothing.", reference: "Psalm 23:1" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "And we know that in all things God works for the good of those who love him, who have been called according to his purpose.", reference: "Romans 8:28" },
  { text: "The LORD is my light and my salvation — whom shall I fear? The LORD is the stronghold of my life — of whom shall I be afraid?", reference: "Psalm 27:1" },
  { text: "But those who hope in the LORD will renew their strength. They will soar on wings like eagles; they will run and not grow weary, they will walk and not be faint.", reference: "Isaiah 40:31" },
  { text: "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", reference: "Philippians 4:6" },
  { text: "So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.", reference: "Isaiah 41:10" },
  { text: "Come to me, all you who are weary and burdened, and I will give you rest.", reference: "Matthew 11:28" },
  { text: "The LORD bless you and keep you; the LORD make his face shine on you and be gracious to you.", reference: "Numbers 6:24-25" },
  { text: "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.", reference: "John 3:16" },
  { text: "Delight yourself in the LORD, and he will give you the desires of your heart.", reference: "Psalm 37:4" },
  { text: "The name of the LORD is a fortified tower; the righteous run to it and are safe.", reference: "Proverbs 18:10" },
  { text: "He has made everything beautiful in its time. He has also set eternity in the human heart.", reference: "Ecclesiastes 3:11" },
  { text: "Cast all your anxiety on him because he cares for you.", reference: "1 Peter 5:7" },
  { text: "This is the day that the LORD has made; let us rejoice and be glad in it.", reference: "Psalm 118:24" },
  { text: "But the fruit of the Spirit is love, joy, peace, forbearance, kindness, goodness, faithfulness, gentleness and self-control.", reference: "Galatians 5:22-23" },
  { text: "Have I not commanded you? Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", reference: "Joshua 1:9" },
  { text: "The LORD is close to the brokenhearted and saves those who are crushed in spirit.", reference: "Psalm 34:18" },
  { text: "Therefore, if anyone is in Christ, the new creation has come: The old has gone, the new is here!", reference: "2 Corinthians 5:17" },
  { text: "Commit to the LORD whatever you do, and he will establish your plans.", reference: "Proverbs 16:3" },
  { text: "God is our refuge and strength, an ever-present help in trouble.", reference: "Psalm 46:1" },
  { text: "In their hearts humans plan their course, but the LORD establishes their steps.", reference: "Proverbs 16:9" },
  { text: "The steadfast love of the LORD never ceases; his mercies never come to an end; they are new every morning; great is your faithfulness.", reference: "Lamentations 3:22-23" },
  { text: "Peace I leave with you; my peace I give you. I do not give to you as the world gives. Do not let your hearts be troubled and do not be afraid.", reference: "John 14:27" },
  { text: "For we walk by faith, not by sight.", reference: "2 Corinthians 5:7" },
  { text: "Be still, and know that I am God.", reference: "Psalm 46:10" },
  { text: "Love is patient, love is kind. It does not envy, it does not boast, it is not proud.", reference: "1 Corinthians 13:4" },
  { text: "May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.", reference: "Romans 15:13" },
];

// ─── Podcast API helpers (PodcastIndex) ──────────────────────

/** Normalize a PodcastIndex feed so `categories` is always a string or null */
function normalizePodcastFeed(feed: any) {
  return {
    id: String(feed.id),
    title: feed.title,
    author: feed.author || null,
    artwork: feed.artwork || feed.image || null,
    description: feed.description || null,
    categories: feed.categories
      ? (typeof feed.categories === 'object'
          ? Object.values(feed.categories).join(', ')
          : String(feed.categories))
      : null,
    episodeCount: feed.episodeCount ?? null,
    language: feed.language || null,
  };
}

function getPodcastIndexHeaders(): Record<string, string> {
  const apiKey = process.env.PODCASTINDEX_API_KEY;
  const apiSecret = process.env.PODCASTINDEX_API_SECRET;
  if (!apiKey || !apiSecret) throw new Error('PodcastIndex API credentials not configured');

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

    airQuality: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      return await getAirQuality(lat, lon);
    },

    historicalWeather: async (_: any, { lat, lon, date }: { lat: number; lon: number; date: string }) => {
      return await getHistoricalWeather(lat, lon, date);
    },

    searchCities: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
      return await searchCities(query, limit);
    },

    reverseGeocode: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
      return await reverseGeocode(lat, lon);
    },

    // ─── Crypto Resolvers ───────────────────────────────────

    cryptoPrices: async (_: any, { ids, vsCurrency = 'usd' }: { ids: string[]; vsCurrency?: string }) => {
      return await getCryptoPrices(ids, vsCurrency);
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

    earningsCalendar: async (_: any, { from, to }: { from: string; to: string }) => {
      return await getEarningsCalendar(from, to);
    },

    // ─── Podcast Resolvers ──────────────────────────────────

    searchPodcasts: async (_: any, { query }: { query: string }) => {
      const data = await searchPodcastsAPI(query);
      return {
        feeds: (data.feeds ?? []).map(normalizePodcastFeed),
        count: data.count ?? 0,
      };
    },

    trendingPodcasts: async () => {
      const data = await getTrendingPodcastsAPI();
      return {
        feeds: (data.feeds ?? []).map(normalizePodcastFeed),
        count: data.count ?? 0,
      };
    },

    podcastEpisodes: async (_: any, { feedId }: { feedId: number }) => {
      return await getPodcastEpisodesAPI(feedId);
    },

    podcastFeed: async (_: any, { feedId }: { feedId: number }) => {
      const cacheKey = `podcast:feed:${feedId}`;
      const cached = podcastCache.get<any>(cacheKey);
      if (cached) return cached;

      const headers = getPodcastIndexHeaders();
      const response = await axios.get('https://api.podcastindex.org/api/1.0/podcasts/byfeedid', {
        params: { id: feedId },
        headers,
        timeout: 10000,
      });
      const feed = response.data.feed;
      if (!feed) return null;
      const result = normalizePodcastFeed(feed);
      podcastCache.set(cacheKey, result, 300);
      return result;
    },

    // ─── Bible Resolvers ─────────────────────────────────────

    bibleVersions: async () => {
      return await getYouVersionBibles();
    },

    bibleVotdApi: async (_: any, { day }: { day: number }) => {
      const index = ((day - 1) % DAILY_VERSES.length + DAILY_VERSES.length) % DAILY_VERSES.length;
      return { ...DAILY_VERSES[index], translation: 'NIV', copyright: null };
    },

    biblePassage: async (_: any, { reference, translation }: { reference: string; translation?: string }) => {
      const parsed = translation ? parseInt(translation, 10) : NaN;
      const bibleId = isNaN(parsed) ? DEFAULT_YOUVERSION_BIBLE_ID : parsed;
      return await getYouVersionPassage(bibleId, reference);
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
