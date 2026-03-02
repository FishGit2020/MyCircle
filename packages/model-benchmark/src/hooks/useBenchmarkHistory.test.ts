import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBenchmarkHistory } from './useBenchmarkHistory';

const mockUseQuery = vi.fn();

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
    GET_BENCHMARK_HISTORY: 'GET_BENCHMARK_HISTORY',
    DELETE_BENCHMARK_RUN: 'DELETE_BENCHMARK_RUN',
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

describe('useBenchmarkHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: true, refetch: vi.fn() });

    const { result } = renderHook(() => useBenchmarkHistory());

    expect(result.current.loading).toBe(true);
    expect(result.current.runs).toEqual([]);
  });

  it('returns runs from query data', () => {
    const mockRuns = [
      { id: 'run-1', userId: 'u1', results: [], createdAt: '2026-01-15T10:00:00Z' },
      { id: 'run-2', userId: 'u1', results: [], createdAt: '2026-01-15T11:00:00Z' },
    ];
    mockUseQuery.mockReturnValue({
      data: { benchmarkHistory: mockRuns },
      loading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useBenchmarkHistory());

    expect(result.current.runs).toEqual(mockRuns);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty array when data is null', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useBenchmarkHistory());

    expect(result.current.runs).toEqual([]);
  });

  it('returns empty array when benchmarkHistory is undefined', () => {
    mockUseQuery.mockReturnValue({ data: {}, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useBenchmarkHistory());

    expect(result.current.runs).toEqual([]);
  });

  it('passes default limit of 10 to query', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    renderHook(() => useBenchmarkHistory());

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_BENCHMARK_HISTORY',
      expect.objectContaining({
        variables: { limit: 10 },
        fetchPolicy: 'cache-and-network',
      })
    );
  });

  it('passes custom limit to query', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    renderHook(() => useBenchmarkHistory(25));

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_BENCHMARK_HISTORY',
      expect.objectContaining({
        variables: { limit: 25 },
      })
    );
  });

  it('exposes refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: mockRefetch });

    const { result } = renderHook(() => useBenchmarkHistory());

    expect(result.current.refetch).toBe(mockRefetch);
  });
});
