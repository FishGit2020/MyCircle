import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  getCryptoPrices,
  cryptoCache,
  createCryptoQueryResolvers,
} from '../../resolvers/crypto.js';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('crypto resolvers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cryptoCache.flushAll();
  });

  // ─── getCryptoPrices ──────────────────────────────────────────

  it('getCryptoPrices transforms CoinGecko response to expected shape', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [
        {
          id: 'bitcoin',
          symbol: 'btc',
          name: 'Bitcoin',
          image: 'http://img/btc.png',
          current_price: 45000,
          market_cap: 900000000000,
          market_cap_rank: 1,
          price_change_percentage_24h: 2.5,
          total_volume: 30000000000,
          sparkline_in_7d: { price: [44000, 44500, 45000] },
        },
      ],
    });

    const result = await getCryptoPrices(['bitcoin']);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      image: 'http://img/btc.png',
      current_price: 45000,
      market_cap: 900000000000,
      market_cap_rank: 1,
      price_change_percentage_24h: 2.5,
      total_volume: 30000000000,
      sparkline_7d: [44000, 44500, 45000],
    });
  });

  it('getCryptoPrices returns cached data on second call', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 'ethereum', symbol: 'eth', name: 'Ethereum', image: '', current_price: 3000, market_cap: 0, market_cap_rank: 2, price_change_percentage_24h: 1, total_volume: 0, sparkline_in_7d: null }],
    });

    await getCryptoPrices(['ethereum']);
    await getCryptoPrices(['ethereum']);

    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('getCryptoPrices handles missing sparkline data', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', image: '', current_price: 0.1, market_cap: 0, market_cap_rank: 10, price_change_percentage_24h: -1, total_volume: 0, sparkline_in_7d: null }],
    });

    const result = await getCryptoPrices(['dogecoin']);
    expect(result[0].sparkline_7d).toEqual([]);
  });

  // ─── createCryptoQueryResolvers ───────────────────────────────

  it('cryptoPrices resolver calls getCryptoPrices with args', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: [{ id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', image: '', current_price: 45000, market_cap: 0, market_cap_rank: 1, price_change_percentage_24h: 0, total_volume: 0, sparkline_in_7d: null }],
    });

    const resolvers = createCryptoQueryResolvers();
    const result = await resolvers.cryptoPrices(null, { ids: ['bitcoin'], vsCurrency: 'eur' });

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('/coins/markets'),
      expect.objectContaining({
        params: expect.objectContaining({ vs_currency: 'eur', ids: 'bitcoin' }),
      }),
    );
    expect(result).toHaveLength(1);
  });
});
