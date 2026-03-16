import React from 'react';
import { useTranslation, WindowEvents } from '@mycircle/shared';
import { useAuth } from '../../context/AuthContext';

const HikingMapWidget = React.memo(function HikingMapWidget() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid;
  const [myCount, setMyCount] = React.useState<number | null>(null);
  const [publicCount, setPublicCount] = React.useState<number | null>(null);

  React.useEffect(() => {
    let unsubMy: (() => void) | undefined;
    let unsubPublic: (() => void) | undefined;

    function subscribe() {
      const hr = (window as any).__hikingRoutes; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!hr) return;
      // Personal routes (only when signed in)
      if (uid && hr.subscribe) {
        unsubMy = hr.subscribe((routes: any[]) => setMyCount(routes.length)); // eslint-disable-line @typescript-eslint/no-explicit-any
      } else {
        setMyCount(null);
      }
      // Public routes (always visible)
      if (hr.subscribePublic) {
        unsubPublic = hr.subscribePublic((routes: any[]) => setPublicCount(routes.length)); // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    subscribe();

    // Re-subscribe when hiking data changes externally (e.g. route saved from MFE)
    const handler = () => { unsubMy?.(); unsubPublic?.(); subscribe(); };
    window.addEventListener(WindowEvents.HIKING_ROUTES_CHANGED, handler);
    return () => {
      unsubMy?.();
      unsubPublic?.();
      window.removeEventListener(WindowEvents.HIKING_ROUTES_CHANGED, handler);
    };
  }, [uid]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.hikingMap')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.hikingMapDesc')}</p>
        </div>
      </div>
      <div className="flex gap-3 mt-1">
        {uid && myCount !== null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('hiking.myRoutes')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{myCount}</span>
            </span>
          </div>
        )}
        {publicCount !== null && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {t('hiking.communityRoutes')}: <span className="font-semibold text-gray-800 dark:text-gray-200">{publicCount}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default HikingMapWidget;
