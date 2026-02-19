import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface EntryFormProps {
  onSubmit: (content: string) => Promise<void>;
  initialValue?: string;
  onCancel?: () => void;
}

export default function EntryForm({ onSubmit, initialValue = '', onCancel }: EntryFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      if (!initialValue) setContent('');
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={t('workTracker.placeholder')}
        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
        autoFocus
      />
      <button
        type="submit"
        disabled={!content.trim() || submitting}
        className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition flex-shrink-0"
      >
        {t('workTracker.save')}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
        >
          {t('workTracker.cancel')}
        </button>
      )}
    </form>
  );
}
