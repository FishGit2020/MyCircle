import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWidgetPinned } from './useWidgetPinned';

vi.mock('@mycircle/shared', () => ({
  WindowEvents: { WIDGET_LAYOUT_CHANGED: 'widget-layout-changed' },
}));

vi.mock('../components/widgets/widgetConfig', () => ({
  loadWidgetLayout: () => ({ pinned: [], size: 'comfortable' }),
  saveWidgetLayout: vi.fn(),
}));

describe('useWidgetPinned', () => {
  it('returns pinned false when no widgets are pinned', () => {
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(result.current.pinned).toBe(false);
  });

  it('returns a toggle function', () => {
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(typeof result.current.toggle).toBe('function');
  });

  it('returns pinned false when widgetId is undefined', () => {
    const { result } = renderHook(() => useWidgetPinned(undefined));
    expect(result.current.pinned).toBe(false);
  });
});
