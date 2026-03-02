import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEndpoints } from './useEndpoints';

const mockUseQuery = vi.fn();
const mockSaveMutation = vi.fn();
const mockDeleteMutation = vi.fn();

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useQuery: (...args: any[]) => mockUseQuery(...args),
    useMutation: vi.fn((query: any) => {
      if (query === 'SAVE_BENCHMARK_ENDPOINT') return [mockSaveMutation, { loading: false }];
      if (query === 'DELETE_BENCHMARK_ENDPOINT') return [mockDeleteMutation, { loading: false }];
      return [vi.fn(), { loading: false }];
    }),
    GET_BENCHMARK_ENDPOINTS: 'GET_BENCHMARK_ENDPOINTS',
    SAVE_BENCHMARK_ENDPOINT: 'SAVE_BENCHMARK_ENDPOINT',
    DELETE_BENCHMARK_ENDPOINT: 'DELETE_BENCHMARK_ENDPOINT',
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

describe('useEndpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: true, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.loading).toBe(true);
    expect(result.current.endpoints).toEqual([]);
  });

  it('returns endpoints from query data', () => {
    const mockEndpoints = [
      { id: '1', url: 'http://nas:11434', name: 'NAS', hasCfAccess: false },
      { id: '2', url: 'https://gpu.example.com', name: 'GPU', hasCfAccess: true },
    ];
    mockUseQuery.mockReturnValue({
      data: { benchmarkEndpoints: mockEndpoints },
      loading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual(mockEndpoints);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty array when data is null', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual([]);
  });

  it('returns empty array when benchmarkEndpoints is undefined', () => {
    mockUseQuery.mockReturnValue({ data: {}, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual([]);
  });

  it('uses cache-and-network fetch policy', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    renderHook(() => useEndpoints());

    expect(mockUseQuery).toHaveBeenCalledWith(
      'GET_BENCHMARK_ENDPOINTS',
      expect.objectContaining({
        fetchPolicy: 'cache-and-network',
      })
    );
  });

  it('saveEndpoint calls save mutation with input', async () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    const input = {
      url: 'http://test:11434',
      name: 'Test Server',
      cfAccessClientId: 'client-id',
      cfAccessClientSecret: 'client-secret',
    };

    await act(async () => {
      await result.current.saveEndpoint(input);
    });

    expect(mockSaveMutation).toHaveBeenCalledWith({
      variables: { input },
    });
  });

  it('saveEndpoint works without optional CF fields', async () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    const input = { url: 'http://test:11434', name: 'Test Server' };

    await act(async () => {
      await result.current.saveEndpoint(input);
    });

    expect(mockSaveMutation).toHaveBeenCalledWith({
      variables: { input },
    });
  });

  it('deleteEndpoint calls delete mutation with id', async () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    await act(async () => {
      await result.current.deleteEndpoint('ep-1');
    });

    expect(mockDeleteMutation).toHaveBeenCalledWith({
      variables: { id: 'ep-1' },
    });
  });

  it('exposes refetch function', () => {
    const mockRefetch = vi.fn();
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: mockRefetch });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it('exposes saving state', () => {
    mockUseQuery.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    // saving comes from the second element of useMutation return
    expect(typeof result.current.saving).toBe('boolean');
  });
});
