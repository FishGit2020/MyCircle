import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ToolCall } from '../hooks/useAiChat';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
  debugMode?: boolean;
}

const TOOL_ICONS: Record<string, string> = {
  getWeather: '\u2601\uFE0F',
  searchCities: '\uD83D\uDD0D',
  getStockQuote: '\uD83D\uDCC8',
  getCryptoPrices: '\uD83E\uDE99',
  navigateTo: '\uD83E\uDDED',
  addFlashcard: '\uD83D\uDCDD',
  getBibleVerse: '\uD83D\uDCD6',
  searchPodcasts: '\uD83C\uDFA7',
  addBookmark: '\uD83D\uDD16',
  listFlashcards: '\uD83D\uDCCB',
};

const TOOL_LABEL_KEYS: Record<string, string> = {
  getWeather: 'ai.toolWeather',
  searchCities: 'ai.toolCitySearch',
  getStockQuote: 'ai.toolStockQuote',
  getCryptoPrices: 'ai.toolCrypto',
  navigateTo: 'ai.toolNavigate',
  addFlashcard: 'ai.toolFlashcard',
  getBibleVerse: 'ai.toolBibleVerse',
  searchPodcasts: 'ai.toolPodcastSearch',
  addBookmark: 'ai.toolBookmark',
  listFlashcards: 'ai.toolFlashcardList',
};

function JsonBlock({ data, label }: { data: unknown; label: string }) {
  const formatted = typeof data === 'string'
    ? (() => { try { return JSON.stringify(JSON.parse(data), null, 2); } catch { return data; } })()
    : JSON.stringify(data, null, 2);

  return (
    <div className="mt-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{label}</span>
      <pre className="mt-0.5 p-2 rounded bg-gray-50 dark:bg-gray-800 text-[11px] text-gray-700 dark:text-gray-300 overflow-x-auto max-h-40 whitespace-pre-wrap break-all font-mono">
        {formatted}
      </pre>
    </div>
  );
}

export default function ToolCallDisplay({ toolCalls, debugMode = false }: ToolCallDisplayProps) {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (toolCalls.length === 0) return null;

  const toggle = (i: number) => setExpandedIndex(prev => prev === i ? null : i);

  return (
    <div className="flex flex-col gap-2 mt-2" role="list" aria-label={t('ai.toolsUsed')}>
      {toolCalls.map((tc, i) => {
        const isExpanded = debugMode || expandedIndex === i;
        const hasResult = tc.result !== undefined && tc.result !== '';

        return (
          <div key={i} role="listitem" className="flex flex-col">
            <button
              type="button"
              onClick={() => toggle(i)}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors w-fit"
              aria-expanded={isExpanded}
            >
              <span aria-hidden="true">{TOOL_ICONS[tc.name] || '\uD83D\uDD27'}</span>
              {t(TOOL_LABEL_KEYS[tc.name] || 'ai.toolGeneric')}
              {tc.args && Object.keys(tc.args).length > 0 && (
                <span className="text-blue-500 dark:text-blue-400">
                  ({Object.values(tc.args).join(', ')})
                </span>
              )}
              <svg
                className={`w-3 h-3 ml-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExpanded && (
              <div className="mt-1 ml-2 pl-2 border-l-2 border-blue-200 dark:border-blue-800">
                {tc.args && Object.keys(tc.args).length > 0 && (
                  <JsonBlock data={tc.args} label={t('ai.debugArgs')} />
                )}
                {hasResult && (
                  <JsonBlock data={tc.result} label={t('ai.debugResult')} />
                )}
                {!hasResult && (
                  <div className="mt-1 text-[11px] text-gray-400 dark:text-gray-500 italic">
                    {t('ai.debugNoResult')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
