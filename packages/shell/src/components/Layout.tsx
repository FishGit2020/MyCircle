import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router';
import { useTranslation } from '@weather/shared';
import ThemeToggle from './ThemeToggle';
import UnitToggle from './UnitToggle';
import SpeedToggle from './SpeedToggle';
import UserMenu from './UserMenu';
import NotificationBell from './NotificationBell';
import OfflineIndicator from './OfflineIndicator';
import LanguageSelector from './LanguageSelector';
import { useRemoteConfigContext } from '../context/RemoteConfigContext';

export default function Layout() {
  const { t } = useTranslation();
  const { config, loading: configLoading } = useRemoteConfigContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside (excluding the toggle button)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        toggleRef.current && !toggleRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  const navLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `text-sm font-medium transition ${
      isActive
        ? 'text-blue-600 dark:text-blue-400'
        : 'text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400'
    }`;
  };

  const mobileNavLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    return `block px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
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
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">MyCircle</h1>
            </Link>

            {/* Desktop nav (hidden on mobile) */}
            <nav aria-label="Main navigation" className="hidden md:flex items-center space-x-4">
              <Link to="/" className={navLinkClass('/')}>
                {t('nav.home')}
              </Link>
              <Link to="/stocks" className={navLinkClass('/stocks')}>
                {t('nav.stocks')}
              </Link>
              <Link to="/podcasts" className={navLinkClass('/podcasts')}>
                {t('nav.podcasts')}
              </Link>
              <Link to="/ai" className={navLinkClass('/ai')}>
                {t('nav.ai')}
              </Link>
              <LanguageSelector />
              <UnitToggle />
              <SpeedToggle />
              <ThemeToggle />
              <NotificationBell />
              <UserMenu />
            </nav>

            {/* Mobile controls: small buttons + hamburger */}
            <div className="flex md:!hidden items-center space-x-2">
              <LanguageSelector />
              <UnitToggle />
              <SpeedToggle />
              <ThemeToggle />
              <NotificationBell />
              <button
                ref={toggleRef}
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none transition-colors"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile dropdown menu */}
          {menuOpen && (
            <div ref={menuRef} className="md:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
              <Link to="/" className={mobileNavLinkClass('/')}>
                {t('nav.home')}
              </Link>
              <Link to="/stocks" className={mobileNavLinkClass('/stocks')}>
                {t('nav.stocks')}
              </Link>
              <Link to="/podcasts" className={mobileNavLinkClass('/podcasts')}>
                {t('nav.podcasts')}
              </Link>
              <Link to="/ai" className={mobileNavLinkClass('/ai')}>
                {t('nav.ai')}
              </Link>
              <div className="px-3 py-2">
                <UserMenu />
              </div>
            </div>
          )}
        </div>
      </header>

      <main id="main-content" className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer role="contentinfo" className="bg-gray-800 dark:bg-gray-950 text-white py-6 mt-12 transition-colors">
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
            {', & '}
            <a
              href="https://podcastindex.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              PodcastIndex
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
                  {key}: <span className="ml-1 font-mono text-blue-400">{value}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
