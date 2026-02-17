import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useTranslation, PullToRefresh } from '@mycircle/shared';
import { useNotes } from '../hooks/useNotes';
import { usePublicNotes } from '../hooks/usePublicNotes';
import NoteList from './NoteList';
import NoteEditor from './NoteEditor';
import type { Note, PublicNote } from '../types';

type View = 'list' | 'new' | 'edit';
type Tab = 'my' | 'public';

export default function Notebook() {
  const { t } = useTranslation();
  const { noteId } = useParams<{ noteId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { notes, loading, error, saveNote, deleteNote, reload } = useNotes();
  const { notes: publicNotes, loading: publicLoading, error: publicError, publishNote, updateNote: updatePublicNote, deleteNote: deletePublicNote, reload: reloadPublic } = usePublicNotes();
  const [tab, setTab] = useState<Tab>('my');

  // Derive view from URL
  const isNewRoute = location.pathname === '/notebook/new';
  const view: View = isNewRoute ? 'new' : noteId ? 'edit' : 'list';

  // Find selected note from loaded data
  const selectedNote = noteId
    ? (notes.find(n => n.id === noteId) || publicNotes.find(n => n.id === noteId) || null)
    : null;

  // Auto-detect tab when navigating to a public note
  useEffect(() => {
    if (noteId && !isNewRoute) {
      const isPublic = publicNotes.some(n => n.id === noteId);
      if (isPublic) setTab('public');
    }
  }, [noteId, isNewRoute, publicNotes]);

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

  const isLoading = tab === 'my' ? loading : publicLoading;
  const currentError = tab === 'my' ? error : publicError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (currentError) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 dark:text-red-400">{currentError}</p>
      </div>
    );
  }

  const handleSave = async (id: string | null, data: { title: string; content: string }) => {
    if (tab === 'public' && id) {
      await updatePublicNote(id, data);
    } else {
      await saveNote(id, data);
    }
    navigate('/notebook');
  };

  const handleDelete = async (id: string) => {
    if (view === 'edit') {
      if (!window.confirm(t('notebook.deleteConfirm'))) return;
    }
    if (tab === 'public') {
      await deletePublicNote(id);
    } else {
      await deleteNote(id);
    }
    if (view === 'edit') {
      navigate('/notebook');
    }
  };

  const handlePublish = async (data: { title: string; content: string }) => {
    await publishNote(data);
    navigate('/notebook');
  };

  if (view === 'new' || view === 'edit') {
    return (
      <NoteEditor
        note={view === 'edit' ? selectedNote : null}
        onSave={handleSave}
        onCancel={() => navigate('/notebook')}
        onDelete={view === 'edit' ? handleDelete : undefined}
        onPublish={tab === 'my' ? handlePublish : undefined}
      />
    );
  }

  const tabItems: { key: Tab; label: string }[] = [
    { key: 'my', label: t('notebook.myNotes') },
    { key: 'public', label: t('notebook.publicNotes') },
  ];

  return (
    <PullToRefresh onRefresh={async () => { reload(); reloadPublic(); }}>
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700" role="tablist" aria-label={t('notebook.title')}>
        {tabItems.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); if (view !== 'list') navigate('/notebook'); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <NoteList
        notes={tab === 'my' ? notes : publicNotes}
        onSelect={(note) => navigate(`/notebook/${note.id}`)}
        onNew={() => navigate('/notebook/new')}
        onDelete={handleDelete}
        isPublicView={tab === 'public'}
      />
    </div>
    </PullToRefresh>
  );
}
