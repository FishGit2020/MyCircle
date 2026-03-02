import React, { useState, useEffect } from 'react';
import { useTranslation, useLazyQuery, GET_BENCHMARK_ENDPOINT_MODELS } from '@mycircle/shared';
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
  const [model, setModel] = useState(() => {
    try { return localStorage.getItem('benchmark-model') || 'gemma2:2b'; } catch { return 'gemma2:2b'; }
  });
  const [selectedPromptId, setSelectedPromptId] = useState('simple');
  const [customPrompt, setCustomPrompt] = useState('');

  // Model discovery: fetch models from the first selected endpoint (or first available)
  const [fetchModels, { data: modelsData }] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);
  const discoveredModels: string[] = modelsData?.benchmarkEndpointModels ?? [];

  // Auto-discover from first available endpoint even before user checks any
  const discoveryEndpointId = selectedEndpoints[0] || endpoints[0]?.id;
  useEffect(() => {
    if (discoveryEndpointId) {
      fetchModels({ variables: { endpointId: discoveryEndpointId } });
    }
  }, [discoveryEndpointId, fetchModels]);

  // Sync model state when discovered models arrive and current value isn't valid
  useEffect(() => {
    if (discoveredModels.length > 0 && !discoveredModels.includes(model)) {
      const newModel = discoveredModels[0];
      setModel(newModel);
      try { localStorage.setItem('benchmark-model', newModel); } catch { /* */ }
    }
  }, [discoveredModels]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleEndpoint = (id: string) => {
    setSelectedEndpoints(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleRun = async () => {
    const prompt = selectedPromptId === 'custom'
      ? customPrompt
      : BENCHMARK_PROMPTS.find(p => p.id === selectedPromptId)?.prompt || '';
    if (!prompt || selectedEndpoints.length === 0) return;

    const results = await runBenchmark(selectedEndpoints, model, prompt);
    onResults(results);

    // Analytics: track benchmark run completion
    const successful = results.filter(r => !r.error);
    const avgTps = successful.length > 0
      ? successful.reduce((sum, r) => sum + (r.timing?.tokensPerSecond || 0), 0) / successful.length
      : 0;
    window.__logAnalyticsEvent?.('benchmark_run_complete', {
      endpoint_count: selectedEndpoints.length,
      model,
      prompt_type: selectedPromptId,
      successful_count: successful.length,
      error_count: results.length - successful.length,
      avg_tokens_per_sec: Math.round(avgTps * 10) / 10,
    });
  };

  return (
    <div className="space-y-5">
      {/* Endpoint Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('benchmark.runner.selectEndpoints')}</label>
        {endpoints.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('benchmark.runner.noEndpoints')}</p>
        ) : (
          <div className="space-y-1.5">
            {endpoints.map(ep => (
              <label key={ep.id} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <input
                  type="checkbox"
                  checked={selectedEndpoints.includes(ep.id)}
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
            ))}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('benchmark.runner.selectModel')}</label>
        <select
          value={model}
          onChange={e => { setModel(e.target.value); try { localStorage.setItem('benchmark-model', e.target.value); } catch { /* */ } }}
          disabled={running || discoveredModels.length === 0}
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {discoveredModels.length === 0 ? (
            <option value="">{t('app.loading')}</option>
          ) : (
            discoveredModels.map(m => (
              <option key={m} value={m}>{m}</option>
            ))
          )}
        </select>
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
        disabled={running || selectedEndpoints.length === 0 || !model.trim()}
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
