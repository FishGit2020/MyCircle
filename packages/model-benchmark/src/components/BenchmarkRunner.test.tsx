import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BenchmarkRunner from './BenchmarkRunner';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  StorageKeys: { BENCHMARK_CACHE: 'benchmark-cache' },
  WindowEvents: { BENCHMARK_CHANGED: 'benchmark-changed' },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// Mock Apollo
vi.mock('@apollo/client', () => ({
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  gql: (str: TemplateStringsArray) => str,
}));

vi.mock('../hooks/useEndpoints', () => ({
  useEndpoints: () => ({
    endpoints: [
      { id: '1', name: 'NAS', url: 'http://nas:11434', hasCfAccess: false },
      { id: '2', name: 'GPU', url: 'http://gpu:11434', hasCfAccess: false },
    ],
    loading: false,
    saving: false,
    refetch: vi.fn(),
    saveEndpoint: vi.fn(),
    deleteEndpoint: vi.fn(),
  }),
}));

vi.mock('../hooks/useBenchmark', () => ({
  useBenchmark: () => ({
    running: false,
    currentEndpoint: null,
    runBenchmark: vi.fn(async () => []),
    saveRun: vi.fn(),
  }),
  BENCHMARK_PROMPTS: [
    { id: 'simple', labelKey: 'benchmark.promptSimple', prompt: 'Test' },
    { id: 'code', labelKey: 'benchmark.promptCode', prompt: 'Code test' },
  ],
}));

describe('BenchmarkRunner', () => {
  const onResults = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders endpoint checkboxes', () => {
    render(<BenchmarkRunner onResults={onResults} />);
    expect(screen.getByText('NAS')).toBeInTheDocument();
    expect(screen.getByText('GPU')).toBeInTheDocument();
  });

  it('renders prompt selection buttons', () => {
    render(<BenchmarkRunner onResults={onResults} />);
    expect(screen.getByText('benchmark.promptSimple')).toBeInTheDocument();
    expect(screen.getByText('benchmark.promptCode')).toBeInTheDocument();
  });

  it('run button is disabled when no endpoints selected', () => {
    render(<BenchmarkRunner onResults={onResults} />);
    const runBtn = screen.getByText('benchmark.runner.run');
    expect(runBtn).toBeDisabled();
  });

  it('run button enables when endpoint is selected', async () => {
    const user = userEvent.setup();
    render(<BenchmarkRunner onResults={onResults} />);
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    const runBtn = screen.getByText('benchmark.runner.run');
    expect(runBtn).not.toBeDisabled();
  });

  it('shows model input with default value', () => {
    render(<BenchmarkRunner onResults={onResults} />);
    const modelInput = screen.getByPlaceholderText('gemma2:2b');
    expect(modelInput).toHaveValue('gemma2:2b');
  });
});
