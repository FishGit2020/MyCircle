import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation, StorageKeys, PageContent } from '@mycircle/shared';
import BenchmarkRunner from './BenchmarkRunner';
import ResultsDashboard from './ResultsDashboard';
import BenchmarkHistory from './BenchmarkHistory';
import { useBenchmark } from '../hooks/useBenchmark';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

type Tab = 'run' | 'results' | 'history';

const TAB_KEYS: Tab[] = ['run', 'results', 'history'];
const VALID_TABS = new Set<string>(TAB_KEYS);

export default function ModelBenchmark() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: Tab = tabParam && VALID_TABS.has(tabParam) ? (tabParam as Tab) : 'run';

  const setActiveTab = useCallback((tab: Tab) => {
    setSearchParams(tab === 'run' ? {} : { tab }, { replace: true });
  }, [setSearchParams]);

  const [latestResults, setLatestResults] = useState<BenchmarkRunResult[]>(() => {
    try {
      const saved = localStorage.getItem(StorageKeys.BENCHMARK_RESULTS);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const benchmark = useBenchmark();
  const { saveRun, running, scoring, currentPromptIndex, totalPrompts } = benchmark;
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleResults = useCallback(async (results: BenchmarkRunResult[]) => {
    setLatestResults(results);
    try { localStorage.setItem(StorageKeys.BENCHMARK_RESULTS, JSON.stringify(results)); } catch { /* */ }
    setSaved(false);
    setSaveError('');
    setActiveTab('results');
    // Auto-save to history
    try {
      await saveRun(results);
      setSaved(true);
      window.__logAnalyticsEvent?.('benchmark_run_saved', {
        result_count: results.length,
      });
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    }
  }, [saveRun, setActiveTab]);

  const handleClearResults = useCallback(() => {
    setLatestResults([]);
    setSaved(false);
    setSaveError('');
    try { localStorage.removeItem(StorageKeys.BENCHMARK_RESULTS); } catch { /* */ }
  }, []);

  const busy = running || scoring;

  return (
    <PageContent maxWidth="4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('benchmark.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('benchmark.subtitle')}</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {TAB_KEYS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            role="tab"
            aria-selected={activeTab === tab}
          >
            {t(`benchmark.tabs.${tab}`)}
            {tab === 'run' && busy && (
              <svg className="inline-block w-3.5 h-3.5 ml-1.5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {tab === 'results' && latestResults.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                {latestResults.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content — Runner stays mounted (hidden) to preserve state during benchmark */}
      <div>
        <div className={activeTab === 'run' ? '' : 'hidden'}>
          <BenchmarkRunner onResults={handleResults} benchmark={benchmark} currentPromptIndex={currentPromptIndex} totalPrompts={totalPrompts} />
        </div>
        {activeTab === 'results' && <ResultsDashboard results={latestResults} saved={saved} saveError={saveError} onClear={handleClearResults} />}
        {activeTab === 'history' && <BenchmarkHistory />}
      </div>
    </PageContent>
  );
}
