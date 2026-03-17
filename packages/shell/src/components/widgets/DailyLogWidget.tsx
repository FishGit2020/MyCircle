import React, { useEffect } from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const DailyLogWidget = React.memo(function DailyLogWidget() {
  const { t } = useTranslation();
  const [entryCount, setEntryCount] = React.useState(0);

  useEffect(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    function countThisMonth(entries: any[]): number { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!Array.isArray(entries)) return 0;
      return entries.filter((e: any) => e.date && e.date.startsWith(currentMonth)).length; // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.DAILY_LOG_CACHE);
        if (raw) {
          setEntryCount(countThisMonth(JSON.parse(raw)));
        } else {
          setEntryCount(0);
        }
      } catch { setEntryCount(0); }
    }
    load();
    // Also try the bridge API for fresh data
    const api = window.__workTracker;
    if (api?.getAll) {
      api.getAll().then((entries: any[]) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setEntryCount(countThisMonth(entries));
        try { localStorage.setItem(StorageKeys.DAILY_LOG_CACHE, JSON.stringify(entries)); } catch { /* ignore */ }
      }).catch(() => { /* ignore */ });
    }
    window.addEventListener(WindowEvents.DAILY_LOG_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.DAILY_LOG_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.dailyLog')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.dailyLogDesc')}</p>
        </div>
      </div>
      {entryCount > 0 ? (
        <p className="text-xs text-amber-600 dark:text-amber-400/70">
          {t('widgets.dailyLogEntries').replace('{count}', String(entryCount))}
        </p>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noDailyLogEntries')}</p>
      )}
    </div>
  );
});

export default DailyLogWidget;
