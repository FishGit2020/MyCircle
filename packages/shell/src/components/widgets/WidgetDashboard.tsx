import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';
import { logEvent } from '../../lib/firebase';
import {
  type WidgetLayout,
  type WidgetSize,
  loadWidgetLayout,
  saveWidgetLayout,
  WIDGET_COMPONENTS,
  WIDGET_ROUTES,
} from './widgetConfig';

// Re-export types for external consumers
export type { WidgetType, WidgetSize } from './widgetConfig';

// ─── Main Dashboard Component ────────────────────────────────────────────────

export default function WidgetDashboard() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const [layout, setLayout] = useState<WidgetLayout>(loadWidgetLayout);

  // Keep layout in sync with storage events (e.g. Firestore restore on sign-in)
  useEffect(() => {
    const handler = () => setLayout(loadWidgetLayout());
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
  }, []);

  const handleSizeChange = useCallback((size: WidgetSize) => {
    const current = loadWidgetLayout();
    saveWidgetLayout({ ...current, size });
    logEvent('widget_size_change', { size });
  }, []);

  if (layout.pinned.length === 0) return null;

  return (
    <section aria-label={t('widgets.title')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('widgets.title')}
        </h3>
        {/* Global size selector */}
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {(['comfortable', 'tight'] as const).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => handleSizeChange(s)}
              className={`text-xs px-2.5 py-1 transition-colors ${
                layout.size === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              aria-label={t(s === 'comfortable' ? 'widgets.sizeComfortable' : 'widgets.sizeTight' as any)}
              aria-pressed={layout.size === s}
            >
              {t(s === 'comfortable' ? 'widgets.sizeComfortable' : 'widgets.sizeTight' as any)}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
        {layout.pinned.map(widgetId => {
          const WidgetComponent = WIDGET_COMPONENTS[widgetId];
          const routeDef = WIDGET_ROUTES[widgetId];
          const to = typeof routeDef === 'function' ? routeDef({ favoriteCities }) : routeDef;
          const spanClass = layout.size === 'tight' ? 'col-span-1' : 'col-span-2 lg:col-span-2';
          const sizeClass = layout.size === 'tight' ? 'p-3 min-h-[80px]' : 'p-5 min-h-[120px]';
          return (
            <Link
              key={widgetId}
              to={to}
              className={`group relative block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all ${sizeClass} ${spanClass}`}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const l = loadWidgetLayout();
                  saveWidgetLayout({ ...l, pinned: l.pinned.filter(id => id !== widgetId) });
                }}
                className="absolute top-1 right-1 p-1 rounded-full text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all z-10"
                aria-label={t('home.unpinWidget')}
                title={t('home.unpinWidget')}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <ErrorBoundary>
                <WidgetComponent />
              </ErrorBoundary>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
