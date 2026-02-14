import { test as base, Page } from '@playwright/test';

/** Sample GraphQL response payloads for mocking the /graphql endpoint. */

const now = Math.floor(Date.now() / 1000);

export const mockCurrentWeather = {
  temp: 22,
  feels_like: 20,
  temp_min: 18,
  temp_max: 25,
  pressure: 1013,
  humidity: 65,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  wind: { speed: 3.5, deg: 180, gust: 5.2 },
  clouds: { all: 10 },
  dt: now,
  timezone: 3600,
  sunrise: now - 20000,
  sunset: now + 20000,
  visibility: 10000,
};

export const mockForecast = Array.from({ length: 7 }, (_, i) => ({
  dt: now + 86400 * (i + 1),
  temp: { min: 15 + i, max: 25 + i, day: 22 + i, night: 16 + i },
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  humidity: 60,
  wind_speed: 4,
  pop: 0.1,
}));

export const mockHourly = Array.from({ length: 24 }, (_, i) => ({
  dt: now + 3600 * i,
  temp: 18 + Math.sin(i / 24 * Math.PI * 2) * 5,
  weather: [{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' }],
  pop: 0.1,
  wind_speed: 3.5,
}));

export const mockSearchCities = [
  { id: '51.5074,-0.1278', name: 'London', country: 'GB', state: 'England', lat: 51.5074, lon: -0.1278 },
  { id: '51.5,-0.08', name: 'London Bridge', country: 'GB', state: 'England', lat: 51.5, lon: -0.08 },
];

// ─── Air Quality mock data ──────────────────────────────────────────

export const mockAirQuality = {
  aqi: 2,
  co: 230.31,
  no: 0.42,
  no2: 12.76,
  o3: 68.52,
  so2: 1.85,
  pm2_5: 8.3,
  pm10: 14.2,
};

// ─── Stock mock data (Finnhub-shaped) ─────────────────────────────

export const mockStockSearchResults = {
  count: 2,
  result: [
    { description: 'Apple Inc', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
    { description: 'Amazon.com Inc', displaySymbol: 'AMZN', symbol: 'AMZN', type: 'Common Stock' },
  ],
};

export const mockStockQuote = {
  c: 185.92,   // current
  d: 2.45,     // change
  dp: 1.34,    // percent change
  h: 187.00,   // high
  l: 183.50,   // low
  o: 184.00,   // open
  pc: 183.47,  // prev close
  t: now,
};

export const mockStockCandles = {
  c: Array.from({ length: 30 }, (_, i) => 180 + Math.sin(i / 5) * 5),
  h: Array.from({ length: 30 }, (_, i) => 182 + Math.sin(i / 5) * 5),
  l: Array.from({ length: 30 }, (_, i) => 178 + Math.sin(i / 5) * 5),
  o: Array.from({ length: 30 }, (_, i) => 179 + Math.sin(i / 5) * 5),
  t: Array.from({ length: 30 }, (_, i) => now - (30 - i) * 86400),
  v: Array.from({ length: 30 }, () => Math.floor(Math.random() * 1000000)),
  s: 'ok',
};

// ─── Earnings Calendar mock data ────────────────────────────────────

const today = new Date();
export const mockEarningsCalendar = Array.from({ length: 3 }, (_, i) => {
  const d = new Date(today);
  d.setDate(d.getDate() + i);
  return {
    date: d.toISOString().split('T')[0],
    epsActual: null,
    epsEstimate: 1.52 + i * 0.1,
    revenueActual: null,
    revenueEstimate: 89_000_000_000 + i * 1_000_000_000,
    symbol: ['AAPL', 'MSFT', 'GOOGL'][i],
    hour: 'amc',
    quarter: 1,
    year: today.getFullYear(),
  };
});

// ─── Crypto mock data ───────────────────────────────────────────────

export const mockCryptoPrices = [
  {
    id: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    image: 'https://example.com/btc.png',
    current_price: 64235.0,
    market_cap: 1_260_000_000_000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.35,
    total_volume: 28_500_000_000,
    sparkline_7d: Array.from({ length: 168 }, (_, i) => 62000 + Math.sin(i / 10) * 2000),
  },
  {
    id: 'ethereum',
    symbol: 'eth',
    name: 'Ethereum',
    image: 'https://example.com/eth.png',
    current_price: 3456.78,
    market_cap: 415_000_000_000,
    market_cap_rank: 2,
    price_change_percentage_24h: -1.12,
    total_volume: 15_200_000_000,
    sparkline_7d: Array.from({ length: 168 }, (_, i) => 3300 + Math.sin(i / 10) * 150),
  },
];

// ─── Podcast mock data (PodcastIndex-shaped) ──────────────────────

export const mockPodcastSearch = {
  feeds: [
    {
      id: 101,
      title: 'Tech Talk Daily',
      author: 'John Smith',
      artwork: 'https://example.com/tech-talk.jpg',
      description: 'A daily podcast about technology news and trends.',
      feedUrl: 'https://example.com/feed.xml',
      episodeCount: 150,
      categories: { '1': 'Technology' },
    },
    {
      id: 102,
      title: 'Science Weekly',
      author: 'Jane Doe',
      artwork: 'https://example.com/science.jpg',
      description: 'Weekly discussions on scientific discoveries.',
      feedUrl: 'https://example.com/science.xml',
      episodeCount: 80,
      categories: { '2': 'Science' },
    },
  ],
  count: 2,
};

const trendingCategories = [
  'Technology, Science',
  'News, Politics',
  'Comedy, Entertainment',
  'Technology, Education',
  'Science, Health',
  'News, Business',
  'Comedy, Society',
  'Education, History',
  'Health, Fitness',
  'Entertainment, Music',
];

export const mockTrendingPodcasts = {
  feeds: Array.from({ length: 10 }, (_, i) => ({
    id: 200 + i,
    title: `Trending Show ${i + 1}`,
    author: `Host ${i + 1}`,
    artwork: `https://example.com/trending-${i}.jpg`,
    description: `Description for trending show ${i + 1}.`,
    feedUrl: `https://example.com/trending-${i}.xml`,
    episodeCount: 20 + i * 5,
    categories: trendingCategories[i],
  })),
};

export const mockPodcastEpisodes = {
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

/**
 * Intercept Stock API requests and return mock data.
 */
export async function mockStockAPI(page: Page) {
  await page.route('**/stock/search**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStockSearchResults),
    });
  });

  await page.route('**/stock/quote**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStockQuote),
    });
  });

  await page.route('**/stock/candles**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockStockCandles),
    });
  });
}

