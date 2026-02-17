import { useState, useRef, useCallback } from 'react';
import { useTranslation, type TranslationKey } from '@mycircle/shared';
import type { ChineseCharacter, CharacterCategory } from '../data/characters';
import { categoryOrder } from '../data/characters';
import PinyinKeyboard from './PinyinKeyboard';

const categoryKeyMap: Record<CharacterCategory, TranslationKey> = {
  family: 'chinese.category.family',
  feelings: 'chinese.category.feelings',
  food: 'chinese.category.food',
  body: 'chinese.category.body',
  house: 'chinese.category.house',
  nature: 'chinese.category.nature',
  numbers: 'chinese.category.numbers',
  phrases: 'chinese.category.phrases',
};

interface CharacterEditorProps {
  character?: ChineseCharacter;
  onSave: (data: { character: string; pinyin: string; meaning: string; category: CharacterCategory }) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

export default function CharacterEditor({ character, onSave, onCancel, onDelete }: CharacterEditorProps) {
  const { t } = useTranslation();
  const [charValue, setCharValue] = useState(character?.character || '');
  const [pinyin, setPinyin] = useState(character?.pinyin || '');
  const [meaning, setMeaning] = useState(character?.meaning || '');
  const [category, setCategory] = useState<CharacterCategory>(character?.category || 'phrases');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const pinyinInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!charValue.trim() || !pinyin.trim() || !meaning.trim()) return;
    onSave({ character: charValue.trim(), pinyin: pinyin.trim(), meaning: meaning.trim(), category });
  }, [charValue, pinyin, meaning, category, onSave]);

  const handlePinyinInsert = useCallback((char: string) => {
    const input = pinyinInputRef.current;
    if (!input) {
      setPinyin((prev) => prev + char);
      return;
    }
    const start = input.selectionStart ?? pinyin.length;
    const end = input.selectionEnd ?? pinyin.length;
    const newValue = pinyin.slice(0, start) + char + pinyin.slice(end);
    setPinyin(newValue);
    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      input.setSelectionRange(start + char.length, start + char.length);
    });
  }, [pinyin]);

  const isEditing = !!character;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      onClick={onCancel}
      role="presentation"
    >
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />
      <div
        className="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-testid="character-editor"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {isEditing ? t('chinese.editCharacter') : t('chinese.addCharacter')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Character */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('chinese.character')} *
            </label>
            <input
              type="text"
              value={charValue}
              onChange={(e) => setCharValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl text-center"
              placeholder="\u5b57"
              required
              data-testid="editor-character-input"
            />
          </div>

          {/* Pinyin with keyboard */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('chinese.pinyin')} *
            </label>
            <input
              ref={pinyinInputRef}
              type="text"
              value={pinyin}
              onChange={(e) => setPinyin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="p\u012bny\u012bn"
              required
              data-testid="editor-pinyin-input"
            />
            <PinyinKeyboard inputRef={pinyinInputRef} onInsert={handlePinyinInsert} />
          </div>

          {/* Meaning */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('chinese.meaning')} *
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="meaning"
              required
              data-testid="editor-meaning-input"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('chinese.categoryLabel')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CharacterCategory)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              data-testid="editor-category-select"
            >
              {categoryOrder.map((cat) => (
                <option key={cat} value={cat}>{t(categoryKeyMap[cat])}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {isEditing && onDelete && (
                showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600 dark:text-red-400">{t('chinese.deleteConfirm')}</span>
                    <button
                      type="button"
                      onClick={() => onDelete(character!.id)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition"
                      data-testid="editor-confirm-delete"
                    >
                      {t('chinese.deleteCharacter')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 transition"
                    >
                      {t('chinese.cancel')}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
                    data-testid="editor-delete-btn"
                  >
                    {t('chinese.deleteCharacter')}
                  </button>
                )
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                data-testid="editor-cancel-btn"
              >
                {t('chinese.cancel')}
              </button>
              <button
                type="submit"
                disabled={!charValue.trim() || !pinyin.trim() || !meaning.trim()}
                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                data-testid="editor-save-btn"
              >
                {t('chinese.save')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
