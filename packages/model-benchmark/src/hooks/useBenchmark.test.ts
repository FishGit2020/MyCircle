import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBenchmark, BENCHMARK_PROMPTS } from './useBenchmark';

const mockRunMutation = vi.fn();
const mockSaveMutation = vi.fn();

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => key;
  return {
    useTranslation: () => ({ t }),
    useMutation: vi.fn((query: any) => {
      // Return different mutation fns based on query
      if (query === 'RUN_BENCHMARK') return [mockRunMutation, { loading: false }];
      if (query === 'SAVE_BENCHMARK_RUN') return [mockSaveMutation, { loading: false }];
      return [vi.fn(), { loading: false }];
    }),
    RUN_BENCHMARK: 'RUN_BENCHMARK',
    SAVE_BENCHMARK_RUN: 'SAVE_BENCHMARK_RUN',
    GET_BENCHMARK_HISTORY: 'GET_BENCHMARK_HISTORY',
    StorageKeys: { BENCHMARK_CACHE: 'benchmark-cache' },
    WindowEvents: { BENCHMARK_CHANGED: 'benchmark-changed' },
    createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  };
});

describe('BENCHMARK_PROMPTS', () => {
  it('exports 5 prompts', () => {
    expect(BENCHMARK_PROMPTS).toHaveLength(5);
  });

  it('has correct prompt IDs', () => {
    const ids = BENCHMARK_PROMPTS.map(p => p.id);
    expect(ids).toEqual(['simple', 'reasoning', 'code', 'summary', 'creative']);
  });

  it('each prompt has id, labelKey, and prompt string', () => {
    for (const p of BENCHMARK_PROMPTS) {
      expect(p).toHaveProperty('id');
      expect(p).toHaveProperty('labelKey');
      expect(p).toHaveProperty('prompt');
      expect(typeof p.prompt).toBe('string');
      expect(p.prompt.length).toBeGreaterThan(0);
    }
  });
});

