import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Note } from '../types';

function formatDate(date: Note['updatedAt']): string {
  const d = date && typeof (date as any).toDate === 'function'
    ? (date as any).toDate()
    : date instanceof Date ? date : new Date();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onDelete: () => void;
}

export default function NoteCard({ note, onClick, onDelete }: NoteCardProps) {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate flex-1">
          {note.title || t('notebook.noteTitle')}
        </h3>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-all rounded"
          title={t('notebook.deleteNote')}
          aria-label={t('notebook.deleteNote')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
        {note.content ? note.content.slice(0, 120) : ''}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        {t('notebook.lastEdited')} {formatDate(note.updatedAt)}
      </p>
    </div>
  );
}
