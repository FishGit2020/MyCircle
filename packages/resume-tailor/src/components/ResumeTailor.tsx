import React, { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation, PageContent, useQuery, useLazyQuery, GET_BENCHMARK_ENDPOINTS, GET_BENCHMARK_ENDPOINT_MODELS } from '@mycircle/shared';
import FactBankEditor from './FactBankEditor';

const ResumeGenerator = lazy(() => import('./ResumeGenerator'));
const ApplicationsLog = lazy(() => import('./ApplicationsLog'));

type Tab = 'factBank' | 'generate' | 'applications';

const MODEL_STORAGE_KEY = 'mycircle-resume-model';
const ENDPOINT_STORAGE_KEY = 'mycircle-resume-endpoint';

export default function ResumeTailor() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('factBank');

  // Fetch user's Ollama endpoints
  const { data: endpointsData } = useQuery(GET_BENCHMARK_ENDPOINTS, {
    fetchPolicy: 'cache-and-network',
  });
  const endpoints: Array<{ id: string; url: string; name: string }> = useMemo(
    () => endpointsData?.benchmarkEndpoints ?? [],
    [endpointsData]
  );

  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(() => {
    try { return localStorage.getItem(ENDPOINT_STORAGE_KEY) || ''; } catch { return ''; }
  });

  const [fetchModels, { data: modelsData, loading: modelsLoading }] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);
  const models: string[] = useMemo(
    () => modelsData?.benchmarkEndpointModels ?? [],
    [modelsData]
  );

  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try { return localStorage.getItem(MODEL_STORAGE_KEY) || ''; } catch { return ''; }
  });

  // Auto-select first endpoint when endpoints load
  useEffect(() => {
    if (endpoints.length > 0) {
      if (!selectedEndpointId || !endpoints.some(ep => ep.id === selectedEndpointId)) {
        const first = endpoints[0].id;
        setSelectedEndpointId(first);
        try { localStorage.setItem(ENDPOINT_STORAGE_KEY, first); } catch { /* */ }
      }
    }
  }, [endpoints, selectedEndpointId]);

  // Fetch models when endpoint changes
  useEffect(() => {
    if (selectedEndpointId) {
      fetchModels({ variables: { endpointId: selectedEndpointId }, fetchPolicy: 'network-only' });
    }
  }, [selectedEndpointId, fetchModels]);

  // Auto-select first available model
  useEffect(() => {
    if (models.length > 0 && (!selectedModel || !models.includes(selectedModel))) {
      const first = models[0];
      setSelectedModel(first);
      try { localStorage.setItem(MODEL_STORAGE_KEY, first); } catch { /* */ }
    }
  }, [models, selectedModel]);

  const handleEndpointChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedEndpointId(id);
    try { localStorage.setItem(ENDPOINT_STORAGE_KEY, id); } catch { /* */ }
  }, []);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value;
    setSelectedModel(model);
    try { localStorage.setItem(MODEL_STORAGE_KEY, model); } catch { /* */ }
  }, []);

  return (
    <PageContent>
      <div className="flex flex-col min-h-0 flex-1">
        {/* Model/Endpoint selector */}
        {endpoints.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <label className="sr-only" htmlFor="resume-endpoint-select">{t('resumeTailor.model.endpoint')}</label>
            <select
              id="resume-endpoint-select"
              value={selectedEndpointId}
              onChange={handleEndpointChange}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[150px] truncate min-h-[36px]"
            >
              {endpoints.map(ep => (
                <option key={ep.id} value={ep.id}>{ep.name || ep.url}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="resume-model-select">{t('resumeTailor.model.model')}</label>
            <select
              id="resume-model-select"
              value={selectedModel}
              onChange={handleModelChange}
              disabled={modelsLoading || models.length === 0}
              className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[180px] truncate disabled:opacity-50 min-h-[36px]"
            >
              {modelsLoading ? (
                <option value="">{t('resumeTailor.model.loadingModels')}</option>
              ) : models.length === 0 ? (
                <option value="">{t('resumeTailor.model.noModels')}</option>
              ) : (
                models.map(m => <option key={m} value={m}>{m}</option>)
              )}
            </select>
          </div>
        )}

        {/* Tab bar */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          {(['factBank', 'generate', 'applications'] as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors min-h-[44px] ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {t(`resumeTailor.tabs.${tab}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-auto">
          {activeTab === 'factBank' && (
            <FactBankEditor model={selectedModel} endpointId={selectedEndpointId || null} />
          )}
          {activeTab === 'generate' && (
            <Suspense fallback={<LoadingSpinner />}>
              <ResumeGenerator model={selectedModel} endpointId={selectedEndpointId || null} />
            </Suspense>
          )}
          {activeTab === 'applications' && (
            <Suspense fallback={<LoadingSpinner />}>
              <ApplicationsLog />
            </Suspense>
          )}
        </div>
      </div>
    </PageContent>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
