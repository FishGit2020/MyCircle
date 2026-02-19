import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useWorkEntries } from '../hooks/useWorkEntries';
import EntryForm from './EntryForm';
import TimelineView from './TimelineView';

type TimeFilter = 'today' | 'thisMonth' | 'all';

export default function WorkTracker() {
  const { t } = useTranslation();
  const { entries, loading, isAuthenticated, authChecked, addEntry, updateEntry, deleteEntry } = useWorkEntries();
  const [filter, setFilter] = useState<TimeFilter>('all');

  const today = new Date().toISOString().split('T')[0];
  const currentMonth = today.slice(0, 7); // "2026-02"

  const filteredEntries = useMemo(() => {
    switch (filter) {
      case 'today':
        return entries.filter(e => e.date === today);
      case 'thisMonth':
        return entries.filter(e => e.date.startsWith(currentMonth));
      default:
        return entries;
    }
  }, [entries, filter, today, currentMonth]);

  if (!authChecked || loading) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('workTracker.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('workTracker.subtitle')}</p>
        </div>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{t('workTracker.title')}</h1>
        <p className="text-gray-500 dark:text-gray-400">{t('workTracker.signInRequired')}</p>
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('workTracker.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('workTracker.subtitle')}</p>
      </div>

      {/* Entry form */}
      <div className="mb-6">
        <EntryForm onSubmit={async (content) => { await addEntry(content); }} />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'today' as const, label: t('workTracker.today') },
          { key: 'thisMonth' as const, label: t('workTracker.thisMonth') },
          { key: 'all' as const, label: t('workTracker.allTime') },
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
        <span className="flex items-center text-xs text-gray-400 dark:text-gray-500 ml-2">
          {t('workTracker.entriesCount').replace('{count}', String(filteredEntries.length))}
        </span>
      </div>

      {/* Timeline */}
      <TimelineView
        entries={filteredEntries}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
      />
    </div>
  );
}
