/**
 * Mock API Server — simulates all external APIs on port 4000.
 * Used by Firebase emulator tests so Cloud Functions don't make real HTTP calls.
 *
 * Route mapping:
 *   OpenWeather: /data/2.5/*, /geo/1.0/*
 *   Finnhub:     /api/v1/*
 *   CoinGecko:   /api/v3/*
 *   PodcastIndex: /api/1.0/*
 *   Bible API:    /:reference
 *   Open-Meteo:   /v1/archive
 */
import express from 'express';

const app = express();
const PORT = process.env.MOCK_API_PORT || 4000;
const now = Math.floor(Date.now() / 1000);

// ─── OpenWeather Mock Data ────────────────────────────────────────

const weatherResponse = {
  coord: { lon: -0.13, lat: 51.51 },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  main: { temp: 22, feels_like: 20, temp_min: 18, temp_max: 25, pressure: 1013, humidity: 65 },
  visibility: 10000,
  wind: { speed: 3.5, deg: 180, gust: 5.2 },
  clouds: { all: 10 },
  dt: now,
  sys: { sunrise: now - 20000, sunset: now + 20000, country: 'GB' },
  timezone: 3600,
  name: 'London',
};

const forecastResponse = {
  list: Array.from({ length: 40 }, (_, i) => ({
    dt: now + 10800 * i,
    main: { temp: 20 + Math.sin(i / 8 * Math.PI) * 5, feels_like: 19, temp_min: 18, temp_max: 24, pressure: 1013, humidity: 60 },
    weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
    wind: { speed: 4, deg: 200 },
    pop: 0.1,
    clouds: { all: 10 },
  })),
  city: { name: 'London', country: 'GB', timezone: 3600 },
};

const airPollutionResponse = {
  list: [{
    main: { aqi: 2 },
    components: { co: 230, no: 0.5, no2: 15, o3: 68, so2: 3, pm2_5: 8, pm10: 12 },
  }],
};

const geocodeResponse = [
  { name: 'London', country: 'GB', state: 'England', lat: 51.5074, lon: -0.1278 },
];

// ─── Finnhub Mock Data ────────────────────────────────────────────

const stockSearchResponse = {
  count: 2,
  result: [
    { description: 'Apple Inc', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
    { description: 'Amazon.com Inc', displaySymbol: 'AMZN', symbol: 'AMZN', type: 'Common Stock' },
  ],
};

const stockQuoteResponse = {
  c: 185.92, d: 2.45, dp: 1.34, h: 187.00, l: 183.50, o: 184.00, pc: 183.47, t: now,
};

const stockProfileResponse = {
  country: 'US', currency: 'USD', exchange: 'NASDAQ', ipo: '1980-12-12',
  marketCapitalization: 2800000, name: 'Apple Inc', ticker: 'AAPL',
  weburl: 'https://www.apple.com/', logo: 'https://example.com/apple.png',
  finnhubIndustry: 'Technology',
};

const stockCandlesResponse = {
  c: Array.from({ length: 30 }, (_, i) => 180 + Math.sin(i / 5) * 5),
  h: Array.from({ length: 30 }, (_, i) => 182 + Math.sin(i / 5) * 5),
  l: Array.from({ length: 30 }, (_, i) => 178 + Math.sin(i / 5) * 5),
  o: Array.from({ length: 30 }, (_, i) => 179 + Math.sin(i / 5) * 5),
  t: Array.from({ length: 30 }, (_, i) => now - (30 - i) * 86400),
  v: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000000)),
  s: 'ok',
};

const earningsResponse = {
  earningsCalendar: [
    { date: '2025-01-30', epsActual: 2.18, epsEstimate: 2.10, symbol: 'AAPL', hour: 'amc', quarter: 1, year: 2025 },
  ],
};

// ─── CoinGecko Mock Data ──────────────────────────────────────────

const cryptoMarketsResponse = [
  {
    id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: 'https://example.com/btc.png',
    current_price: 97500, market_cap: 1900000000000, market_cap_rank: 1,
    price_change_percentage_24h: 2.5, total_volume: 45000000000,
    sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 95000 + Math.sin(i / 24 * Math.PI) * 2000) },
  },
  {
    id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: 'https://example.com/eth.png',
    current_price: 3200, market_cap: 385000000000, market_cap_rank: 2,
    price_change_percentage_24h: 1.8, total_volume: 18000000000,
    sparkline_in_7d: { price: Array.from({ length: 168 }, (_, i) => 3100 + Math.sin(i / 24 * Math.PI) * 100) },
  },
];

// ─── PodcastIndex Mock Data ───────────────────────────────────────

const podcastSearchResponse = {
  feeds: [
    {
      id: 101, title: 'Tech Talk Daily', author: 'John Smith',
      artwork: 'https://example.com/tech-talk.jpg',
      description: 'A daily podcast about technology news and trends.',
      feedUrl: 'https://example.com/feed.xml', episodeCount: 150,
      categories: { '1': 'Technology' },
    },
    {
      id: 102, title: 'Science Weekly', author: 'Jane Doe',
      artwork: 'https://example.com/science.jpg',
      description: 'Weekly discussions on scientific discoveries.',
      feedUrl: 'https://example.com/science.xml', episodeCount: 80,
      categories: { '2': 'Science' },
    },
  ],
  count: 2,
};

