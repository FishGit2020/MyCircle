import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCityManager } from './useCityManager';

const mockAddRecentCity = vi.fn();
const mockRemoveRecentCity = vi.fn();
const mockClearRecentCities = vi.fn();
const mockToggleFavoriteCity = vi.fn().mockResolvedValue(true);
const mockGetRecentCities = vi.fn().mockResolvedValue([]);
const mockGetUserProfile = vi.fn().mockResolvedValue(null);
const mockLogEvent = vi.fn();

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../lib/firebase', () => ({
  addRecentCity: (...args: unknown[]) => mockAddRecentCity(...args),
  removeRecentCity: (...args: unknown[]) => mockRemoveRecentCity(...args),
  clearRecentCities: (...args: unknown[]) => mockClearRecentCities(...args),
  toggleFavoriteCity: (...args: unknown[]) => mockToggleFavoriteCity(...args),
  getRecentCities: (...args: unknown[]) => mockGetRecentCities(...args),
  getUserProfile: (...args: unknown[]) => mockGetUserProfile(...args),
  logEvent: (...args: unknown[]) => mockLogEvent(...args),
}));

const makeUser = (uid = 'user1') => ({ uid } as any);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useCityManager', () => {
  it('starts with empty cities', () => {
    const { result } = renderHook(() => useCityManager(null));
    expect(result.current.recentCities).toEqual([]);
    expect(result.current.favoriteCities).toEqual([]);
  });

  it('addCity calls firebase and updates state', async () => {
    const updatedCities = [{ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74, searchedAt: new Date() }];
    mockGetRecentCities.mockResolvedValue(updatedCities);

    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    expect(mockAddRecentCity).toHaveBeenCalledWith('user1', { id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    expect(result.current.recentCities).toEqual(updatedCities);
    expect(mockLogEvent).toHaveBeenCalledWith('city_searched', { city_name: 'NYC', city_country: 'US' });
  });

  it('addCity still logs event when user is null', async () => {
    const { result } = renderHook(() => useCityManager(null));

    await act(async () => {
      await result.current.addCity({ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74 });
    });

    expect(mockAddRecentCity).not.toHaveBeenCalled();
    expect(mockLogEvent).toHaveBeenCalledWith('city_searched', { city_name: 'NYC', city_country: 'US' });
  });

  it('removeCity calls firebase and refreshes list', async () => {
    mockGetRecentCities.mockResolvedValue([]);

    const { result } = renderHook(() => useCityManager(makeUser()));

    await act(async () => {
      await result.current.removeCity('1');
    });

    expect(mockRemoveRecentCity).toHaveBeenCalledWith('user1', '1');
    expect(mockGetRecentCities).toHaveBeenCalledWith('user1');
  });

  it('removeCity does nothing when user is null', async () => {
    const { result } = renderHook(() => useCityManager(null));

    await act(async () => {
      await result.current.removeCity('1');
    });

    expect(mockRemoveRecentCity).not.toHaveBeenCalled();
  });

  it('clearCities clears firebase and local state', async () => {
    const { result } = renderHook(() => useCityManager(makeUser()));

    // First add cities via setter
    act(() => {
      result.current.setRecentCities([{ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74, searchedAt: new Date() }]);
    });
    expect(result.current.recentCities).toHaveLength(1);

    await act(async () => {
      await result.current.clearCities();
    });

    expect(mockClearRecentCities).toHaveBeenCalledWith('user1');
    expect(result.current.recentCities).toEqual([]);
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

  it('setRecentCities and setFavoriteCities update state', () => {
    const { result } = renderHook(() => useCityManager(null));

    act(() => {
      result.current.setRecentCities([{ id: '1', name: 'NYC', country: 'US', lat: 40, lon: -74, searchedAt: new Date() }]);
      result.current.setFavoriteCities([{ id: '2', name: 'LA', country: 'US', lat: 34, lon: -118 }]);
    });

    expect(result.current.recentCities).toHaveLength(1);
    expect(result.current.favoriteCities).toHaveLength(1);
  });
});
