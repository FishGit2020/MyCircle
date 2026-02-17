import React, { useState, useCallback } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import ThemeToggle from './ThemeToggle';
import UserMenu from './UserMenu';
import LanguageSelector from './LanguageSelector';
import FeedbackButton from './FeedbackButton';
import OfflineIndicator from './OfflineIndicator';
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
import { useRecentlyVisited } from '../../hooks/useRecentlyVisited';

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
};

function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const loader = ROUTE_MODULE_MAP[path];
  if (loader) {
    prefetched.add(path);
    loader().catch(() => {});
  }
}

export default function Layout() {
  const { t } = useTranslation();
  const { config, loading: configLoading } = useRemoteConfigContext();
  const { toggleTheme } = useTheme();
  const [hasActivePlayer, setHasActivePlayer] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();

  useKeyboardShortcuts({
    onToggleTheme: toggleTheme,
    onShowHelp: useCallback(() => setShortcutsOpen(true), []),
  });

  useFocusOnRouteChange();
  const { recent } = useRecentlyVisited();

  const handlePlayerStateChange = useCallback((active: boolean) => {
    setHasActivePlayer(active);
  }, []);

  const navLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `text-sm font-medium transition ${
      isActive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
    }`;
  };

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
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 min-w-0 flex-shrink md:flex-shrink-0">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">MyCircle</h1>
            </Link>

            {/* Desktop nav (hidden on mobile) */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center space-x-4">
              <Link to="/" className={navLinkClass('/')}>
                {t('nav.home')}
              </Link>
              <Link to="/weather" className={navLinkClass('/weather')} onMouseEnter={() => prefetchRoute('/weather')} onFocus={() => prefetchRoute('/weather')}>
                {t('dashboard.weather')}
              </Link>
              <Link to="/stocks" className={navLinkClass('/stocks')} onMouseEnter={() => prefetchRoute('/stocks')} onFocus={() => prefetchRoute('/stocks')}>
                {t('nav.stocks')}
              </Link>
              <Link to="/podcasts" className={navLinkClass('/podcasts')} onMouseEnter={() => prefetchRoute('/podcasts')} onFocus={() => prefetchRoute('/podcasts')}>
                {t('nav.podcasts')}
              </Link>
              <Link to="/bible" className={navLinkClass('/bible')} onMouseEnter={() => prefetchRoute('/bible')} onFocus={() => prefetchRoute('/bible')}>
                {t('nav.bible')}
              </Link>
              <Link to="/worship" className={navLinkClass('/worship')} onMouseEnter={() => prefetchRoute('/worship')} onFocus={() => prefetchRoute('/worship')}>
                {t('nav.worship')}
              </Link>
              <Link to="/notebook" className={navLinkClass('/notebook')} onMouseEnter={() => prefetchRoute('/notebook')} onFocus={() => prefetchRoute('/notebook')}>
                {t('nav.notebook')}
              </Link>
              <Link to="/baby" className={navLinkClass('/baby')} onMouseEnter={() => prefetchRoute('/baby')} onFocus={() => prefetchRoute('/baby')}>
                {t('nav.baby')}
              </Link>
              <Link to="/child-dev" className={navLinkClass('/child-dev')} onMouseEnter={() => prefetchRoute('/child-dev')} onFocus={() => prefetchRoute('/child-dev')}>
                {t('nav.childDev')}
              </Link>
              <Link to="/ai" className={navLinkClass('/ai')} onMouseEnter={() => prefetchRoute('/ai')} onFocus={() => prefetchRoute('/ai')}>
                {t('nav.ai')}
              </Link>
              <button
                onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                aria-label="Search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden lg:inline">{t('search.search')}</span>
                <kbd className="hidden lg:inline px-1 py-0.5 bg-white dark:bg-gray-800 rounded text-[10px] border border-gray-200 dark:border-gray-600">Ctrl+K</kbd>
              </button>
              <LanguageSelector />
              <ThemeToggle />
              <WhatsNewButton />
              <NotificationBell />
              <UserMenu />
            </nav>

            {/* Mobile controls (bottom nav replaces hamburger) */}
            <div className="flex md:!hidden items-center gap-1 flex-shrink-0">
              <LanguageSelector />
              <ThemeToggle />
              <WhatsNewButton />
              <button
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
        </div>
      </header>

      <Breadcrumbs />

      <main
        id="main-content"
        className={`flex-grow container mx-auto px-4 py-8 ${hasActivePlayer ? 'pb-40 md:pb-24' : 'pb-20 md:pb-8'}`}
      >
        <Outlet />
      </main>

      <GlobalAudioPlayer onPlayerStateChange={handlePlayerStateChange} />

      <BottomNav hasActivePlayer={hasActivePlayer} />
      <CommandPalette recentPages={recent} />
      <KeyboardShortcutsHelp open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <FeedbackButton hasActivePlayer={hasActivePlayer} />
      <PwaInstallPrompt />

      <footer
        role="contentinfo"
        className={`bg-gray-800 dark:bg-gray-950 text-white py-6 ${hasActivePlayer ? 'pb-40' : 'pb-20'} md:pb-6 mt-12 transition-colors`}
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
