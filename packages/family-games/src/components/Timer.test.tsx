import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Timer from './Timer';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Timer', () => {
  it('renders the remaining time in seconds', () => {
    render(<Timer durationMs={15000} onTimeUp={vi.fn()} running={false} />);
    expect(screen.getByText('15s')).toBeInTheDocument();
  });

  it('shows a progress bar', () => {
    const { container } = render(<Timer durationMs={10000} onTimeUp={vi.fn()} running={false} />);
    // The progress bar div should exist with a width style
    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('renders without crash when running', () => {
    const onTimeUp = vi.fn();
    render(<Timer durationMs={5000} onTimeUp={onTimeUp} running={true} />);
    expect(screen.getByText('5s')).toBeInTheDocument();
  });

  it('applies red color when time is low (5s or less)', () => {
    render(<Timer durationMs={3000} onTimeUp={vi.fn()} running={false} />);
    // 3 seconds left should show red text
    const timeDisplay = screen.getByText('3s');
    expect(timeDisplay.className).toContain('text-red-500');
  });

  it('applies default color when time is above 5s', () => {
    render(<Timer durationMs={10000} onTimeUp={vi.fn()} running={false} />);
    const timeDisplay = screen.getByText('10s');
    expect(timeDisplay.className).not.toContain('text-red-500');
  });
});
