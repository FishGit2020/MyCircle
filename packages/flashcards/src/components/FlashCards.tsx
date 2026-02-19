import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard, CardType } from '../types';
import { useFlashCards } from '../hooks/useFlashCards';
import CardGrid from './CardGrid';
import CardPractice from './CardPractice';
import AddCardModal from './AddCardModal';
import BibleVersePicker from './BibleVersePicker';

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
    progress,
    loading,
    cardTypes,
    toggleMastered,
    addBibleCards,
    addCustomCard,
    updateCustomCard,
    deleteCard,
    resetProgress,
    isAuthenticated,
  } = useFlashCards();

  const [activeType, setActiveType] = useState<CardType | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBiblePicker, setShowBiblePicker] = useState(false);
  const [practiceCards, setPracticeCards] = useState<FlashCard[] | null>(null);
  const [practiceStart, setPracticeStart] = useState(0);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<FlashCard | null>(null);
  const [cardToEdit, setCardToEdit] = useState<FlashCard | null>(null);

  const filteredCards = useMemo(() => {
    if (activeType === 'all') return allCards;
    return allCards.filter(c => c.type === activeType);
  }, [allCards, activeType]);

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
    if (cardToDelete) {
      deleteCard(cardToDelete.id);
      setCardToDelete(null);
    }
  };

  const handleEdit = (updates: { front: string; back: string; category: string }) => {
    if (cardToEdit) {
      updateCustomCard(cardToEdit.id, updates);
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

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveType('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
            activeType === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {t('flashcards.allCategories')} ({allCards.length})
        </button>
        {cardTypes.map(type => {
          const count = allCards.filter(c => c.type === type).length;
          const labelKey = TYPE_LABELS[type] || type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                activeType === type
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
        onEditCard={setCardToEdit}
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
    </div>
  );
}
