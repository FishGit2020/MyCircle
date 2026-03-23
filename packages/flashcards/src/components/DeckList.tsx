import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useDecks, useDeckCards } from '../hooks/useDecks';
import { useFlashCards } from '../hooks/useFlashCards';
import type { Deck } from '../types';
import DeckCard from './DeckCard';

const ReviewSession = lazy(() => import('./ReviewSession'));
const DeckDetail = lazy(() => import('./DeckDetail'));
const AddDeckModal = lazy(() => import('./AddDeckModal'));

interface Props {
  onSwitchToPractice: () => void;
}

type DeckView = 'list' | 'review' | 'detail';

function DeckCardsWrapper({ deck, onReview, onOpen, onDueTodayCount }: {
  deck: Deck;
  onReview: (id: string) => void;
  onOpen: (id: string) => void;
  onDueTodayCount: (deckId: string, count: number) => void;
}) {
  const { deckCards } = useDeckCards(deck.id);
  const now = Date.now();
  const dueCount = deckCards.filter(c => c.dueDate <= now).length;

  useEffect(() => {
    onDueTodayCount(deck.id, dueCount);
  }, [deck.id, dueCount, onDueTodayCount]);

  return <DeckCard deck={deck} deckCards={deckCards} onReview={onReview} onOpen={onOpen} />;
}

export default function DeckList({ onSwitchToPractice }: Props) {
  const { t } = useTranslation();
  const { decks, streak, loading, createDeck, deleteDeck } = useDecks();
  const { allCards } = useFlashCards();

  const [view, setView] = useState<DeckView>('list');
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [dueCounts, setDueCounts] = useState<Record<string, number>>({});

  const handleDueTodayCount = React.useCallback((deckId: string, count: number) => {
    setDueCounts(prev => prev[deckId] === count ? prev : { ...prev, [deckId]: count });
  }, []);

  const totalDueToday = Object.values(dueCounts).reduce((sum, n) => sum + n, 0);

  const activeDeck = activeDeckId ? decks.find(d => d.id === activeDeckId) ?? null : null;

  // Compute total due today across all decks (from cached deckCards)
  // We use a simple approach — each DeckCardsWrapper handles its own deck

  const handleReview = (deckId: string) => {
    setActiveDeckId(deckId);
    setView('review');
  };

  const handleOpen = (deckId: string) => {
    setActiveDeckId(deckId);
    setView('detail');
  };

  const handleCreateDeck = async (name: string, languagePair?: string) => {
    await createDeck(name, languagePair);
    setShowAddModal(false);
  };

  if (view === 'review' && activeDeckId && activeDeck) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>}>
        <ReviewSession
          deckId={activeDeckId}
          deckName={activeDeck.name}
          allCards={allCards}
          onClose={() => { setView('list'); setActiveDeckId(null); }}
        />
      </Suspense>
    );
  }

  if (view === 'detail' && activeDeckId && activeDeck) {
    return (
      <Suspense fallback={<PageContent><div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></PageContent>}>
        <DeckDetail
          deck={activeDeck}
          allCards={allCards}
          onClose={() => { setView('list'); setActiveDeckId(null); }}
          onDeleteDeck={async () => {
            await deleteDeck(activeDeckId);
            setView('list');
            setActiveDeckId(null);
          }}
        />
      </Suspense>
    );
  }

  return (
    <PageContent>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {t('flashcards.deck.title' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h2>
          {streak && streak.currentStreak > 0 && (
            <p className="text-sm text-orange-500 dark:text-orange-400 font-medium mt-0.5">
              🔥 {t('flashcards.deck.streakDays' as any).replace('{count}', String(streak.currentStreak))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition min-h-[44px]"
          aria-label={t('flashcards.deck.newDeck' as any) as string} /* eslint-disable-line @typescript-eslint/no-explicit-any */
        >
          + {t('flashcards.deck.newDeck' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && decks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            {t('flashcards.deck.noCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            {t('flashcards.deck.addFirstCard' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <button
            type="button"
            onClick={onSwitchToPractice}
            className="text-sm text-blue-500 hover:underline"
          >
            ← {t('flashcards.deck.tabs.practice' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        </div>
      )}

      {/* Due today banner */}
      {!loading && totalDueToday > 0 && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 font-medium">
          {t('flashcards.deck.dueToday' as any).replace('{count}', String(totalDueToday))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
      )}

      {/* Deck grid */}
      {!loading && decks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {decks.map(deck => (
            <DeckCardsWrapper
              key={deck.id}
              deck={deck}
              onReview={handleReview}
              onOpen={handleOpen}
              onDueTodayCount={handleDueTodayCount}
            />
          ))}
        </div>
      )}

      {/* Add deck modal */}
      {showAddModal && (
        <Suspense fallback={null}>
          <AddDeckModal
            onSave={handleCreateDeck}
            onClose={() => setShowAddModal(false)}
          />
        </Suspense>
      )}
    </PageContent>
  );
}
