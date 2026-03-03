import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BenchmarkRunner from './BenchmarkRunner';

const mockFetchModels = vi.fn().mockResolvedValue({
  data: { benchmarkEndpointModels: ['gemma2:2b', 'llama3:8b'] },
});

// Mock @mycircle/shared (includes Apollo hooks)
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any) => opts?.endpoint ? `${key} ${opts.endpoint}` : key,
  }),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useLazyQuery: vi.fn(() => [mockFetchModels, { data: null }]),
  GET_BENCHMARK_ENDPOINT_MODELS: {},
  StorageKeys: { BENCHMARK_CACHE: 'benchmark-cache', BENCHMARK_MODEL_MAP: 'benchmark-model-map', BENCHMARK_JUDGE: 'benchmark-judge' },
  WindowEvents: { BENCHMARK_CHANGED: 'benchmark-changed' },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
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
    scoring: false,
    currentEndpoint: null,
    runBenchmark: vi.fn(async () => []),
    saveRun: vi.fn(),
    scoreResults: vi.fn(async (results: any) => results),
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
    localStorage.clear();
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

  it('shows per-endpoint model dropdown when endpoint is checked', async () => {
    const user = userEvent.setup();
    render(<BenchmarkRunner onResults={onResults} />);

    // Only judge dropdown before selecting endpoints
    expect(screen.queryAllByRole('combobox')).toHaveLength(1);

    // Check first endpoint
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    // Model dropdown should appear for the selected endpoint (+ judge dropdown = 2)
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
  });

  it('shows model dropdowns for each selected endpoint', async () => {
    const user = userEvent.setup();
    render(<BenchmarkRunner onResults={onResults} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    const selects = screen.getAllByRole('combobox');
    // 2 model dropdowns + 1 judge dropdown = 3
    expect(selects).toHaveLength(3);
  });

  it('discovers models when endpoint is checked', async () => {
    const user = userEvent.setup();
    render(<BenchmarkRunner onResults={onResults} />);

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(mockFetchModels).toHaveBeenCalledWith({ variables: { endpointId: '1' }, fetchPolicy: 'network-only' });
  });
});
