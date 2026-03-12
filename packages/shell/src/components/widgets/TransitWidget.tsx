import React, { useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';

const RECENT_STOPS_KEY = 'transit-recent-stops';

const TransitWidget = React.memo(function TransitWidget() {
  const { t } = useTranslation();
  const [recentCount, setRecentCount] = React.useState(0);

  useEffect(() => {
    function load() {
      try {
        const stored = localStorage.getItem(RECENT_STOPS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setRecentCount(parsed.length);
        } else {
          setRecentCount(0);
        }
      } catch { /* ignore */ }
    }
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.transit')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.transitDesc')}</p>
        </div>
      </div>
      {recentCount > 0 ? (
        <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">
          {t('widgets.transitRecentCount' as any).replace('{count}', String(recentCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.transitNoRecent' as any)}</p>
      )}
    </div>
  );
});

export default TransitWidget;
