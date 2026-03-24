import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 30;

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase().replace(/^#+/, '');
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const tag = normalizeTag(raw);
    if (!tag || tag.length > MAX_TAG_LENGTH) return;
    if (tags.includes(tag)) { setInput(''); return; }
    if (tags.length >= MAX_TAGS) return;
    onChange([...tags, tag]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(input); }
    if (e.key === ',') { e.preventDefault(); addTag(input); }
    if (e.key === 'Backspace' && !input && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => onChange(tags.filter(t => t !== tag));

  const atLimit = tags.length >= MAX_TAGS;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-1 items-center min-h-[36px] px-2 py-1 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300"
          >
            #{tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => removeTag(tag)}
              className="min-w-[20px] min-h-[20px] flex items-center justify-center rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-800 transition text-indigo-500 dark:text-indigo-400"
            >
              ×
            </button>
          </span>
        ))}
        {!atLimit && (
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input) addTag(input); }}
            placeholder={tags.length === 0 ? t('dailyLog.tagPlaceholder') : ''}
            className="flex-1 min-w-[80px] bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
            aria-label={t('dailyLog.addTag')}
          />
        )}
      </div>
      {atLimit && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{t('dailyLog.tagLimitReached')}</p>
      )}
    </div>
  );
}
