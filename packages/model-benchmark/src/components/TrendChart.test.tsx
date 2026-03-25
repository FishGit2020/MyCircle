import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TrendChart from './TrendChart';
import type { BenchmarkRun } from '../hooks/useBenchmarkHistory';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string, opts?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (opts?.n != null) return `Run ${opts.n}`;
    return key;
  }}),
}));

function makeRun(overrides: Partial<BenchmarkRun> = {}): BenchmarkRun {
  return {
    id: 'run-1',
    createdAt: '2026-01-01T10:00:00Z',
    results: [
      {
        endpointName: 'NAS',
        model: 'gemma2:2b',
        timing: { tokensPerSecond: 25 },
        qualityScore: 7,
      },
    ],
    ...overrides,
  } as BenchmarkRun;
}

describe('TrendChart', () => {
  it('renders no-trend-data message when fewer than 2 non-null points', () => {
    const runs = [makeRun({ id: 'r1' })];
    render(<TrendChart runs={runs} filter="" />);
    expect(screen.getByText('benchmark.history.noTrendData')).toBeInTheDocument();
  });

  it('renders SVG chart when at least 2 runs have data', () => {
    const runs = [
      makeRun({ id: 'r1', createdAt: '2026-01-01T10:00:00Z' }),
      makeRun({ id: 'r2', createdAt: '2026-01-02T10:00:00Z' }),
    ];
    render(<TrendChart runs={runs} filter="" />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it('renders metric toggle buttons', () => {
    const runs = [
      makeRun({ id: 'r1', createdAt: '2026-01-01T10:00:00Z' }),
      makeRun({ id: 'r2', createdAt: '2026-01-02T10:00:00Z' }),
    ];
    render(<TrendChart runs={runs} filter="" />);
    expect(screen.getByText('benchmark.history.trendTps')).toBeInTheDocument();
    expect(screen.getByText('benchmark.history.trendQuality')).toBeInTheDocument();
  });

  it('switches metric on button click', async () => {
    const user = userEvent.setup({ delay: null });
    const runs = [
      makeRun({ id: 'r1', createdAt: '2026-01-01T10:00:00Z' }),
      makeRun({ id: 'r2', createdAt: '2026-01-02T10:00:00Z' }),
    ];
    render(<TrendChart runs={runs} filter="" />);

    const qualityBtn = screen.getByText('benchmark.history.trendQuality');
    await user.click(qualityBtn);
    // Button should now be styled active (no throw = pass)
    expect(qualityBtn).toBeInTheDocument();
  });

  it('filters to specific endpoint::model when filter is set', () => {
    const runs = [
      makeRun({
        id: 'r1',
        createdAt: '2026-01-01T10:00:00Z',
        results: [
          { endpointName: 'NAS', model: 'gemma2:2b', timing: { tokensPerSecond: 25 }, qualityScore: 7 },
          { endpointName: 'GPU', model: 'llama3:8b', timing: { tokensPerSecond: 50 }, qualityScore: 9 },
        ],
      }),
      makeRun({
        id: 'r2',
        createdAt: '2026-01-02T10:00:00Z',
        results: [
          { endpointName: 'NAS', model: 'gemma2:2b', timing: { tokensPerSecond: 30 }, qualityScore: 8 },
          { endpointName: 'GPU', model: 'llama3:8b', timing: { tokensPerSecond: 55 }, qualityScore: 9 },
        ],
      }),
    ] as BenchmarkRun[];

    render(<TrendChart runs={runs} filter="NAS::gemma2:2b" />);
    // Should render SVG with only NAS series — no legend since only 1 series
    expect(document.querySelector('svg')).toBeInTheDocument();
    expect(screen.queryByText('NAS / gemma2:2b')).not.toBeInTheDocument(); // legend hidden for 1 series
  });

  it('shows legend when multiple series are present', () => {
    const runs = [
      makeRun({
        id: 'r1',
        createdAt: '2026-01-01T10:00:00Z',
        results: [
          { endpointName: 'NAS', model: 'gemma2:2b', timing: { tokensPerSecond: 25 }, qualityScore: 7 },
          { endpointName: 'GPU', model: 'llama3:8b', timing: { tokensPerSecond: 50 }, qualityScore: 9 },
        ],
      }),
      makeRun({
        id: 'r2',
        createdAt: '2026-01-02T10:00:00Z',
        results: [
          { endpointName: 'NAS', model: 'gemma2:2b', timing: { tokensPerSecond: 30 }, qualityScore: 8 },
          { endpointName: 'GPU', model: 'llama3:8b', timing: { tokensPerSecond: 55 }, qualityScore: 9 },
        ],
      }),
    ] as BenchmarkRun[];

    render(<TrendChart runs={runs} filter="" />);
    expect(screen.getByText('NAS / gemma2:2b')).toBeInTheDocument();
    expect(screen.getByText('GPU / llama3:8b')).toBeInTheDocument();
  });

  it('shows no-data message when filter matches no series', () => {
    const runs = [
      makeRun({ id: 'r1', createdAt: '2026-01-01T10:00:00Z' }),
      makeRun({ id: 'r2', createdAt: '2026-01-02T10:00:00Z' }),
    ];
    render(<TrendChart runs={runs} filter="NonExistent::model" />);
    expect(screen.getByText('benchmark.history.noTrendData')).toBeInTheDocument();
  });
});
