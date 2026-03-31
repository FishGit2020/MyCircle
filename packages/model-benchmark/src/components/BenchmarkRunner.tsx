import React, { useState, useCallback } from 'react';
import { useTranslation, useLazyQuery, GET_BENCHMARK_ENDPOINT_MODELS, StorageKeys } from '@mycircle/shared';
import { useEndpoints } from '../hooks/useEndpoints';
import { BENCHMARK_PROMPTS } from '../hooks/useBenchmark';
import type { BenchmarkRunResult, JudgeConfig } from '../hooks/useBenchmark';
import type { useBenchmark } from '../hooks/useBenchmark';

interface Props {
  onResults: (results: BenchmarkRunResult[]) => void;
  benchmark: ReturnType<typeof useBenchmark>;
  currentPromptIndex: number | null;
  totalPrompts: number;
}

export default function BenchmarkRunner({ onResults, benchmark, currentPromptIndex, totalPrompts }: Props) {
  const { t } = useTranslation();
  const { endpoints } = useEndpoints();
  const { running, scoring, currentEndpoint, runBenchmark, scoreResults } = benchmark;

  const [selectedEndpoints, setSelectedEndpoints] = useState<string[]>([]);
  const [modelMap, setModelMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(StorageKeys.BENCHMARK_MODEL_MAP);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const [discoveredModels, setDiscoveredModels] = useState<Record<string, string[]>>({});
  const [discoveryLoading, setDiscoveryLoading] = useState<Record<string, boolean>>({});
  const [discoveryErrors, setDiscoveryErrors] = useState<Record<string, boolean>>({});

  // Multi-prompt selection: persisted to localStorage
  const [selectedPromptIds, setSelectedPromptIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(StorageKeys.BENCHMARK_SELECTED_PROMPTS);
      return saved ? JSON.parse(saved) : ['simple'];
    } catch { return ['simple']; }
  });
  const [customPrompt, setCustomPrompt] = useState('');

  const [judgeKey, setJudgeKey] = useState<string>(() => {
    try {
      return localStorage.getItem(StorageKeys.BENCHMARK_JUDGE) || 'gemini';
    } catch { return 'gemini'; }
  });

  const [fetchModelsQuery] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);

  const persistModelMap = useCallback((next: Record<string, string>) => {
    setModelMap(next);
    try { localStorage.setItem(StorageKeys.BENCHMARK_MODEL_MAP, JSON.stringify(next)); } catch { /* */ }
  }, []);

  const persistSelectedPromptIds = useCallback((ids: string[]) => {
    setSelectedPromptIds(ids);
    try { localStorage.setItem(StorageKeys.BENCHMARK_SELECTED_PROMPTS, JSON.stringify(ids)); } catch { /* */ }
  }, []);

  const discoverModels = useCallback(async (endpointId: string) => {
    setDiscoveryLoading(prev => ({ ...prev, [endpointId]: true }));
    setDiscoveryErrors(prev => ({ ...prev, [endpointId]: false }));
    try {
      const { data } = await fetchModelsQuery({ variables: { endpointId }, fetchPolicy: 'network-only' });
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
    } catch {
      setDiscoveryErrors(prev => ({ ...prev, [endpointId]: true }));
    }
    setDiscoveryLoading(prev => ({ ...prev, [endpointId]: false }));
  }, [fetchModelsQuery]);

  const toggleEndpoint = (id: string) => {
    const isRemoving = selectedEndpoints.includes(id);
    setSelectedEndpoints(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
    // Discover models when checking (not unchecking) an endpoint, or if previous discovery errored
    if (!isRemoving && (!discoveredModels[id] || discoveryErrors[id])) {
      discoverModels(id);
    }
  };

  const handleModelChange = (endpointId: string, model: string) => {
    persistModelMap({ ...modelMap, [endpointId]: model });
  };

  const togglePrompt = (id: string) => {
    persistSelectedPromptIds(
      selectedPromptIds.includes(id)
        ? selectedPromptIds.filter(p => p !== id)
        : [...selectedPromptIds, id]
    );
  };

  const selectAllPrompts = () => {
    persistSelectedPromptIds(BENCHMARK_PROMPTS.map(p => p.id));
  };

  const handleJudgeChange = (key: string) => {
    setJudgeKey(key);
    try { localStorage.setItem(StorageKeys.BENCHMARK_JUDGE, key); } catch { /* */ }
  };

  const getJudgeConfig = useCallback((): JudgeConfig | null => {
    if (judgeKey === 'none') return null;
    if (judgeKey === 'gemini') return { provider: 'gemini', label: 'Gemini (cloud)' };
    // Format: "ollama:{endpointId}:{model}"
    const parts = judgeKey.split(':');
    if (parts.length >= 3 && parts[0] === 'ollama') {
      const epId = parts[1];
      const model = parts.slice(2).join(':');
      const ep = endpoints.find(e => e.id === epId);
      return { provider: 'ollama', endpointId: epId, model, label: `${ep?.name || epId}/${model}` };
    }
    return { provider: 'gemini', label: 'Gemini (cloud)' };
  }, [judgeKey, endpoints]);

  const handleRun = async () => {
    // Resolve selected prompt IDs to prompt strings
    const prompts: string[] = [];
    for (const id of selectedPromptIds) {
      if (id === 'custom') {
        if (customPrompt.trim()) prompts.push(customPrompt.trim());
      } else {
        const found = BENCHMARK_PROMPTS.find(p => p.id === id);
        if (found) prompts.push(found.prompt);
      }
    }
    if (prompts.length === 0 || selectedEndpoints.length === 0) return;

    const endpointModels = selectedEndpoints.map(id => ({
      endpointId: id,
      model: modelMap[id] || '',
    }));
    if (endpointModels.some(em => !em.model.trim())) return;

    let results = await runBenchmark(endpointModels, prompts);

    // Score results with judge model if configured
    const judge = getJudgeConfig();
    if (judge) {
      results = await scoreResults(results, judge);
    }

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
      prompt_count: prompts.length,
      successful_count: successful.length,
      error_count: results.length - successful.length,
      avg_tokens_per_sec: Math.round(avgTps * 10) / 10,
    });
  };

  const currentEndpointLabel = endpoints.find(ep => ep.id === currentEndpoint)?.name ?? currentEndpoint ?? '';

  const runDisabledReason = (() => {
    if (running || scoring) return null;
    if (selectedEndpoints.length === 0) return t('benchmark.runner.needEndpoint');
    if (selectedEndpoints.some(id => discoveryLoading[id])) return null; // loading, no hint needed
    if (selectedEndpoints.some(id => !modelMap[id]?.trim())) return t('benchmark.runner.needModel');
    if (selectedPromptIds.length === 0) return t('benchmark.runner.needPrompt');
    if (selectedPromptIds.includes('custom') && !customPrompt.trim() && selectedPromptIds.length === 1) return t('benchmark.runner.needCustomPrompt');
    return null;
  })();
  const runDisabled = running || scoring
    || selectedEndpoints.length === 0
    || selectedEndpoints.some(id => discoveryLoading[id] || !modelMap[id]?.trim())
    || selectedPromptIds.length === 0
    || (selectedPromptIds.includes('custom') && !customPrompt.trim() && selectedPromptIds.length === 1);

  return (
    <div className="space-y-5">
      {/* Endpoint Selection with inline model dropdowns */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('benchmark.runner.selectEndpoints')}</label>
          <a
            href="/setup"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            {t('benchmark.runner.manageEndpoints')}
          </a>
        </div>
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
                      {discoveryErrors[ep.id] ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500 dark:text-red-400">{t('benchmark.runner.modelDiscoveryError')}</span>
                          <button
                            type="button"
                            onClick={() => discoverModels(ep.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {t('benchmark.runner.retryModels')}
                          </button>
                        </div>
                      ) : (
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
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Batch progress indicator */}
      {running && totalPrompts > 1 && (
        <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300 animate-pulse">
          {t('benchmark.runner.batchProgress', {
            endpoint: currentEndpointLabel,
            current: String((currentPromptIndex ?? 0) + 1),
            total: String(totalPrompts),
          })}
        </div>
      )}

      {/* Prompt Selection — multi-select checkboxes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('benchmark.runner.selectPrompts')}</label>
          <button
            type="button"
            onClick={selectAllPrompts}
            disabled={running}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
          >
            {t('benchmark.runner.allPrompts')}
          </button>
        </div>
        <div className="space-y-1.5">
          {BENCHMARK_PROMPTS.map(p => (
            <label key={p.id} className="flex items-center gap-2 cursor-pointer rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <input
                type="checkbox"
                checked={selectedPromptIds.includes(p.id)}
                onChange={() => togglePrompt(p.id)}
                disabled={running}
                className="rounded text-blue-600"
              />
              <span className="text-sm text-gray-800 dark:text-white">{t(p.labelKey)}</span>
            </label>
          ))}
          <label className="flex items-center gap-2 cursor-pointer rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            <input
              type="checkbox"
              checked={selectedPromptIds.includes('custom')}
              onChange={() => togglePrompt('custom')}
              disabled={running}
              className="rounded text-blue-600"
            />
            <span className="text-sm text-gray-800 dark:text-white">Custom</span>
          </label>
        </div>
        {selectedPromptIds.includes('custom') && (
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

      {/* Judge Model Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('benchmark.runner.judgeModel')}</label>
        <select
          value={judgeKey}
          onChange={e => handleJudgeChange(e.target.value)}
          disabled={running || scoring}
          aria-label={t('benchmark.runner.judgeModel')}
          className="w-full max-w-xs px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="none">{t('benchmark.runner.judgeNone')}</option>
          <option value="gemini">{t('benchmark.runner.judgeGemini')}</option>
          {endpoints.map(ep => {
            const epModels = discoveredModels[ep.id] ?? [];
            return epModels.map(m => (
              <option key={`ollama:${ep.id}:${m}`} value={`ollama:${ep.id}:${m}`}>
                {ep.name} / {m}
              </option>
            ));
          })}
        </select>
      </div>

      {/* Run Button */}
      <div>
        <button
          type="button"
          onClick={handleRun}
          disabled={runDisabled}
          className="w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition flex items-center justify-center gap-2"
        >
          {running || scoring ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {scoring ? t('benchmark.runner.scoring') : t('benchmark.runner.running')}
            </>
          ) : (
            t('benchmark.runner.run')
          )}
        </button>
        {runDisabledReason && (
          <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 text-center">{runDisabledReason}</p>
        )}
      </div>
    </div>
  );
}
