import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Note, PublicNote } from '../types';
import NoteCard from './NoteCard';

interface NoteListProps {
  notes: (Note | PublicNote)[];
  onSelect: (note: Note | PublicNote) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isPublicView?: boolean;
}

export default function NoteList({ notes, onSelect, onNew, onDelete, isPublicView }: NoteListProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return notes;
    const q = search.toLowerCase();
    return notes.filter(
      n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const handleDelete = (id: string) => {
    if (window.confirm(t('notebook.deleteConfirm'))) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('notebook.title')}</h2>
        <button
          onClick={onNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('notebook.newNote')}
        </button>
      </div>

      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('notebook.searchPlaceholder')}
          aria-label={t('notebook.searchPlaceholder')}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm"
        />
      </div>

      <div aria-live="polite">
        {notes.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('notebook.noteCount').replace('{count}', String(filtered.length))}
          </p>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {filtered.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onSelect(note)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">
              {isPublicView ? t('notebook.noPublicNotes') : t('notebook.noNotes')}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">{t('notebook.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
