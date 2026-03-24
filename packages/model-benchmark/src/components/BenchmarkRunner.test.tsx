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
    t: (key: string, opts?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (opts?.endpoint) return `${key} ${opts.endpoint}`;
      if (opts?.current != null) return `${key} ${opts.current}/${opts.total}`;
      return key;
    },
  }),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  useLazyQuery: vi.fn(() => [mockFetchModels, { data: null }]),
  GET_BENCHMARK_ENDPOINT_MODELS: {},
  StorageKeys: {
    BENCHMARK_CACHE: 'benchmark-cache',
    BENCHMARK_MODEL_MAP: 'benchmark-model-map',
    BENCHMARK_JUDGE: 'benchmark-judge',
    BENCHMARK_SELECTED_PROMPTS: 'mycircle-benchmark-selected-prompts',
  },
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

const mockBenchmark = {
  running: false,
  scoring: false,
  currentEndpoint: null,
  currentPromptIndex: null,
  totalPrompts: 0,
  results: [],
  runBenchmark: vi.fn(async () => []),
  saveRun: vi.fn(),
  scoreResults: vi.fn(async (results: any) => results), // eslint-disable-line @typescript-eslint/no-explicit-any
};

function renderRunner(overrides = {}) {
  return render(
    <BenchmarkRunner
      onResults={vi.fn()}
      benchmark={{ ...mockBenchmark, ...overrides }}
      currentPromptIndex={(overrides as any).currentPromptIndex ?? null} // eslint-disable-line @typescript-eslint/no-explicit-any
      totalPrompts={(overrides as any).totalPrompts ?? 0} // eslint-disable-line @typescript-eslint/no-explicit-any
    />
  );
}

describe('BenchmarkRunner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders endpoint checkboxes', () => {
    renderRunner();
    expect(screen.getByText('NAS')).toBeInTheDocument();
    expect(screen.getByText('GPU')).toBeInTheDocument();
  });

  it('renders prompt selection checkboxes for all presets', () => {
    renderRunner();
    expect(screen.getByText('benchmark.promptSimple')).toBeInTheDocument();
    expect(screen.getByText('benchmark.promptCode')).toBeInTheDocument();
    expect(screen.getByText('benchmark.promptCreative')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('run button is disabled when no endpoints selected', () => {
    renderRunner();
    const runBtn = screen.getByText('benchmark.runner.run');
    expect(runBtn).toBeDisabled();
  });

  it('run button is disabled when no prompts are selected', async () => {
    const user = userEvent.setup({ delay: null });
    renderRunner();

    // Uncheck the default 'simple' prompt
    const simpleCheckbox = screen.getAllByRole('checkbox').find(
      (cb) => cb.closest('label')?.textContent?.includes('benchmark.promptSimple')
    );
    expect(simpleCheckbox).toBeDefined();
    await user.click(simpleCheckbox!);

    // Select an endpoint to ensure endpoint isn't the issue
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(screen.getByText('benchmark.runner.run')).toBeDisabled();
  });

  it('"All Prompts" button selects all 5 preset IDs', async () => {
    const user = userEvent.setup({ delay: null });
    renderRunner();

    const allPromptsBtn = screen.getByText('benchmark.runner.allPrompts');
    await user.click(allPromptsBtn);

    // After clicking "All Prompts", all preset checkboxes should be checked
    const presetLabels = ['benchmark.promptSimple', 'benchmark.promptReasoning', 'benchmark.promptCode', 'benchmark.promptSummary', 'benchmark.promptCreative'];
    for (const label of presetLabels) {
      const labelEl = screen.getByText(label).closest('label');
      const checkbox = labelEl?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox?.checked).toBe(true);
    }
  });

  it('custom textarea appears only when custom is checked', async () => {
    const user = userEvent.setup({ delay: null });
    renderRunner();

    expect(screen.queryByPlaceholderText('benchmark.runner.customPrompt')).not.toBeInTheDocument();

    const customLabel = screen.getByText('Custom').closest('label');
    const customCheckbox = customLabel?.querySelector('input[type="checkbox"]');
    if (!customCheckbox) throw new Error('Custom checkbox not found');
    await user.click(customCheckbox);

    expect(screen.getByPlaceholderText('benchmark.runner.customPrompt')).toBeInTheDocument();
  });

  it('batch progress indicator renders when running with multiple prompts', () => {
    renderRunner({ running: true, currentPromptIndex: 1, totalPrompts: 3, currentEndpoint: '1' });

    // Progress indicator should be visible
    expect(screen.getByText(/benchmark.runner.batchProgress/)).toBeInTheDocument();
  });

  it('batch progress indicator not shown when totalPrompts <= 1', () => {
    renderRunner({ running: true, currentPromptIndex: 0, totalPrompts: 1, currentEndpoint: '1' });

    expect(screen.queryByText(/batchProgress/)).not.toBeInTheDocument();
  });

  it('batch progress indicator not shown when not running', () => {
    renderRunner({ running: false, currentPromptIndex: null, totalPrompts: 3 });

    expect(screen.queryByText(/batchProgress/)).not.toBeInTheDocument();
  });

  it('shows per-endpoint model dropdown when endpoint is checked', async () => {
    const user = userEvent.setup({ delay: null });
    renderRunner();

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
    const user = userEvent.setup({ delay: null });
    renderRunner();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);

    const selects = screen.getAllByRole('combobox');
    // 2 model dropdowns + 1 judge dropdown = 3
    expect(selects).toHaveLength(3);
  });

  it('discovers models when endpoint is checked', async () => {
    const user = userEvent.setup({ delay: null });
    renderRunner();

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    expect(mockFetchModels).toHaveBeenCalledWith({ variables: { endpointId: '1' }, fetchPolicy: 'network-only' });
  });
});
