import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { GameType } from './GameCard';

const SCORING_RULES: Record<GameType, string> = {
  trivia: 'games.scoringTrivia',
  math: 'games.scoringMath',
  word: 'games.scoringWord',
  memory: 'games.scoringMemory',
  headsup: 'games.scoringHeadsUp',
  reaction: 'games.scoringReaction',
  simon: 'games.scoringSimon',
  sequence: 'games.scoringSequence',
  colormatch: 'games.scoringColorMatch',
  maze: 'games.scoringMaze',
  anagram: 'games.scoringAnagram',
};

const GAME_NAME_KEYS: Record<GameType, string> = {
  trivia: 'games.trivia',
  math: 'games.mathChallenge',
  word: 'games.wordGame',
  memory: 'games.memoryMatch',
  headsup: 'games.headsUp',
  reaction: 'games.reactionTime',
  simon: 'games.simonSays',
  sequence: 'games.numberSequence',
  colormatch: 'games.colorMatch',
  maze: 'games.mazeRunner',
  anagram: 'games.anagram',
};

const GAME_ROUTES: Record<GameType, string> = {
  trivia: '/family-games/trivia',
  math: '/family-games/math',
  word: '/family-games/word',
  memory: '/family-games/memory',
  headsup: '/family-games/headsup',
  reaction: '/family-games/reaction',
  simon: '/family-games/simon',
  sequence: '/family-games/sequence',
  colormatch: '/family-games/colormatch',
  maze: '/family-games/maze',
  anagram: '/family-games/anagram',
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
  const [error, setError] = useState(false);
  const savedRef = useRef(false);

  // Auto-save score on mount (once only)
  useEffect(() => {
    if (savedRef.current) return;
    const api = window.__familyGames;
    if (!api?.saveScore) return;
    savedRef.current = true;
    api.saveScore({ gameType, score, timeMs, difficulty })
      .then(() => setSubmitted(true))
      .catch(() => setError(true));
  }, [gameType, score, timeMs, difficulty]);

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

  const [showRules, setShowRules] = useState(false);

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

      {/* Scoring rules (collapsible) */}
      <div className="w-full max-w-xs">
        <button
          type="button"
          onClick={() => setShowRules(!showRules)}
          className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors mx-auto"
        >
          <svg className={`w-3.5 h-3.5 transition-transform ${showRules ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          {t('games.howScoringWorks' as any)}
        </button>
        {showRules && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center leading-relaxed">
            {t(SCORING_RULES[gameType] as any)}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
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
