import React, { useState, useMemo } from 'react';
import { useTranslation, StorageKeys, PageContent } from '@mycircle/shared';
import { useDailyLogEntries } from '../hooks/useDailyLogEntries';
import { getLocalDateString } from '../utils/localDate';
import EntryForm from './EntryForm';
import TimelineView from './TimelineView';

type TimeFilter = 'today' | 'thisMonth' | 'all';
type DayFilter = { weekdays: boolean; weekends: boolean };

function loadDayFilter(): DayFilter {
  try {
    const raw = localStorage.getItem(StorageKeys.DAILY_LOG_DAY_FILTER);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { weekdays: true, weekends: true };
}

function saveDayFilter(f: DayFilter) {
  try { localStorage.setItem(StorageKeys.DAILY_LOG_DAY_FILTER, JSON.stringify(f)); } catch { /* ignore */ }
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
}

export default function DailyLog() {
  const { t } = useTranslation();
  const { entries, loading, isAuthenticated, authChecked, addEntry, updateEntry, deleteEntry, moveEntry } = useDailyLogEntries();
  const [filter, setFilter] = useState<TimeFilter>('all');
  const [dayFilter, setDayFilter] = useState<DayFilter>(loadDayFilter);

  const today = getLocalDateString();
  const currentMonth = today.slice(0, 7); // "2026-02"

  const toggleDayFilter = (key: keyof DayFilter) => {
    setDayFilter(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveDayFilter(next);
      return next;
    });
  };

  const filteredEntries = useMemo(() => {
    let result = entries;
    switch (filter) {
      case 'today':
        result = result.filter(e => e.date === today);
        break;
      case 'thisMonth':
        result = result.filter(e => e.date.startsWith(currentMonth));
        break;
    }
    // Apply day type filter
    if (!dayFilter.weekdays || !dayFilter.weekends) {
      result = result.filter(e => {
        const weekend = isWeekend(e.date);
        return weekend ? dayFilter.weekends : dayFilter.weekdays;
      });
    }
    return result;
  }, [entries, filter, today, currentMonth, dayFilter]);

  if (!authChecked || loading) {
    return (
      <PageContent>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dailyLog.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dailyLog.subtitle')}</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </PageContent>
    );
  }

  if (!isAuthenticated) {
    return (
      <PageContent>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('dailyLog.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('dailyLog.signInRequired')}</p>
      </PageContent>
    );
  }

  return (
    <PageContent>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dailyLog.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('dailyLog.subtitle')}</p>
      </div>

      {/* Entry form */}
      <div className="mb-6">
        <EntryForm onSubmit={async (content) => { window.__logAnalyticsEvent?.('work_entry_add'); await addEntry(content); }} />
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { key: 'today' as const, label: t('dailyLog.today') },
          { key: 'thisMonth' as const, label: t('dailyLog.thisMonth') },
          { key: 'all' as const, label: t('dailyLog.allTime') },
        ]).map(f => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              filter === f.key
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {f.label}
          </button>
        ))}

        {/* Day type toggles */}
        <div className="flex gap-1 ml-auto">
          <button
            type="button"
            onClick={() => toggleDayFilter('weekdays')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              dayFilter.weekdays
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 line-through'
            }`}
          >
            {t('dailyLog.weekdays')}
          </button>
          <button
            type="button"
            onClick={() => toggleDayFilter('weekends')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              dayFilter.weekends
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 line-through'
            }`}
          >
            {t('dailyLog.weekends')}
          </button>
        </div>

        <span className="flex items-center text-xs text-gray-400 dark:text-gray-500 w-full sm:w-auto sm:ml-2">
          {t('dailyLog.entriesCount').replace('{count}', String(filteredEntries.length))}
        </span>
      </div>

      {/* Timeline */}
      <TimelineView
        entries={filteredEntries}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        onMoveEntry={moveEntry}
      />
    </PageContent>
  );
}
