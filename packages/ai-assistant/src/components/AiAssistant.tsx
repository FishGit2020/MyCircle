import { useRef, useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation, useQuery, useLazyQuery, GET_OLLAMA_MODELS, GET_BENCHMARK_ENDPOINTS, GET_BENCHMARK_ENDPOINT_MODELS, EndpointManager, PageContent } from '@mycircle/shared';
import { useAiChatWithStreaming } from '../hooks/useAiChatWithStreaming';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import type { ChatMessage as ChatMessageType } from '../hooks/useAiChat';
import ToolCallDisplay from './ToolCallDisplay';

const AiMonitor = lazy(() => import('./AiMonitor'));

const SUGGESTION_KEYS = [
  'ai.suggestWeather',
  'ai.suggestStocks',
  'ai.suggestCrypto',
  'ai.suggestNavigate',
  'ai.suggestCompare',
  'ai.suggestFlashcard',
  'ai.suggestBible',
  'ai.suggestPodcast',
  'ai.suggestNote',
  'ai.suggestWorkEntry',
  'ai.suggestBaby',
  'ai.suggestImmigration',
  'ai.suggestChildDev',
] as const;

const DEBUG_STORAGE_KEY = 'ai-debug-mode';
const MODEL_STORAGE_KEY = 'mycircle-ai-model';
const ENDPOINT_STORAGE_KEY = 'mycircle-ai-endpoint';
const TOOL_MODE_STORAGE_KEY = 'mycircle-ai-tool-mode';

