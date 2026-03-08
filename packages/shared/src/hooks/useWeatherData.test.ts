import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockUseSubscription = vi.fn();

vi.mock('@apollo/client/react', () => ({
  useQuery: (...args: any[]) => mockUseQuery(...args),
  useSubscription: (...args: any[]) => mockUseSubscription(...args),
}));

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useWeatherData } from './useWeatherData';

describe('useWeatherData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
    mockUseSubscription.mockReturnValue({
      data: undefined,
      error: undefined,
    });
  });

  it('returns null weather data when coordinates are null', () => {
    const { result } = renderHook(() => useWeatherData(null, null));

    expect(result.current.current).toBeNull();
    expect(result.current.forecast).toBeNull();
    expect(result.current.hourly).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ skip: true }),
    );
  });

  it('returns weather data on successful query', () => {
    const mockCurrent = { temp: 25, description: 'Sunny', dt: 1700000000 };
    const mockForecast = [{ dt: 1700086400, temp: { day: 26 } }];
    const mockHourly = [{ dt: 1700003600, temp: 24 }];

    mockUseQuery.mockReturnValue({
      data: {
        weather: {
          current: mockCurrent,
          forecast: mockForecast,
          hourly: mockHourly,
        },
      },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useWeatherData(40.7, -74.0));

    expect(result.current.current).toEqual(mockCurrent);
    expect(result.current.forecast).toEqual(mockForecast);
    expect(result.current.hourly).toEqual(mockHourly);
    expect(result.current.loading).toBe(false);
  });

  it('returns error message from query error', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: { message: 'Network error' },
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useWeatherData(40.7, -74.0));

    expect(result.current.error).toBe('Network error');
  });

  it('provides a working refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useWeatherData(40.7, -74.0));
    result.current.refetch();

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('sets isLive when realtime is enabled and coords provided', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useWeatherData(40.7, -74.0, true));

    expect(result.current.isLive).toBe(true);
  });

  it('sets isLive false when realtime is disabled', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useWeatherData(40.7, -74.0, false));

    expect(result.current.isLive).toBe(false);
  });
});
