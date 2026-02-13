import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, SEARCH_STOCKS, GET_STOCK_QUOTE, GET_STOCK_CANDLES } from '@mycircle/shared';

// --- Types ---

export interface StockSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface StockCandle {
  c: number[]; // Close prices
  h: number[]; // High prices
  l: number[]; // Low prices
  o: number[]; // Open prices
  t: number[]; // Timestamps
  v: number[]; // Volume
  s: string;   // Status ("ok" or "no_data")
}

export type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y';

export const TIMEFRAMES: { id: Timeframe; label: string; days: number; resolution: string }[] = [
  { id: '1W', label: '1W', days: 7, resolution: '60' },
  { id: '1M', label: '1M', days: 30, resolution: 'D' },
  { id: '3M', label: '3M', days: 90, resolution: 'D' },
  { id: '6M', label: '6M', days: 180, resolution: 'D' },
  { id: '1Y', label: '1Y', days: 365, resolution: 'W' },
];

// --- GraphQL Response Types ---

interface SearchStocksResponse {
  searchStocks: StockSearchResult[];
}

interface StockQuoteResponse {
  stockQuote: StockQuote | null;
}

interface StockCandlesResponse {
  stockCandles: StockCandle | null;
}

// --- Hook: useStockSearch ---

interface UseStockSearchReturn {
  results: StockSearchResult[];
  loading: boolean;
  error: string | null;
}

export function useStockSearch(query: string): UseStockSearchReturn {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    if (query.length < 1) {
      setDebouncedQuery('');
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const { data, loading, error } = useQuery<SearchStocksResponse>(SEARCH_STOCKS, {
    variables: { query: debouncedQuery },
    skip: debouncedQuery.length < 1,
    fetchPolicy: 'cache-first',
  });

  const results = debouncedQuery.length < 1 ? [] : (data?.searchStocks ?? []);

  return {
    results,
    loading,
    error: error?.message ?? null,
  };
}

// --- Hook: useStockQuote ---

interface UseStockQuoteReturn {
  quote: StockQuote | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  lastUpdated: Date | null;
  isLive: boolean;
}

export function useStockQuote(
  symbol: string | null,
  pollInterval: number = 60_000
): UseStockQuoteReturn {
  const { data, loading, error, refetch } = useQuery<StockQuoteResponse>(GET_STOCK_QUOTE, {
    variables: { symbol: symbol! },
    skip: !symbol,
    fetchPolicy: 'cache-and-network',
    pollInterval: symbol ? pollInterval : 0,
  });

  return {
    quote: data?.stockQuote ?? null,
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
    lastUpdated: data?.stockQuote?.t ? new Date(data.stockQuote.t * 1000) : null,
    isLive: !!symbol && pollInterval > 0,
  };
}

// --- Hook: useStockCandles (with timeframe support) ---

interface UseStockCandlesReturn {
  candles: StockCandle | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStockCandles(symbol: string | null, timeframe: Timeframe = '1M'): UseStockCandlesReturn {
  const tf = TIMEFRAMES.find(t => t.id === timeframe) ?? TIMEFRAMES[1];
  const now = useMemo(() => Math.floor(Date.now() / 1000), []);
  const from = useMemo(() => now - tf.days * 24 * 60 * 60, [now, tf.days]);

  const { data, loading, error, refetch } = useQuery<StockCandlesResponse>(GET_STOCK_CANDLES, {
    variables: { symbol: symbol!, resolution: tf.resolution, from, to: now },
    skip: !symbol,
    fetchPolicy: 'cache-and-network',
  });

  return {
    candles: data?.stockCandles ?? null,
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
  };
}
