import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWidgetPinned } from './useWidgetPinned';

vi.mock('@mycircle/shared', () => ({
  WindowEvents: { WIDGET_LAYOUT_CHANGED: 'widget-layout-changed' },
  StorageKeys: { WIDGET_LAYOUT: 'widget-dashboard-layout' },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');
const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

beforeEach(() => {
  getItemSpy.mockReturnValue(null);
  setItemSpy.mockClear();
});

describe('useWidgetPinned', () => {
  it('returns pinned=false when widgetId is undefined', () => {
    const { result } = renderHook(() => useWidgetPinned(undefined));
    expect(result.current.pinned).toBe(false);
  });

  it('returns pinned=false when widget is not in layout', () => {
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(result.current.pinned).toBe(false);
  });

  it('returns pinned=true when widget is in layout', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout')
        return JSON.stringify({ pinned: ['weather', 'stocks'], size: 'comfortable' });
      return null;
    });
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(result.current.pinned).toBe(true);
  });

  it('toggle pins a widget', () => {
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(result.current.pinned).toBe(false);

    act(() => {
      const event = new MouseEvent('click', { bubbles: true });
      result.current.toggle(event as unknown as React.MouseEvent);
    });

    expect(result.current.pinned).toBe(true);
    expect(setItemSpy).toHaveBeenCalledWith(
      'widget-dashboard-layout',
      expect.stringContaining('weather')
    );
  });

  it('toggle unpins a widget', () => {
    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout')
        return JSON.stringify({ pinned: ['weather'], size: 'comfortable' });
      return null;
    });
    const { result } = renderHook(() => useWidgetPinned('weather'));
    expect(result.current.pinned).toBe(true);

    act(() => {
      const event = new MouseEvent('click', { bubbles: true });
      result.current.toggle(event as unknown as React.MouseEvent);
    });

    expect(result.current.pinned).toBe(false);
  });

  it('re-syncs when WIDGET_LAYOUT_CHANGED event fires', () => {
    const { result } = renderHook(() => useWidgetPinned('stocks'));
    expect(result.current.pinned).toBe(false);

    getItemSpy.mockImplementation((key: string) => {
      if (key === 'widget-dashboard-layout')
        return JSON.stringify({ pinned: ['stocks'], size: 'comfortable' });
      return null;
    });

    act(() => {
      window.dispatchEvent(new Event('widget-layout-changed'));
    });

    expect(result.current.pinned).toBe(true);
  });
});
