import React, { useReducer, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';
import ErrorBoundary from '../common/ErrorBoundary';
import { logEvent } from '../../lib/firebase';
import {
  type WidgetConfig,
  type WidgetSize,
  DEFAULT_LAYOUT,
  loadLayout,
  saveLayout,
  loadWidgetSize,
  saveWidgetSize,
  WIDGET_COMPONENTS,
  WIDGET_ROUTES,
} from './widgetConfig';

// Re-export types for external consumers
export type { WidgetType, WidgetSize, WidgetConfig } from './widgetConfig';

// ─── Dashboard Reducer ──────────────────────────────────────────────────────

type DashboardAction =
  | { type: 'SET_LAYOUT'; layout: WidgetConfig[] }
  | { type: 'TOGGLE_EDITING' }
  | { type: 'DRAG_START'; index: number }
  | { type: 'DRAG_OVER'; index: number }
  | { type: 'DRAG_LEAVE' }
  | { type: 'DROP'; dropIndex: number }
  | { type: 'DRAG_END' }
  | { type: 'MOVE_WIDGET'; index: number; direction: -1 | 1 }
  | { type: 'TOGGLE_VISIBILITY'; index: number }
  | { type: 'SET_SIZE'; size: WidgetSize }
  | { type: 'RESET' };

interface DashboardState {
  layout: WidgetConfig[];
  widgetSize: WidgetSize;
  editing: boolean;
  dragIndex: number | null;
  dragOverIndex: number | null;
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LAYOUT':
      return { ...state, layout: action.layout };
    case 'TOGGLE_EDITING':
      return { ...state, editing: !state.editing };
    case 'DRAG_START':
      return { ...state, dragIndex: action.index };
    case 'DRAG_OVER':
      return { ...state, dragOverIndex: action.index };
    case 'DRAG_LEAVE':
      return { ...state, dragOverIndex: null };
    case 'DROP': {
      if (state.dragIndex === null || state.dragIndex === action.dropIndex) {
        return { ...state, dragOverIndex: null };
      }
      const next = [...state.layout];
      const [moved] = next.splice(state.dragIndex, 1);
      next.splice(action.dropIndex, 0, moved);
      return { ...state, layout: next, dragOverIndex: null };
    }
    case 'DRAG_END':
      return { ...state, dragIndex: null, dragOverIndex: null };
    case 'MOVE_WIDGET': {
      const target = action.index + action.direction;
      if (target < 0 || target >= state.layout.length) return state;
      const next = [...state.layout];
      [next[action.index], next[target]] = [next[target], next[action.index]];
      return { ...state, layout: next };
    }
    case 'TOGGLE_VISIBILITY':
      return {
        ...state,
        layout: state.layout.map((w, i) =>
          i === action.index ? { ...w, visible: !w.visible } : w
        ),
      };
    case 'SET_SIZE':
      return { ...state, widgetSize: action.size };
    case 'RESET':
      return { ...state, layout: DEFAULT_LAYOUT };
    case 'RELOAD':
      return { ...state, layout: loadLayout() };
    default:
      return state;
  }
}

// ─── Main Dashboard Component ────────────────────────────────────────────────

