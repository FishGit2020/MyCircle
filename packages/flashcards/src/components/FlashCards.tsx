import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import type { FlashCard, CardType } from '../types';
import { useFlashCards } from '../hooks/useFlashCards';
import { phrases } from '../data/phrases';
import type { ChineseCharacter, CharacterCategory } from '../data/characters';
import CardGrid from './CardGrid';
import CardPractice from './CardPractice';
import AddCardModal from './AddCardModal';
import BibleVersePicker from './BibleVersePicker';
import QuizView from './QuizView';
import CharacterEditor from './CharacterEditor';

const TYPE_LABELS: Record<CardType, string> = {
  chinese: 'flashcards.chinese',
  english: 'flashcards.english',
  'bible-first-letter': 'flashcards.bibleFirstLetter',
  'bible-full': 'flashcards.bibleFull',
  custom: 'flashcards.custom',
};

export default function FlashCards() {
  const { t } = useTranslation();
  const {
    allCards,
    chineseCards,
    progress,
    loading,
    cardTypes,
    toggleMastered,
    addBibleCards,
    addCustomCard,
    updateCard,
    deleteCard,
    resetProgress,
    isAuthenticated,
    addChineseChar,
    updateChineseChar,
    deleteChineseChar,
  } = useFlashCards();

  const [disabledTypes, setDisabledTypes] = useState<Set<CardType>>(() => {
    try {
      const stored = localStorage.getItem(StorageKeys.FLASHCARD_TYPE_FILTER);
      if (stored) return new Set(JSON.parse(stored) as CardType[]);
    } catch { /* ignore */ }
    return new Set();
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBiblePicker, setShowBiblePicker] = useState(false);
  const [practiceCards, setPracticeCards] = useState<FlashCard[] | null>(null);
  const [practiceStart, setPracticeStart] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<FlashCard | null>(null);
  const [cardToEdit, setCardToEdit] = useState<FlashCard | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCharEditor, setShowCharEditor] = useState(false);
  const [editingChar, setEditingChar] = useState<ChineseCharacter | undefined>(undefined);

  const filteredCards = useMemo(() => {
    if (disabledTypes.size === 0) return allCards;
    return allCards.filter(c => !disabledTypes.has(c.type));
  }, [allCards, disabledTypes]);

  const toggleType = useCallback((type: CardType) => {
    setDisabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      try { localStorage.setItem(StorageKeys.FLASHCARD_TYPE_FILTER, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const masteredCount = progress.masteredIds.length;

  const handleCardClick = (card: FlashCard) => {
    const idx = filteredCards.findIndex(c => c.id === card.id);
    setPracticeStart(idx >= 0 ? idx : 0);
    setPracticeCards(filteredCards);
  };

  const handlePracticeAll = () => {
    if (filteredCards.length > 0) {
      setPracticeStart(0);
      setPracticeCards(filteredCards);
    }
  };

  const handleReset = () => {
    resetProgress();
    setShowResetConfirm(false);
  };

  const handleDeleteConfirm = () => {
    if (!cardToDelete) return;
    if (cardToDelete.type === 'chinese') {
      const rawId = cardToDelete.id.replace(/^zh-/, '');
      deleteChineseChar(rawId);
    } else {
      deleteCard(cardToDelete.id);
    }
    setCardToDelete(null);
  };

  const handleEditRequest = (card: FlashCard) => {
    if (card.type === 'chinese') {
      const rawId = card.id.replace(/^zh-/, '');
      setEditingChar({
        id: rawId,
        character: card.front,
        pinyin: card.meta?.pinyin || '',
        meaning: card.back,
        category: (card.category || 'phrases') as CharacterCategory,
      });
      setShowCharEditor(true);
    } else {
      setCardToEdit(card);
    }
  };

  const handleEdit = (updates: { front: string; back: string; category: string }) => {
    if (cardToEdit) {
      updateCard(cardToEdit.id, updates);
      setCardToEdit(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="pb-20 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('flashcards.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('flashcards.subtitle')}</p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{t('flashcards.cardsCount').replace('{count}', String(allCards.length))}</span>
        <span>{t('flashcards.masteredCount').replace('{count}', String(masteredCount))}</span>
      </div>

      {/* Type filter chips (toggle: active = shown, inactive = hidden) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {cardTypes.map(type => {
          const count = allCards.filter(c => c.type === type).length;
          const labelKey = TYPE_LABELS[type] || type;
          const isEnabled = !disabledTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              aria-pressed={isEnabled}
              onClick={() => toggleType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                isEnabled
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t(labelKey as any)} ({count})
            </button>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={handlePracticeAll}
          disabled={filteredCards.length === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition"
        >
          {t('flashcards.practiceAll')}
        </button>
        {allCards.some(c => c.type === 'english') && (
          <button
            type="button"
            onClick={() => setShowQuiz(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition"
          >
            {t('english.quiz')}
          </button>
        )}
        {isAuthenticated && (
          <>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              {t('flashcards.addCustomCard')}
            </button>
            <button
              type="button"
              onClick={() => { setEditingChar(undefined); setShowCharEditor(true); }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 transition"
            >
              {t('chinese.addCharacter')}
            </button>
            <button
              type="button"
              onClick={() => setShowBiblePicker(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
            >
              {t('flashcards.addBibleVerses')}
            </button>
          </>
        )}
        {masteredCount > 0 && (
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
          >
            {t('flashcards.resetProgress')}
          </button>
        )}
      </div>

      {/* Card grid */}
      <CardGrid
        cards={filteredCards}
        masteredIds={progress.masteredIds}
        onCardClick={handleCardClick}
        onDeleteCard={setCardToDelete}
        onEditCard={handleEditRequest}
        isAuthenticated={isAuthenticated}
      />

      {/* Practice view */}
      {practiceCards && (
        <CardPractice
          cards={practiceCards}
          masteredIds={progress.masteredIds}
          onToggleMastered={toggleMastered}
          onClose={() => setPracticeCards(null)}
          startIndex={practiceStart}
        />
      )}

      {/* Add card modal */}
      {showAddModal && (
        <AddCardModal
          onAdd={addCustomCard}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit card modal */}
      {cardToEdit && (
        <AddCardModal
          initialValues={{
            front: cardToEdit.front,
            back: cardToEdit.back,
            category: cardToEdit.category,
          }}
          onEdit={handleEdit}
          onClose={() => setCardToEdit(null)}
        />
      )}

      {/* Bible verse picker */}
      {showBiblePicker && (
        <BibleVersePicker
          onAddCards={addBibleCards}
          onClose={() => setShowBiblePicker(false)}
        />
      )}

      {/* Delete confirmation */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-gray-800 dark:text-white mb-4">
              {t('flashcards.deleteConfirm')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {t('flashcards.cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                {t('flashcards.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quiz view */}
      {showQuiz && (
        <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowQuiz(false)}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
            >
              {t('flashcards.done')}
            </button>
            <span className="text-sm font-medium text-gray-800 dark:text-white">{t('english.quiz')}</span>
            <div className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <QuizView phrases={phrases} onQuizComplete={() => {}} />
          </div>
        </div>
      )}

      {/* Character editor */}
      {showCharEditor && (
        <CharacterEditor
          character={editingChar}
          onSave={async (data) => {
            if (editingChar) {
              await updateChineseChar(editingChar.id, data);
            } else {
              await addChineseChar(data);
            }
            setShowCharEditor(false);
            setEditingChar(undefined);
          }}
          onCancel={() => { setShowCharEditor(false); setEditingChar(undefined); }}
          onDelete={editingChar ? async (id) => {
            await deleteChineseChar(id);
            setShowCharEditor(false);
            setEditingChar(undefined);
          } : undefined}
        />
      )}

      {/* Reset confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-gray-800 dark:text-white mb-4">
              {t('flashcards.resetConfirm')}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                {t('flashcards.cancel')}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition"
              >
                {t('flashcards.resetProgress')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA safe area bottom spacer for notched devices */}
      <div className="md:hidden" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} aria-hidden="true" />
    </div>
  );
}
