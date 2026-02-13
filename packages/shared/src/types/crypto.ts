export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  price_change_percentage_24h: number | null;
  total_volume: number;
  sparkline_7d: number[];
}
