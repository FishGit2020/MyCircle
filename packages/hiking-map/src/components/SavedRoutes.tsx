import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import {
  listRoutes, deleteRoute, saveRoute, renameRoute, subscribeRoutes,
  shareRoute, unshareRoute, listPublicRoutes, subscribePublicRoutes,
} from '../services/routeStorageService';
import type { SavedRoute, PublicRoute } from '../services/routeStorageService';
import type { RouteResult } from '../providers/RoutingProvider';

interface Props {
  currentRoute: RouteResult | null;
  currentStart?: string;
  currentEnd?: string;
  onLoadRoute: (route: SavedRoute | PublicRoute) => void;
}

function formatDistance(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}
function formatDuration(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ─── Auth gate ─────────────────────────────────────────────────────────────

function SignInPrompt() {
  const { t } = useTranslation();
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4 text-center">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('hiking.signInToRoutes')}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('hiking.signInToRoutesHint')}</p>
      </div>
    </div>
  );
}

// ─── Route card ────────────────────────────────────────────────────────────

interface PersonalCardProps {
  route: SavedRoute;
  renamingId: string | null;
  renameValue: string;
  sharing: string | null;
  onLoad: (r: SavedRoute) => void;
  onShare: (r: SavedRoute) => void;
  onUnshare: (r: SavedRoute) => void;
  onDelete: (id: string) => void;
  onRenameStart: (r: SavedRoute) => void;
  onRenameChange: (v: string) => void;
  onRenameConfirm: (id: string) => void;
  onRenameCancel: () => void;
}

