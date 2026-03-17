import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCityManager } from './useCityManager';

const mockToggleFavoriteCity = vi.fn().mockResolvedValue(true);
const mockGetUserProfile = vi.fn().mockResolvedValue(null);

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: { RECENT_CITIES: 'recent-cities' },
  eventBus: { subscribe: vi.fn(() => vi.fn()), publish: vi.fn() },
  MFEvents: { CITY_SELECTED: 'city_selected' },
}));

vi.mock('../lib/firebase', () => ({
  toggleFavoriteCity: (...args: unknown[]) => mockToggleFavoriteCity(...args),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  logEvent: vi.fn(),
}));

const makeUser = (uid = 'user1') => ({ uid } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('useCityManager', () => {
  it('starts with empty cities when localStorage is empty', () => {
    const { result } = renderHook(() => useCityManager(null));
    expect(result.current.recentCities).toEqual([]);
    expect(result.current.favoriteCities).toEqual([]);
  });

  it('initializes recentCities from localStorage', () => {
    const stored = [{ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74, searchedAt: new Date().toISOString() }];
    localStorage.setItem('recent-cities', JSON.stringify(stored));

    const { result } = renderHook(() => useCityManager(null));
    expect(result.current.recentCities).toHaveLength(1);
    expect(result.current.recentCities[0].name).toBe('NYC');
  });

  it('addCity saves to localStorage and updates state', async () => {
    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    expect(result.current.recentCities).toHaveLength(1);
    expect(result.current.recentCities[0].name).toBe('NYC');
    const stored = JSON.parse(localStorage.getItem('recent-cities') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('NYC');
  });

  it('addCity deduplicates cities by id', async () => {
    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    expect(result.current.recentCities).toHaveLength(1);
  });

  it('addCity works when user is null', async () => {
    const { result } = renderHook(() => useCityManager(null));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    expect(result.current.recentCities).toHaveLength(1);
  });

  it('removeCity removes from localStorage and state', async () => {
    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    await act(async () => {
      await result.current.removeCity('1');
    });

    expect(result.current.recentCities).toHaveLength(0);
    const stored = JSON.parse(localStorage.getItem('recent-cities') || '[]');
    expect(stored).toHaveLength(0);
  });

  it('clearCities clears localStorage and state', async () => {
    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });
    expect(result.current.recentCities).toHaveLength(1);

    await act(async () => {
      await result.current.clearCities();
    });

    expect(result.current.recentCities).toEqual([]);
    expect(localStorage.getItem('recent-cities')).toBe('[]');
  });

  it('toggleFavorite calls firebase and returns result', async () => {
    mockToggleFavoriteCity.mockResolvedValue(true);
    mockGetUserProfile.mockResolvedValue({ favoriteCities: [{ id: '1', name: 'LA' }] });

    const { result } = renderHook(() => useCityManager(makeUser()));

    let isNowFavorite = false;
    await act(async () => {
      isNowFavorite = await result.current.toggleFavorite({ id: '1', name: 'LA', country: 'US', lat: 34, lon: -118 });
    });

    expect(isNowFavorite).toBe(true);
    expect(result.current.favoriteCities).toEqual([{ id: '1', name: 'LA' }]);
  });

  it('toggleFavorite returns false when user is null', async () => {
    const { result } = renderHook(() => useCityManager(null));

    let isNowFavorite = true;
    await act(async () => {
      isNowFavorite = await result.current.toggleFavorite({ id: '1', name: 'LA', country: 'US', lat: 34, lon: -118 });
    });

    expect(isNowFavorite).toBe(false);
  });

  it('setFavoriteCities updates state', () => {
    const { result } = renderHook(() => useCityManager(null));

    act(() => {
      result.current.setFavoriteCities([{ id: '2', name: 'LA', country: 'US', lat: 34, lon: -118 }]);
    });

    expect(result.current.favoriteCities).toHaveLength(1);
  });
});
