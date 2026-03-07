import React, { useState, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation, TranslationKey, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { WidgetType } from '../widgets/WidgetDashboard';

interface QuickAccessItem {
  path: string;
  labelKey: TranslationKey;
  color: string;
  darkColor: string;
  icon: React.ReactNode;
  /** WidgetType ID for pinning to dashboard, if applicable */
  widgetId?: WidgetType;
}

function useWidgetPinned(widgetId: WidgetType | undefined) {
  const [pinned, setPinned] = useState<boolean>(() => {
    if (!widgetId) return false;
    try {
      const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
      if (!stored) return false;
      const layout: Array<{ id: string; visible: boolean }> = JSON.parse(stored);
      const widget = layout.find(w => w.id === widgetId);
      return widget?.visible ?? false;
    } catch { return false; }
  });

  const toggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!widgetId) return;
    try {
      const stored = localStorage.getItem(StorageKeys.WIDGET_LAYOUT);
      const layout: Array<{ id: string; visible: boolean }> = stored ? JSON.parse(stored) : [];
      const idx = layout.findIndex(w => w.id === widgetId);
      if (idx >= 0) {
        layout[idx] = { ...layout[idx], visible: !layout[idx].visible };
      }
      const next = !pinned;
      localStorage.setItem(StorageKeys.WIDGET_LAYOUT, JSON.stringify(layout));
      window.dispatchEvent(new Event(WindowEvents.WIDGET_LAYOUT_CHANGED));
      setPinned(next);
    } catch { /* ignore */ }
  }, [widgetId, pinned]);

  return { pinned, toggle };
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    path: '/weather',
    labelKey: 'nav.weather',
    color: 'bg-blue-50 text-blue-500',
    darkColor: 'dark:bg-blue-900/20 dark:text-blue-400',
    widgetId: 'weather',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  },
  {
    path: '/stocks',
    labelKey: 'nav.stocks',
    color: 'bg-green-50 text-green-500',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400',
    widgetId: 'stocks',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
  {
    path: '/podcasts',
    labelKey: 'nav.podcasts',
    color: 'bg-purple-50 text-purple-500',
    darkColor: 'dark:bg-purple-900/20 dark:text-purple-400',
    widgetId: 'nowPlaying',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  },
  {
    path: '/bible',
    labelKey: 'nav.bible',
    color: 'bg-amber-50 text-amber-500',
    darkColor: 'dark:bg-amber-900/20 dark:text-amber-400',
    widgetId: 'verse',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    path: '/worship',
    labelKey: 'nav.worship',
    color: 'bg-pink-50 text-pink-500',
    darkColor: 'dark:bg-pink-900/20 dark:text-pink-400',
    widgetId: 'worship',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  },
  {
    path: '/notebook',
    labelKey: 'nav.notebook',
    color: 'bg-indigo-50 text-indigo-500',
    darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400',
    widgetId: 'notebook',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    path: '/baby',
    labelKey: 'nav.baby',
    color: 'bg-rose-50 text-rose-500',
    darkColor: 'dark:bg-rose-900/20 dark:text-rose-400',
    widgetId: 'babyTracker',
    icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
  },
  {
    path: '/child-dev',
    labelKey: 'nav.childDev',
    color: 'bg-teal-50 text-teal-500',
    darkColor: 'dark:bg-teal-900/20 dark:text-teal-400',
    widgetId: 'childDev',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    path: '/youth-tracker',
    labelKey: 'nav.youthTracker',
    color: 'bg-lime-50 text-lime-500',
    darkColor: 'dark:bg-lime-900/20 dark:text-lime-400',
    widgetId: 'youthTracker',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    path: '/flashcards',
    labelKey: 'nav.flashcards',
    color: 'bg-teal-50 text-teal-500',
    darkColor: 'dark:bg-teal-900/20 dark:text-teal-400',
    widgetId: 'flashcards',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  },
  {
    path: '/daily-log',
    labelKey: 'nav.dailyLog',
    color: 'bg-amber-50 text-amber-600',
    darkColor: 'dark:bg-amber-900/20 dark:text-amber-400',
    widgetId: 'dailyLog',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  },
  {
    path: '/files',
    labelKey: 'nav.cloudFiles',
    color: 'bg-cyan-50 text-cyan-500',
    darkColor: 'dark:bg-cyan-900/20 dark:text-cyan-400',
    widgetId: 'cloudFiles',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" /></svg>,
  },
  {
    path: '/ai',
    labelKey: 'nav.ai',
    color: 'bg-violet-50 text-violet-500',
    darkColor: 'dark:bg-violet-900/20 dark:text-violet-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
  {
    path: '/library',
    labelKey: 'nav.digitalLibrary',
    color: 'bg-indigo-50 text-indigo-500',
    darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400',
    widgetId: 'digitalLibrary',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  },
  {
    path: '/family-games',
    labelKey: 'nav.familyGames',
    color: 'bg-fuchsia-50 text-fuchsia-500',
    darkColor: 'dark:bg-fuchsia-900/20 dark:text-fuchsia-400',
    widgetId: 'familyGames',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  },
  {
    path: '/hiking',
    labelKey: 'nav.hikingMap',
    color: 'bg-green-50 text-green-600',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400',
    widgetId: 'hikingMap',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  },
  {
    path: '/doc-scanner',
    labelKey: 'nav.docScanner',
    color: 'bg-sky-50 text-sky-500',
    darkColor: 'dark:bg-sky-900/20 dark:text-sky-400',
    widgetId: 'docScanner',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
  {
    path: '/benchmark',
    labelKey: 'nav.benchmark',
    color: 'bg-orange-50 text-orange-500',
    darkColor: 'dark:bg-orange-900/20 dark:text-orange-400',
    widgetId: 'benchmark',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>,
  },
  {
    path: '/immigration',
    labelKey: 'nav.immigration',
    color: 'bg-sky-50 text-sky-500',
    darkColor: 'dark:bg-sky-900/20 dark:text-sky-400',
    widgetId: 'immigration',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
  },
];

function QuickAccessTile({ item }: { item: QuickAccessItem }) {
  const { t } = useTranslation();
  const { pinned, toggle } = useWidgetPinned(item.widgetId);

  return (
    <div className="relative group">
      <Link
        to={item.path}
        className="flex flex-col items-center gap-1.5 md:gap-2 p-2.5 md:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 active:bg-gray-50 dark:active:bg-gray-700 transition-all w-full"
      >
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${item.color} ${item.darkColor}`}>
          {item.icon}
        </div>
        <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
          {t(item.labelKey)}
        </span>
      </Link>
      {item.widgetId && (
        <button
          type="button"
          onClick={toggle}
          title={pinned ? t('home.unpinWidget') : t('home.pinWidget')}
          aria-label={pinned ? t('home.unpinWidget') : t('home.pinWidget')}
          aria-pressed={pinned}
          className={`absolute top-1 right-1 p-0.5 rounded transition-all ${
            pinned
              ? 'text-yellow-400 opacity-100'
              : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100'
          } hover:text-yellow-400 dark:hover:text-yellow-400`}
        >
          <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default function QuickAccessTiles() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('home.quickAccess')}>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {t('home.quickAccess')}
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
        {QUICK_ACCESS_ITEMS.map(item => (
          <QuickAccessTile key={item.path} item={item} />
        ))}
      </div>
    </section>
  );
}
