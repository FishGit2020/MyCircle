import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { SessionSummary } from '../hooks/useSessionHistory';

interface ProgressDashboardProps {
  sessions: SessionSummary[];
}

interface DimensionData {
  key: keyof Pick<SessionSummary, 'avgTechnical' | 'avgProblemSolving' | 'avgCommunication' | 'avgDepth'>;
  labelKey: string;
  color: string;
  darkColor: string;
}

const DIMENSIONS: DimensionData[] = [
  { key: 'avgTechnical', labelKey: 'aiInterviewer.technical', color: 'bg-blue-500', darkColor: 'dark:bg-blue-400' },
  { key: 'avgProblemSolving', labelKey: 'aiInterviewer.problemSolving', color: 'bg-purple-500', darkColor: 'dark:bg-purple-400' },
  { key: 'avgCommunication', labelKey: 'aiInterviewer.communication', color: 'bg-green-500', darkColor: 'dark:bg-green-400' },
  { key: 'avgDepth', labelKey: 'aiInterviewer.depth', color: 'bg-orange-500', darkColor: 'dark:bg-orange-400' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '?';
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressDashboard({ sessions }: ProgressDashboardProps) {
  const { t } = useTranslation();
  const [chapterFilter, setChapterFilter] = useState<string>('');

  const qualifiedSessions = sessions.filter(
    (s) => s.mode === 'question-bank' && s.overallScore != null,
  );

  const chapters = Array.from(
    new Set(qualifiedSessions.map((s) => s.chapter).filter(Boolean)),
  ) as string[];

  const filtered = chapterFilter
    ? qualifiedSessions.filter((s) => s.chapter === chapterFilter)
    : qualifiedSessions;

  if (qualifiedSessions.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('aiInterviewer.noProgressData')}</p>
      </div>
    );
  }

  // Show sessions in chronological order for the chart
  const sorted = [...filtered].sort((a, b) =>
    (a.createdAt ?? '').localeCompare(b.createdAt ?? ''),
  );

  return (
    <div className="flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
          {t('aiInterviewer.progressDashboard')}
        </h2>
        {chapters.length > 0 && (
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('aiInterviewer.filterByChapter')}
          >
            <option value="">{t('aiInterviewer.allChapters')}</option>
            {chapters.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length < 2 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500">{t('aiInterviewer.noProgressData')}</p>
      ) : (
        <>
          {/* Dimension score trends */}
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                {t(dim.labelKey)}
              </span>
              <div className="flex items-end gap-1 h-16">
                {sorted.map((s, i) => {
                  const val = s[dim.key] ?? 0;
                  const heightPct = Math.round((val / 10) * 100);
                  return (
                    <div key={s.id} className="flex flex-col items-center gap-0.5 flex-1 min-w-[20px]">
                      <span className="text-[9px] text-gray-500 dark:text-gray-400">
                        {val.toFixed(1)}
                      </span>
                      <div
                        className={`w-full rounded-t ${dim.color} ${dim.darkColor} transition-all`}
                        style={{ height: `${Math.max(heightPct, 4)}%`, maxHeight: '44px', minHeight: '3px' }}
                        title={`${formatDate(s.createdAt)}: ${val.toFixed(1)}/10`}
                      />
                      {i === 0 || i === sorted.length - 1 ? (
                        <span className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight">
                          {formatDate(s.createdAt)}
                        </span>
                      ) : (
                        <span className="text-[9px] leading-tight opacity-0">·</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary table */}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-1 pr-2 font-medium">{t('aiInterviewer.filterByDate')}</th>
                  {DIMENSIONS.map((d) => (
                    <th key={d.key} className="text-right py-1 px-1 font-medium">{t(d.labelKey).slice(0, 5)}</th>
                  ))}
                  <th className="text-right py-1 pl-1 font-medium">{t('aiInterviewer.overallScore')}</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(-5).map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                    <td className="py-1 pr-2">{formatDate(s.createdAt)}</td>
                    {DIMENSIONS.map((d) => (
                      <td key={d.key} className="text-right py-1 px-1">{(s[d.key] ?? 0).toFixed(1)}</td>
                    ))}
                    <td className="text-right py-1 pl-1 font-medium text-green-600 dark:text-green-400">
                      {(s.overallScore ?? 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
