import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const TravelMapWidget = React.memo(function TravelMapWidget() {
  const { t } = useTranslation();
  const [pinCount, setPinCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(StorageKeys.TRAVEL_PINS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setPinCount(parsed.length);
          else setPinCount(0);
        } else {
          setPinCount(0);
        }
      } catch { /* ignore */ }
    }
    load();

    window.addEventListener(WindowEvents.TRAVEL_PINS_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.TRAVEL_PINS_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">
            {t('widgets.travelMap' as any)}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('widgets.travelMapDesc' as any)}
          </p>
        </div>
      </div>
      {pinCount > 0 ? (
        <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
          {(t('widgets.travelMapPinCount' as any) as string).replace('{count}', String(pinCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('widgets.travelMapNoPins' as any)}
        </p>
      )}
    </div>
  );
});

export default TravelMapWidget;
