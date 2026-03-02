import { useState, useCallback } from 'react';
import {
  useMutation,
  RUN_BENCHMARK,
  SAVE_BENCHMARK_RUN,
  GET_BENCHMARK_HISTORY,
  StorageKeys,
  WindowEvents,
} from '@mycircle/shared';
import type {
  BenchmarkTimingResult,
  BenchmarkRunResult,
} from '@mycircle/shared';

// Re-export generated types for downstream consumers
export type { BenchmarkTimingResult, BenchmarkRunResult };

export const BENCHMARK_PROMPTS = [
  { id: 'simple', labelKey: 'benchmark.promptSimple' as const, prompt: 'What is the capital of France?' },
  { id: 'reasoning', labelKey: 'benchmark.promptReasoning' as const, prompt: 'Explain why the sky is blue in 3 sentences.' },
  { id: 'code', labelKey: 'benchmark.promptCode' as const, prompt: 'Write a Python function that reverses a linked list.' },
  { id: 'summary', labelKey: 'benchmark.promptSummary' as const, prompt: 'Summarize the key principles of object-oriented programming.' },
  { id: 'creative', labelKey: 'benchmark.promptCreative' as const, prompt: 'Write a haiku about machine learning.' },
];

export function useBenchmark() {
  const [results, setResults] = useState<BenchmarkRunResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const [runMutation] = useMutation(RUN_BENCHMARK);
  const [saveMutation] = useMutation(SAVE_BENCHMARK_RUN, {
    refetchQueries: [{ query: GET_BENCHMARK_HISTORY }],
  });

  const runBenchmark = useCallback(async (
    endpointIds: string[],
    model: string,
    prompt: string,
  ) => {
    setRunning(true);
    setResults([]);
    const newResults: BenchmarkRunResult[] = [];

    for (const endpointId of endpointIds) {
      setCurrentEndpoint(endpointId);
      try {
        const { data } = await runMutation({
          variables: { endpointId, model, prompt },
        });
        if (data?.runBenchmark) {
          newResults.push(data.runBenchmark);
          setResults([...newResults]);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        newResults.push({
          endpointId,
          endpointName: endpointId,
          model,
          prompt,
          response: '',
          timing: null,
          error: message,
          timestamp: new Date().toISOString(),
        });
        setResults([...newResults]);
      }
    }

    setRunning(false);
    setCurrentEndpoint(null);

    // Update localStorage cache for widget
    if (newResults.length > 0) {
      const fastest = newResults
        .filter(r => r.timing)
        .sort((a, b) => (b.timing?.tokensPerSecond ?? 0) - (a.timing?.tokensPerSecond ?? 0))[0];
      try {
        localStorage.setItem(StorageKeys.BENCHMARK_CACHE, JSON.stringify({
          lastRunAt: new Date().toISOString(),
          fastestEndpoint: fastest?.endpointName ?? null,
          fastestTps: fastest?.timing?.tokensPerSecond ?? null,
          endpointCount: endpointIds.length,
        }));
        window.dispatchEvent(new Event(WindowEvents.BENCHMARK_CHANGED));
      } catch { /* ignore */ }
    }

    return newResults;
  }, [runMutation]);

  const saveRun = useCallback(async (runResults: BenchmarkRunResult[]) => {
    await saveMutation({ variables: { results: runResults } });
  }, [saveMutation]);

  return { results, running, currentEndpoint, runBenchmark, saveRun };
}
