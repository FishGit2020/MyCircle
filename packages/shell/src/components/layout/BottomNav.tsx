import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation, StorageKeys, WindowEvents, TranslationKey } from '@mycircle/shared';
import { logEvent } from '../../lib/firebase';

interface NavItem {
  path: string;
  labelKey: TranslationKey;
  icon: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  { path: '/', labelKey: 'bottomNav.home', icon: 'home' },
  { path: '/weather', labelKey: 'bottomNav.weather', icon: 'weather' },
  { path: '/stocks', labelKey: 'bottomNav.stocks', icon: 'stocks' },
  { path: '/podcasts', labelKey: 'bottomNav.podcasts', icon: 'podcasts' },
  { path: '/bible', labelKey: 'nav.bible', icon: 'bible' },
  { path: '/worship', labelKey: 'nav.worship', icon: 'worship' },
  { path: '/notebook', labelKey: 'nav.notebook', icon: 'notebook' },
  { path: '/baby', labelKey: 'nav.baby', icon: 'baby' },
  { path: '/child-dev', labelKey: 'nav.childDev', icon: 'child-dev' },
  { path: '/flashcards', labelKey: 'nav.flashcards', icon: 'flashcards' },
  { path: '/work-tracker', labelKey: 'nav.workTracker', icon: 'work-tracker' },
  { path: '/ai', labelKey: 'nav.ai', icon: 'ai' },
];

const DEFAULT_ORDER = ALL_NAV_ITEMS.map(item => item.path);
const MAIN_BAR_COUNT = 4;

function loadNavOrder(): string[] {
  try {
    const stored = localStorage.getItem(StorageKeys.BOTTOM_NAV_ORDER);
    if (stored) {
      const order = JSON.parse(stored) as string[];
      const validPaths = new Set(DEFAULT_ORDER);
      // Keep stored paths that still exist, preserving user's order
      const merged = order.filter(p => validPaths.has(p));
      // Append any new paths not in the stored order
      for (const p of DEFAULT_ORDER) {
        if (!merged.includes(p)) merged.push(p);
      }
      if (merged.length === DEFAULT_ORDER.length) {
        return merged;
      }
    }
  } catch { /* ignore */ }
  return DEFAULT_ORDER;
}

function saveNavOrder(order: string[]) {
  try {
    localStorage.setItem(StorageKeys.BOTTOM_NAV_ORDER, JSON.stringify(order));
    window.dispatchEvent(new Event(WindowEvents.BOTTOM_NAV_ORDER_CHANGED));
  } catch { /* ignore */ }
}

function getItemByPath(path: string): NavItem {
  return ALL_NAV_ITEMS.find(item => item.path === path) || ALL_NAV_ITEMS[0];
}

function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-5 h-5';
  switch (icon) {
    case 'home':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'weather':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>;
    case 'stocks':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
    case 'podcasts':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
    case 'bible':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
    case 'worship':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>;
    case 'notebook':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
    case 'baby':
      return <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>;
    case 'child-dev':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
    case 'ai':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
    case 'flashcards':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
    case 'work-tracker':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    default:
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
  }
}

export default function BottomNav({ hasActivePlayer }: { hasActivePlayer: boolean }) {
  const { t } = useTranslation();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [orderedPaths, setOrderedPaths] = useState<string[]>(loadNavOrder);
  const moreRef = useRef<HTMLDivElement>(null);
  const dragIdx = useRef<number | null>(null);

  // Listen for external order changes (e.g. Firestore restore on sign-in)
  useEffect(() => {
    function handleOrderChanged() {
      setOrderedPaths(loadNavOrder());
    }
    window.addEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleOrderChanged);
    return () => window.removeEventListener(WindowEvents.BOTTOM_NAV_ORDER_CHANGED, handleOrderChanged);
  }, []);

  const navItems = orderedPaths.slice(0, MAIN_BAR_COUNT).map(getItemByPath);
  const moreItems = orderedPaths.slice(MAIN_BAR_COUNT).map(getItemByPath);

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const isMoreActive = moreItems.some(item => isActive(item.path));

  // Close "More" menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [moreOpen]);

  // Close on route change
  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const moveItem = useCallback((index: number, direction: -1 | 1) => {
    setOrderedPaths(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      saveNavOrder(next);
      return next;
    });
  }, []);

  const resetOrder = useCallback(() => {
    setOrderedPaths(DEFAULT_ORDER);
    saveNavOrder(DEFAULT_ORDER);
  }, []);

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDrop = (targetIdx: number) => {
    const fromIdx = dragIdx.current;
    if (fromIdx === null || fromIdx === targetIdx) return;
    setOrderedPaths(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(targetIdx, 0, moved);
      saveNavOrder(next);
      return next;
    });
    dragIdx.current = null;
  };

  // ── Edit overlay ──────────────────────────────
  if (editing) {
    return (
      <div className="md:hidden fixed inset-0 z-[60] bg-white dark:bg-gray-900 overflow-y-auto" data-testid="nav-editor" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">{t('bottomNav.editTitle')}</h2>
            <div className="flex gap-2">
              <button
                onClick={resetOrder}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                {t('bottomNav.reset')}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition"
              >
                {t('bottomNav.editDone')}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            {orderedPaths.map((path, idx) => {
              const item = getItemByPath(path);
              const isInMainBar = idx < MAIN_BAR_COUNT;
              const showDivider = idx === MAIN_BAR_COUNT;

              return (
                <React.Fragment key={path}>
                  {showDivider && (
                    <div className="flex items-center gap-2 py-2 mt-2">
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {t('bottomNav.moreSection')}
                      </span>
                      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                    </div>
                  )}
                  {idx === 0 && (
                    <div className="flex items-center gap-2 pb-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {t('bottomNav.mainBarSection')}
                      </span>
                    </div>
                  )}
                  <div
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(idx)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition cursor-grab active:cursor-grabbing ${
                      isInMainBar
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                    data-testid={`nav-editor-item-${path}`}
                  >
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M4 16h16" />
                    </svg>
                    <NavIcon icon={item.icon} className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white">{t(item.labelKey)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                        aria-label={t('bottomNav.moveUp')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveItem(idx, 1)}
                        disabled={idx === orderedPaths.length - 1}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 transition rounded-lg active:bg-gray-100 dark:active:bg-gray-700"
                        aria-label={t('bottomNav.moveDown')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Normal bottom nav ─────────────────────────
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map(item => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => logEvent('bottom_nav_tap', { item_path: item.path })}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <NavIcon icon={item.icon} />
              <span className="text-[11px] font-medium leading-none">{t(item.labelKey)}</span>
            </Link>
          );
        })}

        {/* More button */}
        <div ref={moreRef} className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
          <button
            onClick={() => setMoreOpen(prev => { if (!prev) logEvent('bottom_nav_more_open'); return !prev; })}
            className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              isMoreActive || moreOpen
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            aria-expanded={moreOpen}
            aria-haspopup="true"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
            <span className="text-[11px] font-medium leading-none">{t('bottomNav.more')}</span>
          </button>

          {/* More popup */}
          {moreOpen && (
            <div className="absolute bottom-full mb-2 right-0 w-48 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 overflow-hidden">
              {moreItems.map(item => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      active
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                );
              })}
              {/* Edit order button */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
                <button
                  onClick={() => { setMoreOpen(false); setEditing(true); }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 w-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{t('bottomNav.editOrder')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
