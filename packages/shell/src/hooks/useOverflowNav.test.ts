import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOverflowNav } from './useOverflowNav';

// --- ResizeObserver mock ---
const observeMock = vi.fn();
const disconnectMock = vi.fn();

class MockResizeObserver implements ResizeObserver {
  constructor(_cb: ResizeObserverCallback) {}
  observe = observeMock;
  unobserve = vi.fn();
  disconnect = disconnectMock;
}

beforeEach(() => {
  global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  vi.clearAllMocks();
});

function makeContainer(containerWidth: number, childWidths: number[]) {
  const children = childWidths.map((w) => ({ offsetWidth: w }) as HTMLElement);
  return {
    clientWidth: containerWidth,
    children,
  } as unknown as HTMLElement;
}

describe('useOverflowNav', () => {
  it('returns full count when all items fit', () => {
    const el = makeContainer(500, [80, 80, 80, 80, 80]);
    const ref = { current: el };

    const { result } = renderHook(() => useOverflowNav(ref, 5, 44));

    expect(result.current).toBe(5);
  });

  it('returns reduced count when container is too narrow', () => {
    // item0 (100) + overflow(44) = 144 <= 250 → fits=1
    // item0+item1 (200) + overflow(44) = 244 <= 250 → fits=2
    // item0+item1+item2 (300) + 0 = 300 > 250 → stop
    const el = makeContainer(250, [100, 100, 100]);
    const ref = { current: el };

    const { result } = renderHook(() => useOverflowNav(ref, 3, 44));

    expect(result.current).toBe(2);
  });

  it('returns 0 when container is too small for even one item', () => {
    const el = makeContainer(30, [100, 100]);
    const ref = { current: el };

    const { result } = renderHook(() => useOverflowNav(ref, 2, 44));

    expect(result.current).toBe(0);
  });

  it('returns all items when container width is 0 (jsdom fallback)', () => {
    const el = makeContainer(0, [0, 0, 0]);
    const ref = { current: el };

    const { result } = renderHook(() => useOverflowNav(ref, 3, 44));

    expect(result.current).toBe(3);
  });

  it('disconnects observer on unmount', () => {
    const el = makeContainer(500, [80, 80]);
    const ref = { current: el };

    const { unmount } = renderHook(() => useOverflowNav(ref, 2, 44));
    unmount();

    expect(disconnectMock).toHaveBeenCalled();
  });
});
