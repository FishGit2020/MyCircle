import React, { useState, useMemo } from 'react';
import { useTranslation, StorageKeys, PageContent } from '@mycircle/shared';
import { useDailyLogEntries } from '../hooks/useDailyLogEntries';
import { getLocalDateString } from '../utils/localDate';
import EntryForm from './EntryForm';
import TimelineView from './TimelineView';
import SearchBar from './SearchBar';
import StatsView from './StatsView';

type TimeFilter = 'today' | 'thisMonth' | 'all';
type DayFilter = { weekdays: boolean; weekends: boolean };
type ActiveView = 'timeline' | 'stats';

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
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<ActiveView>('timeline');

  const today = getLocalDateString();
  const currentMonth = today.slice(0, 7);

  const toggleDayFilter = (key: keyof DayFilter) => {
    setDayFilter(prev => {
      const next = { ...prev, [key]: !prev[key] };
      saveDayFilter(next);
      return next;
    });
  };

  const filteredEntries = useMemo(() => {
    let result = entries;
    // Time filter
    switch (filter) {
      case 'today':
        result = result.filter(e => e.date === today);
        break;
      case 'thisMonth':
        result = result.filter(e => e.date.startsWith(currentMonth));
        break;
    }
    // Day type filter
    if (!dayFilter.weekdays || !dayFilter.weekends) {
      result = result.filter(e => {
        const weekend = isWeekend(e.date);
        return weekend ? dayFilter.weekends : dayFilter.weekdays;
      });
    }
    // Tag filter
    if (activeTag) {
      result = result.filter(e => e.tags?.includes(activeTag));
    }
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(e =>
        e.content.toLowerCase().includes(q) ||
        e.tags?.some(tag => tag.includes(q))
      );
    }
    return result;
  }, [entries, filter, today, currentMonth, dayFilter, activeTag, searchQuery]);

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
      {/* Header + tabs */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('dailyLog.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('dailyLog.subtitle')}</p>
        </div>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setActiveView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeView === 'timeline'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t('dailyLog.timelineTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('stats')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeView === 'stats'
                ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t('dailyLog.statsTab')}
          </button>
        </div>
      </div>

      {activeView === 'stats' ? (
        <StatsView entries={entries} />
      ) : (
        <>
          {/* Entry form */}
          <div className="mb-4">
            <EntryForm
              onSubmit={async (content, mood, tags) => {
                window.__logAnalyticsEvent?.('work_entry_add');
                await addEntry(content, mood, tags);
              }}
            />
          </div>

          {/* Search */}
          <div className="mb-3">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
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

            {/* Active tag filter chip */}
            {activeTag && (
              <button
                type="button"
                onClick={() => setActiveTag(null)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-500 text-white"
              >
                #{activeTag}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

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

          {/* Empty state for search */}
          {searchQuery.trim() && filteredEntries.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('dailyLog.searchNoResults')}
            </p>
          ) : (
            <TimelineView
              entries={filteredEntries}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              onMoveEntry={moveEntry}
              onTagFilter={setActiveTag}
              searchQuery={searchQuery}
            />
          )}
        </>
      )}
    </PageContent>
  );
}
