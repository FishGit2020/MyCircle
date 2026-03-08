import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { ROUTE_LABEL_KEYS } from '../../routeConfig';
import { ROUTE_SEGMENT_TO_WIDGET } from '../widgets/widgetConfig';
import { useWidgetPinned } from '../../hooks/useWidgetPinned';

function resolveDetailLabel(
  firstSegment: string,
  segments: string[],
  searchParams: URLSearchParams,
  t: (key: string) => string,
): string {
  switch (firstSegment) {
    case 'weather':
      if (segments[1] === 'compare') return t('nav.compare');
      return searchParams.get('name') || t('nav.detail');
    case 'stocks':
      return segments[1];
    case 'worship':
      if (segments[1] === 'new') return t('worship.newSong');
      if (segments[2] === 'edit') return t('worship.editSong');
      return t('nav.detail');
    case 'notebook':
      if (segments[1] === 'new') return t('notebook.newNote');
      return t('notebook.editNote');
    case 'family-games': {
      const gameMap: Record<string, string> = {
        trivia: 'games.trivia',
        math: 'games.mathChallenge',
        word: 'games.wordGame',
        memory: 'games.memoryMatch',
        headsup: 'games.headsUp',
      };
      return t(gameMap[segments[1]] || 'nav.detail');
    }
    default:
      return t('nav.detail');
  }
}

function PinButton({ segment }: { segment: string }) {
  const { t } = useTranslation();
  const widgetId = ROUTE_SEGMENT_TO_WIDGET[segment];
  const { pinned, toggle } = useWidgetPinned(widgetId);

  if (!widgetId) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      title={pinned ? t('home.unpinWidget') : t('home.pinWidget')}
      aria-label={pinned ? t('home.unpinWidget') : t('home.pinWidget')}
      aria-pressed={pinned}
      className={`ml-2 p-1 rounded transition-colors ${
        pinned
          ? 'text-yellow-400 dark:text-yellow-300'
          : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400 dark:hover:text-yellow-300'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill={pinned ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
      </svg>
    </button>
  );
}

export default function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mfeDetail, setMfeDetail] = useState<string | null>(null);

  // Compute root section early so we can use it as effect dependency
  const firstSegmentForEffect = location.pathname.split('/').filter(Boolean)[0] || '';

  // Listen for MFE-provided breadcrumb detail (e.g. book title from digital library)
  useEffect(() => {
    const handler = (e: Event) => setMfeDetail((e as CustomEvent).detail || null);
    window.addEventListener(WindowEvents.BREADCRUMB_DETAIL, handler);
    return () => window.removeEventListener(WindowEvents.BREADCRUMB_DETAIL, handler);
  }, []);

  // Clear MFE detail only when navigating to a different top-level section,
  // not when going deeper within the same section (e.g. /library → /library/:id)
  useEffect(() => { setMfeDetail(null); }, [firstSegmentForEffect]);

  // Don't show breadcrumbs on the home page
  if (location.pathname === '/') return null;

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const labelKey = ROUTE_LABEL_KEYS[firstSegment];
  if (!labelKey) return null;

  const hasDetail = segments.length > 1;
  const tabParam = searchParams.get('tab');

  return (
    <nav aria-label={t('nav.breadcrumbLabel')} className="container mx-auto px-4 py-2 flex items-center">
      <ol className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1 flex-1 min-w-0">
        <li>
          <Link
            to="/"
            className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            {t('nav.home')}
          </Link>
        </li>
        <li aria-hidden="true" className="select-none">/</li>
        {hasDetail ? (
          <>
            <li>
              <Link
                to={`/${firstSegment}`}
                onClick={() => {
                  window.dispatchEvent(new Event('breadcrumb-navigate-parent'));
                  setMfeDetail(null);
                }}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {t(labelKey)}
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]">
              {mfeDetail || resolveDetailLabel(firstSegment, segments, searchParams, t)}
            </li>
          </>
        ) : tabParam ? (
          <>
            <li>
              <Link
                to={`/${firstSegment}`}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {t(labelKey)}
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
              {t(`${firstSegment}.tabs.${tabParam}` as any)}
            </li>
          </>
        ) : mfeDetail ? (
          <>
            <li>
              <Link
                to={`/${firstSegment}`}
                onClick={() => {
                  window.dispatchEvent(new Event('breadcrumb-navigate-parent'));
                  setMfeDetail(null);
                }}
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {t(labelKey)}
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[200px]">
              {mfeDetail}
            </li>
          </>
        ) : (
          <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
            {t(labelKey)}
          </li>
        )}
      </ol>
      <PinButton segment={firstSegment} />
    </nav>
  );
}
