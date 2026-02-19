import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

interface AddCardModalProps {
  onAdd?: (card: { front: string; back: string; category: string }) => void;
  onEdit?: (updates: { front: string; back: string; category: string }) => void;
  initialValues?: { front: string; back: string; category: string };
  onClose: () => void;
}

export default function AddCardModal({ onAdd, onEdit, initialValues, onClose }: AddCardModalProps) {
  const { t } = useTranslation();
  const isEditMode = !!initialValues;
  const [front, setFront] = useState(initialValues?.front ?? '');
  const [back, setBack] = useState(initialValues?.back ?? '');
  const [category, setCategory] = useState(initialValues?.category ?? 'custom');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const data = { front: front.trim(), back: back.trim(), category: category.trim() || 'custom' };
    if (isEditMode && onEdit) {
      onEdit(data);
    } else if (onAdd) {
      onAdd(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {isEditMode ? t('flashcards.editCard') : t('flashcards.addCustomCard')}
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="card-front" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.front')}
                </label>
                <input
                  id="card-front"
                  type="text"
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="card-back" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.back')}
                </label>
                <input
                  id="card-back"
                  type="text"
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="card-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.category')}
                </label>
                <input
                  id="card-category"
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              {t('flashcards.cancel')}
            </button>
            <button
              type="submit"
              disabled={!front.trim() || !back.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 rounded-lg transition"
            >
              {t('flashcards.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
