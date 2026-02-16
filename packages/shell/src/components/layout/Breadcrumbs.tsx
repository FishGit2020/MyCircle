import React from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '@mycircle/shared';

/** Map from first path segment to i18n key */
const ROUTE_LABEL_KEYS: Record<string, string> = {
  weather: 'nav.weather',
  stocks: 'nav.stocks',
  podcasts: 'nav.podcasts',
  ai: 'nav.ai',
  bible: 'nav.bible',
  worship: 'nav.worship',
  notebook: 'nav.notebook',
  baby: 'nav.baby',
  compare: 'nav.compare',
};

export default function Breadcrumbs() {
  const { t } = useTranslation();
  const location = useLocation();

  // Don't show breadcrumbs on the home page
  if (location.pathname === '/') return null;

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const labelKey = ROUTE_LABEL_KEYS[firstSegment];
  if (!labelKey) return null;

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
        <li aria-current="page" className="font-medium text-gray-700 dark:text-gray-200">
          {t(labelKey)}
        </li>
      </ol>
    </nav>
  );
}
