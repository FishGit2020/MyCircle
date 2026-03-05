import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import type { TranslationKey } from '@mycircle/shared';
import { useTranslation } from '@mycircle/shared';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import FeedbackButton from './FeedbackButton';
import OfflineIndicator from './OfflineIndicator';
import SyncIndicator from '../common/SyncIndicator';
import CommandPalette from './CommandPalette';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import Breadcrumbs from './Breadcrumbs';
import BottomNav from './BottomNav';
import PwaInstallPrompt from './PwaInstallPrompt';
import { NotificationBell } from '../notifications';
import { WhatsNewButton } from '../notifications';
import { GlobalAudioPlayer } from '../player';
import { useRemoteConfigContext } from '../../context/RemoteConfigContext';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useFocusOnRouteChange } from '../../hooks/useFocusOnRouteChange';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useRecentlyVisited } from '../../hooks/useRecentlyVisited';
import { useOverflowNav } from '../../hooks/useOverflowNav';
import { logEvent } from '../../lib/firebase';

// Prefetch MFE remote modules on hover/focus to reduce perceived load time
const prefetched = new Set<string>();
const ROUTE_MODULE_MAP: Record<string, () => Promise<unknown>> = {
  '/weather': () => import('weatherDisplay/WeatherDisplay'),
  '/stocks': () => import('stockTracker/StockTracker'),
  '/podcasts': () => import('podcastPlayer/PodcastPlayer'),
  '/ai': () => import('aiAssistant/AiAssistant'),
  '/bible': () => import('bibleReader/BibleReader'),
  '/worship': () => import('worshipSongs/WorshipSongs'),
  '/notebook': () => import('notebook/Notebook'),
  '/baby': () => import('babyTracker/BabyTracker'),
  '/child-dev': () => import('childDevelopment/ChildDevelopment'),
  '/flashcards': () => import('flashcards/FlashCards'),
  '/daily-log': () => import('dailyLog/DailyLog'),
  '/files': () => import('cloudFiles/CloudFiles'),
  '/library': () => import('digitalLibrary/DigitalLibrary'),
  '/family-games': () => import('familyGames/FamilyGames'),
};

function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = ROUTE_MODULE_MAP[path];
  if (loader) {
    prefetched.add(path);
    loader().catch(() => {});
  }
}

// --- NavIcon (copied from BottomNav to avoid coupling desktop/mobile nav) ---
function NavIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = className || 'w-4 h-4';
  switch (icon) {
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
    case 'daily-log':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
    case 'cloud-files':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>;
    case 'benchmark':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>;
    case 'immigration':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;
    case 'digital-library':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
    case 'family-games':
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
  }
}

// --- Nav group data model ---
interface NavItem { path: string; labelKey: TranslationKey; icon: string }
interface NavGroup { labelKey: TranslationKey; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { labelKey: 'nav.group.daily', items: [
    { path: '/weather', labelKey: 'dashboard.weather', icon: 'weather' },
    { path: '/stocks',  labelKey: 'nav.stocks',        icon: 'stocks' },
    { path: '/podcasts', labelKey: 'nav.podcasts',     icon: 'podcasts' },
  ]},
  { labelKey: 'nav.group.faith', items: [
    { path: '/bible',   labelKey: 'nav.bible',   icon: 'bible' },
    { path: '/worship', labelKey: 'nav.worship', icon: 'worship' },
  ]},
  { labelKey: 'nav.group.family', items: [
    { path: '/baby',      labelKey: 'nav.baby',     icon: 'baby' },
    { path: '/child-dev', labelKey: 'nav.childDev', icon: 'child-dev' },
    { path: '/immigration', labelKey: 'nav.immigration', icon: 'immigration' },
    { path: '/family-games', labelKey: 'nav.familyGames', icon: 'family-games' },
  ]},
  { labelKey: 'nav.group.learning', items: [
    { path: '/flashcards', labelKey: 'nav.flashcards', icon: 'flashcards' },
    { path: '/ai',       labelKey: 'nav.ai',      icon: 'ai' },
    { path: '/benchmark', labelKey: 'nav.benchmark', icon: 'benchmark' },
  ]},
  { labelKey: 'nav.group.workspace', items: [
    { path: '/notebook', labelKey: 'nav.notebook', icon: 'notebook' },
    { path: '/files', labelKey: 'nav.cloudFiles', icon: 'cloud-files' },
    { path: '/library', labelKey: 'nav.digitalLibrary', icon: 'digital-library' },
    { path: '/daily-log', labelKey: 'nav.dailyLog', icon: 'daily-log' },
  ]},
];

