import React from 'react';
import { Link } from 'react-router';
import { useTranslation, TranslationKey } from '@mycircle/shared';

interface QuickAccessItem {
  path: string;
  labelKey: TranslationKey;
  color: string;
  darkColor: string;
  icon: React.ReactNode;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    path: '/weather',
    labelKey: 'nav.weather',
    color: 'bg-blue-50 text-blue-500',
    darkColor: 'dark:bg-blue-900/20 dark:text-blue-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>,
  },
  {
    path: '/stocks',
    labelKey: 'nav.stocks',
    color: 'bg-green-50 text-green-500',
    darkColor: 'dark:bg-green-900/20 dark:text-green-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  },
  {
    path: '/podcasts',
    labelKey: 'nav.podcasts',
    color: 'bg-purple-50 text-purple-500',
    darkColor: 'dark:bg-purple-900/20 dark:text-purple-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  },
  {
    path: '/bible',
    labelKey: 'nav.bible',
    color: 'bg-amber-50 text-amber-500',
    darkColor: 'dark:bg-amber-900/20 dark:text-amber-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  },
  {
    path: '/worship',
    labelKey: 'nav.worship',
    color: 'bg-pink-50 text-pink-500',
    darkColor: 'dark:bg-pink-900/20 dark:text-pink-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>,
  },
  {
    path: '/notebook',
    labelKey: 'nav.notebook',
    color: 'bg-indigo-50 text-indigo-500',
    darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    path: '/baby',
    labelKey: 'nav.baby',
    color: 'bg-rose-50 text-rose-500',
    darkColor: 'dark:bg-rose-900/20 dark:text-rose-400',
    icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>,
  },
  {
    path: '/child-dev',
    labelKey: 'nav.childDev',
    color: 'bg-teal-50 text-teal-500',
    darkColor: 'dark:bg-teal-900/20 dark:text-teal-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  },
  {
    path: '/chinese',
    labelKey: 'nav.chinese',
    color: 'bg-red-50 text-red-500',
    darkColor: 'dark:bg-red-900/20 dark:text-red-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>,
  },
  {
    path: '/english',
    labelKey: 'nav.english',
    color: 'bg-sky-50 text-sky-500',
    darkColor: 'dark:bg-sky-900/20 dark:text-sky-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364V3" /></svg>,
  },
  {
    path: '/ai',
    labelKey: 'nav.ai',
    color: 'bg-violet-50 text-violet-500',
    darkColor: 'dark:bg-violet-900/20 dark:text-violet-400',
    icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>,
  },
];

export default function QuickAccessTiles() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('home.quickAccess')}>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
        {t('home.quickAccess')}
      </h3>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
        {QUICK_ACCESS_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1.5 md:gap-2 p-2.5 md:p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 active:bg-gray-50 dark:active:bg-gray-700 transition-all"
          >
            <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center ${item.color} ${item.darkColor}`}>
              {item.icon}
            </div>
            <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
              {t(item.labelKey)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
