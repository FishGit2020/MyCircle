import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React, { Suspense } from 'react';
import { tracedLazy } from './tracedLazy';

// Mock firebase/performance — must come before any import that pulls it in
const mockStop = vi.fn();
const mockStart = vi.fn();
vi.mock('firebase/performance', () => ({
  trace: vi.fn(() => ({ start: mockStart, stop: mockStop })),
}));

const DummyComponent = () => React.createElement('div', null, 'loaded');

describe('tracedLazy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('traces a successful import', async () => {
    const { trace: traceFn } = await import('firebase/performance');
    const perf = {} as any;
    const importFn = vi.fn().mockResolvedValue({ default: DummyComponent });

    const Lazy = tracedLazy('mfe_test_load', importFn, () => perf);

    render(
      React.createElement(Suspense, { fallback: React.createElement('div', null, 'loading') },
        React.createElement(Lazy)),
    );

    // Wait for the lazy component to resolve
    await screen.findByText('loaded');

    expect(traceFn).toHaveBeenCalledWith(perf, 'mfe_test_load');
    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStop).toHaveBeenCalledOnce();
    expect(importFn).toHaveBeenCalledOnce();
  });

  it('skips tracing when perf is null', async () => {
    const { trace: traceFn } = await import('firebase/performance');
    const importFn = vi.fn().mockResolvedValue({ default: DummyComponent });

    const Lazy = tracedLazy('mfe_test_load', importFn, () => null);

    render(
      React.createElement(Suspense, { fallback: React.createElement('div', null, 'loading') },
        React.createElement(Lazy)),
    );

    await screen.findByText('loaded');

    expect(traceFn).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockStop).not.toHaveBeenCalled();
    expect(importFn).toHaveBeenCalledOnce();
  });

  it('stops the trace even when the import fails', async () => {
    const { trace: traceFn } = await import('firebase/performance');
    const perf = {} as any;
    const importFn = vi.fn().mockRejectedValue(new Error('chunk failed'));

    const Lazy = tracedLazy('mfe_fail_load', importFn, () => perf);

    // Suppress React error boundary console noise
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // React.lazy will reject — we catch the error via an error boundary
    class Catcher extends React.Component<{ children: React.ReactNode }, { err: boolean }> {
      state = { err: false };
      static getDerivedStateFromError() { return { err: true }; }
      render() { return this.state.err ? React.createElement('div', null, 'error caught') : this.props.children; }
    }

    render(
      React.createElement(Catcher, null,
        React.createElement(Suspense, { fallback: React.createElement('div', null, 'loading') },
          React.createElement(Lazy))),
    );

    await screen.findByText('error caught');

    expect(traceFn).toHaveBeenCalledWith(perf, 'mfe_fail_load');
    expect(mockStart).toHaveBeenCalledOnce();
    expect(mockStop).toHaveBeenCalledOnce();

    spy.mockRestore();
  });
});
