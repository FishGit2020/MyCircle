import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { useBenchmarkHistory } from '../hooks/useBenchmarkHistory';

export default function BenchmarkHistory() {
  const { t } = useTranslation();
  const { runs, loading } = useBenchmarkHistory(20);

  if (loading) {
    return <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{t('app.loading')}</div>;
  }

  if (runs.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        {t('benchmark.history.none')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.history.title')}</h3>
      {runs.map(run => {
        const results = Array.isArray(run.results) ? run.results : [];
        const fastest = results
          .filter((r: any) => r.timing)
          .sort((a: any, b: any) => (b.timing?.tokensPerSecond ?? 0) - (a.timing?.tokensPerSecond ?? 0))[0];

        return (
          <div key={run.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t('benchmark.history.runAt', { date: new Date(run.createdAt).toLocaleString() })}
              </div>
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                {t('benchmark.history.endpoints', { count: String(results.length) })}
              </span>
            </div>
            {results.length > 0 && (
              <div className="space-y-1.5">
                {results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{r.endpointName || r.endpointId}</span>
                    {r.error ? (
                      <span className="text-red-500 text-xs">{t('benchmark.results.error')}</span>
                    ) : r.timing ? (
                      <span className={`font-mono ${fastest && r === fastest ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}`}>
                        {r.timing.tokensPerSecond?.toFixed(1)} tok/s
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