// --- NavDropdown component ---
function NavDropdown({
  group,
  isOpen,
  onToggle,
  pathname,
  t: translate,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  t: (key: TranslationKey) => string;
}) {
  const isGroupActive = group.items.some(
    item => pathname.startsWith(item.path),
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`text-sm font-medium transition flex items-center gap-1 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 ${
          isGroupActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {translate(group.labelKey)}
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
        >
          {group.items.map(item => {
            const active = pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                role="menuitem"
                onMouseEnter={() => prefetchRoute(item.path)}
                onFocus={() => prefetchRoute(item.path)}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <NavIcon icon={item.icon} />
                {translate(item.labelKey)}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// --- OverflowMenu: collects groups that don't fit into a "..." dropdown ---
function OverflowMenu({
  groups,
  isOpen,
  onToggle,
  pathname,
  t: translate,
}: {
  groups: NavGroup[];
  isOpen: boolean;
  onToggle: () => void;
  pathname: string;
  t: (key: TranslationKey) => string;
}) {
  if (groups.length === 0) return null;

  const isAnyActive = groups.some(g =>
    g.items.some(item => pathname.startsWith(item.path)),
  );

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={onToggle}
        className={`text-sm font-medium transition flex items-center gap-1 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 min-w-[44px] min-h-[44px] justify-center ${
          isAnyActive
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
        }`}
        aria-label={translate('nav.more')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      </button>
      {isOpen && (
        <div
          role="menu"
          className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-[70vh] overflow-y-auto"
        >
          {groups.map((group) => (
            <div key={group.labelKey}>
              <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                {translate(group.labelKey)}
              </div>
              {group.items.map(item => {
                const active = pathname.startsWith(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                      active
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <NavIcon icon={item.icon} />
                    {translate(item.labelKey)}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { t } = useTranslation();
  const { config, loading: configLoading } = useRemoteConfigContext();
  const { toggleTheme } = useTheme();
  const [hasActivePlayer, setHasActivePlayer] = useState(false);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const visibleCount = useOverflowNav(navContainerRef, NAV_GROUPS.length, 44);

  useKeyboardShortcuts({
    onToggleTheme: toggleTheme,
    onShowHelp: useCallback(() => setShortcutsOpen(true), []),
  });

  useFocusOnRouteChange();
  useDocumentTitle();
  const { recent } = useRecentlyVisited();

  const handlePlayerStateChange = useCallback((active: boolean) => {
    setHasActivePlayer(active);
  }, []);

  const handlePlayerVisibilityChange = useCallback((visible: boolean) => {
    setIsPlayerVisible(visible);
  }, []);

  // Close dropdown and scroll to top on route change
  useEffect(() => {
    setOpenGroup(null);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    if (openGroup === null) return;
    function handleMouseDown(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openGroup]);

  // Close dropdown on Escape
  useEffect(() => {
    if (openGroup === null) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenGroup(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [openGroup]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:outline-none"
      >
        {t('nav.skipToContent')}
      </a>
      <OfflineIndicator />
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-[1920px] mx-auto px-4 py-2 sm:py-3">
          {/* Mobile header */}
          <div className="flex md:hidden items-center justify-between gap-2">
            <Link to="/" className="flex items-center space-x-2 min-w-0 flex-shrink">
              <svg className="w-6 h-6 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h1 className="text-lg font-bold text-gray-800 dark:text-white truncate">MyCircle</h1>
            </Link>
            <div className="flex items-center gap-1 flex-shrink-0">
              <LanguageSelector />
              <WhatsNewButton />
              <FeedbackButton />
              <button
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label={t('search.search')}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          {/* Desktop header — CSS Grid: icon | MyCircle | nav (1fr) | right icons */}
          <nav
            ref={navRef}
            aria-label="Main navigation"
            className="hidden md:grid items-center gap-2"
            style={{ gridTemplateColumns: 'auto auto 1fr auto' }}
          >
            {/* Col 1: Icon */}
            <Link to="/" className="flex items-center flex-shrink-0" aria-label="Home">
              <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </Link>

            {/* Col 2: Brand */}
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white whitespace-nowrap">MyCircle</h1>
            </Link>

            {/* Col 3: Nav dropdowns (shrinkable 1fr) */}
            <div ref={navContainerRef} className="flex items-center gap-1 lg:gap-2 min-w-0 overflow-hidden">
              {NAV_GROUPS.slice(0, visibleCount).map(group => (
                <NavDropdown
                  key={group.labelKey}
                  group={group}
                  isOpen={openGroup === group.labelKey}
                  onToggle={() => {
                    setOpenGroup(prev => {
                      const next = prev === group.labelKey ? null : group.labelKey;
                      if (next) logEvent('nav_dropdown_open', { group: group.labelKey });
                      return next;
                    });
                  }}
                  pathname={location.pathname}
                  t={t}
                />
              ))}
              {visibleCount < NAV_GROUPS.length && (
                <OverflowMenu
                  groups={NAV_GROUPS.slice(visibleCount)}
                  isOpen={openGroup === '__overflow__'}
                  onToggle={() => {
                    setOpenGroup(prev => prev === '__overflow__' ? null : '__overflow__');
                  }}
                  pathname={location.pathname}
                  t={t}
                />
              )}
            </div>

            {/* Col 4: Right-side icons (never collapse) */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors"
                aria-label="Search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:inline">{t('search.search')}</span>
                <kbd className="hidden lg:inline px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-[10px] border border-gray-200 dark:border-gray-600">Ctrl+K</kbd>
              </button>
              <LanguageSelector />
              <WhatsNewButton />
              <FeedbackButton />
              <NotificationBell />
              <UserMenu />
            </div>
          </nav>
        </div>
      </header>

      <Breadcrumbs />

      <main
        id="main-content"
        className={`flex-grow flex flex-col container mx-auto px-4 py-6 ${isPlayerVisible ? 'pb-32 md:pb-20' : 'pb-16 md:pb-4'}`}
        style={{ '--player-h': isPlayerVisible ? '5rem' : '0px' } as React.CSSProperties}
      >
        <Outlet />
        {/* PWA safe area bottom spacer for notched devices */}
        <div className="md:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} aria-hidden="true" />
      </main>

      <GlobalAudioPlayer onPlayerStateChange={handlePlayerStateChange} onPlayerVisibilityChange={handlePlayerVisibilityChange} />

      <BottomNav hasActivePlayer={isPlayerVisible} />
      <CommandPalette recentPages={recent} />
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <PwaInstallPrompt />
      <SyncIndicator />

      <footer
        role="contentinfo"
        className="bg-gray-800 dark:bg-gray-950 text-white py-6 md:pb-6 mt-12 transition-colors"
        style={{ paddingBottom: `calc(${isPlayerVisible ? '8rem' : '4rem'} + env(safe-area-inset-bottom, 0px))` }}
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm">
            {t('footer.dataProvider')}{' '}
            <a
              href="https://openweathermap.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              OpenWeatherMap
            </a>
            {', '}
            <a
              href="https://finnhub.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Finnhub
            </a>
            {', '}
            <a
              href="https://podcastindex.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              PodcastIndex
            </a>
            {' & '}
            <a
              href="https://developers.youversion.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              YouVersion
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t('footer.builtWith')}
            {' · '}
            <a
              href="https://github.com/FishGit2020/MyCircle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </p>
          <p className="text-xs text-gray-400 mt-2">
            <Link to="/privacy" className="text-blue-400 hover:underline">{t('footer.privacyPolicy')}</Link>
            {' · '}
            <Link to="/terms" className="text-blue-400 hover:underline">{t('footer.termsOfService')}</Link>
          </p>
          {!configLoading && Object.keys(config).length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1">
              {Object.entries(config).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-300"
                >
                  {key}: <span className="ml-1 font-mono text-blue-300">{value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
