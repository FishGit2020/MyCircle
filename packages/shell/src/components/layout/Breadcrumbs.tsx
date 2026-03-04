import React, { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { ROUTE_LABEL_KEYS } from '../../routeConfig';

function resolveDetailLabel(
  firstSegment: string,
  segments: string[],
  searchParams: URLSearchParams,
  t: (key: string) => string,
): string {
  switch (firstSegment) {
    case 'weather':
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

export default function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mfeDetail, setMfeDetail] = useState<string | null>(null);

  // Listen for MFE-provided breadcrumb detail (e.g. book title from digital library)
  useEffect(() => {
    const handler = (e: Event) => setMfeDetail((e as CustomEvent).detail || null);
    window.addEventListener(WindowEvents.BREADCRUMB_DETAIL, handler);
    return () => window.removeEventListener(WindowEvents.BREADCRUMB_DETAIL, handler);
  }, []);

  // Clear MFE detail on route change
  useEffect(() => { setMfeDetail(null); }, [location.pathname]);

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
    <nav aria-label={t('nav.breadcrumbLabel')} className="container mx-auto px-4 py-2">
      <ol className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-1">
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
                className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
              >
                {t(labelKey)}
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">/</li>
            <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
              {resolveDetailLabel(firstSegment, segments, searchParams, t)}
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
    </nav>
  );
}
