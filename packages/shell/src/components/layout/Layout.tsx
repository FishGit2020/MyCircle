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
import { NavIcon } from './NavIcon';
import { useTheme } from '../../context/ThemeContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useFocusOnRouteChange } from '../../hooks/useFocusOnRouteChange';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useRecentlyVisited } from '../../hooks/useRecentlyVisited';
import { useOverflowNav } from '../../hooks/useOverflowNav';
import { logEvent } from '../../lib/firebase';
import { NAV_GROUPS, prefetchRoute } from '../../lib/navConfig';
import type { NavGroup } from '../../lib/navConfig';

// --- NavDropdown component ---
function NavDropdown({
  group,
  isOpen,
  onToggle,
  onClose,
  pathname,
  t: translate,
}: {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  pathname: string;
  t: (key: TranslationKey) => string;
}) {
  const isGroupActive = group.items.some(
    item => pathname.startsWith(item.path),
  );

  return (
    <div className="relative" data-nav-item>
      <button
        type="button"
        onClick={onToggle}
        className={`text-sm font-medium transition flex items-center gap-1 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded px-1 whitespace-nowrap ${
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
                onClick={onClose}
                onMouseEnter={() => prefetchRoute(item.path)}
                onFocus={() => prefetchRoute(item.path)}
                className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                  active
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <NavIcon icon={item.icon} className="w-4 h-4" />
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
  onClose,
  pathname,
  t: translate,
}: {
  groups: NavGroup[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
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
                    onClick={onClose}
                    onMouseEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm transition ${
                      active
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <NavIcon icon={item.icon} className="w-4 h-4" />
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
    const mainEl = document.getElementById('main-content');
    if (mainEl?.scrollTo) mainEl.scrollTo(0, 0);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Close dropdown on outside click — use both pointerdown and mousedown for
  // broad browser compat (pointerdown covers touch; mousedown covers legacy)
  useEffect(() => {
    if (openGroup === null) return;
    function handleOutsideClick(e: Event) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
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
              <LanguageSelector />
              <WhatsNewButton />
              <FeedbackButton />
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
            <div ref={navContainerRef} className="flex items-center gap-1 lg:gap-2 min-w-0">
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
                  onClose={() => setOpenGroup(null)}
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
                  onClose={() => setOpenGroup(null)}
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
        className="flex-shrink-0 bg-gray-800 dark:bg-gray-950 text-white py-6 md:py-2 mt-12 md:mt-0 transition-colors"
      >
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs text-gray-400">
            <Link to="/privacy" className="text-blue-400 hover:underline">{t('footer.privacyPolicy')}</Link>
            {' · '}
            <Link to="/terms" className="text-blue-400 hover:underline">{t('footer.termsOfService')}</Link>
            {' · '}
            <a
              href="https://github.com/FishGit2020/MyCircle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3 inline" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </p>
          {/* Mobile spacer for fixed BottomNav + audio player clearance */}
          <div
            className="md:hidden"
            style={{ height: `calc(${isPlayerVisible ? '8rem' : '4rem'} + env(safe-area-inset-bottom, 0px))` }}
            aria-hidden="true"
          />
        </div>
      </footer>
    </div>
  );
}
