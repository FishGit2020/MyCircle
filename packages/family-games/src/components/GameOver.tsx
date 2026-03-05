import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { GameType } from './GameCard';

const GAME_NAME_KEYS: Record<GameType, string> = {
  trivia: 'games.trivia',
  math: 'games.mathChallenge',
  word: 'games.wordGame',
  memory: 'games.memoryMatch',
  headsup: 'games.headsUp',
};

const GAME_ROUTES: Record<GameType, string> = {
  trivia: '/family-games/trivia',
  math: '/family-games/math',
  word: '/family-games/word',
  memory: '/family-games/memory',
  headsup: '/family-games/headsup',
};

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
  const [error, setError] = useState(false);

  const handleSubmitScore = async () => {
    const api = window.__familyGames;
    if (!api?.saveScore) return;

    setSubmitting(true);
    setError(false);
    try {
      await api.saveScore({ gameType, score, timeMs, difficulty });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = useCallback(async () => {
    const gameName = t(GAME_NAME_KEYS[gameType] || 'games.trivia');
    const text = t('games.shareText').replace('{score}', String(score)).replace('{game}', gameName);
    const url = `${window.location.origin}${GAME_ROUTES[gameType] || '/family-games'}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: gameName, text, url });
      } catch { /* user cancelled or share failed */ }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
      } catch { /* ignore */ }
    }
  }, [gameType, score, t]);

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
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
            {t('games.submitFailed')}
          </p>
        )}
        <button
          type="button"
          onClick={handleShare}
          className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          {t('games.shareScore')}
        </button>
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
