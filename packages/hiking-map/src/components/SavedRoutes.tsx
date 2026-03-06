import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import { listRoutes, deleteRoute, saveRoute } from '../services/routeStorageService';
import type { SavedRoute } from '../services/routeStorageService';
import type { RouteResult } from '../providers/RoutingProvider';

interface Props {
  map: maplibregl.Map | null;
  /** Current planned route — shown as a "Save" button when set. */
  currentRoute: RouteResult | null;
  currentStart?: string;
  currentEnd?: string;
  /** Called when a saved route is loaded (to display it). */
  onLoadRoute: (route: SavedRoute) => void;
}

function formatDistance(meters: number) {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SavedRoutes({ map, currentRoute, currentStart, currentEnd, onLoadRoute }: Props) {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    const all = await listRoutes();
    setRoutes(all);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSave = async () => {
    if (!currentRoute) return;
    setSaving(true);
    const name = `${t('hiking.route')} ${new Date().toLocaleDateString()}`;
    await saveRoute({
      name,
      distance: currentRoute.distance,
      duration: currentRoute.duration,
      geometry: currentRoute.geometry,
      startLabel: currentStart,
      endLabel: currentEnd,
    });
    await refresh();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await deleteRoute(id);
    await refresh();
  };

  const handleLoad = (route: SavedRoute) => {
    onLoadRoute(route);
    // Fit map to route bounds
    if (map) {
      const mgl = (window as any).maplibregl;
      if (mgl?.LngLatBounds) {
        const coords = route.geometry.coordinates as [number, number][];
        const bounds = coords.reduce(
          (b: any, c: [number, number]) => b.extend(c),
          new mgl.LngLatBounds(coords[0], coords[0])
        );
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 60, maxZoom: 16 });
        }
      }
    }
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white"
      >
        <span>{t('hiking.savedRoutes')} {routes.length > 0 && <span className="text-xs font-normal text-gray-400">({routes.length})</span>}</span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {currentRoute && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition"
            >
              {saving ? t('hiking.saving') : t('hiking.saveCurrentRoute')}
            </button>
          )}

          {routes.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('hiking.noSavedRoutes')}</p>
          )}

          {routes.map(route => (
            <div
              key={route.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{route.name}</p>
                <p className="text-xs text-gray-400">
                  {formatDistance(route.distance)} · {formatDuration(route.duration)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLoad(route)}
                aria-label={t('hiking.loadRoute')}
                title={t('hiking.loadRoute')}
                className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(route.id)}
                aria-label={t('hiking.deleteRoute')}
                title={t('hiking.deleteRoute')}
                className="p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
