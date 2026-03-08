import { useState, useCallback, useEffect } from 'react';
import { WindowEvents } from '@mycircle/shared';
import type { WidgetType } from '../components/widgets/widgetConfig';
import { loadWidgetLayout, saveWidgetLayout } from '../components/widgets/widgetConfig';

export function useWidgetPinned(widgetId: WidgetType | undefined) {
  const [pinned, setPinned] = useState<boolean>(() => {
    if (!widgetId) return false;
    return loadWidgetLayout().pinned.includes(widgetId);
  });

  // Re-sync when layout changes (e.g., after Firestore restore on sign-in)
  useEffect(() => {
    if (!widgetId) return;
    const handler = () => setPinned(loadWidgetLayout().pinned.includes(widgetId));
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
  }, [widgetId]);

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!widgetId) return;
    const layout = loadWidgetLayout();
    const isPinned = layout.pinned.includes(widgetId);
    const newPinned = isPinned
      ? layout.pinned.filter(id => id !== widgetId)
      : [...layout.pinned, widgetId];
    saveWidgetLayout({ ...layout, pinned: newPinned });
    setPinned(!isPinned);
  }, [widgetId]);

  return { pinned, toggle };
}
