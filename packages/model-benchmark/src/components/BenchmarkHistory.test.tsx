import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import BenchmarkHistory from './BenchmarkHistory';

// Mock @mycircle/shared
vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const mockUseBenchmarkHistory = vi.fn();
vi.mock('../hooks/useBenchmarkHistory', () => ({
  useBenchmarkHistory: (...args: any[]) => mockUseBenchmarkHistory(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

describe('BenchmarkHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state', () => {
    mockUseBenchmarkHistory.mockReturnValue({ runs: [], loading: true, deleteRun: vi.fn(), clearAll: vi.fn() });
    render(<BenchmarkHistory />);
    expect(screen.getByText('app.loading')).toBeInTheDocument();
  });

  it('shows empty state when no runs', () => {
    mockUseBenchmarkHistory.mockReturnValue({ runs: [], loading: false, deleteRun: vi.fn(), clearAll: vi.fn() });
    render(<BenchmarkHistory />);
    expect(screen.getByText('benchmark.history.none')).toBeInTheDocument();
  });

  it('renders run history with results', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-1',
          createdAt: '2026-01-15T10:30:00Z',
          results: [
            {
              endpointName: 'NAS Server',
              endpointId: 'ep-1',
              timing: { tokensPerSecond: 25.3 },
              error: null,
            },
            {
              endpointName: 'GPU Server',
              endpointId: 'ep-2',
              timing: { tokensPerSecond: 45.7 },
              error: null,
            },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('benchmark.history.title')).toBeInTheDocument();
    expect(screen.getByText('NAS Server')).toBeInTheDocument();
    expect(screen.getByText('GPU Server')).toBeInTheDocument();
    expect(screen.getByText('25.3 tok/s')).toBeInTheDocument();
    expect(screen.getByText('45.7 tok/s')).toBeInTheDocument();
  });

  it('shows error indicator for failed results', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-2',
          createdAt: '2026-01-15T12:00:00Z',
          results: [
            {
              endpointName: 'Failing Endpoint',
              endpointId: 'ep-3',
              timing: null,
              error: 'Connection refused',
            },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('Failing Endpoint')).toBeInTheDocument();
    expect(screen.getByText('benchmark.results.error')).toBeInTheDocument();
  });

  it('shows dash for results without timing or error', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-3',
          createdAt: '2026-01-15T14:00:00Z',
          results: [
            {
              endpointName: 'Pending',
              endpointId: 'ep-4',
              timing: null,
              error: null,
            },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
    // The dash character for no timing/no error
    const dash = screen.getByText('\u2014');
    expect(dash).toBeInTheDocument();
  });

  it('falls back to endpointId when endpointName is missing', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-4',
          createdAt: '2026-01-15T15:00:00Z',
          results: [
            {
              endpointId: 'fallback-id',
              timing: { tokensPerSecond: 10.0 },
              error: null,
            },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('fallback-id')).toBeInTheDocument();
  });

  it('highlights the fastest endpoint result', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-5',
          createdAt: '2026-01-15T16:00:00Z',
          results: [
            {
              endpointName: 'Slow',
              endpointId: 'ep-slow',
              timing: { tokensPerSecond: 10.0 },
              error: null,
            },
            {
              endpointName: 'Fast',
              endpointId: 'ep-fast',
              timing: { tokensPerSecond: 50.0 },
              error: null,
            },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    const fastElement = screen.getByText('50.0 tok/s');
    // The fastest should have green and semibold styling
    expect(fastElement.className).toContain('text-green-600');
    expect(fastElement.className).toContain('font-semibold');
  });

  it('shows endpoint count badge for each run', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-6',
          createdAt: '2026-01-15T17:00:00Z',
          results: [
            { endpointName: 'A', endpointId: 'a', timing: { tokensPerSecond: 20 }, error: null },
            { endpointName: 'B', endpointId: 'b', timing: { tokensPerSecond: 30 }, error: null },
          ],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('benchmark.history.endpoints')).toBeInTheDocument();
  });

  it('passes limit of 20 to useBenchmarkHistory hook', () => {
    mockUseBenchmarkHistory.mockReturnValue({ runs: [], loading: false, deleteRun: vi.fn(), clearAll: vi.fn() });
    render(<BenchmarkHistory />);
    expect(mockUseBenchmarkHistory).toHaveBeenCalledWith(20);
  });

  it('handles run with empty results array', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-empty',
          createdAt: '2026-01-15T18:00:00Z',
          results: [],
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    expect(screen.getByText('benchmark.history.title')).toBeInTheDocument();
    expect(screen.getByText('benchmark.history.endpoints')).toBeInTheDocument();
  });

  it('handles run with non-array results gracefully', () => {
    mockUseBenchmarkHistory.mockReturnValue({
      runs: [
        {
          id: 'run-bad',
          createdAt: '2026-01-15T19:00:00Z',
          results: null,
        },
      ],
      loading: false,
      deleteRun: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<BenchmarkHistory />);
    // Should not crash — results fallback to empty array
    expect(screen.getByText('benchmark.history.title')).toBeInTheDocument();
  });
});
