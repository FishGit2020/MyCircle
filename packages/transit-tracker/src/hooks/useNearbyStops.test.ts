import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const fetchNearbySpy = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useLazyQuery: () => [fetchNearbySpy, { data: { transitNearbyStops: [] }, loading: false, error: null }],
  GET_TRANSIT_NEARBY_STOPS: {},
}));

import { useNearbyStops } from './useNearbyStops';

const originalGeolocation = navigator.geolocation;
const stub: { getCurrentPosition: ReturnType<typeof vi.fn> } = { getCurrentPosition: vi.fn() };

// The root test setup defines navigator.geolocation with writable:true but
// not configurable, so we mutate via direct assignment instead of
// Object.defineProperty (which would fail).
function setGeolocation(value: unknown) {
  (navigator as unknown as { geolocation: unknown }).geolocation = value;
}

describe('useNearbyStops — permission state', () => {
  beforeEach(() => {
    fetchNearbySpy.mockClear();
    stub.getCurrentPosition = vi.fn();
    setGeolocation(stub);
  });

  afterAll(() => {
    setGeolocation(originalGeolocation);
  });

  it('starts as "unknown" before any call', () => {
    const { result } = renderHook(() => useNearbyStops());
    expect(result.current.permission).toBe('unknown');
  });

  it('becomes "granted" on a successful getCurrentPosition', () => {
    stub.getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({ coords: { latitude: 47.6, longitude: -122.3 } } as GeolocationPosition);
    });
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby());
    expect(result.current.permission).toBe('granted');
    expect(fetchNearbySpy).toHaveBeenCalledTimes(1);
  });

  it('becomes "denied" on PERMISSION_DENIED (code 1)', () => {
    stub.getCurrentPosition = vi.fn((_success: unknown, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    });
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby());
    expect(result.current.permission).toBe('denied');
    expect(fetchNearbySpy).not.toHaveBeenCalled();
  });

  it('becomes "unavailable" on POSITION_UNAVAILABLE (code 2)', () => {
    stub.getCurrentPosition = vi.fn((_success: unknown, error: PositionErrorCallback) => {
      error({ code: 2, message: 'unavailable', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    });
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby());
    expect(result.current.permission).toBe('unavailable');
  });

  it('becomes "unavailable" on TIMEOUT (code 3)', () => {
    stub.getCurrentPosition = vi.fn((_success: unknown, error: PositionErrorCallback) => {
      error({ code: 3, message: 'timeout', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 } as GeolocationPositionError);
    });
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby());
    expect(result.current.permission).toBe('unavailable');
  });

  it('becomes "unavailable" when navigator.geolocation is missing', () => {
    setGeolocation(undefined);
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby());
    expect(result.current.permission).toBe('unavailable');
  });

  it('explicit coords skip geolocation and report "granted"', () => {
    const { result } = renderHook(() => useNearbyStops());
    act(() => result.current.findNearby({ lat: 47.6, lon: -122.3 }));
    expect(result.current.permission).toBe('granted');
    expect(fetchNearbySpy).toHaveBeenCalledTimes(1);
  });
});
