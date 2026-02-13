import { useTranslation } from '@mycircle/shared';
import type { ToolCall } from '../hooks/useAiChat';

interface ToolCallDisplayProps {
  toolCalls: ToolCall[];
}

const TOOL_ICONS: Record<string, string> = {
  getWeather: '\u2601\uFE0F',
  searchCities: '\uD83D\uDD0D',
  getStockQuote: '\uD83D\uDCC8',
  getCryptoPrices: '\uD83E\uDE99',
  navigateTo: '\uD83E\uDDED',
};

const TOOL_LABEL_KEYS: Record<string, string> = {
  getWeather: 'ai.toolWeather',
  searchCities: 'ai.toolCitySearch',
  getStockQuote: 'ai.toolStockQuote',
  getCryptoPrices: 'ai.toolCrypto',
  navigateTo: 'ai.toolNavigate',
};

export default function ToolCallDisplay({ toolCalls }: ToolCallDisplayProps) {
  const { t } = useTranslation();

  if (toolCalls.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label={t('ai.toolsUsed')}>
      {toolCalls.map((tc, i) => (
        <span
          key={i}
          role="listitem"
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium"
        >
          <span aria-hidden="true">{TOOL_ICONS[tc.name] || '\uD83D\uDD27'}</span>
          {t(TOOL_LABEL_KEYS[tc.name] || 'ai.toolGeneric')}
          {tc.args && Object.keys(tc.args).length > 0 && (
            <span className="text-blue-500 dark:text-blue-400">
              ({Object.values(tc.args).join(', ')})
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
