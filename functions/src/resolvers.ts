import axios from 'axios';
import crypto from 'crypto';
import NodeCache from 'node-cache';

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';
const PODCASTINDEX_BASE = process.env.PODCASTINDEX_BASE_URL || 'https://api.podcastindex.org';
const YOUVERSION_API_BASE = process.env.YOUVERSION_API_BASE_URL || 'https://api.youversion.com/v1';
const OPEN_METEO_BASE = process.env.OPEN_METEO_BASE_URL || 'https://archive-api.open-meteo.com';

// Simple in-memory cache
const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
const stockCache = new NodeCache({ stdTTL: 30, checkperiod: 10 });
const cryptoCache = new NodeCache({ stdTTL: 60, checkperiod: 20 });
const podcastCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });
const bibleCache = new NodeCache({ stdTTL: 3600, checkperiod: 300 });

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
    baseURL: `${OPENWEATHER_BASE}/data/2.5`,
    timeout: 5000,
    params: {
      appid: apiKey,
      units: 'metric'
    }
  });
}

function createGeoClient(apiKey: string) {
  return axios.create({
    baseURL: `${OPENWEATHER_BASE}/geo/1.0`,
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

// ─── Air Quality via OpenWeatherMap (free tier) ────────────────

async function getAirQuality(apiKey: string, lat: number, lon: number) {
  const cacheKey = `aqi:${lat.toFixed(2)}:${lon.toFixed(2)}`;
  const cached = weatherCache.get<any>(cacheKey);
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

  weatherCache.set(cacheKey, result, 600);
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
  const cached = weatherCache.get<any>(cacheKey);
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

  weatherCache.set(cacheKey, result, 86400); // Cache for 24h — historical data doesn't change
  return result;
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

// ─── Company News (Finnhub) ─────────────────────────────
// (Earnings calendar removed — stock alerts feature simplified)
}

async function getCompanyNews(apiKey: string, symbol: string, from: string, to: string) {
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

// ─── Stock API helpers (Finnhub) ─────────────────────────────

async function searchStocks(apiKey: string, query: string) {
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

async function getStockQuote(apiKey: string, symbol: string) {
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

async function getStockCandles(apiKey: string, symbol: string, resolution: string, from: number, to: number) {
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

async function searchPodcastsAPI(apiKey: string, apiSecret: string, query: string) {
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
    params: { id: feedId, max: 20 },
    headers,
    timeout: 10000,
  });
  podcastCache.set(cacheKey, response.data, 600);
  return response.data;
}

// ─── Bible helpers (YouVersion API) ─────────────────────────

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

/**
 * Convert a human-readable reference like "John 3" or "Genesis 1:1-10" to USFM format.
 * Examples: "John 3" → "JHN.3", "Genesis 1:1-10" → "GEN.1.1-GEN.1.10", "Psalms 23" → "PSA.23"
 */
function convertToUsfmRef(reference: string): string {
  // Parse "Book Chapter" or "Book Chapter:Verse" or "Book Chapter:Start-End"
  const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
  if (!match) return reference;

  const [, bookName, chapter, verseStart, verseEnd] = match;
  const usfm = BOOK_ABBREVIATIONS[bookName];
  if (!usfm) return reference;

  if (verseStart && verseEnd) {
    return `${usfm}.${chapter}.${verseStart}-${usfm}.${chapter}.${verseEnd}`;
  }
  if (verseStart) {
    return `${usfm}.${chapter}.${verseStart}`;
  }
  return `${usfm}.${chapter}`;
}

// Cache for YouVersion versions list (24hr TTL)
const youversionVersionsCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

interface YouVersionBible {
  id: number;
  abbreviation: string;
  title: string;
}

/** Fetch available English Bible versions from YouVersion API */
async function getYouVersionBibles(apiKey: string): Promise<YouVersionBible[]> {
  const cacheKey = 'youversion:bibles:en';
  const cached = youversionVersionsCache.get<YouVersionBible[]>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${YOUVERSION_API_BASE}/bibles`, {
    params: { 'language_ranges[]': 'en', all_available: true },
    headers: { 'x-yvp-app-key': apiKey },
    timeout: 10000,
  });

  const bibles: YouVersionBible[] = (response.data.data || response.data || []).map((b: any) => ({
    id: b.id,
    abbreviation: b.abbreviation || b.abbr || '',
    title: b.title || b.name || '',
  }));

  youversionVersionsCache.set(cacheKey, bibles);
  return bibles;
}

/** Fetch a passage from YouVersion API */
async function getYouVersionPassage(
  bibleId: number,
  reference: string,
  apiKey: string
): Promise<{ text: string; reference: string; translation: string; verseCount: number; copyright: string | null }> {
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

/** Fetch Verse of the Day from YouVersion API */
async function getYouVersionVotd(day: number, apiKey: string): Promise<{ text: string; reference: string; translation: string; copyright: string | null }> {
  const cacheKey = `youversion:votd:${day}`;
  const cached = bibleCache.get<any>(cacheKey);
  if (cached) return cached;

  const response = await axios.get(`${YOUVERSION_API_BASE}/verse-of-the-day/${day}`, {
    headers: { 'x-yvp-app-key': apiKey },
    timeout: 10000,
  });

  const data = response.data;
  const verse = data.verse || data;
  const result = {
    text: (verse.text || verse.content || '').trim(),
    reference: verse.reference || verse.human_reference || '',
    translation: verse.bible_abbreviation || verse.translation || 'NIV',
    copyright: verse.copyright || null,
  };

  bibleCache.set(cacheKey, result, 3600);
  return result;
}

// Curated daily verses (one per day-of-year, wraps around)
// Curated verse references — text is fetched from YouVersion API at runtime
const DAILY_VERSES = [
  { reference: "Jeremiah 29:11" },
  { reference: "Proverbs 3:5-6" },
  { reference: "Philippians 4:13" },
  { reference: "Psalm 23:1" },
  { reference: "Joshua 1:9" },
  { reference: "Romans 8:28" },
  { reference: "Psalm 27:1" },
  { reference: "Isaiah 40:31" },
  { reference: "Philippians 4:6" },
  { reference: "Isaiah 41:10" },
  { reference: "Matthew 11:28" },
  { reference: "Numbers 6:24-25" },
  { reference: "John 3:16" },
  { reference: "Psalm 37:4" },
  { reference: "Proverbs 18:10" },
  { reference: "Ecclesiastes 3:11" },
  { reference: "1 Peter 5:7" },
  { reference: "Psalm 118:24" },
  { reference: "Galatians 5:22-23" },
  { reference: "Joshua 1:9" },
  { reference: "Psalm 34:18" },
  { reference: "2 Corinthians 5:17" },
  { reference: "Proverbs 16:3" },
  { reference: "Psalm 46:1" },
  { reference: "Proverbs 16:9" },
  { reference: "Lamentations 3:22-23" },
  { reference: "John 14:27" },
  { reference: "2 Corinthians 5:7" },
  { reference: "Psalm 46:10" },
  { reference: "1 Corinthians 13:4" },
  { reference: "Romans 15:13" },
];

// Default Bible version (NIV 2011 = 111 on YouVersion)
const DEFAULT_YOUVERSION_BIBLE_ID = 111;

// Resolver factory
export function createResolvers(getApiKey: () => string, getFinnhubKey?: () => string, getPodcastKeys?: () => { apiKey: string; apiSecret: string }, getYouVersionKey?: () => string) {
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

      airQuality: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        return await getAirQuality(apiKey, lat, lon);
      },

      historicalWeather: async (_: any, { lat, lon, date }: { lat: number; lon: number; date: string }) => {
        return await getHistoricalWeather(lat, lon, date);
      },

      searchCities: async (_: any, { query, limit = 5 }: { query: string; limit?: number }) => {
        const apiKey = getApiKey();
        return await searchCities(apiKey, query, limit);
      },

      reverseGeocode: async (_: any, { lat, lon }: { lat: number; lon: number }) => {
        const apiKey = getApiKey();
        return await reverseGeocode(apiKey, lat, lon);
      },

      // ─── Crypto Resolvers ───────────────────────────────────

      cryptoPrices: async (_: any, { ids, vsCurrency = 'usd' }: { ids: string[]; vsCurrency?: string }) => {
        return await getCryptoPrices(ids, vsCurrency);
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

      companyNews: async (_: any, { symbol, from, to }: { symbol: string; from: string; to: string }) => {
        const finnhubKey = getFinnhubKey?.() || '';
        if (!finnhubKey) throw new Error('FINNHUB_API_KEY not configured');
        return await getCompanyNews(finnhubKey, symbol, from, to);
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

      // ─── Bible Resolvers ─────────────────────────────────────

      bibleVersions: async () => {
        const yvKey = getYouVersionKey?.() || '';
        if (!yvKey) throw new Error('YOUVERSION_APP_KEY not configured');
        return await getYouVersionBibles(yvKey);
      },

      bibleVotd: async (_: any, { day }: { day: number }) => {
        const index = ((day - 1) % DAILY_VERSES.length + DAILY_VERSES.length) % DAILY_VERSES.length;
        return { text: '', reference: DAILY_VERSES[index].reference, translation: 'NIV', copyright: null };
      },

      bibleVotdApi: async (_: any, { day }: { day: number }) => {
        const yvKey = getYouVersionKey?.() || '';
        if (yvKey) {
          try {
            return await getYouVersionVotd(day, yvKey);
          } catch {
            console.warn('[bibleVotdApi] YouVersion VOTD API failed for day', day, '— trying biblePassage fallback');
          }
        }
        // Fallback 1: try fetching verse text via biblePassage API using curated reference
        const index = ((day - 1) % DAILY_VERSES.length + DAILY_VERSES.length) % DAILY_VERSES.length;
        const curated = DAILY_VERSES[index];
        if (yvKey) {
          try {
            const passage = await getYouVersionPassage(DEFAULT_YOUVERSION_BIBLE_ID, curated.reference, yvKey);
            return { text: passage.text, reference: passage.reference, translation: passage.translation, copyright: passage.copyright };
          } catch {
            console.warn('[bibleVotdApi] biblePassage fallback failed for', curated.reference, '— using hardcoded text');
          }
        }
        // Fallback 2: return reference only (text fetched from API failed)
        return { text: '', reference: curated.reference, translation: 'NIV', copyright: null };
      },

      biblePassage: async (_: any, { reference, translation }: { reference: string; translation?: string }) => {
        const yvKey = getYouVersionKey?.() || '';
        if (!yvKey) throw new Error('YOUVERSION_APP_KEY not configured');
        const parsed = translation ? parseInt(translation, 10) : NaN;
        const bibleId = isNaN(parsed) ? DEFAULT_YOUVERSION_BIBLE_ID : parsed;
        return await getYouVersionPassage(bibleId, reference, yvKey);
      },
    }
  };
}
