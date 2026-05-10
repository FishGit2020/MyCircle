import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';

let arrivalsState: { data: unknown; error: { message: string } | null };
let stopState: { data: unknown; error: { message: string } | null };
const refetchSpy = vi.fn();

vi.mock('@mycircle/shared', () => ({
  useQuery: vi.fn((query: { __id?: string }) => {
    if (query?.__id === 'arrivals') {
      return { data: arrivalsState.data, loading: false, error: arrivalsState.error, refetch: refetchSpy };
    }
    return { data: stopState.data, loading: false, error: stopState.error, refetch: vi.fn() };
  }),
  GET_TRANSIT_ARRIVALS: { __id: 'arrivals' },
  GET_TRANSIT_STOP: { __id: 'stop' },
}));

import { useTransitArrivals } from './useTransitArrivals';

describe('useTransitArrivals — error vs refreshError', () => {
  beforeEach(() => {
    refetchSpy.mockClear();
    arrivalsState = { data: undefined, error: null };
    stopState = { data: undefined, error: null };
  });

  it('initial fetch failure: error set, refreshError null', () => {
    arrivalsState = { data: undefined, error: { message: 'network down' } };

    const { result } = renderHook(() => useTransitArrivals('1_29248'));
    expect(result.current.error).toBe('network down');
    expect(result.current.refreshError).toBeNull();
  });

  it('cached data + refetch failure: refreshError set, error null', () => {
    arrivalsState = {
      data: { transitArrivals: [] },
      error: { message: 'refetch failed' },
    };

    const { result } = renderHook(() => useTransitArrivals('1_29248'));
    expect(result.current.refreshError).toBe('refetch failed');
    expect(result.current.error).toBeNull();
  });

  it('clean success: both error and refreshError are null', () => {
    arrivalsState = { data: { transitArrivals: [] }, error: null };

    const { result } = renderHook(() => useTransitArrivals('1_29248'));
    expect(result.current.error).toBeNull();
    expect(result.current.refreshError).toBeNull();
  });
});

describe('useTransitArrivals — stale-prediction partitioning', () => {
  beforeEach(() => {
    refetchSpy.mockClear();
    arrivalsState = { data: undefined, error: null };
    stopState = { data: undefined, error: null };
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const arrivalAt = (offsetMs: number) => ({
    routeId: `r${offsetMs}`,
    routeShortName: `${offsetMs}`,
    tripHeadsign: 'X',
    scheduledArrival: Date.now() + offsetMs,
    predictedArrival: Date.now() + offsetMs,
    isRealTime: true,
    status: '',
    vehicleId: `v${offsetMs}`,
  });

  it('keeps a future arrival without departed flag', () => {
    arrivalsState = {
      data: { transitArrivals: [arrivalAt(5 * 60_000)] },
      error: null,
    };
    const { result } = renderHook(() => useTransitArrivals('s'));
    expect(result.current.arrivals).toHaveLength(1);
    expect(result.current.arrivals[0].departed).toBeUndefined();
  });

  it('marks an arrival 30s past as departed', () => {
    arrivalsState = {
      data: { transitArrivals: [arrivalAt(-30_000)] },
      error: null,
    };
    const { result } = renderHook(() => useTransitArrivals('s'));
    expect(result.current.arrivals).toHaveLength(1);
    expect(result.current.arrivals[0].departed).toBe(true);
  });

  it('omits an arrival 90s past', () => {
    arrivalsState = {
      data: {
        transitArrivals: [arrivalAt(-90_000), arrivalAt(60_000)],
      },
      error: null,
    };
    const { result } = renderHook(() => useTransitArrivals('s'));
    expect(result.current.arrivals).toHaveLength(1);
    expect(result.current.arrivals[0].routeShortName).toBe('60000');
  });
});
