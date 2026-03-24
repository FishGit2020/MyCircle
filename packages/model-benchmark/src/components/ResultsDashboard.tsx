import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';
import BenchmarkChart from './BenchmarkChart';

function QualityBadge({ score }: { score: number }) {
  const color = score >= 8
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : score >= 5
      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}

interface Props {
  results: BenchmarkRunResult[];
  saved: boolean;
  saveError?: string;
  onClear: () => void;
}

export default function ResultsDashboard({ results, saved, saveError, onClear }: Props) {
  const { t } = useTranslation();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

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

  const hasQuality = results.some(r => r.qualityScore != null && r.qualityScore > 0);
  const baseColSpan = 5 + (results.length > 1 ? 1 : 0) + (hasQuality ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t('benchmark.results.title')}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Table / Chart toggle */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-xs transition-colors min-h-[32px] ${
                viewMode === 'table'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('benchmark.results.tableView')}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              className={`px-3 py-1 text-xs transition-colors min-h-[32px] ${
                viewMode === 'chart'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {t('benchmark.results.chartView')}
            </button>
          </div>
          {saved && (
            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t('benchmark.results.autoSaved')}
            </span>
          )}
          <button
            type="button"
            onClick={() => { if (confirm(t('benchmark.results.clearConfirm'))) onClear(); }}
            className="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
          >
            {t('benchmark.results.clearAll')}
          </button>
        </div>
      </div>
      {saveError && (
        <div className="px-3 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg" role="alert">
          {saveError}
        </div>
      )}

      {/* Chart view */}
      {viewMode === 'chart' && (
        <BenchmarkChart results={results} />
      )}

      {/* Results Table + Token Counts — hidden in chart mode */}
      {viewMode === 'table' && (
      <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="py-2 px-3 text-left text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.endpoint')}</th>
              <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.tps')}</th>
              {hasQuality && (
                <th className="py-2 px-3 text-right text-gray-600 dark:text-gray-400 font-medium">{t('benchmark.results.quality')}</th>
              )}
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
              <React.Fragment key={i}>
                <tr
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                  onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-gray-800 dark:text-white">{r.endpointName}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{r.model}</div>
                  </td>
                  {r.error ? (
                    <td colSpan={baseColSpan} className="py-2.5 px-3 text-red-500 text-sm">
                      {t('benchmark.results.error')}: {r.error}
                    </td>
                  ) : r.timing ? (
                    <>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-mono font-semibold ${r.timing.tokensPerSecond === fastestTps ? 'text-green-600 dark:text-green-400' : 'text-gray-800 dark:text-white'}`}>
                          {r.timing.tokensPerSecond.toFixed(1)}
                        </span>
                      </td>
                      {hasQuality && (
                        <td className="py-2.5 px-3 text-right">
                          {r.qualityScore != null && r.qualityScore > 0 ? (
                            <QualityBadge score={r.qualityScore} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
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
                    <td colSpan={baseColSpan} className="py-2.5 px-3 text-gray-500 text-sm">—</td>
                  )}
                </tr>
                {expandedIdx === i && (
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <td colSpan={baseColSpan + 1} className="px-3 py-3 space-y-2">
                      {r.qualityFeedback && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                            {t('benchmark.results.quality')}
                            {r.qualityJudge && <span className="ml-1 font-normal">({t('benchmark.results.qualityJudge')}: {r.qualityJudge})</span>}
                          </div>
                          <div className="text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-2">
                            {r.qualityScore != null && r.qualityScore > 0 && <QualityBadge score={r.qualityScore} />}
                            <span className="ml-2">{r.qualityFeedback}</span>
                          </div>
                        </div>
                      )}
                      {r.response && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('benchmark.results.response')}</div>
                          <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-3 max-h-48 overflow-y-auto">
                            {r.response}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
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
      )}
    </div>
  );
}