/**
 * Intercept Podcast API requests and return mock data.
 */
export async function mockPodcastAPI(page: Page) {
  await page.route('**/podcast/search**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPodcastSearch),
    });
  });

  await page.route('**/podcast/trending**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTrendingPodcasts),
    });
  });

  await page.route('**/podcast/episodes**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockPodcastEpisodes),
    });
  });
}

/**
 * Intercept GraphQL requests and return mock data so e2e tests
 * don't depend on a live OpenWeather API key.
 */
export async function mockGraphQL(page: Page) {
  await page.route('**/graphql', async (route) => {
    const request = route.request();

    // Only intercept POST (GraphQL queries)
    if (request.method() !== 'POST') {
      return route.continue();
    }

    let body: any;
    try {
      body = request.postDataJSON();
    } catch {
      return route.continue();
    }

    const operationName = body?.operationName;

    if (operationName === 'GetWeather') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            weather: {
              current: mockCurrentWeather,
              forecast: mockForecast,
              hourly: mockHourly,
            },
          },
        }),
      });
    }

    if (operationName === 'GetCurrentWeather') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { currentWeather: mockCurrentWeather },
        }),
      });
    }

    if (operationName === 'SearchCities') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { searchCities: mockSearchCities },
        }),
      });
    }

    if (operationName === 'GetAirQuality') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { airQuality: mockAirQuality },
        }),
      });
    }

    if (operationName === 'ReverseGeocode') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            reverseGeocode: [mockSearchCities[0]],
          },
        }),
      });
    }

    // ─── Stock GraphQL queries ────────────────────────────────

    if (operationName === 'SearchStocks') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { searchStocks: mockStockSearchResults.result },
        }),
      });
    }

    if (operationName === 'GetStockQuote') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { stockQuote: mockStockQuote },
        }),
      });
    }

    if (operationName === 'GetStockCandles') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { stockCandles: mockStockCandles },
        }),
      });
    }

    if (operationName === 'GetEarningsCalendar') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { earningsCalendar: mockEarningsCalendar },
        }),
      });
    }

    if (operationName === 'GetCryptoPrices') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { cryptoPrices: mockCryptoPrices },
        }),
      });
    }

    // ─── Podcast GraphQL queries ──────────────────────────────

    if (operationName === 'SearchPodcasts') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { searchPodcasts: mockPodcastSearch },
        }),
      });
    }

    if (operationName === 'GetTrendingPodcasts') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { trendingPodcasts: mockTrendingPodcasts },
        }),
      });
    }

    if (operationName === 'GetPodcastFeed') {
      const feedId = body?.variables?.feedId;
      const feedIdNum = Number(feedId);
      // Find the feed in trending or search mocks
      const feed = mockTrendingPodcasts.feeds.find(f => f.id === feedIdNum) ??
        mockPodcastSearch.feeds.find(f => f.id === feedIdNum) ??
        { id: feedIdNum, title: `Podcast ${feedId}`, author: 'Unknown', artwork: null, description: '', categories: '', episodeCount: 0, language: 'en' };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { podcastFeed: feed },
        }),
      });
    }

    if (operationName === 'GetPodcastEpisodes') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { podcastEpisodes: mockPodcastEpisodes },
        }),
      });
    }

    // ─── Bible GraphQL queries ──────────────────────────────

    if (operationName === 'GetBibleVotd') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { bibleVotd: mockBibleVotd },
        }),
      });
    }

    if (operationName === 'GetBiblePassage') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { biblePassage: mockBiblePassage },
        }),
      });
    }

    // Default: return empty data instead of forwarding to a potentially
    // dead server (in CI static mode, port 3003 is not running).
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null }),
    });
  });
}

