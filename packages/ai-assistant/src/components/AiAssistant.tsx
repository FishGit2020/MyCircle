import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useAiChat } from '../hooks/useAiChat';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const SUGGESTION_KEYS = [
  'ai.suggestWeather',
  'ai.suggestStocks',
  'ai.suggestCrypto',
  'ai.suggestNavigate',
  'ai.suggestCompare',
  'ai.suggestFlashcard',
  'ai.suggestBible',
  'ai.suggestPodcast',
] as const;

const DEBUG_STORAGE_KEY = 'ai-debug-mode';

export default function AiAssistant() {
  const { t } = useTranslation();
  const { messages, loading, error, canRetry, sendMessage, clearChat, retry } = useAiChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [debugMode, setDebugMode] = useState(() => {
    try { return localStorage.getItem(DEBUG_STORAGE_KEY) === 'true'; } catch { return false; }
  });

  const toggleDebug = useCallback(() => {
    setDebugMode(prev => {
      const next = !prev;
      try { localStorage.setItem(DEBUG_STORAGE_KEY, String(next)); } catch { /* */ }
      return next;
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="ai-assistant max-w-3xl mx-auto px-4 py-6 flex flex-col h-[calc(100vh-16rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <svg className="w-7 h-7 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            {t('ai.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('ai.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Debug toggle */}
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
          {messages.length > 0 && (
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

      {/* Messages area */}
      <div
        className={`flex-1 space-y-4 mb-4 min-h-0 ${messages.length > 0 || loading ? 'overflow-y-auto' : 'overflow-hidden'}`}
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

        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} debugMode={debugMode} />
        ))}

        {loading && (
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

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}
