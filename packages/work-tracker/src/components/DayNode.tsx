import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { WorkEntry } from '../types';
import EntryForm from './EntryForm';

interface DayNodeProps {
  date: string;
  entries: WorkEntry[];
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(0, 0, 0, 0);

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };

  return date.toLocaleDateString(undefined, options);
}

function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0];
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().split('T')[0];
}

export default function DayNode({ date, entries, onUpdate, onDelete }: DayNodeProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const dayLabel = isToday(date)
    ? t('workTracker.today')
    : isYesterday(date)
      ? t('workTracker.yesterday')
      : '';

  return (
    <div className="relative pl-14">
      {/* Timeline line */}
      <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Timeline dot */}
      <div className={`absolute left-1 top-1 w-3 h-3 rounded-full border-2 ${
        isToday(date)
          ? 'bg-blue-500 border-blue-500'
          : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
      }`} />

      {/* Date label */}
      <div className="mb-2">
        <span className="text-sm font-semibold text-gray-800 dark:text-white">
          {formatDate(date)}
        </span>
        {dayLabel && (
          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
            {dayLabel}
          </span>
        )}
      </div>

      {/* Entry cards */}
      <div className="space-y-2 mb-6">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 group"
          >
            {editingId === entry.id ? (
              <EntryForm
                initialValue={entry.content}
                onSubmit={async (content) => {
                  await onUpdate(entry.id, content);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                  {entry.content}
                </p>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingId(entry.id)}
                    className="p-1 text-gray-400 hover:text-blue-500 transition"
                    aria-label={t('workTracker.edit')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {confirmDeleteId === entry.id ? (
                    <button
                      type="button"
                      onClick={async () => {
                        await onDelete(entry.id);
                        setConfirmDeleteId(null);
                      }}
                      className="p-1 text-red-500 hover:text-red-600 transition text-xs font-medium"
                    >
                      Confirm
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(entry.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition"
                      aria-label={t('workTracker.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
