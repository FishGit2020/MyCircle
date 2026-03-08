import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useCryptoPrices } from './useCryptoPrices';

describe('useCryptoPrices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
  });

  it('returns empty prices and no error initially', () => {
    const { result } = renderHook(() => useCryptoPrices());

    expect(result.current.prices).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('defaults to bitcoin when no ids provided', () => {
    renderHook(() => useCryptoPrices());

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ variables: { ids: ['bitcoin'] } }),
    );
  });

  it('passes custom ids to the query', () => {
    renderHook(() => useCryptoPrices(['ethereum', 'solana']));

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ variables: { ids: ['ethereum', 'solana'] } }),
    );
  });

  it('returns crypto prices data on success', () => {
    const mockPrices = [
      { id: 'bitcoin', name: 'Bitcoin', current_price: 50000 },
    ];
    mockUseQuery.mockReturnValue({
      data: { cryptoPrices: mockPrices },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCryptoPrices());

    expect(result.current.prices).toEqual(mockPrices);
  });

  it('returns error message on failure', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'API limit reached' },
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useCryptoPrices());

    expect(result.current.error).toBe('API limit reached');
  });

  it('provides a working refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useCryptoPrices());
    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });
});
