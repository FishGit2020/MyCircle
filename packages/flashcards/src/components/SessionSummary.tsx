import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { SessionStats } from '../hooks/useReviewSession';

interface Props {
  stats: SessionStats;
  deckName: string;
  onDone: () => void;
}

export default function SessionSummary({ stats, deckName, onDone }: Props) {
  const { t } = useTranslation();

  const nextDateStr = stats.nextReviewDate
    ? new Date(stats.nextReviewDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : null;

  const totalRatings = stats.ratings.again + stats.ratings.hard + stats.ratings.good + stats.ratings.easy;
  const passRate = totalRatings > 0
    ? Math.round(((stats.ratings.good + stats.ratings.easy) / totalRatings) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-3xl mb-2" aria-hidden="true">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            {t('flashcards.deck.sessionSummary' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{deckName}</p>
        </div>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('flashcards.deck.cardsReviewed' as any).replace('{count}', String(stats.cardsReviewed))}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </span>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">{passRate}% recalled</span>
          </div>

          {/* Rating breakdown */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
              <div className="font-bold text-red-600 dark:text-red-400 text-base">{stats.ratings.again}</div>
              <div className="text-red-500 dark:text-red-400">{t('flashcards.deck.again' as any)}</div>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
              <div className="font-bold text-orange-600 dark:text-orange-400 text-base">{stats.ratings.hard}</div>
              <div className="text-orange-500 dark:text-orange-400">{t('flashcards.deck.hard' as any)}</div>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
              <div className="font-bold text-blue-600 dark:text-blue-400 text-base">{stats.ratings.good}</div>
              <div className="text-blue-500 dark:text-blue-400">{t('flashcards.deck.good' as any)}</div>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
              <div className="font-bold text-green-600 dark:text-green-400 text-base">{stats.ratings.easy}</div>
              <div className="text-green-500 dark:text-green-400">{t('flashcards.deck.easy' as any)}</div>{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </div>
          </div>

          {/* Next review */}
          {nextDateStr && (
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              {t('flashcards.deck.sessionNextReview' as any).replace('{date}', nextDateStr)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          )}
        </div>

        {/* Done button */}
        <button
          type="button"
          onClick={onDone}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 transition min-h-[44px]"
        >
          {t('flashcards.done' as any)}{/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>
    </div>
  );
}
