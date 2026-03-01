import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

interface Props {
  results: BenchmarkRunResult[];
  onSave: () => void;
  saving: boolean;
}

export default function ResultsDashboard({ results, onSave, saving }: Props) {
  const { t } = useTranslation();

  if (results.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        {t('benchmark.results.noResults')}
      </div>
    );
  }

  // Find fastest for speedup calculation
  const fastestTps = Math.max(
    ...results.filter(r => r.timing).map(r => r.timing!.tokensPerSecond)
  );
  const slowestTps = Math.min(
    ...results.filter(r => r.timing).map(r => r.timing!.tokensPerSecond)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.results.title')}</h3>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg transition"
        >
          {saving ? '...' : t('benchmark.results.save')}
        </button>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 px-3 text-left text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.endpoint')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.tps')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">{t('benchmark.results.promptTps')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium hidden md:table-cell">{t('benchmark.results.ttft')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.totalTime')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium hidden lg:table-cell">{t('benchmark.results.loadTime')}</th>
              {results.length > 1 && (
                <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.speedup')}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {results.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td className="py-2.5 px-3">
                  <div className="font-medium text-gray-800 dark:text-white">{r.endpointName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{r.model}</div>
                </td>
                {r.error ? (
                  <td colSpan={results.length > 1 ? 6 : 5} className="py-2.5 px-3 text-red-500 text-sm">
                    {t('benchmark.results.error')}: {r.error}
                  </td>
                ) : r.timing ? (
                  <>
                    <td className="py-2.5 px-3 text-right">
                      <span className={`font-mono font-semibold ${r.timing.tokensPerSecond === fastestTps ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
                        {r.timing.tokensPerSecond.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right hidden md:table-cell font-mono text-gray-700 dark:text-gray-300">
                      {r.timing.promptTokensPerSecond.toFixed(1)}
                    </td>
                    <td className="py-2.5 px-3 text-right hidden md:table-cell font-mono text-gray-700 dark:text-gray-300">
                      {r.timing.timeToFirstToken.toFixed(2)}s
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                      {r.timing.totalDuration.toFixed(2)}s
                    </td>
                    <td className="py-2.5 px-3 text-right hidden lg:table-cell font-mono text-gray-700 dark:text-gray-300">
                      {r.timing.loadDuration.toFixed(2)}s
                    </td>
                    {results.length > 1 && (
                      <td className="py-2.5 px-3 text-right">
                        {r.timing.tokensPerSecond === fastestTps ? (
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {slowestTps > 0 ? `${(fastestTps / slowestTps).toFixed(1)}x` : '—'}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">1.0x</span>
                        )}
                      </td>
                    )}
                  </>
                ) : (
                  <td colSpan={results.length > 1 ? 6 : 5} className="py-2.5 px-3 text-gray-500 text-sm">—</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Token Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {results.filter(r => r.timing).map((r, i) => (
          <div key={i} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-sm font-medium text-gray-800 dark:text-white mb-1">{r.endpointName}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
              <div>Eval: {r.timing!.evalCount} {t('benchmark.results.tokens')} in {r.timing!.evalDuration.toFixed(2)}s</div>
              <div>Prompt: {r.timing!.promptEvalCount} {t('benchmark.results.tokens')} in {r.timing!.promptEvalDuration.toFixed(2)}s</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
