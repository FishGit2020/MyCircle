import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import BenchmarkRunner from './BenchmarkRunner';
import EndpointManager from './EndpointManager';
import ResultsDashboard from './ResultsDashboard';
import BenchmarkHistory from './BenchmarkHistory';
import { useBenchmark } from '../hooks/useBenchmark';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

type Tab = 'run' | 'endpoints' | 'results' | 'history';

const TAB_KEYS: Tab[] = ['run', 'endpoints', 'results', 'history'];

export default function ModelBenchmark() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('run');
  const [latestResults, setLatestResults] = useState<BenchmarkRunResult[]>([]);
  const { saveRun } = useBenchmark();
  const [saving, setSaving] = useState(false);

  const handleResults = useCallback((results: BenchmarkRunResult[]) => {
    setLatestResults(results);
    setActiveTab('results');
  }, []);

  const handleSave = useCallback(async () => {
    if (latestResults.length === 0) return;
    setSaving(true);
    try {
      await saveRun(latestResults);
    } finally {
      setSaving(false);
    }
  }, [latestResults, saveRun]);

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-8">
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
            {tab === 'results' && latestResults.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                {latestResults.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'run' && <BenchmarkRunner onResults={handleResults} />}
        {activeTab === 'endpoints' && <EndpointManager />}
        {activeTab === 'results' && <ResultsDashboard results={latestResults} onSave={handleSave} saving={saving} />}
        {activeTab === 'history' && <BenchmarkHistory />}
      </div>
    </div>
  );
}
