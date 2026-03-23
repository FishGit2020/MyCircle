import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useMilestoneEvents } from '../hooks/useMilestoneEvents';
import type { MilestoneEvent } from '../hooks/useMilestoneEvents';

interface MilestoneEventsSectionProps {
  childId?: string | null;
  isAuthenticated: boolean;
}

function isFutureDate(dateStr: string): boolean {
  const today = new Date().toISOString().substring(0, 10);
  return dateStr > today;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MilestoneEventsSection({ childId, isAuthenticated }: MilestoneEventsSectionProps) {
  const { t } = useTranslation();
  const { events, loading, addEvent, updateEvent, deleteEvent } = useMilestoneEvents({ childId });

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formNote, setFormNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!isAuthenticated) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 py-2">
        {t('babyJournal.myMoments.signInPrompt')}
      </p>
    );
  }

  const openAddForm = () => {
    setEditingId(null);
    setFormTitle('');
    setFormDate('');
    setFormNote('');
    setShowForm(true);
  };

  const openEditForm = (ev: MilestoneEvent) => {
    setEditingId(ev.id);
    setFormTitle(ev.title);
    setFormDate(ev.eventDate);
    setFormNote(ev.note ?? '');
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, { title: formTitle.trim(), eventDate: formDate, note: formNote || null });
      } else {
        await addEvent({ title: formTitle.trim(), eventDate: formDate, note: formNote || null, childId: childId ?? null });
      }
      setShowForm(false);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteEvent(id);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="space-y-3">
      {loading && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && events.length === 0 && !showForm && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
          {t('babyJournal.myMoments.empty')}
        </p>
      )}

      {events.map((ev) => (
        <div
          key={ev.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-start gap-3"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{ev.title}</span>
              {isFutureDate(ev.eventDate) && (
                <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                  {t('babyJournal.myMoments.upcoming')}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(ev.eventDate)}</p>
            {ev.note && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{ev.note}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => openEditForm(ev)}
              aria-label={t('babyJournal.myMoments.edit')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(ev.id)}
              aria-label={t('babyJournal.myMoments.delete')}
              className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 space-y-3">
          <p className="text-sm text-red-700 dark:text-red-300">{t('babyJournal.myMoments.deleteConfirm')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
            >
              {t('babyJournal.myMoments.delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {t('babyJournal.myMoments.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-pink-200 dark:border-pink-800 bg-pink-50 dark:bg-pink-900/10 px-4 py-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('babyJournal.myMoments.titleLabel')} *
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={t('babyJournal.myMoments.titlePlaceholder')}
              maxLength={120}
              required
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100"
            />
          </div>
          <div>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              placeholder={t('babyJournal.myMoments.datePlaceholder')}
              required
              aria-label={t('babyJournal.myMoments.datePlaceholder')}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100"
            />
          </div>
          <div>
            <textarea
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              placeholder={t('babyJournal.myMoments.notePlaceholder')}
              maxLength={2000}
              rows={3}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !formTitle.trim() || !formDate}
              className="px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 disabled:opacity-50 min-h-[44px]"
            >
              {t('babyJournal.myMoments.save')}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {t('babyJournal.myMoments.cancel')}
            </button>
          </div>
        </form>
      )}

      {!showForm && (
        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('babyJournal.myMoments.add')}
        </button>
      )}
    </div>
  );
}
