import React, { useState, lazy, Suspense } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type { Deck, FlashCard } from '../types';
import { useDeckCards } from '../hooks/useDecks';
import { getMaturity } from '../lib/sm2';

const DeckCardManager = lazy(() => import('./DeckCardManager'));
const AddDeckModal = lazy(() => import('./AddDeckModal'));

interface Props {
  deck: Deck;
  allCards: FlashCard[];
  onClose: () => void;
  onDeleteDeck: () => Promise<void>;
}

export default function DeckDetail({ deck, allCards, onClose, onDeleteDeck }: Props) {
  const { t } = useTranslation();
  const { deckCards, loading, addCard, removeCard } = useDeckCards(deck.id);
  const [showCardManager, setShowCardManager] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingCardId, setRemovingCardId] = useState<string | null>(null);

  // Maturity breakdown
  const newCount = deckCards.filter(c => c.maturity === 'new').length;
  const learningCount = deckCards.filter(c => c.maturity === 'learning').length;
  const matureCount = deckCards.filter(c => c.maturity === 'mature').length;
  const total = deckCards.length;

  const handleRemoveCard = async (cardId: string) => {
    setRemovingCardId(cardId);
    try {
      await removeCard(cardId);
    } finally {
      setRemovingCardId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDeleteDeck();
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const resolveCard = (cardId: string): FlashCard | undefined =>
    allCards.find(c => c.id === cardId);

  return (
    <PageContent>
      {/* Back button */}
      <button type="button" onClick={onClose} className="text-sm text-blue-500 hover:underline mb-4 min-h-[44px] flex items-center gap-1">
        ← {t('flashcards.deck.tabs.decks' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </button>

      {/* Deck header */}
      <div className="flex items-start justify-between mb-4">
        <div className="min-w-0 flex-1 mr-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">{deck.name}</h2>
          {deck.languagePair && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{deck.languagePair}</p>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('flashcards.cardsCount' as any).replace('{count}', String(total))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowRenameModal(true)}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white px-2 py-1 rounded min-h-[44px] transition"
          >
            {t('flashcards.deck.rename' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm text-red-500 hover:text-red-600 px-2 py-1 rounded min-h-[44px] transition"
          >
            {t('flashcards.deck.delete' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        </div>
      </div>

      {/* Maturity progress bar */}
      {total > 0 && (
        <div className="mb-6">
          <div className="flex h-2.5 rounded-full overflow-hidden mb-2 bg-gray-100 dark:bg-gray-700">
            {newCount > 0 && (
              <div className="bg-gray-400 dark:bg-gray-500 transition-all" style={{ width: `${(newCount / total) * 100}%` }} />
            )}
            {learningCount > 0 && (
              <div className="bg-yellow-400 dark:bg-yellow-500 transition-all" style={{ width: `${(learningCount / total) * 100}%` }} />
            )}
            {matureCount > 0 && (
              <div className="bg-green-500 dark:bg-green-400 transition-all" style={{ width: `${(matureCount / total) * 100}%` }} />
            )}
          </div>
          <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" aria-hidden="true" />
              {t('flashcards.deck.new' as any)}: {newCount}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 dark:bg-yellow-500" aria-hidden="true" />
              {t('flashcards.deck.learning' as any)}: {learningCount}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400" aria-hidden="true" />
              {t('flashcards.deck.mature' as any)}: {matureCount}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setShowCardManager(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition min-h-[44px]"
        >
          {t('flashcards.deck.addCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {/* Card list */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {!loading && total === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {t('flashcards.deck.noCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {t('flashcards.deck.addFirstCard' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
        </div>
      )}

      {!loading && total > 0 && (
        <div className="space-y-2">
          {deckCards.map(dc => {
            const card = resolveCard(dc.cardId);
            const maturity = getMaturity(dc.repetitions);
            return (
              <div
                key={dc.cardId}
                className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                    {card?.front ?? dc.cardId}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{card?.back ?? ''}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                  maturity === 'mature'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : maturity === 'learning'
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {t(`flashcards.deck.${maturity}` as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveCard(dc.cardId)}
                  disabled={removingCardId === dc.cardId}
                  className="shrink-0 p-1.5 rounded text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t('flashcards.deck.removeCard' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Card manager modal */}
      {showCardManager && (
        <Suspense fallback={null}>
          <DeckCardManager
            deckId={deck.id}
            allCards={allCards}
            existingDeckCards={deckCards}
            onAdd={addCard}
            onClose={() => setShowCardManager(false)}
          />
        </Suspense>
      )}

      {/* Rename modal */}
      {showRenameModal && (
        <Suspense fallback={null}>
          <AddDeckModal
            initialName={deck.name}
            initialLanguagePair={deck.languagePair}
            onSave={async (name, languagePair) => {
              if (window.__flashcardDecks) {
                await window.__flashcardDecks.update(deck.id, { name, languagePair });
              }
              setShowRenameModal(false);
            }}
            onClose={() => setShowRenameModal(false)}
          />
        </Suspense>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-gray-800 dark:text-white mb-4">
              {t('flashcards.deck.deleteConfirm' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition min-h-[44px]"
              >
                {t('flashcards.cancel' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-lg transition min-h-[44px]"
              >
                {deleting ? '…' : t('flashcards.deck.delete' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContent>
  );
}
