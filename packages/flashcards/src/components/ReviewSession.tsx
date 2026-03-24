import React, { useState, useEffect } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type { FlashCard } from '../types';
import type { Rating } from '../types';
import { useReviewSession } from '../hooks/useReviewSession';
import SessionSummary from './SessionSummary';

interface Props {
  deckId: string;
  deckName: string;
  allCards: FlashCard[];  // Full card library to resolve card content from cardId
  onClose: () => void;
}

const RATING_CONFIG: { rating: Rating; labelKey: string; colorClass: string }[] = [
  { rating: 'again', labelKey: 'flashcards.deck.again', colorClass: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800' },
  { rating: 'hard', labelKey: 'flashcards.deck.hard', colorClass: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50 border border-orange-200 dark:border-orange-800' },
  { rating: 'good', labelKey: 'flashcards.deck.good', colorClass: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800' },
  { rating: 'easy', labelKey: 'flashcards.deck.easy', colorClass: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800' },
];

export default function ReviewSession({ deckId, deckName, allCards, onClose }: Props) {
  const { t } = useTranslation();
  const { status, currentCard, progressCurrent, progressTotal, sessionStats, startSession, rateCard, resetSession } = useReviewSession(deckId);
  const [isFlipped, setIsFlipped] = useState(false);

  // Auto-start when we have due cards
  useEffect(() => {
    if (status === 'idle') startSession();
  }, [status, startSession]);

  // Reset flip state when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [currentCard?.cardId]);

  const handleRate = (rating: Rating) => {
    rateCard(rating);
    setIsFlipped(false);
  };

  // Resolve card content from allCards using cardId
  const resolveCard = (cardId: string): FlashCard | undefined => {
    return allCards.find(c => c.id === cardId);
  };

  if (status === 'loading') {
    return (
      <PageContent>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </PageContent>
    );
  }

  if (status === 'no-cards') {
    return (
      <PageContent>
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-green-600 dark:text-green-400 font-medium mb-2">
            {t('flashcards.deck.noDue' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <button type="button" onClick={onClose} className="text-sm text-blue-500 hover:underline mt-4 min-h-[44px] px-4">
            ← {t('flashcards.deck.tabs.decks' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        </div>
      </PageContent>
    );
  }

  const resolvedCard = currentCard ? resolveCard(currentCard.cardId) : null;

  return (
    <div className="fixed inset-0 z-40 bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition min-h-[44px] px-2"
        >
          ← {t('flashcards.done' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-gray-800 dark:text-white truncate max-w-[180px]">{deckName}</p>
          {status === 'active' && (
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {t('flashcards.deck.progress' as any) /* eslint-disable-line @typescript-eslint/no-explicit-any */
                .replace('{current}', String(progressCurrent + 1))
                .replace('{total}', String(progressTotal))}
            </p>
          )}
        </div>
        <div className="w-16" aria-hidden="true" />
      </div>

      {/* Progress bar */}
      {status === 'active' && progressTotal > 0 && (
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-1 bg-blue-500 transition-all duration-300"
            style={{ width: `${(progressCurrent / progressTotal) * 100}%` }}
          />
        </div>
      )}

      {/* Card area */}
      {status === 'active' && currentCard && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
          {/* Card */}
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[220px] flex flex-col items-center justify-center p-6 text-center">
              {!isFlipped ? (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">Front</p>
                  <p className="text-2xl font-medium text-gray-800 dark:text-white">
                    {resolvedCard?.front ?? currentCard.cardId}
                  </p>
                  {resolvedCard?.meta?.pinyin && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{resolvedCard.meta.pinyin}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 uppercase tracking-wide">Answer</p>
                  <p className="text-2xl font-medium text-gray-800 dark:text-white">
                    {resolvedCard?.back ?? '—'}
                  </p>
                  {resolvedCard?.meta?.reference && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{resolvedCard.meta.reference}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Maturity badge */}
          <div className="text-xs text-gray-400 dark:text-gray-500 capitalize">
            {currentCard.maturity}
          </div>

          {/* Flip / Rating buttons */}
          {!isFlipped ? (
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="w-full max-w-md py-4 rounded-xl text-base font-semibold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition min-h-[56px]"
            >
              {t('flashcards.deck.flip' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          ) : (
            <div className="w-full max-w-md grid grid-cols-4 gap-2">
              {RATING_CONFIG.map(({ rating, labelKey, colorClass }) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRate(rating)}
                  className={`py-3 rounded-xl text-sm font-medium transition min-h-[56px] ${colorClass}`}
                  aria-label={`Rate as ${rating}`}
                >
                  {t(labelKey as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Session summary overlay */}
      {status === 'complete' && sessionStats && (
        <SessionSummary
          stats={sessionStats}
          deckName={deckName}
          onDone={() => {
            resetSession();
            onClose();
          }}
        />
      )}
    </div>
  );
}
