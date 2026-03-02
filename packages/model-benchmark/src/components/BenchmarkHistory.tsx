import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { useBenchmarkHistory } from '../hooks/useBenchmarkHistory';

export default function BenchmarkHistory() {
  const { t } = useTranslation();
  const { runs, loading, deleteRun } = useBenchmarkHistory(20);

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

  const handleDelete = async (id: string) => {
    if (!confirm(t('benchmark.history.deleteConfirm'))) return;
    await deleteRun(id);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.history.title')}</h3>
      {runs.map(run => {
        const results = Array.isArray(run.results) ? run.results : [];
        const fastest = results
          .filter((r: any) => r.timing)
          .sort((a: any, b: any) => (b.timing?.tokensPerSecond ?? 0) - (a.timing?.tokensPerSecond ?? 0))[0];
        // Show model + prompt from first result (same across endpoints in a run)
        const firstResult = results[0];
        const model = firstResult?.model;
        const prompt = firstResult?.prompt;

        return (
          <div key={run.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t('benchmark.history.runAt', { date: new Date(run.createdAt).toLocaleString() })}
                </div>
                {model && (
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {model}
                    {prompt && <span className="ml-2 italic truncate max-w-[200px] inline-block align-bottom">&ldquo;{prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt}&rdquo;</span>}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                  {t('benchmark.history.endpoints', { count: String(results.length) })}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(run.id)}
                  className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-0.5"
                  aria-label={t('benchmark.history.delete')}
                  title={t('benchmark.history.delete')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            {results.length > 0 && (
              <div className="space-y-1.5">
                {results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm gap-2">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{r.endpointName || r.endpointId}</span>
                    {r.error ? (
                      <span className="text-red-500 text-xs">{t('benchmark.results.error')}</span>
                    ) : r.timing ? (
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className={fastest && r === fastest ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-gray-600 dark:text-gray-400'}>
                          {r.timing.tokensPerSecond?.toFixed(1)} tok/s
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 hidden sm:inline" title={t('benchmark.results.ttft')}>
                          TTFT {r.timing.timeToFirstToken?.toFixed(2)}s
                        </span>
                        <span className="text-gray-400 dark:text-gray-500 hidden sm:inline" title={t('benchmark.results.totalTime')}>
                          {r.timing.totalDuration?.toFixed(2)}s
                        </span>
                      </div>
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
