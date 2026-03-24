import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { MoodValue, WorkEntry } from '../types';
import { getLocalDateString } from '../utils/localDate';
import EntryForm from './EntryForm';
import HighlightedText from './HighlightedText';

const MOOD_EMOJI: Record<MoodValue, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😔',
  frustrated: '😤',
  energized: '🔥',
};

interface DayNodeProps {
  date: string;
  entries: WorkEntry[];
  onUpdate: (id: string, content: string, mood?: MoodValue, tags?: string[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMoveEntry?: (id: string, newDate: string) => Promise<void>;
  onTagFilter?: (tag: string) => void;
  searchQuery?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return date.toLocaleDateString(undefined, options);
}

function isToday(dateStr: string): boolean {
  return dateStr === getLocalDateString();
}

function isYesterday(dateStr: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === getLocalDateString(yesterday);
}

export default function DayNode({ date, entries, onUpdate, onDelete, onMoveEntry, onTagFilter, searchQuery }: DayNodeProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);

  const dayLabel = isToday(date)
    ? t('dailyLog.today')
    : isYesterday(date)
      ? t('dailyLog.yesterday')
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
                initialMood={entry.mood}
                initialTags={entry.tags}
                onSubmit={async (content, mood, tags) => {
                  await onUpdate(entry.id, content, mood, tags);
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {entry.mood && (
                      <span
                        className="flex-shrink-0 text-base leading-5 mt-0.5"
                        aria-label={t(('dailyLog.mood.' + entry.mood) as Parameters<typeof t>[0])}
                        role="img"
                      >
                        {MOOD_EMOJI[entry.mood]}
                      </span>
                    )}
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap flex-1">
                      <HighlightedText text={entry.content} query={searchQuery ?? ''} />
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(entry.id)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition"
                      aria-label={t('dailyLog.edit')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {onMoveEntry && (
                      <button
                        type="button"
                        onClick={() => setMovingId(movingId === entry.id ? null : entry.id)}
                        className="p-1 text-gray-400 hover:text-indigo-500 transition"
                        aria-label={t('dailyLog.moveDate')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
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
                        aria-label={t('dailyLog.delete')}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                {/* Tag chips */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {entry.tags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onTagFilter?.(tag)}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                {movingId === entry.id && onMoveEntry && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {t('dailyLog.moveDatePicker')}:
                    </label>
                    <input
                      type="date"
                      defaultValue={date}
                      onChange={async (e) => {
                        if (e.target.value && e.target.value !== date) {
                          await onMoveEntry(entry.id, e.target.value);
                          setMovingId(null);
                        }
                      }}
                      className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      aria-label={t('dailyLog.moveDatePicker')}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
