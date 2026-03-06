import React from 'react';
import { useTranslation, StorageKeys, WindowEvents } from '@mycircle/shared';

const BenchmarkWidget = React.memo(function BenchmarkWidget() {
  const { t } = useTranslation();
  const [summary, setSummary] = React.useState<{ lastRunAt?: string; fastestEndpoint?: string; fastestTps?: number } | null>(null);

  React.useEffect(() => {
    function load() {
      try {
        const raw = localStorage.getItem(StorageKeys.BENCHMARK_CACHE);
        if (raw) setSummary(JSON.parse(raw));
        else setSummary(null);
      } catch { /* ignore */ }
    }
    load();
    window.addEventListener(WindowEvents.BENCHMARK_CHANGED, load);
    return () => window.removeEventListener(WindowEvents.BENCHMARK_CHANGED, load);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{t('widgets.benchmark')}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.benchmarkDesc')}</p>
        </div>
      </div>
      {summary?.fastestEndpoint ? (
        <div className="space-y-1">
          <p className="text-xs text-indigo-600 dark:text-indigo-400/70">
            {t('widgets.benchmarkFastest').replace('{endpoint}', summary.fastestEndpoint).replace('{tps}', String(summary.fastestTps?.toFixed(1) ?? '?'))}
          </p>
          {summary.lastRunAt && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('widgets.benchmarkLastRun').replace('{date}', new Date(summary.lastRunAt).toLocaleDateString())}
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('widgets.noBenchmark')}</p>
      )}
    </div>
  );
});

export default BenchmarkWidget;
