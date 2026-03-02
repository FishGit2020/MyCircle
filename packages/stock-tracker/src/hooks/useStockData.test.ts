import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Create stable mock functions for Apollo hooks
const mockUseQuery = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  SEARCH_STOCKS: 'SEARCH_STOCKS_QUERY',
  GET_STOCK_QUOTE: 'GET_STOCK_QUOTE_QUERY',
  GET_STOCK_CANDLES: 'GET_STOCK_CANDLES_QUERY',
}));

import { useStockSearch, useStockQuote, useStockCandles } from './useStockData';

describe('useStockSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty results when query is empty', () => {
    const { result } = renderHook(() => useStockSearch(''));

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('debounces the search query', () => {
    const mockResults = [
      { description: 'Apple Inc.', displaySymbol: 'AAPL', symbol: 'AAPL', type: 'Common Stock' },
    ];
    mockUseQuery.mockReturnValue({
      data: { searchStocks: mockResults },
      loading: false,
      error: undefined,
    });

    const { result, rerender } = renderHook(
      ({ query }) => useStockSearch(query),
      { initialProps: { query: 'AAPL' } }
    );

    // Before debounce fires, query should still be empty (skip=true)
    // useQuery is called with skip: true because debouncedQuery is ''
    expect(mockUseQuery).toHaveBeenCalledWith(
      'SEARCH_STOCKS_QUERY',
      expect.objectContaining({ skip: true })
    );

    // Advance timers to trigger debounce
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // After debounce, results should be available
    expect(result.current.results).toEqual(mockResults);
  });

  it('returns error message when query fails', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useStockSearch('AAPL'));

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.error).toBe('Network error');
  });

  it('returns loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });

    const { result } = renderHook(() => useStockSearch('AAPL'));

    expect(result.current.loading).toBe(true);
  });
});

describe('useStockQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('returns null quote when symbol is null', () => {
    const { result } = renderHook(() => useStockQuote(null));

    expect(result.current.quote).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_STOCK_QUOTE_QUERY',
      expect.objectContaining({ skip: true })
    );
  });

  it('returns quote data for valid symbol', () => {
    const mockQuote = {
      c: 150.25,
      d: 2.5,
      dp: 1.69,
      h: 152,
      l: 148,
      o: 149,
      pc: 147.75,
      t: 1700000000,
    };

    mockUseQuery.mockReturnValue({
      data: { stockQuote: mockQuote },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useStockQuote('AAPL'));

    expect(result.current.quote).toEqual(mockQuote);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.isLive).toBe(true);
  });

  it('computes lastUpdated from quote timestamp', () => {
    const timestamp = 1700000000;
    mockUseQuery.mockReturnValue({
      data: { stockQuote: { c: 150, d: 2, dp: 1, h: 152, l: 148, o: 149, pc: 148, t: timestamp } },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useStockQuote('AAPL'));

    expect(result.current.lastUpdated).toEqual(new Date(timestamp * 1000));
  });

  it('sets isLive based on pollInterval', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    // Default pollInterval is 60000 => isLive = true
    const { result: result1 } = renderHook(() => useStockQuote('AAPL'));
    expect(result1.current.isLive).toBe(true);

    // pollInterval = 0 => isLive = false
    const { result: result2 } = renderHook(() => useStockQuote('AAPL', 0));
    expect(result2.current.isLive).toBe(false);
  });

  it('provides a refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useStockQuote('AAPL'));
    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });
});

describe('useStockCandles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('returns null candles when symbol is null', () => {
    const { result } = renderHook(() => useStockCandles(null));

    expect(result.current.candles).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_STOCK_CANDLES_QUERY',
      expect.objectContaining({ skip: true })
    );
  });

  it('returns candle data for valid symbol', () => {
    const mockCandleData = {
      c: [150, 152, 155],
      h: [153, 154, 157],
      l: [148, 150, 153],
      o: [149, 151, 154],
      t: [1700000000, 1700086400, 1700172800],
      v: [1000, 1200, 1100],
      s: 'ok',
    };

    mockUseQuery.mockReturnValue({
      data: { stockCandles: mockCandleData },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useStockCandles('AAPL'));

    expect(result.current.candles).toEqual(mockCandleData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('passes correct variables based on timeframe', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderHook(() => useStockCandles('AAPL', '1W'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_STOCK_CANDLES_QUERY',
      expect.objectContaining({
        variables: expect.objectContaining({
          symbol: 'AAPL',
          resolution: '60', // 1W uses resolution '60'
        }),
        skip: false,
      })
    );
  });

  it('uses default 1M timeframe', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    renderHook(() => useStockCandles('AAPL'));

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_STOCK_CANDLES_QUERY',
      expect.objectContaining({
        variables: expect.objectContaining({
          resolution: 'D', // 1M uses resolution 'D'
        }),
      })
    );
  });

  it('provides a refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useStockCandles('AAPL'));
    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });
});
