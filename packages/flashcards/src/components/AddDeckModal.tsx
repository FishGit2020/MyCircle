import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface Props {
  initialName?: string;
  initialLanguagePair?: string;
  onSave: (name: string, languagePair?: string) => Promise<void>;
  onClose: () => void;
}

export default function AddDeckModal({ initialName = '', initialLanguagePair = '', onSave, onClose }: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialName);
  const [languagePair, setLanguagePair] = useState(initialLanguagePair);
  const [saving, setSaving] = useState(false);

  const isEditing = !!initialName;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed, languagePair.trim() || undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          {isEditing
            ? t('flashcards.deck.rename' as any)  /* eslint-disable-line @typescript-eslint/no-explicit-any */
            : t('flashcards.deck.newDeck' as any)  /* eslint-disable-line @typescript-eslint/no-explicit-any */
          }
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Deck name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('flashcards.deck.deckName' as any)} *{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={100}
              required
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('flashcards.deck.deckName' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
            />
          </div>

          {/* Language pair */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('flashcards.deck.languagePair' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </label>
            <input
              type="text"
              value={languagePair}
              onChange={e => setLanguagePair(e.target.value)}
              maxLength={50}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t('flashcards.deck.languagePairPlaceholder' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-h-[44px]"
            >
              {t('flashcards.cancel' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition min-h-[44px]"
            >
              {saving ? '…' : (isEditing ? t('flashcards.save' as any) : t('flashcards.deck.create' as any))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