// ─── Bible mock data ────────────────────────────────────────────

export const mockBibleVotd = {
  text: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
  reference: 'John 3:16',
  translation: 'NIV',
  copyright: null,
};

export const mockBiblePassage = {
  text: 'In the beginning God created the heavens and the earth. The earth was formless and empty, and darkness was over the surface of the deep.',
  reference: 'Genesis 1',
  translation: 'WEB',
  verseCount: 31,
};

// ─── AI Chat mock data ───────────────────────────────────────────

export const mockAiChatResponse = {
  response: 'The weather in Tokyo is currently 22°C with clear skies.',
  toolCalls: [
    { name: 'getWeather', args: { city: 'Tokyo' }, result: '{"city":"Tokyo","temp":22,"description":"clear sky"}' },
  ],
};

/**
 * Intercept AI Chat API requests and return mock data.
 */
export async function mockAiChatAPI(page: Page) {
  await page.route('**/ai/chat', async (route) => {
    if (route.request().method() !== 'POST') {
      return route.continue();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockAiChatResponse),
    });
  });
}

/**
 * Dismiss onboarding modal by setting localStorage before the page loads.
 * This must be done via addInitScript so it runs before React hydrates.
 */
async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mycircle-onboarding-complete', 'true');
  });
}

/** Extended test fixture that sets up all API mocks for every test. */
export const test = base.extend<{ mockApi: void }>({
  mockApi: [async ({ page }, use) => {
    await dismissOnboarding(page);
    await mockGraphQL(page);
    await mockStockAPI(page);
    await mockPodcastAPI(page);
    await mockAiChatAPI(page);
    await use();
  }, { auto: true }],
});

export { expect } from '@playwright/test';
