import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  searchStocks,
  getStockQuote,
  getStockCandles,
  getCompanyNews,
  stockCache,
  createStockQueryResolvers,
} from '../../resolvers/stocks.js';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('stock resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    stockCache.flushAll();
  });

  // ─── searchStocks ─────────────────────────────────────────────

  it('searchStocks returns and caches results from Finnhub', async () => {
    const mockResults = [{ description: 'Apple Inc', symbol: 'AAPL' }];
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { result: mockResults } });

    const result = await searchStocks('test-key', 'apple');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/search'),
      expect.objectContaining({
        params: { q: 'apple' },
        headers: { 'X-Finnhub-Token': 'test-key' },
      }),
    );
    expect(result).toEqual(mockResults);

    // Second call should use cache
    const cached = await searchStocks('test-key', 'apple');
    expect(cached).toEqual(mockResults);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  // ─── getStockQuote ────────────────────────────────────────────

  it('getStockQuote returns raw quote data', async () => {
    const mockQuote = { c: 150.0, d: 2.5, dp: 1.7, h: 152, l: 148, o: 149, pc: 147.5 };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockQuote });

    const result = await getStockQuote('test-key', 'AAPL');

    expect(result).toEqual(mockQuote);
  });

  // ─── getCompanyNews ───────────────────────────────────────────

  it('getCompanyNews transforms and limits articles to 10', async () => {
    const apiArticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      category: 'company',
      datetime: 1700000000 + i,
      headline: `Article ${i}`,
      image: `http://img/${i}`,
      source: 'Reuters',
      summary: `Summary ${i}`,
      url: `http://url/${i}`,
      related: 'AAPL',
    }));
    vi.mocked(axios.get).mockResolvedValueOnce({ data: apiArticles });

    const result = await getCompanyNews('test-key', 'AAPL', '2024-01-01', '2024-01-31');

    expect(result).toHaveLength(10);
    expect(result[0]).toHaveProperty('headline', 'Article 0');
    expect(result[0]).toHaveProperty('source', 'Reuters');
  });

  // ─── getStockCandles ──────────────────────────────────────────

  it('getStockCandles passes correct params', async () => {
    const mockCandles = { s: 'ok', c: [150], h: [152], l: [148], o: [149], t: [1700000000], v: [1000] };
    vi.mocked(axios.get).mockResolvedValueOnce({ data: mockCandles });

    const result = await getStockCandles('test-key', 'AAPL', 'D', 1699900000, 1700000000);

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/stock/candle'),
      expect.objectContaining({
        params: { symbol: 'AAPL', resolution: 'D', from: 1699900000, to: 1700000000 },
      }),
    );
    expect(result).toEqual(mockCandles);
  });

  // ─── createStockQueryResolvers error handling ─────────────────

  it('resolver throws when FINNHUB_API_KEY is not configured', async () => {
    const resolvers = createStockQueryResolvers(() => '');

    await expect(resolvers.searchStocks(null, { query: 'apple' }))
      .rejects.toThrow('FINNHUB_API_KEY not configured');
  });
});
