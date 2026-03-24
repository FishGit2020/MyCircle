import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Deck, DeckCard as DeckCardType } from '../types';

interface Props {
  deck: Deck;
  deckCards: DeckCardType[];
  onReview: (deckId: string) => void;
  onOpen: (deckId: string) => void;
}

export default function DeckCard({ deck, deckCards, onReview, onOpen }: Props) {
  const { t } = useTranslation();
  const now = Date.now();
  const dueTodayCount = deckCards.filter(c => c.dueDate <= now).length;
  const cardCount = deckCards.length;

  // Find earliest future due date for "all caught up" message
  const upcomingDueDates = deckCards
    .filter(c => c.dueDate > now)
    .map(c => c.dueDate)
    .sort((a, b) => a - b);
  const nextDueDate = upcomingDueDates[0];
  const nextDueDateStr = nextDueDate
    ? new Date(nextDueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition">
      {/* Deck header — clickable to open detail */}
      <button
        type="button"
        onClick={() => onOpen(deck.id)}
        className="w-full text-left mb-3"
        aria-label={`Open deck ${deck.name}`}
      >
        <h3 className="text-base font-semibold text-gray-800 dark:text-white truncate">
          {deck.name}
        </h3>
        {deck.languagePair && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
            {deck.languagePair}
          </p>
        )}
      </button>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span>{t('flashcards.cardsCount' as any).replace('{count}', String(cardCount))}</span>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        {dueTodayCount > 0 && (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {t('flashcards.deck.dueToday' as any).replace('{count}', String(dueTodayCount))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </span>
        )}
      </div>

      {/* Due status / review button */}
      {cardCount === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">
          {t('flashcards.deck.noCards' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      ) : dueTodayCount > 0 ? (
        <button
          type="button"
          onClick={() => onReview(deck.id)}
          className="w-full py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition min-h-[44px]"
          aria-label={`Review ${deck.name}`}
        >
          {t('flashcards.deck.review' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      ) : (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium">
          {nextDueDateStr
            ? t('flashcards.deck.allCaughtUp' as any).replace('{date}', nextDueDateStr)  /* eslint-disable-line @typescript-eslint/no-explicit-any */
            : t('flashcards.deck.noDue' as any)  /* eslint-disable-line @typescript-eslint/no-explicit-any */
          }
        </p>
      )}
    </div>
  );
}
