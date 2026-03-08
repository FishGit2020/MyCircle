import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useHistoricalWeather } from './useHistoricalWeather';

describe('useHistoricalWeather', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  it('returns null historical data and skips query when coordinates are null', () => {
    const { result } = renderHook(() => useHistoricalWeather(null, null));

    expect(result.current.historical).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it('computes last-year date and passes it as variable', () => {
    renderHook(() => useHistoricalWeather(40.7, -74.0));

    const callArgs = mockUseQuery.mock.calls[0][1];
    expect(callArgs.variables.lat).toBe(40.7);
    expect(callArgs.variables.lon).toBe(-74.0);
    // date should be a YYYY-MM-DD string
    expect(callArgs.variables.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(callArgs.skip).toBe(false);
  });

  it('returns historical weather data on success', () => {
    const mockHistorical = { temp: 22, description: 'Clear' };
    mockUseQuery.mockReturnValue({
      data: { historicalWeather: mockHistorical },
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useHistoricalWeather(40.7, -74.0));

    expect(result.current.historical).toEqual(mockHistorical);
  });

  it('returns error message on failure', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Server error' },
    });

    const { result } = renderHook(() => useHistoricalWeather(40.7, -74.0));

    expect(result.current.error).toBe('Server error');
    expect(result.current.historical).toBeNull();
  });
});
