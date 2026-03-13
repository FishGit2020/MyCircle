import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import BenchmarkWidget from './BenchmarkWidget';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BENCHMARK_CACHE: 'benchmark_cache' },
  WindowEvents: { BENCHMARK_CHANGED: 'benchmark-changed' },
}));

describe('BenchmarkWidget', () => {
  it('renders without crashing', () => {
    render(<BenchmarkWidget />);
    expect(screen.getByText('widgets.benchmark')).toBeInTheDocument();
  });

  it('shows description text', () => {
    render(<BenchmarkWidget />);
    expect(screen.getByText('widgets.benchmarkDesc')).toBeInTheDocument();
  });

  it('shows no benchmark message when no data', () => {
    render(<BenchmarkWidget />);
    expect(screen.getByText('widgets.noBenchmark')).toBeInTheDocument();
  });

  it('has proper heading structure', () => {
    const { container } = render(<BenchmarkWidget />);
    const heading = container.querySelector('h4');
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent('widgets.benchmark');
  });
});
