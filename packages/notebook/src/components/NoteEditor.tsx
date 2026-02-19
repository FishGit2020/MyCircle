import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Note } from '../types';

interface NoteEditorProps {
  note: Note | null;
  onSave: (id: string | null, data: { title: string; content: string }) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => void;
  onPublish?: (data: { title: string; content: string }) => Promise<void>;
}

export default function NoteEditor({ note, onSave, onCancel, onDelete, onPublish }: NoteEditorProps) {
  const { t } = useTranslation();
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;
    setSaving(true);
    try {
      await onSave(note?.id ?? null, { title: title.trim(), content: content.trim() });
      window.__logAnalyticsEvent?.('note_save', { is_new: !note?.id });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!onPublish) return;
    if (!title.trim() && !content.trim()) return;
    if (!window.confirm(t('notebook.publishConfirm'))) return;
    setPublishing(true);
    try {
      await onPublish({ title: title.trim(), content: content.trim() });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-h-[calc(100vh-12rem)]">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
        <button
          type="button"
          onClick={onCancel}
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('notebook.title')}
        </button>
        <span className="text-gray-400 dark:text-gray-500">/</span>
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {note ? t('notebook.editNote') : t('notebook.newNote')}
        </span>
      </nav>

      <div>
        <label htmlFor="note-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('notebook.noteTitle')}
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('notebook.noteTitlePlaceholder')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('notebook.content')}
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('notebook.contentPlaceholder')}
          className="w-full flex-1 min-h-[200px] px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-y font-mono text-sm"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || (!title.trim() && !content.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {saving ? t('notebook.saving') : t('notebook.save')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
          >
            {t('notebook.cancel')}
          </button>
          {onPublish && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing || saving || (!title.trim() && !content.trim())}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
            >
              {publishing ? t('notebook.publishing') : t('notebook.publish')}
            </button>
          )}
        </div>

        {note && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(note.id)}
            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm"
          >
            {t('notebook.deleteNote')}
          </button>
        )}
      </div>
    </form>
  );
}
