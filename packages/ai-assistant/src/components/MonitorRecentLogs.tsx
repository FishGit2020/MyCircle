import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface ToolCallLog {
  name: string;
  durationMs: number | null;
  error: string | null;
}

interface LogEntry {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  toolCalls: ToolCallLog[];
  questionPreview: string;
  answerPreview: string;
  status: string;
  error: string | null;
}

interface Props {
  logs?: LogEntry[];
  loading: boolean;
}

function latencyColorClass(ms: number): string {
  if (ms < 2000) return 'text-green-600 dark:text-green-400';
  if (ms < 5000) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function providerBadge(provider: string): string {
  if (provider === 'ollama') return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
  return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MonitorRecentLogs({ logs, loading }: Props) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading && !logs) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded mb-2" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">{t('ai.monitor.recentLogs')}</p>

      {!logs || logs.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">{t('ai.monitor.noLogs')}</p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-1">
          {logs.map(log => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  aria-expanded={isExpanded}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm">
                    {/* Provider badge */}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${providerBadge(log.provider)}`}>
                      {log.provider}
                    </span>
                    {/* Question preview */}
                    <span className="flex-1 truncate text-gray-700 dark:text-gray-200 text-xs">
                      {log.questionPreview || '—'}
                    </span>
                    {/* Latency */}
                    <span className={`text-xs font-mono ${latencyColorClass(log.latencyMs)}`}>
                      {(log.latencyMs / 1000).toFixed(1)}s
                    </span>
                    {/* Tokens */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {log.inputTokens + log.outputTokens}t
                    </span>
                    {/* Tool chips */}
                    {log.toolCalls.length > 0 && (
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded">
                        {log.toolCalls.map(tc => tc.name).join(', ')}
                      </span>
                    )}
                    {/* Status */}
                    {log.status === 'error' ? (
                      <span className="w-4 h-4 text-red-500" title={t('ai.monitor.error')}>&#x2717;</span>
                    ) : (
                      <span className="w-4 h-4 text-green-500" title={t('ai.monitor.success')}>&#x2713;</span>
                    )}
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 text-xs space-y-2">
                    <div className="flex gap-2 text-gray-400 dark:text-gray-500">
                      <span>{formatTime(log.timestamp)}</span>
                      <span>{log.model}</span>
                    </div>
                    {log.questionPreview && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">{t('ai.monitor.question')}</p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{log.questionPreview}</p>
                      </div>
                    )}
                    {log.answerPreview && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">{t('ai.monitor.answer')}</p>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{log.answerPreview}</p>
                      </div>
                    )}
                    {log.toolCalls.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">{t('ai.monitor.tools')}</p>
                        <div className="space-y-1">
                          {log.toolCalls.map((tc, i) => (
                            <div key={i} className="flex gap-2">
                              <span className="font-mono text-gray-600 dark:text-gray-300">{tc.name}</span>
                              {tc.durationMs != null && (
                                <span className={latencyColorClass(tc.durationMs)}>{tc.durationMs}ms</span>
                              )}
                              {tc.error && <span className="text-red-500">{tc.error}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {log.error && (
                      <p className="text-red-500">{log.error}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
