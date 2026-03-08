import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useAirQuality } from './useAirQuality';

describe('useAirQuality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false, error: undefined });
  });

  it('returns null air quality and skips query when coordinates are null', () => {
    const { result } = renderHook(() => useAirQuality(null, null));

    expect(result.current.airQuality).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it('passes coordinates and does not skip when both lat/lon provided', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true, error: undefined });

    const { result } = renderHook(() => useAirQuality(40.7, -74.0));

    expect(result.current.loading).toBe(true);
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        variables: { lat: 40.7, lon: -74.0 },
        skip: false,
      }),
    );
  });

  it('returns air quality data on success', () => {
    const mockAq = { aqi: 42, components: { pm2_5: 10 } };
    mockUseQuery.mockReturnValue({
      data: { airQuality: mockAq },
      loading: false,
      error: undefined,
    });

    const { result } = renderHook(() => useAirQuality(40.7, -74.0));

    expect(result.current.airQuality).toEqual(mockAq);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns error message on failure', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Network error' },
    });

    const { result } = renderHook(() => useAirQuality(40.7, -74.0));

    expect(result.current.error).toBe('Network error');
    expect(result.current.airQuality).toBeNull();
  });
});
