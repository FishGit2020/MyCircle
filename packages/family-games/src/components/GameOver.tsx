import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { GameType } from './GameCard';

interface GameOverProps {
  gameType: GameType;
  score: number;
  timeMs: number;
  difficulty: string;
  onPlayAgain: () => void;
  onBack: () => void;
}

export default function GameOver({ gameType, score, timeMs, difficulty, onPlayAgain, onBack }: GameOverProps) {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitScore = async () => {
    const api = (window as any).__familyGames;
    if (!api?.saveScore) return;

    setSubmitting(true);
    try {
      await api.saveScore({ gameType, score, timeMs, difficulty });
      setSubmitted(true);
    } catch {
      // Silently fail — user can still play again
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('games.gameOver')}
        </h2>
        <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
          {score}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('games.timeLabel')}: {(timeMs / 1000).toFixed(1)}s &middot; {difficulty}
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmitScore}
            disabled={submitting}
            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
          >
            {submitting ? t('games.submitting') : t('games.submitScore')}
          </button>
        )}
        {submitted && (
          <p className="text-sm text-green-600 dark:text-green-400 text-center font-medium">
            {t('games.scoreSubmitted')}
          </p>
        )}
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium text-sm transition"
        >
          {t('games.playAgain')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {t('games.backToGames')}
        </button>
      </div>
    </div>
  );
}
