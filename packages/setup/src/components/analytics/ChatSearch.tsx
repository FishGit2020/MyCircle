import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation, useQuery, SQL_CHAT_SEARCH } from '@mycircle/shared';

interface SearchResult {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  questionPreview: string;
  answerPreview: string;
  latencyMs: number | null;
  totalTokens: number | null;
}

function highlightMatch(text: string, query: string): JSX.Element {
  if (!query.trim() || !text) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function ChatSearch() {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedQuery(value.trim());
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const { data, loading } = useQuery(SQL_CHAT_SEARCH, {
    variables: { query: debouncedQuery, limit: 50 },
    skip: !debouncedQuery,
    fetchPolicy: 'network-only',
  });

  const results: SearchResult[] = data?.sqlChatSearch || [];
  const hasSearched = debouncedQuery.length > 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
        {t('setup.search.title')}
      </h3>

      {/* Search Input */}
      <div className="relative max-w-xl">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t('setup.search.placeholder')}
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label={t('setup.search.title')}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && hasSearched && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">
          {t('setup.search.searching')}
        </div>
      )}

      {/* Results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
          {t('setup.search.noResults')}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
            >
              {/* Header row */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <time dateTime={result.timestamp}>
                    {new Date(result.timestamp).toLocaleString()}
                  </time>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <span className="font-medium text-gray-600 dark:text-gray-300">
                    {result.model}
                  </span>
                  {result.provider && (
                    <>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <span>{result.provider}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                  {result.latencyMs != null && <span>{Math.round(result.latencyMs)}ms</span>}
                  {result.totalTokens != null && (
                    <span>{result.totalTokens.toLocaleString()} tokens</span>
                  )}
                </div>
              </div>

              {/* Question */}
              {result.questionPreview && (
                <div className="text-sm text-gray-800 dark:text-gray-200">
                  <span className="font-medium text-blue-600 dark:text-blue-400 mr-1.5">Q:</span>
                  {highlightMatch(result.questionPreview, debouncedQuery)}
                </div>
              )}

              {/* Answer */}
              {result.answerPreview && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-green-600 dark:text-green-400 mr-1.5">A:</span>
                  {highlightMatch(result.answerPreview, debouncedQuery)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
