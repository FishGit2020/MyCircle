import { useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useSessionHistory } from '../hooks/useSessionHistory';
import type { SessionSummary } from '../hooks/useSessionHistory';
import type { InterviewConfig } from '../hooks/useInterviewStateMachine';

interface SessionHistoryPanelProps {
  onOpen: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRerun?: (config: Partial<InterviewConfig> & { chapter: string; difficulty: string }) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatScore(score: number | null): string {
  if (score == null) return '—';
  return score.toFixed(1);
}

export default function SessionHistoryPanel({ onOpen, onDelete, onRerun }: SessionHistoryPanelProps) {
  const { t } = useTranslation();
  const {
    sessions,
    loading,
    chapterFilter,
    dateFilter,
    setChapterFilter,
    setDateFilter,
    loadSessions,
  } = useSessionHistory();

  useEffect(() => {
    loadSessions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Collect unique chapters from loaded sessions for filter dropdown
  const chapters = Array.from(new Set(sessions.map((s) => s.chapter).filter(Boolean))) as string[];

  const dateOptions = [
    { value: 'all', label: t('aiInterviewer.allTime') },
    { value: '7d', label: t('aiInterviewer.last7Days') },
    { value: '30d', label: t('aiInterviewer.last30Days') },
  ];

  return (
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
        <select
          value={chapterFilter ?? ''}
          onChange={(e) => setChapterFilter(e.target.value || null)}
          className="flex-1 min-w-[120px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.filterByChapter')}
        >
          <option value="">{t('aiInterviewer.allChapters')}</option>
          {chapters.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="flex-1 min-w-[100px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.filterByDate')}
        >
          {dateOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Session list */}
      <div className="max-h-64 overflow-y-auto px-4 py-2">
        {loading && (
          <p className="text-xs text-gray-400 dark:text-gray-500 py-2">{t('aiInterviewer.loading')}</p>
        )}
        {!loading && sessions.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-2">{t('aiInterviewer.noSessions')}</p>
        )}
        {!loading && sessions.length > 0 && (
          <div className="space-y-1">
            {sessions.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                onOpen={onOpen}
                onDelete={onDelete}
                onRerun={onRerun}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionRowProps {
  session: SessionSummary;
  onOpen: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onRerun?: (config: Partial<InterviewConfig> & { chapter: string; difficulty: string }) => void;
}

function SessionRow({ session, onOpen, onDelete, onRerun }: SessionRowProps) {
  const { t } = useTranslation();
  const isStructured = session.mode === 'question-bank' && session.chapter;

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5 text-xs border-b border-gray-100 dark:border-gray-700 last:border-0">
      {/* Left: metadata */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-500 dark:text-gray-400">{formatDate(session.createdAt)}</span>
          <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            isStructured
              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isStructured ? t('aiInterviewer.questionBankMode') : t('aiInterviewer.customMode')}
          </span>
          {session.overallScore != null && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {formatScore(session.overallScore)}/10
            </span>
          )}
        </div>
        <span className="text-gray-700 dark:text-gray-300 truncate max-w-[280px] mt-0.5">
          {session.chapter
            ? `${session.chapter}${session.difficulty ? ` · ${session.difficulty}` : ''}`
            : session.questionPreview || t('aiInterviewer.customMode')}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onOpen(session.id)}
          className="rounded px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors min-h-[44px] flex items-center"
          aria-label={t('aiInterviewer.viewSession')}
        >
          {t('aiInterviewer.viewSession')}
        </button>
        {isStructured && onRerun && session.chapter && (
          <button
            type="button"
            onClick={() => onRerun({ chapter: session.chapter!, difficulty: session.difficulty ?? 'medium' })}
            className="rounded px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors min-h-[44px] flex items-center"
            aria-label={t('aiInterviewer.reRunSetup')}
          >
            {t('aiInterviewer.reRunSetup')}
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(session.id)}
          className="rounded px-2 py-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors min-h-[44px] flex items-center"
          aria-label={t('aiInterviewer.deleteSession')}
        >
          {t('aiInterviewer.deleteSession')}
        </button>
      </div>
    </div>
  );
}