export default function WidgetDashboard() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, undefined, () => ({
    layout: loadLayout(),
    widgetSize: loadWidgetSize(),
    editing: false,
    dragIndex: null,
    dragOverIndex: null,
  }));
  const { layout, widgetSize, editing, dragIndex, dragOverIndex } = state;
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  // Persist layout on change
  useEffect(() => {
    selfDispatchRef.current = true;
    saveLayout(layout);
  }, [layout]);

  // Persist global widget size
  useEffect(() => {
    saveWidgetSize(widgetSize);
  }, [widgetSize]);

  // Reload layout when auth context updates localStorage (e.g. sign-in restore)
  const selfDispatchRef = useRef(false);
  useEffect(() => {
    const handler = () => {
      if (selfDispatchRef.current) { selfDispatchRef.current = false; return; }
      dispatch({ type: 'RELOAD' });
    };
    window.addEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WIDGET_LAYOUT_CHANGED, handler);
  }, []);

  // ── Drag handlers ──────────────────────────────────────────────────────

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    dispatch({ type: 'DRAG_START', index });
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    // Slight delay for visual feedback
    requestAnimationFrame(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = '0.4';
      }
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dispatch({ type: 'DRAG_OVER', index });
  }, []);

  const handleDragLeave = useCallback(() => {
    dispatch({ type: 'DRAG_LEAVE' });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    dispatch({ type: 'DROP', dropIndex });
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    dispatch({ type: 'DRAG_END' });
  }, []);

  const visibleWidgets = React.useMemo(
    () => layout.filter(w => w.visible),
    [layout]
  );

  return (
    <section aria-label={t('widgets.title')}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
          {t('widgets.title')}
        </h3>
        <div className="flex items-center gap-2">
          {/* Global size selector */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            {(['small', 'medium', 'large'] as const).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => { logEvent('widget_size_change', { size: s }); dispatch({ type: 'SET_SIZE', size: s }); }}
                className={`text-xs px-2 py-1 transition-colors ${
                  widgetSize === s
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label={`${t('widgets.size')} ${s}`}
                aria-pressed={widgetSize === s}
              >
                {s === 'small' ? 'S' : s === 'medium' ? 'M' : 'L'}
              </button>
            ))}
          </div>
          {editing && (
            <button
              type="button"
              onClick={() => { logEvent('widget_reset'); dispatch({ type: 'RESET' }); }}
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {t('widgets.reset')}
            </button>
          )}
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_EDITING' })}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            aria-pressed={editing}
          >
            {editing ? t('widgets.done') : t('widgets.customize')}
          </button>
        </div>
      </div>

      {/* Editing mode: all widgets including hidden */}
      {editing ? (
        <div
          className="space-y-2"
          role="list"
          aria-label={t('widgets.dragHint')}
        >
          {layout.map((widget, index) => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.id];
            return (
              <div
                key={widget.id}
                role="listitem"
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  relative rounded-xl border-2 p-4 transition-all cursor-grab active:cursor-grabbing
                  ${dragOverIndex === index
                    ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                  }
                  ${!widget.visible ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* Drag handle (desktop only) */}
                  <span className="hidden md:inline text-gray-500 dark:text-gray-400 select-none" aria-hidden="true">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
                      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
                      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
                    </svg>
                  </span>

                  {/* Move buttons (tap on mobile, click on desktop) */}
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'MOVE_WIDGET', index, direction: -1 })}
                    disabled={index === 0}
                    className="p-1.5 md:p-1 rounded-lg md:rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                    aria-label={t('widgets.moveUp')}
                  >
                    <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'MOVE_WIDGET', index, direction: 1 })}
                    disabled={index === layout.length - 1}
                    className="p-1.5 md:p-1 rounded-lg md:rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
                    aria-label={t('widgets.moveDown')}
                  >
                    <svg className="w-5 h-5 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <span className="flex-1" />

                  {/* Visibility toggle */}
                  <button
                    type="button"
                    onClick={() => { logEvent('widget_toggle_visibility', { widget_id: widget.id, visible: !widget.visible }); dispatch({ type: 'TOGGLE_VISIBILITY', index }); }}
                    className={`text-xs px-2 py-1 rounded-full transition-colors ${
                      widget.visible
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    aria-label={t('widgets.toggleVisibility')}
                    aria-pressed={widget.visible}
                  >
                    {widget.visible ? t('widgets.visible') : t('widgets.hidden')}
                  </button>
                </div>
                <div className="pointer-events-none">
                  <ErrorBoundary>
                    <WidgetComponent />
                  </ErrorBoundary>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Normal mode: only visible widgets with data in a responsive grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-4">
          {visibleWidgets.map(widget => {
            const WidgetComponent = WIDGET_COMPONENTS[widget.id];
            const routeDef = WIDGET_ROUTES[widget.id];
            const to = typeof routeDef === 'function' ? routeDef({ favoriteCities }) : routeDef;
            const spanClass = widgetSize === 'large'
              ? 'col-span-2 lg:col-span-4 2xl:col-span-3'
              : widgetSize === 'small'
                ? 'col-span-1'
                : 'col-span-2 lg:col-span-2';
            const sizeClass = widgetSize === 'small' ? 'p-3 min-h-[80px]' : 'p-5 min-h-[120px]';
            return (
              <Link
                key={widget.id}
                to={to}
                className={`block bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all ${sizeClass} ${spanClass}`}
              >
                <ErrorBoundary>
                  <WidgetComponent />
                </ErrorBoundary>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
