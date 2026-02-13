import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useNotes } from '../hooks/useNotes';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';
import type { Note } from '../types';

type View = 'list' | 'new' | 'edit';

export default function Notebook() {
  const { t } = useTranslation();
  const { notes, loading, error, saveNote, deleteNote } = useNotes();
  const [view, setView] = useState<View>('list');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  // Auth check — shell exposes __getFirebaseIdToken when user is logged in
  const hasAuth = typeof (window as any).__getFirebaseIdToken === 'function';
  const hasApi = typeof (window as any).__notebook !== 'undefined';

  if (!hasAuth || !hasApi) {
    return (
      <div className="text-center py-16">
        <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{t('notebook.loginToUse')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const handleSave = async (id: string | null, data: { title: string; content: string }) => {
    await saveNote(id, data);
    setView('list');
    setSelectedNote(null);
  };

  const handleDelete = async (id: string) => {
    if (view === 'edit') {
      if (!window.confirm(t('notebook.deleteConfirm'))) return;
    }
    await deleteNote(id);
    if (view === 'edit') {
      setView('list');
      setSelectedNote(null);
    }
  };

  if (view === 'new' || view === 'edit') {
    return (
      <NoteEditor
        note={view === 'edit' ? selectedNote : null}
        onSave={handleSave}
        onCancel={() => { setView('list'); setSelectedNote(null); }}
        onDelete={view === 'edit' ? handleDelete : undefined}
      />
    );
  }

  return (
    <NoteList
      notes={notes}
      onSelect={(note) => { setSelectedNote(note); setView('edit'); }}
      onNew={() => setView('new')}
      onDelete={handleDelete}
    />
  );
}
