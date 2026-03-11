import React from 'react';
import { Link } from 'react-router';
import { useTranslation, TranslationKey } from '@mycircle/shared';
import type { WidgetType } from '../widgets/WidgetDashboard';
import { useWidgetPinned } from '../../hooks/useWidgetPinned';
import { getIcon } from './iconRegistry';

interface QuickAccessItem {
  path: string;
  labelKey: TranslationKey;
  color: string;
  darkColor: string;
  /** Icon key from iconRegistry */
  iconKey: string;
  /** WidgetType ID for pinning to dashboard, if applicable */
  widgetId?: WidgetType;
}

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  { path: '/weather', labelKey: 'nav.weather', color: 'bg-blue-50 text-blue-500', darkColor: 'dark:bg-blue-900/20 dark:text-blue-400', widgetId: 'weather', iconKey: 'weather' },
  { path: '/stocks', labelKey: 'nav.stocks', color: 'bg-green-50 text-green-500', darkColor: 'dark:bg-green-900/20 dark:text-green-400', widgetId: 'stocks', iconKey: 'stocks' },
  { path: '/podcasts', labelKey: 'nav.podcasts', color: 'bg-purple-50 text-purple-500', darkColor: 'dark:bg-purple-900/20 dark:text-purple-400', widgetId: 'nowPlaying', iconKey: 'podcasts' },
  { path: '/bible', labelKey: 'nav.bible', color: 'bg-amber-50 text-amber-500', darkColor: 'dark:bg-amber-900/20 dark:text-amber-400', widgetId: 'verse', iconKey: 'bible' },
  { path: '/worship', labelKey: 'nav.worship', color: 'bg-pink-50 text-pink-500', darkColor: 'dark:bg-pink-900/20 dark:text-pink-400', widgetId: 'worship', iconKey: 'worship' },
  { path: '/notebook', labelKey: 'nav.notebook', color: 'bg-indigo-50 text-indigo-500', darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400', widgetId: 'notebook', iconKey: 'notebook' },
  { path: '/baby', labelKey: 'nav.baby', color: 'bg-rose-50 text-rose-500', darkColor: 'dark:bg-rose-900/20 dark:text-rose-400', widgetId: 'babyTracker', iconKey: 'baby' },
  { path: '/child-dev', labelKey: 'nav.childDev', color: 'bg-teal-50 text-teal-500', darkColor: 'dark:bg-teal-900/20 dark:text-teal-400', widgetId: 'childDev', iconKey: 'child-dev' },
  { path: '/flashcards', labelKey: 'nav.flashcards', color: 'bg-teal-50 text-teal-500', darkColor: 'dark:bg-teal-900/20 dark:text-teal-400', widgetId: 'flashcards', iconKey: 'flashcards' },
  { path: '/daily-log', labelKey: 'nav.dailyLog', color: 'bg-amber-50 text-amber-600', darkColor: 'dark:bg-amber-900/20 dark:text-amber-400', widgetId: 'dailyLog', iconKey: 'daily-log' },
  { path: '/files', labelKey: 'nav.cloudFiles', color: 'bg-cyan-50 text-cyan-500', darkColor: 'dark:bg-cyan-900/20 dark:text-cyan-400', widgetId: 'cloudFiles', iconKey: 'cloud-files' },
  { path: '/ai', labelKey: 'nav.ai', color: 'bg-violet-50 text-violet-500', darkColor: 'dark:bg-violet-900/20 dark:text-violet-400', widgetId: 'aiAssistant', iconKey: 'ai' },
  { path: '/library', labelKey: 'nav.digitalLibrary', color: 'bg-indigo-50 text-indigo-500', darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400', widgetId: 'digitalLibrary', iconKey: 'digital-library' },
  { path: '/family-games', labelKey: 'nav.familyGames', color: 'bg-fuchsia-50 text-fuchsia-500', darkColor: 'dark:bg-fuchsia-900/20 dark:text-fuchsia-400', widgetId: 'familyGames', iconKey: 'family-games' },
  { path: '/hiking', labelKey: 'nav.hikingMap', color: 'bg-green-50 text-green-600', darkColor: 'dark:bg-green-900/20 dark:text-green-400', widgetId: 'hikingMap', iconKey: 'hiking' },
  { path: '/doc-scanner', labelKey: 'nav.docScanner', color: 'bg-sky-50 text-sky-500', darkColor: 'dark:bg-sky-900/20 dark:text-sky-400', widgetId: 'docScanner', iconKey: 'doc-scanner' },
  { path: '/benchmark', labelKey: 'nav.benchmark', color: 'bg-orange-50 text-orange-500', darkColor: 'dark:bg-orange-900/20 dark:text-orange-400', widgetId: 'benchmark', iconKey: 'benchmark' },
  { path: '/immigration', labelKey: 'nav.immigration', color: 'bg-sky-50 text-sky-500', darkColor: 'dark:bg-sky-900/20 dark:text-sky-400', widgetId: 'immigration', iconKey: 'immigration' },
  { path: '/trips', labelKey: 'nav.tripPlanner' as any, color: 'bg-emerald-50 text-emerald-500', darkColor: 'dark:bg-emerald-900/20 dark:text-emerald-400', widgetId: 'tripPlanner', iconKey: 'trip-planner' },
  { path: '/polls', labelKey: 'nav.pollSystem' as any, color: 'bg-violet-50 text-violet-500', darkColor: 'dark:bg-violet-900/20 dark:text-violet-400', widgetId: 'pollSystem', iconKey: 'poll-system' },
  { path: '/radio', labelKey: 'nav.radio', color: 'bg-amber-50 text-amber-500', darkColor: 'dark:bg-amber-900/20 dark:text-amber-400', widgetId: 'radioStation', iconKey: 'radio' },
  { path: '/interview', labelKey: 'nav.interview', color: 'bg-indigo-50 text-indigo-500', darkColor: 'dark:bg-indigo-900/20 dark:text-indigo-400', widgetId: 'aiInterviewer', iconKey: 'interview' },
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
          {getIcon(item.iconKey)}
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
          className={`absolute top-1 right-1 p-0.5 rounded transition-colors ${
            pinned
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-300 dark:text-gray-600 hover:text-blue-400 dark:hover:text-blue-400'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
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
