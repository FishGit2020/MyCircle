import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockUseQuery = vi.fn();
const mockSaveMutation = vi.fn();
const mockDeleteMutation = vi.fn();

vi.mock('@mycircle/shared', () => {
  const saveMut = vi.fn();
  const deleteMut = vi.fn();
  const queryMock = vi.fn();
  const mutationMock = vi.fn((query: any) => {
    if (query === 'SAVE_BENCHMARK_ENDPOINT') return [saveMut, { loading: false }];
    if (query === 'DELETE_BENCHMARK_ENDPOINT') return [deleteMut, { loading: false }];
    return [vi.fn(), { loading: false }];
  });

  function useEndpoints() {
    const { data, loading, refetch } = queryMock('GET_BENCHMARK_ENDPOINTS', { fetchPolicy: 'cache-and-network' });
    const [save, { loading: saving }] = mutationMock('SAVE_BENCHMARK_ENDPOINT');
    const [del] = mutationMock('DELETE_BENCHMARK_ENDPOINT');
    const endpoints = data?.benchmarkEndpoints ?? [];
    const saveEndpoint = async (input: any) => { await save({ variables: { input } }); };
    const deleteEndpoint = async (id: string) => { await del({ variables: { id } }); };
    return { endpoints, loading, saving, refetch, saveEndpoint, deleteEndpoint };
  }

  // Expose internal mocks for tests via __mocks
  (useEndpoints as any).__queryMock = queryMock;
  (useEndpoints as any).__saveMutation = saveMut;
  (useEndpoints as any).__deleteMutation = deleteMut;

  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useQuery: queryMock,
    useMutation: mutationMock,
    useEndpoints,
    GET_BENCHMARK_ENDPOINTS: 'GET_BENCHMARK_ENDPOINTS',
    SAVE_BENCHMARK_ENDPOINT: 'SAVE_BENCHMARK_ENDPOINT',
    DELETE_BENCHMARK_ENDPOINT: 'DELETE_BENCHMARK_ENDPOINT',
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

// Grab mock references after mock is set up
let queryMock: ReturnType<typeof vi.fn>;
let saveMut: ReturnType<typeof vi.fn>;
let deleteMut: ReturnType<typeof vi.fn>;

beforeEach(async () => {
  const shared = await import('@mycircle/shared');
  const hook = (shared as any).useEndpoints;
  queryMock = hook.__queryMock;
  saveMut = hook.__saveMutation;
  deleteMut = hook.__deleteMutation;
  vi.clearAllMocks();
});

import { useEndpoints } from './useEndpoints';

describe('useEndpoints', () => {
  it('returns loading state initially', () => {
    queryMock.mockReturnValue({ data: null, loading: true, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.loading).toBe(true);
    expect(result.current.endpoints).toEqual([]);
  });

  it('returns endpoints from query data', () => {
    const mockEndpoints = [
      { id: '1', url: 'http://nas:11434', name: 'NAS', hasCfAccess: false, source: 'benchmark' },
      { id: '2', url: 'https://gpu.example.com', name: 'GPU', hasCfAccess: true, source: 'chat' },
    ];
    queryMock.mockReturnValue({
      data: { benchmarkEndpoints: mockEndpoints },
      loading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual(mockEndpoints);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty array when data is null', () => {
    queryMock.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.endpoints).toEqual([]);
  });

  it('saveEndpoint calls save mutation with input', async () => {
    queryMock.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    const input = {
      url: 'http://test:11434',
      name: 'Test Server',
      source: 'benchmark',
    };

    await act(async () => {
      await result.current.saveEndpoint(input);
    });

    expect(saveMut).toHaveBeenCalledWith({
      variables: { input },
    });
  });

  it('deleteEndpoint calls delete mutation with id', async () => {
    queryMock.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    await act(async () => {
      await result.current.deleteEndpoint('ep-1');
    });

    expect(deleteMut).toHaveBeenCalledWith({
      variables: { id: 'ep-1' },
    });
  });

  it('exposes refetch function', () => {
    const mockRefetch = vi.fn();
    queryMock.mockReturnValue({ data: null, loading: false, refetch: mockRefetch });

    const { result } = renderHook(() => useEndpoints());

    expect(result.current.refetch).toBe(mockRefetch);
  });

  it('exposes saving state', () => {
    queryMock.mockReturnValue({ data: null, loading: false, refetch: vi.fn() });

    const { result } = renderHook(() => useEndpoints());

    expect(typeof result.current.saving).toBe('boolean');
  });
});