function PersonalRouteCard({
  route, renamingId, renameValue, sharing,
  onLoad, onShare, onUnshare, onDelete,
  onRenameStart, onRenameChange, onRenameConfirm, onRenameCancel,
}: PersonalCardProps) {
  const { t } = useTranslation();
  const isShared = !!route.sharedId;
  const isSharingThis = sharing === route.id;

  return (
    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      {renamingId === route.id ? (
        <div className="flex gap-1.5">
          <input
            type="text" value={renameValue}
            onChange={e => onRenameChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onRenameConfirm(route.id); if (e.key === 'Escape') onRenameCancel(); }}
            autoFocus
            className="flex-1 min-w-0 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="button" onClick={() => onRenameConfirm(route.id)} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition">{t('hiking.save')}</button>
          <button type="button" onClick={onRenameCancel} className="px-1.5 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 transition">✕</button>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-1.5 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{route.name}</p>
              <p className="text-xs text-gray-400">{formatDistance(route.distance)} · {formatDuration(route.duration)}</p>
            </div>
            {isShared && (
              <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {t('hiking.shared')}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Load */}
            <button type="button" onClick={() => onLoad(route)} aria-label={t('hiking.loadRoute')} title={t('hiking.loadRoute')}
              className="p-1.5 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            {/* Share / Unshare */}
            {isShared ? (
              <button type="button" onClick={() => onUnshare(route)} disabled={isSharingThis}
                aria-label={t('hiking.unshareRoute')} title={t('hiking.unshareRoute')}
                className="p-1.5 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </button>
            ) : (
              <button type="button" onClick={() => onShare(route)} disabled={isSharingThis}
                aria-label={t('hiking.shareRoute')} title={t('hiking.shareRoute')}
                className="p-1.5 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-green-600 disabled:opacity-50 transition">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
              </button>
            )}
            {/* Rename */}
            <button type="button" onClick={() => onRenameStart(route)} aria-label={t('hiking.renameRoute')} title={t('hiking.renameRoute')}
              className="p-1.5 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            {/* Delete */}
            <button type="button" onClick={() => onDelete(route.id)} aria-label={t('hiking.deleteRoute')} title={t('hiking.deleteRoute')}
              className="ml-auto p-1.5 rounded text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function SavedRoutes({ currentRoute, currentStart, currentEnd, onLoadRoute }: Props) {
  const { t } = useTranslation();
  const isLoggedIn = !!window.__currentUid;

  const [myRoutes, setMyRoutes] = useState<SavedRoute[]>([]);
  const [publicRoutes, setPublicRoutes] = useState<PublicRoute[]>([]);
  const [myExpanded, setMyExpanded] = useState(false);
  const [communityExpanded, setCommunityExpanded] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [sharing, setSharing] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [my, pub] = await Promise.all([listRoutes(), listPublicRoutes()]);
    setMyRoutes(my);
    setPublicRoutes(pub);
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    refresh();
    const unsubMy = subscribeRoutes(setMyRoutes);
    const unsubPub = subscribePublicRoutes(setPublicRoutes);
    return () => { unsubMy(); unsubPub(); };
  }, [isLoggedIn, refresh]);

  useEffect(() => {
    if (showNameInput) nameInputRef.current?.focus();
  }, [showNameInput]);

  // ── Save ──
  const handleSaveClick = () => {
    if (!currentRoute) return;
    setSaveName(`${t('hiking.route')} ${new Date().toLocaleDateString()}`);
    setShowNameInput(true);
    setMyExpanded(true);
  };

  const handleSaveConfirm = async () => {
    if (!currentRoute) return;
    setSaving(true);
    setShowNameInput(false);
    try {
      await saveRoute({
        name: saveName.trim() || `${t('hiking.route')} ${new Date().toLocaleDateString()}`,
        distance: currentRoute.distance,
        duration: currentRoute.duration,
        geometry: currentRoute.geometry,
        startLabel: currentStart,
        endLabel: currentEnd,
      });
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    await deleteRoute(id);
    await refresh();
  };

  // ── Load ──
  const handleLoad = (route: SavedRoute | PublicRoute) => onLoadRoute(route);

  // ── Rename ──
  const handleRenameStart = (route: SavedRoute) => { setRenamingId(route.id); setRenameValue(route.name); };
  const handleRenameConfirm = async (id: string) => {
    await renameRoute(id, renameValue.trim() || t('hiking.route'));
    setRenamingId(null);
    await refresh();
  };

  // ── Share / Unshare ──
  const handleShare = async (route: SavedRoute) => {
    setSharing(route.id);
    try { await shareRoute(route); await refresh(); } finally { setSharing(null); }
  };
  const handleUnshare = async (route: SavedRoute) => {
    setSharing(route.id);
    try { await unshareRoute(route.id); await refresh(); } finally { setSharing(null); }
  };

  if (!isLoggedIn) return <SignInPrompt />;

  return (
    <div className="mt-3 space-y-0">
      {/* ── My Routes ── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMyExpanded(v => !v)}
            className="flex items-center justify-between flex-1 text-sm font-semibold text-gray-900 dark:text-white">
            <span className="flex items-center gap-1.5">
              {t('hiking.myRoutes')}
              {myRoutes.length > 0 && <span className="text-xs font-normal text-gray-400">({myRoutes.length})</span>}
            </span>
            <svg className={`w-4 h-4 text-gray-400 transition-transform ${myExpanded ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {myExpanded && (
          <div className="mt-2 space-y-2">
            {/* Save current route */}
            {currentRoute && !showNameInput && (
              <button type="button" onClick={handleSaveClick} disabled={saving}
                className="w-full py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-60 transition">
                {saving ? t('hiking.saving') : t('hiking.saveCurrentRoute')}
              </button>
            )}

            {showNameInput && (
              <div className="flex gap-1.5">
                <input ref={nameInputRef} type="text" value={saveName}
                  onChange={e => setSaveName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveConfirm(); if (e.key === 'Escape') setShowNameInput(false); }}
                  placeholder={t('hiking.routeNamePlaceholder')}
                  className="flex-1 min-w-0 text-xs px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button type="button" onClick={handleSaveConfirm}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white transition">
                  {t('hiking.save')}
                </button>
                <button type="button" onClick={() => setShowNameInput(false)}
                  className="px-2 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition">✕</button>
              </div>
            )}

            {myRoutes.length === 0 && !showNameInput && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('hiking.noSavedRoutes')}</p>
            )}

            {myRoutes.map(route => (
              <PersonalRouteCard
                key={route.id}
                route={route}
                renamingId={renamingId}
                renameValue={renameValue}
                sharing={sharing}
                onLoad={handleLoad}
                onShare={handleShare}
                onUnshare={handleUnshare}
                onDelete={handleDelete}
                onRenameStart={handleRenameStart}
                onRenameChange={setRenameValue}
                onRenameConfirm={handleRenameConfirm}
                onRenameCancel={() => setRenamingId(null)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Community Routes ── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
        <button type="button" onClick={() => setCommunityExpanded(v => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-gray-900 dark:text-white">
          <span className="flex items-center gap-1.5">
            {t('hiking.communityRoutes')}
            {publicRoutes.length > 0 && <span className="text-xs font-normal text-gray-400">({publicRoutes.length})</span>}
          </span>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${communityExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {communityExpanded && (
          <div className="mt-2 space-y-2">
            {publicRoutes.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{t('hiking.noCommunityRoutes')}</p>
            )}
            {publicRoutes.map(route => (
              <div key={route.id} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{route.name}</p>
                    <p className="text-xs text-gray-400">{formatDistance(route.distance)} · {formatDuration(route.duration)}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                      {t('hiking.sharedBy')} {route.sharedBy.displayName}
                    </p>
                  </div>
                  <button type="button" onClick={() => handleLoad(route)}
                    aria-label={t('hiking.loadRoute')} title={t('hiking.loadRoute')}
                    className="shrink-0 p-1.5 rounded text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
