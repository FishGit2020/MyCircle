import React, { useState, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { GameType } from './GameCard';

interface ScoreEntry {
  id: string;
  gameType: GameType;
  score: number;
  timeMs: number;
  difficulty: string;
  playedBy: { uid: string; displayName: string };
  playedAt: string;
}

const GAME_TABS: GameType[] = ['trivia', 'word', 'memory', 'math', 'headsup'];

export default function Scoreboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<GameType>('trivia');
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const api = (window as any).__familyGames;
    if (api?.getScores) {
      api.getScores(activeTab).then((data: ScoreEntry[]) => {
        setScores(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Subscribe to real-time updates
    let unsub: (() => void) | undefined;
    if (api?.subscribe) {
      unsub = api.subscribe(activeTab, (data: ScoreEntry[]) => {
        setScores(data);
      });
    }
    return () => unsub?.();
  }, [activeTab]);

  const tabLabel = (type: GameType): string => {
    switch (type) {
      case 'trivia': return t('games.trivia');
      case 'word': return t('games.wordGame');
      case 'memory': return t('games.memoryMatch');
      case 'math': return t('games.mathChallenge');
      case 'headsup': return t('games.headsUp');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">{t('games.scoreboard')}</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {GAME_TABS.map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tabLabel(tab)}
          </button>
        ))}
      </div>

      {/* Score list */}
      <div className="p-4">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('games.loading')}</p>
        ) : scores.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('games.noScores')}</p>
        ) : (
          <div className="space-y-2">
            {scores.map((entry, i) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
              >
                <span className={`text-sm font-bold w-6 text-center ${
                  i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {entry.playedBy.displayName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {entry.difficulty} &middot; {(entry.timeMs / 1000).toFixed(1)}s
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {entry.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
