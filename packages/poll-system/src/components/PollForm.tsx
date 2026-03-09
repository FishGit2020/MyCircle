import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type { Poll, PollOption } from '../types';

interface PollFormProps {
  onSave: (data: Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export default function PollForm({ onSave, onCancel }: PollFormProps) {
  const { t } = useTranslation();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<{ id: string; text: string }[]>([
    { id: 'opt-1', text: '' },
    { id: 'opt-2', text: '' },
  ]);
  const [isPublic, setIsPublic] = useState(true);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');

  const addOption = useCallback(() => {
    setOptions(prev => [...prev, { id: `opt-${Date.now()}`, text: '' }]);
  }, []);

  const removeOption = useCallback((id: string) => {
    setOptions(prev => prev.filter(o => o.id !== id));
  }, []);

  const updateOption = useCallback((id: string, text: string) => {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, text } : o));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter(o => o.text.trim());
    if (!question.trim() || validOptions.length < 2) return;

    const pollOptions: PollOption[] = validOptions.map(o => ({
      id: o.id,
      text: o.text.trim(),
      votes: 0,
    }));

    onSave({
      question: question.trim(),
      options: pollOptions,
      createdBy: (window as any).__currentUid || 'anonymous',
      isPublic,
      expiresAt: hasExpiration && expiresAt ? expiresAt : null,
    });
  }, [question, options, isPublic, hasExpiration, expiresAt, onSave]);

  const validCount = options.filter(o => o.text.trim()).length;

  return (
    <PageContent maxWidth="3xl" className="space-y-4"><form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {t('pollSystem.newPoll')}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {t('pollSystem.cancel')}
        </button>
      </div>

      <div>
        <label htmlFor="ps-question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('pollSystem.question')} *
        </label>
        <input
          id="ps-question"
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          required
          aria-required="true"
          placeholder={t('pollSystem.questionPlaceholder')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('pollSystem.optionsLabel')} *
        </label>
        <div className="space-y-2">
          {options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500 w-5 text-right flex-shrink-0">{idx + 1}.</span>
              <input
                type="text"
                value={opt.text}
                onChange={e => updateOption(opt.id, e.target.value)}
                placeholder={`${t('pollSystem.option')} ${idx + 1}`}
                aria-label={`${t('pollSystem.option')} ${idx + 1}`}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition"
                  aria-label={t('pollSystem.removeOption')}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition"
        >
          + {t('pollSystem.addOption')}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label htmlFor="ps-public" className="flex items-center gap-2 cursor-pointer">
          <input
            id="ps-public"
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('pollSystem.makePublic')}</span>
        </label>
      </div>

      <div className="space-y-2">
        <label htmlFor="ps-has-expiration" className="flex items-center gap-2 cursor-pointer">
          <input
            id="ps-has-expiration"
            type="checkbox"
            checked={hasExpiration}
            onChange={e => setHasExpiration(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-violet-600 focus:ring-violet-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('pollSystem.setExpiration')}</span>
        </label>
        {hasExpiration && (
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
          />
        )}
      </div>

      <button
        type="submit"
        disabled={!question.trim() || validCount < 2}
        className="w-full py-2.5 px-4 bg-violet-500 hover:bg-violet-600 disabled:bg-violet-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
      >
        {t('pollSystem.createPoll')}
      </button>
    </form></PageContent>
  );
}
