import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

const TECHNIQUE_CATEGORIES = ['algorithms', 'two-pointers', 'python-syntax', 'bugs'];

interface AddTechniqueModalProps {
  onAdd?: (card: { front: string; back: string; category: string; meta?: { difficulty: string } }) => void;
  onEdit?: (updates: { front: string; back: string; category: string }) => void;
  initialValues?: { front: string; back: string; category: string; meta?: { difficulty?: string } };
  onClose: () => void;
}

export default function AddTechniqueModal({ onAdd, onEdit, initialValues, onClose }: AddTechniqueModalProps) {
  const { t } = useTranslation();
  const isEditMode = !!initialValues;
  const [front, setFront] = useState(initialValues?.front ?? '');
  const [back, setBack] = useState(initialValues?.back ?? '');
  const [category, setCategory] = useState(initialValues?.category ?? 'algorithms');
  const [customCategory, setCustomCategory] = useState('');
  const [difficulty, setDifficulty] = useState(initialValues?.meta?.difficulty ?? '2');
  const isCustomCat = !TECHNIQUE_CATEGORIES.includes(category);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    const cat = isCustomCat ? customCategory.trim() || category : category;
    if (isEditMode && onEdit) {
      onEdit({ front: front.trim(), back: back.trim(), category: cat });
    } else if (onAdd) {
      onAdd({ front: front.trim(), back: back.trim(), category: cat, meta: { difficulty } });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 pt-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {isEditMode ? t('flashcards.editCard') : t('flashcards.addTechniqueCard' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="tech-front" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.front')}
                </label>
                <textarea
                  id="tech-front"
                  value={front}
                  onChange={e => setFront(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="tech-back" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.back')}
                </label>
                <textarea
                  id="tech-back"
                  value={back}
                  onChange={e => setBack(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
                />
              </div>

              <div>
                <label htmlFor="tech-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('flashcards.category')}
                </label>
                <select
                  id="tech-category"
                  value={isCustomCat ? '__custom__' : category}
                  onChange={e => {
                    if (e.target.value === '__custom__') {
                      setCategory('__custom__');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
                >
                  {TECHNIQUE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__custom__">{t('flashcards.customCategory' as any)}</option> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </select>
                {isCustomCat && (
                  <input
                    type="text"
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder={t('flashcards.enterCategory' as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    className="w-full mt-2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                )}
              </div>

              {!isEditMode && (
                <div>
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('flashcards.difficulty' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                  </span>
                  <div className="flex gap-3">
                    {[{ v: '1', label: 'Easy', color: 'green' }, { v: '2', label: 'Medium', color: 'yellow' }, { v: '3', label: 'Hard', color: 'red' }].map(d => (
                      <button
                        key={d.v}
                        type="button"
                        onClick={() => setDifficulty(d.v)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition min-h-[44px] ${
                          difficulty === d.v
                            ? d.color === 'green' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 ring-2 ring-green-500'
                            : d.color === 'yellow' ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 ring-2 ring-yellow-500'
                            : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 ring-2 ring-red-500'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
