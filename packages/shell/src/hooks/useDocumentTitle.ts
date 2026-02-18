import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { ROUTE_LABEL_KEYS } from '../routeConfig';
import { logEvent } from '../lib/firebase';

const APP_NAME = 'MyCircle';

/**
 * Updates document.title on every route change and fires a GA4 page_view event.
 * Skips the analytics event on initial render to avoid double-counting with
 * the automatic page_view that GA4 fires on script load.
 */
export function useDocumentTitle() {
  const { t } = useTranslation();
  const location = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const { pathname } = location;
    let title: string;

    if (pathname === '/') {
      title = APP_NAME;
    } else {
      const firstSegment = pathname.split('/').filter(Boolean)[0];
      const labelKey = firstSegment ? ROUTE_LABEL_KEYS[firstSegment] : undefined;
      const pageName = labelKey ? t(labelKey as any) : t('app.pageNotFound' as any);
      title = `${pageName} - ${APP_NAME}`;
    }

    document.title = title;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    logEvent('page_view', {
      page_path: pathname,
      page_title: title,
    });
  }, [location.pathname, t]);
}
