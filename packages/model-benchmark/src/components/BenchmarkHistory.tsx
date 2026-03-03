import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useBenchmarkHistory } from '../hooks/useBenchmarkHistory';

export default function BenchmarkHistory() {
  const { t } = useTranslation();
  const { runs, loading, deleteRun, clearAll } = useBenchmarkHistory(20);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

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

  const handleClearAll = async () => {
    if (!confirm(t('benchmark.history.clearAllConfirm'))) return;
    setClearing(true);
    try {
      await clearAll();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.history.title')}</h3>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={clearing}
          className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
        >
          {clearing ? '...' : t('benchmark.history.clearAll')}
        </button>
      </div>
      {runs.map(run => {
        const results = Array.isArray(run.results) ? run.results : [];
        const fastest = results
          .filter((r: any) => r.timing)
          .sort((a: any, b: any) => (b.timing?.tokensPerSecond ?? 0) - (a.timing?.tokensPerSecond ?? 0))[0];
        // Show model(s) + prompt from results (may differ across endpoints)
        const uniqueModels = [...new Set(results.map((r: any) => r.model).filter(Boolean))];
        const model = uniqueModels.join(', ');
        const prompt = results[0]?.prompt;
        const isExpanded = expandedRunId === run.id;

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
                  onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExpanded ? t('benchmark.history.hideDetails') : t('benchmark.history.showDetails')}
                </button>
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
            {/* Summary row */}
            {results.length > 0 && !isExpanded && (
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
            {/* Expanded detail view */}
            {isExpanded && results.length > 0 && (
              <div className="space-y-3 mt-2">
                {results.map((r: any, i: number) => (
                  <div key={i} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-sm font-medium text-gray-800 dark:text-white">{r.endpointName || r.endpointId}</span>
                        {r.model && <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">{r.model}</span>}
                      </div>
                      {r.timing && (
                        <span className={`text-sm font-mono font-semibold ${fastest && r === fastest ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                          {r.timing.tokensPerSecond?.toFixed(1)} tok/s
                        </span>
                      )}
                    </div>
                    {r.error && (
                      <div className="text-sm text-red-500 mb-2">{t('benchmark.results.error')}: {r.error}</div>
                    )}
                    {r.timing && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-2">
                        <div>
                          <span className="block text-gray-400 dark:text-gray-500">{t('benchmark.results.ttft')}</span>
                          <span className="font-mono">{r.timing.timeToFirstToken?.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 dark:text-gray-500">{t('benchmark.results.totalTime')}</span>
                          <span className="font-mono">{r.timing.totalDuration?.toFixed(2)}s</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 dark:text-gray-500">{t('benchmark.results.promptTps')}</span>
                          <span className="font-mono">{r.timing.promptTokensPerSecond?.toFixed(1)}</span>
                        </div>
                        <div>
                          <span className="block text-gray-400 dark:text-gray-500">{t('benchmark.results.loadTime')}</span>
                          <span className="font-mono">{r.timing.loadDuration?.toFixed(2)}s</span>
                        </div>
                      </div>
                    )}
                    {r.prompt && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('benchmark.results.request')}</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
                          {r.prompt}
                        </div>
                      </div>
                    )}
                    {r.response && (
                      <div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('benchmark.results.response')}</div>
                        <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 max-h-32 overflow-y-auto">
                          {r.response}
                        </div>
                      </div>
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