export default function AiAssistant() {
  const { t } = useTranslation();
  const { messages, loading, streaming, streamingContent, activeToolCalls, thinkingSteps, error, canRetry, sendMessage, clearChat, retry, abort } = useAiChatWithStreaming();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's Ollama endpoints
  const { data: endpointsData } = useQuery(GET_BENCHMARK_ENDPOINTS, {
    fetchPolicy: 'cache-and-network',
  });
  const endpoints: Array<{ id: string; url: string; name: string }> = endpointsData?.benchmarkEndpoints ?? [];

  const [selectedEndpoint, setSelectedEndpoint] = useState(() => {
    try { return localStorage.getItem(ENDPOINT_STORAGE_KEY) || ''; } catch { return ''; }
  });

  // Fetch models for the selected endpoint
  const [fetchModels, { data: modelsData, loading: modelsLoading }] = useLazyQuery(GET_BENCHMARK_ENDPOINT_MODELS);
  const models: string[] = modelsData?.benchmarkEndpointModels ?? [];

  // Also keep the old ollamaModels query as fallback for default endpoint
  const { data: defaultModelsData } = useQuery(GET_OLLAMA_MODELS);
  const defaultModels: string[] = defaultModelsData?.ollamaModels ?? [];

  // Use endpoint-specific models if available, else default
  const displayModels = selectedEndpoint && models.length > 0 ? models : defaultModels;

  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const VALID_TABS = new Set(['chat', 'endpoints', 'monitor']);
  const activeTab: 'chat' | 'endpoints' | 'monitor' = tabParam && VALID_TABS.has(tabParam) ? (tabParam as any) : 'chat';
  const setActiveTab = useCallback((tab: 'chat' | 'endpoints' | 'monitor') => {
    setSearchParams(tab === 'chat' ? {} : { tab }, { replace: true });
  }, [setSearchParams]);

  const [selectedModel, setSelectedModel] = useState(() => {
    try { return localStorage.getItem(MODEL_STORAGE_KEY) || ''; } catch { return ''; }
  });

  // When endpoints load, auto-select saved or first endpoint
  useEffect(() => {
    if (endpoints.length > 0) {
      if (!selectedEndpoint || !endpoints.some(ep => ep.id === selectedEndpoint)) {
        const first = endpoints[0].id;
        setSelectedEndpoint(first);
        try { localStorage.setItem(ENDPOINT_STORAGE_KEY, first); } catch { /* */ }
      }
    }
  }, [endpoints, selectedEndpoint]);

  // Fetch models when selected endpoint changes
  useEffect(() => {
    if (selectedEndpoint) {
      fetchModels({ variables: { endpointId: selectedEndpoint }, fetchPolicy: 'network-only' });
    }
  }, [selectedEndpoint, fetchModels]);

  // Reset to first available model if saved model is no longer in the list
  useEffect(() => {
    if (displayModels.length > 0 && (!selectedModel || !displayModels.includes(selectedModel))) {
      const first = displayModels[0];
      setSelectedModel(first);
      try { localStorage.setItem(MODEL_STORAGE_KEY, first); } catch { /* */ }
    }
  }, [displayModels, selectedModel]);

  const handleEndpointChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (loading || streaming) abort();
    const id = e.target.value;
    setSelectedEndpoint(id);
    try { localStorage.setItem(ENDPOINT_STORAGE_KEY, id); } catch { /* */ }
  }, [loading, streaming, abort]);

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    if (loading || streaming) abort();
    const model = e.target.value;
    setSelectedModel(model);
    try { localStorage.setItem(MODEL_STORAGE_KEY, model); } catch { /* */ }
  }, [loading, streaming, abort]);

  const [debugMode, setDebugMode] = useState(() => {
    try { return localStorage.getItem(DEBUG_STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const [toolMode, setToolMode] = useState<'native' | 'mcp'>(() => {
    try { return (localStorage.getItem(TOOL_MODE_STORAGE_KEY) as 'native' | 'mcp') || 'native'; } catch { return 'native'; }
  });

  const toggleDebug = useCallback(() => {
    setDebugMode(prev => {
      const next = !prev;
      try { localStorage.setItem(DEBUG_STORAGE_KEY, String(next)); } catch { /* */ }
      return next;
    });
  }, []);

  const handleToolModeChange = useCallback((mode: 'native' | 'mcp') => {
    setToolMode(mode);
    try { localStorage.setItem(TOOL_MODE_STORAGE_KEY, mode); } catch { /* */ }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, streaming, streamingContent]);

  return (
    <PageContent maxWidth="3xl" fill className="ai-assistant min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-2 mb-4">
        <div className="min-w-0 flex-shrink">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="truncate">{t('ai.title')}</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('ai.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Endpoint + Model selectors — shown when user has Ollama endpoints */}
          {activeTab === 'chat' && endpoints.length > 0 && (
            <>
              <label className="sr-only" htmlFor="ai-endpoint-select">{t('ai.endpointLabel')}</label>
              <select
                id="ai-endpoint-select"
                value={selectedEndpoint}
                onChange={handleEndpointChange}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 max-w-[120px] truncate"
              >
                {endpoints.map(ep => (
                  <option key={ep.id} value={ep.id}>{ep.name}</option>
                ))}
              </select>
              <label className="sr-only" htmlFor="ai-model-select">{t('ai.modelLabel')}</label>
              <select
                id="ai-model-select"
                value={selectedModel}
                onChange={handleModelChange}
                disabled={modelsLoading || displayModels.length === 0}
                className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-400 disabled:opacity-50 max-w-[140px] truncate"
              >
                {modelsLoading ? (
                  <option value="">{t('app.loading')}</option>
                ) : displayModels.length === 0 ? (
                  <option value="">{t('benchmark.runner.noModels')}</option>
                ) : (
                  displayModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))
                )}
              </select>
            </>
          )}
          {/* Tool mode toggle (Native / MCP) */}
          {activeTab === 'chat' && endpoints.length > 0 && (
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
              <button
                type="button"
                onClick={() => handleToolModeChange('native')}
                className={`text-xs px-2 py-1 transition-colors ${toolMode === 'native' ? 'bg-blue-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={t('ai.toolModeNative')}
              >
                {t('ai.toolModeNative')}
              </button>
              <button
                type="button"
                onClick={() => handleToolModeChange('mcp')}
                className={`text-xs px-2 py-1 transition-colors ${toolMode === 'mcp' ? 'bg-purple-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title={t('ai.toolModeMcp')}
              >
                MCP
              </button>
            </div>
          )}
          {/* Debug toggle */}
          {activeTab === 'chat' && (
            <button
              type="button"
              onClick={toggleDebug}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                debugMode
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              aria-label={t('ai.debugToggle')}
              title={t('ai.debugToggle')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </button>
          )}
          {activeTab === 'chat' && messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              aria-label={t('ai.clearChat')}
            >
              {t('ai.clearChat')}
            </button>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'chat'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('ai.tabChat')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'endpoints'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('ai.tabEndpoints')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monitor')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'monitor'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('ai.tabMonitor')}
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'endpoints' ? (
        <div className="flex-1 overflow-y-auto">
          <EndpointManager source="chat" />
        </div>
      ) : activeTab === 'monitor' ? (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-gray-400 dark:text-gray-500">Loading...</div>}>
          <AiMonitor />
        </Suspense>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Messages area */}
          <div
            className={`flex-1 space-y-4 mb-4 min-h-0 overflow-y-auto`}
            role="list"
            aria-label={t('ai.chatMessages')}
            aria-live="polite"
          >
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 dark:text-gray-500">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-lg font-medium">{t('ai.emptyTitle')}</p>
                <p className="text-sm mt-2 max-w-sm">{t('ai.emptyHint')}</p>

                {endpoints.length === 0 && (
                  <p className="text-sm mt-3 max-w-sm text-amber-500 dark:text-amber-400">{t('ai.noEndpointsHint')}</p>
                )}

                {/* Suggested prompts */}
                <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
                  {SUGGESTION_KEYS.map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => sendMessage(t(key))}
                      className="px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                debugMode={debugMode}
                isLatest={i === messages.length - 1 && msg.role === 'assistant' && !streaming}
              />
            ))}

            {/* Streaming/generating badge */}
            {(streaming || (loading && !streaming)) && (
              <div className="flex justify-start">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                  streaming
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                  {streaming ? t('ai.streamingBadge') : t('ai.generatingBadge')}
                </span>
              </div>
            )}

            {/* Thinking steps — show what the AI is doing before the response */}
            {streaming && thinkingSteps.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[75%] bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl rounded-bl-md px-4 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">{t('ai.thinking')}</span>
                  </div>
                  <ul className="space-y-0.5">
                    {thinkingSteps.map((step, i) => (
                      <li key={i} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        {i === thinkingSteps.length - 1 && !streamingContent ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0" />
                        ) : (
                          <svg className="w-3 h-3 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Streaming message — shows incremental content as it arrives */}
            {streaming && streamingContent && (
              <ChatMessage
                message={{ id: 'streaming', role: 'assistant', content: streamingContent, timestamp: Date.now() } as ChatMessageType}
                debugMode={debugMode}
                streaming
              />
            )}

            {/* Active tool calls during streaming */}
            {streaming && activeToolCalls.length > 0 && (
              <div className="flex justify-start">
                <div className="max-w-[85%] sm:max-w-[75%] bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <ToolCallDisplay toolCalls={activeToolCalls} debugMode={debugMode} />
                </div>
              </div>
            )}

            {/* Loading indicator — only when waiting for first response (not streaming) */}
            {loading && !streaming && (
              <div className="flex justify-start" role="status" aria-label={t('ai.thinking')}>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {t('ai.thinking')}
                  </div>
                </div>
              </div>
            )}

            {/* Streaming with no content yet — show "Connecting..." */}
            {streaming && !streamingContent && activeToolCalls.length === 0 && (
              <div className="flex justify-start" role="status" aria-label={t('ai.connecting')}>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    {t('ai.connecting')}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error display with retry */}
          {error && (
            <div className="mb-3 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between gap-2" role="alert">
              <span className="text-red-600 dark:text-red-400 text-sm">{error}</span>
              {canRetry && (
                <button
                  type="button"
                  onClick={retry}
                  className="flex-shrink-0 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline transition-colors"
                >
                  {t('ai.retry')}
                </button>
              )}
            </div>
          )}

          {/* Stop button */}
          {(loading || streaming) && (
            <div className="flex justify-center mb-2">
              <button
                type="button"
                onClick={abort}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                aria-label={t('ai.stop')}
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="6" width="12" height="12" rx="1" />
                </svg>
                {t('ai.stop')}
              </button>
            </div>
          )}

          {/* Input */}
          <ChatInput onSend={sendMessage} disabled={loading || streaming} />
        </div>
      )}
    </PageContent>
  );
}