const trendingPodcastsResponse = {
  feeds: Array.from({ length: 10 }, (_, i) => ({
    id: 200 + i,
    title: `Trending Show ${i + 1}`,
    author: `Host ${i + 1}`,
    artwork: `https://example.com/trending-${i}.jpg`,
    description: `Description for trending show ${i + 1}.`,
    feedUrl: `https://example.com/trending-${i}.xml`,
    episodeCount: 20 + i * 5,
    categories: { [String(10 + i)]: ['Technology', 'Science', 'News', 'Comedy', 'Education'][i % 5] },
  })),
};

const podcastFeedResponse = {
  feed: {
    id: 101, title: 'Tech Talk Daily', author: 'John Smith',
    artwork: 'https://example.com/tech-talk.jpg',
    description: 'A daily podcast about technology news and trends.',
    feedUrl: 'https://example.com/feed.xml', episodeCount: 150,
    categories: { '1': 'Technology' },
    language: 'en',
  },
};

const podcastEpisodesResponse = {
  items: Array.from({ length: 5 }, (_, i) => ({
    id: 1000 + i,
    title: `Episode ${i + 1}: Great Content`,
    description: `Description for episode ${i + 1}.`,
    datePublished: now - i * 86400 * 7,
    duration: 1800 + i * 600,
    enclosureUrl: `https://example.com/ep${i + 1}.mp3`,
    enclosureType: 'audio/mpeg',
    image: `https://example.com/ep${i + 1}.jpg`,
    feedId: 101,
  })),
};

// ─── YouVersion Bible API Mock Data ───────────────────────────────

const bibleBiblesResponse = {
  data: [
    { id: 1, abbreviation: 'KJV', title: 'King James Version' },
    { id: 111, abbreviation: 'NIV', title: 'New International Version' },
    { id: 1588, abbreviation: 'AMP', title: 'Amplified Bible' },
    { id: 12, abbreviation: 'ASV', title: 'American Standard Version' },
    { id: 100, abbreviation: 'NASB1995', title: 'New American Standard Bible 1995' },
  ],
};

const biblePassageResponse = {
  reference: 'John 3:16',
  content: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.\n',
  bible_abbreviation: 'KJV',
  verse_count: 1,
  copyright: null,
};

// ─── Open-Meteo Mock Data ─────────────────────────────────────────

const historicalWeatherResponse = {
  daily: {
    time: ['2025-01-01'],
    temperature_2m_max: [8],
    temperature_2m_min: [2],
    weathercode: [3],
    windspeed_10m_max: [15],
    precipitation_sum: [0.5],
  },
};

// ─── Routes ───────────────────────────────────────────────────────

// OpenWeather
app.get('/data/2.5/weather', (req, res) => {
  res.json(weatherResponse);
});
app.get('/data/2.5/forecast', (req, res) => {
  res.json(forecastResponse);
});
app.get('/data/2.5/air_pollution', (req, res) => {
  res.json(airPollutionResponse);
});
app.get('/geo/1.0/direct', (req, res) => {
  const q = (req.query.q || '').toString().toLowerCase();
  const result = [{ ...geocodeResponse[0], name: q.charAt(0).toUpperCase() + q.slice(1) || 'London' }];
  res.json(result);
});
app.get('/geo/1.0/reverse', (req, res) => {
  res.json(geocodeResponse);
});

// Finnhub
app.get('/api/v1/search', (req, res) => {
  res.json(stockSearchResponse);
});
app.get('/api/v1/quote', (req, res) => {
  res.json(stockQuoteResponse);
});
app.get('/api/v1/stock/profile2', (req, res) => {
  res.json(stockProfileResponse);
});
app.get('/api/v1/stock/candle', (req, res) => {
  res.json(stockCandlesResponse);
});
app.get('/api/v1/calendar/earnings', (req, res) => {
  res.json(earningsResponse);
});

// CoinGecko
app.get('/api/v3/coins/markets', (req, res) => {
  res.json(cryptoMarketsResponse);
});

// PodcastIndex
app.get('/api/1.0/search/byterm', (req, res) => {
  res.json(podcastSearchResponse);
});
app.get('/api/1.0/podcasts/trending', (req, res) => {
  res.json(trendingPodcastsResponse);
});
app.get('/api/1.0/podcasts/byfeedid', (req, res) => {
  res.json(podcastFeedResponse);
});
app.get('/api/1.0/episodes/byfeedid', (req, res) => {
  res.json(podcastEpisodesResponse);
});

// Open-Meteo Historical
app.get('/v1/archive', (req, res) => {
  res.json(historicalWeatherResponse);
});

// YouVersion Bible API
app.get('/v1/bibles', (req, res) => {
  res.json(bibleBiblesResponse);
});

app.get('/v1/bibles/:id/passages/:passageId', (req, res) => {
  const ref = decodeURIComponent(req.params.passageId);
  res.json({ ...biblePassageResponse, reference: ref });
});

// ─── Start ────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Mock API server on http://localhost:${PORT}`);
});
