import React, { useState, useCallback } from 'react';
import { useTranslation, useLazyQuery, GET_BENCHMARK_ENDPOINT_MODELS, StorageKeys } from '@mycircle/shared';
import { useEndpoints } from '../hooks/useEndpoints';
import { useBenchmark, BENCHMARK_PROMPTS } from '../hooks/useBenchmark';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

interface Props {
  onResults: (results: BenchmarkRunResult[]) => void;
}

export default function BenchmarkRunner({ onResults }: Props) {
  const { t } = useTranslation();
  const { endpoints } = useEndpoints();
  const { running, currentEndpoint, runBenchmark } = useBenchmark();

  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [modelMap, setModelMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(StorageKeys.BENCHMARK_MODEL_MAP);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, string[]>>({});
  const [discoveryLoading, setDiscoveryLoading] = useState<Record<string, boolean>>({});
  const [selectedPromptId, setSelectedPromptId] = useState('simple');
  const [customPrompt, setCustomPrompt] = useState('');

  const [fetchModelsQuery] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);

  const persistModelMap = useCallback((next: Record<string, string>) => {
    setModelMap(next);
    try { localStorage.setItem(StorageKeys.BENCHMARK_MODEL_MAP, JSON.stringify(next)); } catch { /* */ }
  }, []);

  const discoverModels = useCallback(async (endpointId: string) => {
    setDiscoveryLoading(prev => ({ ...prev, [endpointId]: true }));
    try {
      const { data } = await fetchModelsQuery({ variables: { endpointId } });
      const models: string[] = data?.benchmarkEndpointModels ?? [];
      setDiscoveredModels(prev => ({ ...prev, [endpointId]: models }));
      // Auto-select first model if current selection is not valid
      setModelMap(prev => {
        if (models.length > 0 && !models.includes(prev[endpointId] ?? '')) {
          const next = { ...prev, [endpointId]: models[0] };
          try { localStorage.setItem(StorageKeys.BENCHMARK_MODEL_MAP, JSON.stringify(next)); } catch { /* */ }
          return next;
        }
        return prev;
      });
    } catch { /* ignore */ }
    setDiscoveryLoading(prev => ({ ...prev, [endpointId]: false }));
  }, [fetchModelsQuery]);

  const toggleEndpoint = (id: string) => {
    setSelectedEndpoints(prev => {
      if (prev.includes(id)) {
        return prev.filter(e => e !== id);
      }
      // Discover models when checking an endpoint
      if (!discoveredModels[id]) {
        discoverModels(id);
      }
      return [...prev, id];
    });
  };

  const handleModelChange = (endpointId: string, model: string) => {
    persistModelMap({ ...modelMap, [endpointId]: model });
  };

  const handleRun = async () => {
    const prompt = selectedPromptId === 'custom'
      ? customPrompt
      : BENCHMARK_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '';
    if (!prompt || selectedEndpoints.length === 0) return;

    const endpointModels = selectedEndpoints.map(id => ({
      endpointId: id,
      model: modelMap[id] || '',
    }));
    if (endpointModels.some(em => !em.model.trim())) return;

    const results = await runBenchmark(endpointModels, prompt);
    onResults(results);

    // Analytics: track benchmark run completion
    const successful = results.filter(r => !r.error);
    const avgTps = successful.length > 0
      ? successful.reduce((sum, r) => sum + (r.timing?.tokensPerSecond || 0), 0) / successful.length
      : 0;
    const uniqueModels = [...new Set(endpointModels.map(em => em.model))];
    window.__logAnalyticsEvent?.('benchmark_run_complete', {
      endpoint_count: selectedEndpoints.length,
      models: uniqueModels.join(','),
      prompt_type: selectedPromptId,
      successful_count: successful.length,
      error_count: results.length - successful.length,
      avg_tokens_per_sec: Math.round(avgTps * 10) / 10,
    });
  };

  const runDisabled = running
    || selectedEndpoints.length === 0
    || selectedEndpoints.some(id => !modelMap[id]?.trim());

  return (
    <div className="space-y-5">
      {/* Endpoint Selection with inline model dropdowns */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('benchmark.runner.selectEndpoints')}</label>
        {endpoints.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('benchmark.runner.noEndpoints')}</p>
        ) : (
          <div className="space-y-1.5">
            {endpoints.map(ep => {
              const isSelected = selectedEndpoints.includes(ep.id);
              const epModels = discoveredModels[ep.id] ?? [];
              const isLoading = discoveryLoading[ep.id] ?? false;

              return (
                <div key={ep.id} className="rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <label className="flex items-center gap-2 cursor-pointer p-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEndpoint(ep.id)}
                      className="rounded text-blue-600"
                      disabled={running}
                    />
                    <span className="text-sm text-gray-800 dark:text-white">{ep.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">({ep.url})</span>
                    {running && currentEndpoint === ep.id && (
                      <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 animate-pulse">{t('benchmark.runner.running')}</span>
                    )}
                  </label>
                  {isSelected && (
                    <div className="pl-8 pb-2">
                      <select
                        value={modelMap[ep.id] || ''}
                        onChange={e => handleModelChange(ep.id, e.target.value)}
                        disabled={running || isLoading || epModels.length === 0}
                        aria-label={t('benchmark.runner.selectModelFor', { endpoint: ep.name })}
                        className="w-full max-w-xs px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <option value="">{t('app.loading')}</option>
                        ) : epModels.length === 0 ? (
                          <option value="">{t('benchmark.runner.noModels')}</option>
                        ) : (
                          epModels.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prompt Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('benchmark.runner.selectPrompt')}</label>
        <div className="flex flex-wrap gap-2">
          {BENCHMARK_PROMPTS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPromptId(p.id)}
              disabled={running}
              className={`px-3 py-1.5 text-sm rounded-full border transition ${
                selectedPromptId === p.id
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {t(p.labelKey)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedPromptId('custom')}
            disabled={running}
            className={`px-3 py-1.5 text-sm rounded-full border transition ${
              selectedPromptId === 'custom'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-blue-400'
            }`}
          >
            Custom
          </button>
        </div>
        {selectedPromptId === 'custom' && (
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder={t('benchmark.runner.customPrompt')}
            disabled={running}
            rows={3}
            className="mt-2 w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      {/* Run Button */}
      <button
        type="button"
        onClick={handleRun}
        disabled={runDisabled}
        className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
      >
        {running ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('benchmark.runner.running')}
          </>
        ) : (
          t('benchmark.runner.run')
        )}
      </button>
    </div>
  );
}
