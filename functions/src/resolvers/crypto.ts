import axios from 'axios';
import NodeCache from 'node-cache';

const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';

export const cryptoCache = new NodeCache({ stdTTL: 60, checkperiod: 20 });

// ─── Crypto API helpers (CoinGecko — free, no API key) ───────

export async function getCryptoPrices(ids: string[], vsCurrency: string = 'usd') {
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

// ─── Crypto Query Resolvers ───────────────────────────────────

export function createCryptoQueryResolvers() {
  return {
    cryptoPrices: async (_: any, { ids, vsCurrency = 'usd' }: { ids: string[]; vsCurrency?: string }) => {
      return await getCryptoPrices(ids, vsCurrency);
    },
  };
}
