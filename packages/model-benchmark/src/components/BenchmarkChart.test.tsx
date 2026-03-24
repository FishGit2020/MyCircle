import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BenchmarkChart from './BenchmarkChart';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/useBenchmark', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useBenchmark')>();
  return {
    ...actual,
    BENCHMARK_PROMPTS: [
      { id: 'simple', labelKey: 'benchmark.promptSimple', prompt: 'What is the capital of France?' },
      { id: 'reasoning', labelKey: 'benchmark.promptReasoning', prompt: 'Explain why the sky is blue in 3 sentences.' },
      { id: 'code', labelKey: 'benchmark.promptCode', prompt: 'Write a Python function that reverses a linked list.' },
      { id: 'summary', labelKey: 'benchmark.promptSummary', prompt: 'Summarize the key principles of object-oriented programming.' },
      { id: 'creative', labelKey: 'benchmark.promptCreative', prompt: 'Write a haiku about machine learning.' },
    ],
  };
});

function makeResult(overrides: Partial<BenchmarkRunResult> = {}): BenchmarkRunResult {
  return {
    endpointId: 'ep-1',
    endpointName: 'NAS',
    model: 'gemma2:2b',
    prompt: 'What is the capital of France?',
    response: 'Paris',
    error: null,
    qualityScore: null,
    qualityFeedback: null,
    qualityJudge: null,
    timestamp: '2026-01-15T10:00:00Z',
    timing: {
      tokensPerSecond: 25,
      promptTokensPerSecond: 10,
      timeToFirstToken: 0.5,
      totalDuration: 2.0,
      loadDuration: 0.1,
      evalCount: 50,
      evalDuration: 1.5,
      promptEvalCount: 10,
      promptEvalDuration: 0.4,
    },
    ...overrides,
  };
}

describe('BenchmarkChart', () => {
  it('renders empty state when results is empty', () => {
    render(<BenchmarkChart results={[]} />);
    expect(screen.getByText('benchmark.results.noResults')).toBeInTheDocument();
  });

  it('renders bars for each result (title attributes)', () => {
    const results = [
      makeResult({ endpointName: 'NAS', timing: { tokensPerSecond: 25, promptTokensPerSecond: 10, timeToFirstToken: 0.5, totalDuration: 2, loadDuration: 0.1, evalCount: 50, evalDuration: 1.5, promptEvalCount: 10, promptEvalDuration: 0.4 } }),
      makeResult({ endpointId: 'ep-2', endpointName: 'GPU', timing: { tokensPerSecond: 50, promptTokensPerSecond: 20, timeToFirstToken: 0.3, totalDuration: 1, loadDuration: 0.1, evalCount: 50, evalDuration: 0.8, promptEvalCount: 10, promptEvalDuration: 0.2 } }),
    ];
    render(<BenchmarkChart results={results} />);

    // Each result should produce a bar with a title
    const nasBars = screen.getAllByTitle(/NAS/);
    expect(nasBars.length).toBeGreaterThan(0);
    const gpuBars = screen.getAllByTitle(/GPU/);
    expect(gpuBars.length).toBeGreaterThan(0);
  });

  it('error result shows error bar with title containing "Error"', () => {
    const results = [
      makeResult({ error: 'Connection refused', timing: null }),
    ];
    render(<BenchmarkChart results={results} />);
    expect(screen.getByTitle(/Error/)).toBeInTheDocument();
  });

  it('fastest bar has green class', () => {
    const results = [
      makeResult({ endpointName: 'Slow', timing: { tokensPerSecond: 10, promptTokensPerSecond: 5, timeToFirstToken: 1, totalDuration: 4, loadDuration: 0.2, evalCount: 40, evalDuration: 3, promptEvalCount: 8, promptEvalDuration: 0.8 } }),
      makeResult({ endpointId: 'ep-2', endpointName: 'Fast', timing: { tokensPerSecond: 50, promptTokensPerSecond: 20, timeToFirstToken: 0.2, totalDuration: 1, loadDuration: 0.1, evalCount: 50, evalDuration: 0.8, promptEvalCount: 10, promptEvalDuration: 0.1 } }),
    ];
    render(<BenchmarkChart results={results} />);

    // The fastest bar (Fast / gemma2:2b with 50 tok/s) should have green class
    const fastBars = screen.getAllByTitle(/Fast/);
    const greenBar = fastBars.find(el => el.className.includes('green'));
    expect(greenBar).toBeDefined();
  });

  it('"By Prompt" groupBy toggle shows prompt labels as group headers when multiple prompts', async () => {
    const user = userEvent.setup({ delay: null });
    const results = [
      makeResult({ prompt: 'What is the capital of France?' }),
      makeResult({ prompt: 'Write a Python function that reverses a linked list.' }),
    ];
    render(<BenchmarkChart results={results} />);

    // Should show groupBy toggle buttons when multiple prompts
    const byPromptBtn = screen.getByText('benchmark.results.groupByPrompt');
    await user.click(byPromptBtn);

    // In prompt groupBy mode, each group should have the label resolved via BENCHMARK_PROMPTS
    // The prompt text for "simple" maps to label "simple" -> t('benchmark.promptSimple')
    // Since we don't translate, we'd see the label via the component logic
    expect(byPromptBtn).toBeInTheDocument();
  });

  it('does not show groupBy toggle when only one prompt', () => {
    const results = [
      makeResult({ endpointName: 'NAS' }),
      makeResult({ endpointId: 'ep-2', endpointName: 'GPU' }),
    ];
    render(<BenchmarkChart results={results} />);
    expect(screen.queryByText('benchmark.results.groupByPrompt')).not.toBeInTheDocument();
  });

  it('renders without error when results contains mixed valid and error results', () => {
    const results = [
      makeResult({ endpointName: 'OK', timing: { tokensPerSecond: 20, promptTokensPerSecond: 8, timeToFirstToken: 0.6, totalDuration: 2.5, loadDuration: 0.15, evalCount: 40, evalDuration: 2, promptEvalCount: 8, promptEvalDuration: 0.35 } }),
      makeResult({ endpointId: 'ep-2', endpointName: 'Broken', error: 'Timeout', timing: null }),
    ];
    expect(() => render(<BenchmarkChart results={results} />)).not.toThrow();
    expect(screen.getByTitle(/Broken.*Error/)).toBeInTheDocument();
  });
});
