import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { listRoutes, deleteRoute, saveRoute, renameRoute, subscribeRoutes } from '../services/routeStorageService';
import type { SavedRoute } from '../services/routeStorageService';
import type { RouteResult } from '../providers/RoutingProvider';

interface Props {
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

export default function SavedRoutes({ currentRoute, currentStart, currentEnd, onLoadRoute }: Props) {
  const { t } = useTranslation();
  const [routes, setRoutes] = useState<SavedRoute[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    const all = await listRoutes();
    setRoutes(all);
  }, []);

  useEffect(() => {
    refresh();
    // Real-time updates via Firebase when authenticated
    const unsub = subscribeRoutes((updated) => setRoutes(updated));
    return unsub;
  }, [refresh]);

  // Focus name input when it appears
  useEffect(() => {
    if (showNameInput) nameInputRef.current?.focus();
  }, [showNameInput]);

  const handleSaveClick = () => {
    if (!currentRoute) return;
    setSaveName(`${t('hiking.route')} ${new Date().toLocaleDateString()}`);
    setShowNameInput(true);
  };

  const handleSaveConfirm = async () => {
    if (!currentRoute) return;
    setSaving(true);
    setShowNameInput(false);
    await saveRoute({
      name: saveName.trim() || `${t('hiking.route')} ${new Date().toLocaleDateString()}`,
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
  };

  const handleRenameStart = (route: SavedRoute) => {
    setRenamingId(route.id);
    setRenameValue(route.name);
  };

  const handleRenameConfirm = async (id: string) => {
    await renameRoute(id, renameValue.trim() || t('hiking.route'));
    setRenamingId(null);
    await refresh();
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white"
      >
        <span>
          {t('hiking.savedRoutes')}
          {routes.length > 0 && <span className="ml-1 text-xs font-normal text-gray-400">({routes.length})</span>}
          {window.__hikingRoutes && (
            <span className="ml-1.5 text-[10px] font-normal text-blue-500">{t('hiking.synced')}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {/* Save current route */}
          {currentRoute && !showNameInput && (
            <button
              type="button"
              onClick={handleSaveClick}
              disabled={saving}
              className="w-full py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition"
            >
              {saving ? t('hiking.saving') : t('hiking.saveCurrentRoute')}
            </button>
          )}

          {/* Name input for new route */}
          {showNameInput && (
            <div className="flex gap-1.5">
              <input
                ref={nameInputRef}
                type="text"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveConfirm(); if (e.key === 'Escape') setShowNameInput(false); }}
                placeholder={t('hiking.routeNamePlaceholder')}
                className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={handleSaveConfirm}
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
              >
                {t('hiking.save')}
              </button>
              <button
                type="button"
                onClick={() => setShowNameInput(false)}
                className="px-2 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                ✕
              </button>
            </div>
          )}

          {routes.length === 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('hiking.noSavedRoutes')}</p>
          )}

          {routes.map(route => (
            <div
              key={route.id}
              className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              {renamingId === route.id ? (
                <div className="flex gap-1.5 mb-1">
                  <input
                    type="text"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleRenameConfirm(route.id); if (e.key === 'Escape') setRenamingId(null); }}
                    autoFocus
                    className="flex-1 min-w-0 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => handleRenameConfirm(route.id)} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition">{t('hiking.save')}</button>
                  <button type="button" onClick={() => setRenamingId(null)} className="px-1.5 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 transition">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{route.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatDistance(route.distance)} · {formatDuration(route.duration)}
                    </p>
                  </div>
                  {/* Load */}
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
                  {/* Rename (Firebase only) */}
                  {window.__hikingRoutes && (
                    <button
                      type="button"
                      onClick={() => handleRenameStart(route)}
                      aria-label={t('hiking.renameRoute')}
                      title={t('hiking.renameRoute')}
                      className="p-1.5 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                  {/* Delete */}
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
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
