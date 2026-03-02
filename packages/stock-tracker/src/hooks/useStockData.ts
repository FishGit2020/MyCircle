import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, SEARCH_STOCKS, GET_STOCK_QUOTE, GET_STOCK_CANDLES } from '@mycircle/shared';
import type {
  SearchStocksQuery,
  GetStockQuoteQuery,
  GetStockCandlesQuery,
  StockSearchResult,
  StockQuote,
  StockCandle,
} from '@mycircle/shared';

// Re-export entity types for downstream consumers
export type { StockSearchResult, StockQuote, StockCandle };

export type Timeframe = '1W' | '1M' | '3M' | '6M' | '1Y';

export const TIMEFRAMES: { id: Timeframe; label: string; days: number; resolution: string }[] = [
  { id: '1W', label: '1W', days: 7, resolution: '60' },
  { id: '1M', label: '1M', days: 30, resolution: 'D' },
  { id: '3M', label: '3M', days: 90, resolution: 'D' },
  { id: '6M', label: '6M', days: 180, resolution: 'D' },
  { id: '1Y', label: '1Y', days: 365, resolution: 'W' },
];

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

  const { data, loading, error } = useQuery<SearchStocksQuery>(SEARCH_STOCKS, {
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
  const { data, loading, error, refetch } = useQuery<GetStockQuoteQuery>(GET_STOCK_QUOTE, {
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

  const { data, loading, error, refetch } = useQuery<GetStockCandlesQuery>(GET_STOCK_CANDLES, {
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
