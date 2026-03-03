import { useState, useCallback } from 'react';
import {
  useMutation,
  RUN_BENCHMARK,
  SAVE_BENCHMARK_RUN,
  SCORE_BENCHMARK_RESPONSE,
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

export interface JudgeConfig {
  provider: 'gemini' | 'ollama';
  endpointId?: string;
  model?: string;
  label: string;
}

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
  const [scoring, setScoring] = useState(false);
  const [currentEndpoint, setCurrentEndpoint] = useState<string | null>(null);

  const [runMutation] = useMutation(RUN_BENCHMARK);
  const [saveMutation] = useMutation(SAVE_BENCHMARK_RUN, {
    refetchQueries: [{ query: GET_BENCHMARK_HISTORY }],
  });
  const [scoreMutation] = useMutation(SCORE_BENCHMARK_RESPONSE);

  const runBenchmark = useCallback(async (
    endpointModels: Array<{ endpointId: string; model: string }>,
    prompt: string,
  ) => {
    setRunning(true);
    setResults([]);
    const newResults: BenchmarkRunResult[] = [];

    for (const { endpointId, model } of endpointModels) {
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
          endpointCount: endpointModels.length,
        }));
        window.dispatchEvent(new Event(WindowEvents.BENCHMARK_CHANGED));
      } catch { /* ignore */ }
    }

    return newResults;
  }, [runMutation]);

  const saveRun = useCallback(async (runResults: BenchmarkRunResult[]) => {
    await saveMutation({ variables: { results: runResults } });
  }, [saveMutation]);

  const scoreResults = useCallback(async (
    runResults: BenchmarkRunResult[],
    judge: JudgeConfig,
  ): Promise<BenchmarkRunResult[]> => {
    setScoring(true);
    const scored: BenchmarkRunResult[] = [];

    for (const r of runResults) {
      if (r.error || !r.response) {
        scored.push(r);
        continue;
      }
      try {
        const { data } = await scoreMutation({
          variables: {
            prompt: r.prompt,
            response: r.response,
            judgeProvider: judge.provider,
            judgeEndpointId: judge.endpointId || null,
            judgeModel: judge.model || null,
          },
        });
        const q = data?.scoreBenchmarkResponse;
        scored.push({
          ...r,
          qualityScore: q?.score ?? null,
          qualityFeedback: q?.feedback ?? null,
          qualityJudge: q?.judge ?? null,
        });
      } catch {
        scored.push({
          ...r,
          qualityScore: null,
          qualityFeedback: 'Scoring failed',
          qualityJudge: judge.label,
        });
      }
    }

    setScoring(false);
    setResults(scored);
    return scored;
  }, [scoreMutation]);

  return { results, running, scoring, currentEndpoint, runBenchmark, saveRun, scoreResults };
}
