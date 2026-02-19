import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { WorkEntry } from '../types';
import DayNode from './DayNode';

interface TimelineViewProps {
  entries: WorkEntry[];
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function groupByDate(entries: WorkEntry[]): Map<string, WorkEntry[]> {
  const groups = new Map<string, WorkEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.date) || [];
    existing.push(entry);
    groups.set(entry.date, existing);
  }
  // Sort dates descending
  return new Map(
    [...groups.entries()].sort(([a], [b]) => b.localeCompare(a))
  );
}

export default function TimelineView({ entries, onUpdate, onDelete }: TimelineViewProps) {
  const { t } = useTranslation();

  if (entries.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('workTracker.noEntries')}
      </p>
    );
  }

  const grouped = groupByDate(entries);

  return (
    <div className="mt-6">
      {[...grouped.entries()].map(([date, dayEntries]) => (
        <DayNode
          key={date}
          date={date}
          entries={dayEntries}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
