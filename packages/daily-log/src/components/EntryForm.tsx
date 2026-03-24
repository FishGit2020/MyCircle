import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { MoodValue } from '../types';
import MoodPicker from './MoodPicker';
import TagInput from './TagInput';

interface EntryFormProps {
  onSubmit: (content: string, mood?: MoodValue, tags?: string[]) => Promise<void>;
  initialValue?: string;
  initialMood?: MoodValue;
  initialTags?: string[];
  onCancel?: () => void;
}

export default function EntryForm({
  onSubmit,
  initialValue = '',
  initialMood,
  initialTags = [],
  onCancel,
}: EntryFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState(initialValue);
  const [mood, setMood] = useState<MoodValue | undefined>(initialMood);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), mood, tags);
      if (!initialValue) {
        setContent('');
        setMood(undefined);
        setTags([]);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t('dailyLog.placeholder')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition flex-shrink-0"
        >
          {t('dailyLog.save')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
          >
            {t('dailyLog.cancel')}
          </button>
        )}
      </div>
      <MoodPicker value={mood} onChange={setMood} />
      <TagInput tags={tags} onChange={setTags} />
    </form>
  );
}
