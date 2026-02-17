import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PullToRefresh } from './PullToRefresh';

// Mock useTranslation
vi.mock('../i18n/I18nContext', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'pullToRefresh.hint': 'Pull to refresh',
        'pullToRefresh.release': 'Release to refresh',
        'pullToRefresh.refreshing': 'Refreshing...',
      };
      return map[key] ?? key;
    },
  }),
}));

function simulatePull(container: HTMLElement, distance: number) {
  fireEvent.touchStart(container, {
    touches: [{ clientY: 0 }],
  });
  fireEvent.touchMove(container, {
    touches: [{ clientY: distance }],
  });
}

describe('PullToRefresh', () => {
  beforeEach(() => {
    // Ensure scrollY is 0 (at top of page)
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true });
  });

  it('renders children', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <p>Hello world</p>
      </PullToRefresh>
    );
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('does not show indicator initially', () => {
    render(
      <PullToRefresh onRefresh={vi.fn()}>
        <p>Content</p>
      </PullToRefresh>
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows hint indicator when pulling down', () => {
    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    simulatePull(wrapper, 40);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Pull to refresh');
    expect(screen.getByText('Pull to refresh')).toBeInTheDocument();
  });

  it('shows release indicator when pull exceeds threshold', () => {
    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    // Pull 140 px → deltaY * 0.5 = 70px > 60px threshold
    simulatePull(wrapper, 140);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Release to refresh');
    expect(screen.getByText('Release to refresh')).toBeInTheDocument();
  });

  it('calls onRefresh after pull gesture past threshold', async () => {
    let resolveRefresh!: () => void;
    const onRefresh = vi.fn(() => new Promise<void>(r => { resolveRefresh = r; }));

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;

    // Pull past threshold
    simulatePull(wrapper, 140);

    // Release
    await act(async () => {
      fireEvent.touchEnd(wrapper);
    });

    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Refreshing...');

    // Resolve the promise
    await act(async () => {
      resolveRefresh();
    });

    // Indicator should be gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('does not trigger when pull is below threshold', async () => {
    const onRefresh = vi.fn();

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;

    // Pull below threshold (40 * 0.5 = 20px < 60px threshold)
    simulatePull(wrapper, 40);

    await act(async () => {
      fireEvent.touchEnd(wrapper);
    });

    expect(onRefresh).not.toHaveBeenCalled();
  });

  it('does not trigger when scrollY > 0', async () => {
    const onRefresh = vi.fn();

    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });

    const { container } = render(
      <PullToRefresh onRefresh={onRefresh}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;

    simulatePull(wrapper, 140);

    await act(async () => {
      fireEvent.touchEnd(wrapper);
    });

    expect(onRefresh).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('indicator has role="status" with aria-label', () => {
    const { container } = render(
      <PullToRefresh onRefresh={vi.fn()}>
        <p>Content</p>
      </PullToRefresh>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    simulatePull(wrapper, 40);

    const indicator = screen.getByRole('status');
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute('aria-label');
  });
});