describe('useBenchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
  });

  it('returns initial state', () => {
    const { result } = renderHook(() => useBenchmark());
    expect(result.current.results).toEqual([]);
    expect(result.current.running).toBe(false);
    expect(result.current.currentEndpoint).toBeNull();
    expect(typeof result.current.runBenchmark).toBe('function');
    expect(typeof result.current.saveRun).toBe('function');
  });

  it('runBenchmark sets running to true during execution', async () => {
    // Make mutation resolve asynchronously
    mockRunMutation.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({ data: { runBenchmark: {
        endpointId: 'ep-1',
        endpointName: 'NAS',
        model: 'gemma2:2b',
        prompt: 'test',
        response: 'Paris',
        timing: { tokensPerSecond: 25 },
        error: null,
        timestamp: '2026-01-15T10:00:00Z',
      }}}), 10);
    }));

    const { result } = renderHook(() => useBenchmark());

    let runPromise: Promise<any>;
    act(() => {
      runPromise = result.current.runBenchmark(['ep-1'], 'gemma2:2b', 'test');
    });

    // Should be running
    expect(result.current.running).toBe(true);

    await act(async () => {
      await runPromise!;
    });

    expect(result.current.running).toBe(false);
  });

  it('runBenchmark accumulates results from multiple endpoints', async () => {
    mockRunMutation
      .mockResolvedValueOnce({
        data: {
          runBenchmark: {
            endpointId: 'ep-1',
            endpointName: 'NAS',
            model: 'gemma2:2b',
            prompt: 'test',
            response: 'Response 1',
            timing: { tokensPerSecond: 25 },
            error: null,
            timestamp: '2026-01-15T10:00:00Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          runBenchmark: {
            endpointId: 'ep-2',
            endpointName: 'GPU',
            model: 'gemma2:2b',
            prompt: 'test',
            response: 'Response 2',
            timing: { tokensPerSecond: 50 },
            error: null,
            timestamp: '2026-01-15T10:00:01Z',
          },
        },
      });

    const { result } = renderHook(() => useBenchmark());

    let returnedResults: any;
    await act(async () => {
      returnedResults = await result.current.runBenchmark(['ep-1', 'ep-2'], 'gemma2:2b', 'test');
    });

    expect(returnedResults).toHaveLength(2);
    expect(returnedResults[0].endpointName).toBe('NAS');
    expect(returnedResults[1].endpointName).toBe('GPU');
    expect(result.current.results).toHaveLength(2);
  });

  it('runBenchmark handles errors gracefully', async () => {
    mockRunMutation.mockRejectedValueOnce(new Error('Connection refused'));

    const { result } = renderHook(() => useBenchmark());

    let returnedResults: any;
    await act(async () => {
      returnedResults = await result.current.runBenchmark(['ep-1'], 'gemma2:2b', 'test');
    });

    expect(returnedResults).toHaveLength(1);
    expect(returnedResults[0].error).toBe('Connection refused');
    expect(returnedResults[0].timing).toBeNull();
    expect(returnedResults[0].endpointId).toBe('ep-1');
    expect(result.current.running).toBe(false);
  });

  it('runBenchmark handles non-Error thrown values', async () => {
    mockRunMutation.mockRejectedValueOnce('string error');

    const { result } = renderHook(() => useBenchmark());

    let returnedResults: any;
    await act(async () => {
      returnedResults = await result.current.runBenchmark(['ep-1'], 'gemma2:2b', 'test');
    });

    expect(returnedResults[0].error).toBe('Unknown error');
  });

  it('runBenchmark updates localStorage cache with fastest result', async () => {
    mockRunMutation
      .mockResolvedValueOnce({
        data: {
          runBenchmark: {
            endpointId: 'ep-1',
            endpointName: 'Slow',
            model: 'gemma2:2b',
            prompt: 'test',
            response: 'r',
            timing: { tokensPerSecond: 10 },
            error: null,
            timestamp: '2026-01-15T10:00:00Z',
          },
        },
      })
      .mockResolvedValueOnce({
        data: {
          runBenchmark: {
            endpointId: 'ep-2',
            endpointName: 'Fast',
            model: 'gemma2:2b',
            prompt: 'test',
            response: 'r',
            timing: { tokensPerSecond: 50 },
            error: null,
            timestamp: '2026-01-15T10:00:01Z',
          },
        },
      });

    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await result.current.runBenchmark(['ep-1', 'ep-2'], 'gemma2:2b', 'test');
    });

    const cache = JSON.parse(localStorage.getItem('benchmark-cache') || '{}');
    expect(cache.fastestEndpoint).toBe('Fast');
    expect(cache.fastestTps).toBe(50);
    expect(cache.endpointCount).toBe(2);
    expect(cache.lastRunAt).toBeDefined();
  });

  it('runBenchmark dispatches BENCHMARK_CHANGED event', async () => {
    mockRunMutation.mockResolvedValueOnce({
      data: {
        runBenchmark: {
          endpointId: 'ep-1',
          endpointName: 'NAS',
          model: 'gemma2:2b',
          prompt: 'test',
          response: 'r',
          timing: { tokensPerSecond: 25 },
          error: null,
          timestamp: '2026-01-15T10:00:00Z',
        },
      },
    });

    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await result.current.runBenchmark(['ep-1'], 'gemma2:2b', 'test');
    });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'benchmark-changed' })
    );
  });

  it('runBenchmark sets currentEndpoint for each iteration', async () => {
    const endpointOrder: (string | null)[] = [];

    mockRunMutation.mockImplementation(async ({ variables }: any) => {
      // Capture currentEndpoint at call time (checked after act)
      return {
        data: {
          runBenchmark: {
            endpointId: variables.endpointId,
            endpointName: variables.endpointId,
            model: variables.model,
            prompt: variables.prompt,
            response: 'r',
            timing: { tokensPerSecond: 20 },
            error: null,
            timestamp: new Date().toISOString(),
          },
        },
      };
    });

    const { result } = renderHook(() => useBenchmark());

    await act(async () => {
      await result.current.runBenchmark(['ep-1', 'ep-2'], 'gemma2:2b', 'test');
    });

    // After completion, currentEndpoint should be null
    expect(result.current.currentEndpoint).toBeNull();
  });

  it('runBenchmark skips null data from mutation', async () => {
    mockRunMutation.mockResolvedValueOnce({ data: null });

    const { result } = renderHook(() => useBenchmark());

    let returnedResults: any;
    await act(async () => {
      returnedResults = await result.current.runBenchmark(['ep-1'], 'gemma2:2b', 'test');
    });

    // No results added when data is null
    expect(returnedResults).toHaveLength(0);
  });

  it('saveRun calls save mutation with results', async () => {
    const { result } = renderHook(() => useBenchmark());

    const mockResults = [
      {
        endpointId: 'ep-1',
        endpointName: 'NAS',
        model: 'gemma2:2b',
        prompt: 'test',
        response: 'r',
        timing: { tokensPerSecond: 25 } as any,
        error: null,
        timestamp: '2026-01-15T10:00:00Z',
      },
    ];

    await act(async () => {
      await result.current.saveRun(mockResults);
    });

    expect(mockSaveMutation).toHaveBeenCalledWith({
      variables: { results: mockResults },
    });
  });
});
