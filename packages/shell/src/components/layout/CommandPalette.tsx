import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import type { RecentPage } from '../../hooks/useRecentlyVisited';

interface PaletteItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'navigation' | 'recent';
}

interface Props {
  recentPages?: RecentPage[];
}

/** Map route paths to their i18n label keys */
const ROUTE_LABEL_KEYS: Record<string, string> = {
  '/weather': 'commandPalette.goToWeather',
  '/stocks': 'commandPalette.goToStocks',
  '/podcasts': 'commandPalette.goToPodcasts',
  '/bible': 'commandPalette.goToBible',
  '/worship': 'commandPalette.goToWorship',
  '/notebook': 'commandPalette.goToNotebook',
  '/baby': 'commandPalette.goToBaby',
  '/ai': 'commandPalette.goToAi',
};

const clockIcon = (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function CommandPalette({ recentPages = [] }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Ctrl+K / Cmd+K to toggle
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Build recent items from the recentPages prop (exclude current page)
  const recentItems: PaletteItem[] = useMemo(() =>
    recentPages
      .filter(p => p.path !== location.pathname)
      .slice(0, 3)
      .map(p => {
        const basePath = '/' + p.path.split('/').filter(Boolean)[0];
        const labelKey = ROUTE_LABEL_KEYS[basePath];
        return {
          id: `recent-${p.path}`,
          label: labelKey ? t(labelKey) : p.path,
          description: p.path,
          icon: clockIcon,
          action: () => { navigate(p.path); setOpen(false); },
          category: 'recent' as const,
        };
      }),
    [recentPages, location.pathname, navigate, t]
  );

  const navItems: PaletteItem[] = [
    {
      id: 'nav-home', label: t('bottomNav.home'), description: '/',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
      action: () => { navigate('/'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-weather', label: t('commandPalette.goToWeather'), description: '/weather',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
      action: () => { navigate('/weather'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-stocks', label: t('commandPalette.goToStocks'), description: '/stocks',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      action: () => { navigate('/stocks'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-podcasts', label: t('commandPalette.goToPodcasts'), description: '/podcasts',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
      action: () => { navigate('/podcasts'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-bible', label: t('commandPalette.goToBible'), description: '/bible',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      action: () => { navigate('/bible'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-worship', label: t('commandPalette.goToWorship'), description: '/worship',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
      action: () => { navigate('/worship'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-notebook', label: t('commandPalette.goToNotebook'), description: '/notebook',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
      action: () => { navigate('/notebook'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-baby', label: t('commandPalette.goToBaby'), description: '/baby',
      icon: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
      action: () => { navigate('/baby'); setOpen(false); }, category: 'navigation',
    },
    {
      id: 'nav-ai', label: t('commandPalette.goToAi'), description: '/ai',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
      action: () => { navigate('/ai'); setOpen(false); }, category: 'navigation',
    },
  ];

  // Combine recent + nav for filtering; when searching, search across all items
  const allItems = [...recentItems, ...navItems];

  const filtered = query.trim()
    ? allItems.filter(item =>
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      )
    : allItems;

  // Split filtered results into recent and nav sections
  const filteredRecent = filtered.filter(i => i.category === 'recent');
  const filteredNav = filtered.filter(i => i.category === 'navigation');

  // Flat list for keyboard navigation
  const flatList = [...filteredRecent, ...filteredNav];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, flatList.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && flatList[selectedIndex]) {
      flatList[selectedIndex].action();
    }
  }, [flatList, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.querySelector(`[data-palette-index="${selectedIndex}"]`) as HTMLElement | null;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!open) return null;

  let globalIndex = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

      {/* Palette */}
      <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder={t('commandPalette.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white text-sm placeholder-gray-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-72 overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">{t('commandPalette.noResults')}</p>
          ) : (
            <>
              {/* Recent pages section */}
              {filteredRecent.length > 0 && (
                <>
                  <p className="px-4 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('commandPalette.recentPages')}
                  </p>
                  {filteredRecent.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <button
                        key={item.id}
                        data-palette-index={idx}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{item.icon}</span>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.description}</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}

              {/* Navigation section */}
              {filteredNav.length > 0 && (
                <>
                  <p className="px-4 py-1 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    {t('commandPalette.quickActions')}
                  </p>
                  {filteredNav.map((item) => {
                    const idx = globalIndex++;
                    return (
                      <button
                        key={item.id}
                        data-palette-index={idx}
                        onClick={item.action}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                          idx === selectedIndex
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                        onMouseEnter={() => setSelectedIndex(idx)}
                      >
                        <span className="flex-shrink-0 text-gray-400 dark:text-gray-500">{item.icon}</span>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.description}</span>
                        )}
                      </button>
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">&uarr;&darr;</kbd>
            {t('commandPalette.navigate')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">&crarr;</kbd>
            {t('commandPalette.select')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">esc</kbd>
            {t('commandPalette.close')}
          </span>
        </div>
      </div>
    </div>
  );
}
