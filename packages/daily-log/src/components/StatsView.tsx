import { useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { MoodValue, WorkEntry } from '../types';
import { computeStreak } from '../utils/streak';
import { compute30DayChart, computeMoodDistribution, computeTopTags } from '../utils/stats';

const MOOD_EMOJI: Record<MoodValue, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😔',
  frustrated: '😤',
  energized: '🔥',
};

const MOOD_COLOR: Record<MoodValue, string> = {
  happy:      'bg-green-400 dark:bg-green-500',
  neutral:    'bg-gray-400 dark:bg-gray-500',
  sad:        'bg-blue-400 dark:bg-blue-500',
  frustrated: 'bg-red-400 dark:bg-red-500',
  energized:  'bg-orange-400 dark:bg-orange-500',
};

interface StatsViewProps {
  entries: WorkEntry[];
}

export default function StatsView({ entries }: StatsViewProps) {
  const { t } = useTranslation();

  const streak = useMemo(() => computeStreak(entries), [entries]);
  const chart = useMemo(() => compute30DayChart(entries), [entries]);
  const moodDist = useMemo(() => computeMoodDistribution(entries), [entries]);
  const topTags = useMemo(() => computeTopTags(entries), [entries]);

  const maxCount = Math.max(...chart.map(d => d.count), 1);

  return (
    <div className="space-y-6 mt-4">
      {/* Streak + Total */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dailyLog.streak')}</p>
          {streak > 0 ? (
            <p className="text-2xl font-bold text-orange-500 dark:text-orange-400">
              🔥 {t('dailyLog.streakDays').replace('{count}', String(streak))}
            </p>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('dailyLog.streakNone')}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('dailyLog.totalEntries')}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{entries.length}</p>
        </div>
      </div>

      {/* 30-day chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{t('dailyLog.last30Days')}</p>
        <div className="flex items-end gap-0.5 h-16 overflow-x-auto">
          {chart.map(({ date, count }) => (
            <div
              key={date}
              title={`${date}: ${count}`}
              className="flex-1 min-w-[6px] rounded-t transition"
              style={{ height: `${Math.round((count / maxCount) * 100)}%` }}
            >
              <div
                className={`w-full h-full rounded-t ${count > 0 ? 'bg-blue-400 dark:bg-blue-500' : 'bg-gray-100 dark:bg-gray-700'}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Mood distribution */}
      {moodDist.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{t('dailyLog.moodDistribution')}</p>
          <div className="space-y-2">
            {moodDist.map(({ mood, count, percentage }) => (
              <div key={mood} className="flex items-center gap-2">
                <span className="text-base w-6 flex-shrink-0">{MOOD_EMOJI[mood]}</span>
                <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${MOOD_COLOR[mood]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 w-16 text-right flex-shrink-0">
                  {percentage}% ({count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top tags */}
      {topTags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{t('dailyLog.topTags')}</p>
          <div className="space-y-1.5">
            {topTags.map(({ tag, count }) => (
              <div key={tag} className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">#{tag}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 font-medium">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
