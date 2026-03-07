import { useState, useCallback, useEffect } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import type { WidgetType } from '../components/widgets/widgetConfig';
import { loadLayout, saveLayout } from '../components/widgets/widgetConfig';

export function useWidgetPinned(widgetId: WidgetType | undefined) {
  const [pinned, setPinned] = useState<boolean>(() => {
    if (!widgetId) return false;
    try {
      const layout = loadLayout();
      const widget = layout.find(w => w.id === widgetId);
      return widget?.visible ?? false;
    } catch { return false; }
  });

  // Re-sync when layout changes (e.g., after Firestore restore on sign-in)
  useEffect(() => {
    if (!widgetId) return;
    const handler = () => {
      try {
        const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
        if (!stored) { setPinned(false); return; }
        const layout: Array<{ id: string; visible: boolean }> = JSON.parse(stored);
        const widget = layout.find(w => w.id === widgetId);
        setPinned(widget?.visible ?? false);
      } catch { /* ignore */ }
    };
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
  }, [widgetId]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!widgetId) return;
    try {
      const layout = loadLayout();
      const idx = layout.findIndex(w => w.id === widgetId);
      if (idx >= 0) {
        layout[idx] = { ...layout[idx], visible: !layout[idx].visible };
        saveLayout(layout);
        setPinned(layout[idx].visible);
      }
    } catch { /* ignore */ }
  }, [widgetId]);

  return { pinned, toggle };
}
