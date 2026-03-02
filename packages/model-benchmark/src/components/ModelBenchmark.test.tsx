import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import userEvent from '@testing-library/user-event';
import ModelBenchmark from './ModelBenchmark';

// Mock @mycircle/shared (includes Apollo hooks)
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  useQuery: vi.fn(() => ({ data: null, loading: false, refetch: vi.fn() })),
  useMutation: vi.fn(() => [vi.fn(), { loading: false }]),
  StorageKeys: { BENCHMARK_CACHE: 'benchmark-cache' },
  WindowEvents: { BENCHMARK_CHANGED: 'benchmark-changed' },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

// Mock child components
vi.mock('./BenchmarkRunner', () => ({
  default: ({ onResults }: { onResults: (r: any[]) => void }) => (
    <div data-testid="benchmark-runner">
      <button onClick={() => onResults([])}>mock-run</button>
    </div>
  ),
}));
vi.mock('./EndpointManager', () => ({
  default: () => <div data-testid="endpoint-manager">EndpointManager</div>,
}));
vi.mock('./ResultsDashboard', () => ({
  default: () => <div data-testid="results-dashboard">ResultsDashboard</div>,
}));
vi.mock('./BenchmarkHistory', () => ({
  default: () => <div data-testid="benchmark-history">BenchmarkHistory</div>,
}));
vi.mock('../hooks/useBenchmark', () => ({
  useBenchmark: () => ({ saveRun: vi.fn() }),
  BENCHMARK_PROMPTS: [],
}));

describe('ModelBenchmark', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title and tabs', () => {
    render(<MemoryRouter><ModelBenchmark /></MemoryRouter>);
    expect(screen.getByText('benchmark.title')).toBeInTheDocument();
    expect(screen.getByText('benchmark.tabs.run')).toBeInTheDocument();
    expect(screen.getByText('benchmark.tabs.endpoints')).toBeInTheDocument();
    expect(screen.getByText('benchmark.tabs.results')).toBeInTheDocument();
    expect(screen.getByText('benchmark.tabs.history')).toBeInTheDocument();
  });

  it('shows the runner tab by default', () => {
    render(<MemoryRouter><ModelBenchmark /></MemoryRouter>);
    expect(screen.getByTestId('benchmark-runner')).toBeInTheDocument();
  });

  it('switches to endpoints tab when clicked', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ModelBenchmark /></MemoryRouter>);
    await user.click(screen.getByText('benchmark.tabs.endpoints'));
    expect(screen.getByTestId('endpoint-manager')).toBeInTheDocument();
  });

  it('switches to history tab when clicked', async () => {
    const user = userEvent.setup();
    render(<MemoryRouter><ModelBenchmark /></MemoryRouter>);
    await user.click(screen.getByText('benchmark.tabs.history'));
    expect(screen.getByTestId('benchmark-history')).toBeInTheDocument();
  });

  it('marks the active tab with aria-selected', () => {
    render(<MemoryRouter><ModelBenchmark /></MemoryRouter>);
    const runTab = screen.getByText('benchmark.tabs.run');
    expect(runTab).toHaveAttribute('aria-selected', 'true');
    const endpointTab = screen.getByText('benchmark.tabs.endpoints');
    expect(endpointTab).toHaveAttribute('aria-selected', 'false');
  });

  it('reads tab from URL search params', () => {
    render(<MemoryRouter initialEntries={['/benchmark?tab=history']}><ModelBenchmark /></MemoryRouter>);
    expect(screen.getByTestId('benchmark-history')).toBeInTheDocument();
    expect(screen.getByText('benchmark.tabs.history')).toHaveAttribute('aria-selected', 'true');
  });
});
