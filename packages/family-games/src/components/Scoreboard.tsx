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

const GAME_ORDER: GameType[] = ['trivia', 'math', 'word', 'memory', 'headsup'];

const GAME_COLORS: Record<GameType, string> = {
  trivia: 'purple',
  math: 'blue',
  word: 'green',
  memory: 'orange',
  headsup: 'fuchsia',
};

const GAME_LABEL_KEYS: Record<GameType, string> = {
  trivia: 'games.trivia',
  math: 'games.mathChallenge',
  word: 'games.wordGame',
  memory: 'games.memoryMatch',
  headsup: 'games.headsUp',
};

const TOP_N = 5;

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' \u00b7 ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch { return ''; }
}

function GameScoreCard({ gameType, t }: { gameType: GameType; t: (key: string) => string }) {
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const api = window.__familyGames;
    if (api?.getScores) {
      api.getScores(gameType).then((data: ScoreEntry[]) => {
        setScores(data);
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }

    let unsub: (() => void) | undefined;
    if (api?.subscribe) {
      unsub = api.subscribe(gameType, (data: ScoreEntry[]) => {
        setScores(data);
      });
    }
    return () => unsub?.();
  }, [gameType]);

  const color = GAME_COLORS[gameType];
  const shown = expanded ? scores : scores.slice(0, TOP_N);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-${color}-50 dark:bg-${color}-900/20`}>
        <h4 className={`text-sm font-semibold text-${color}-700 dark:text-${color}-300`}>
          {t(GAME_LABEL_KEYS[gameType])}
        </h4>
      </div>
      <div className="p-3">
        {loading ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">{t('games.loading')}</p>
        ) : scores.length === 0 ? (
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-3">{t('games.noScores')}</p>
        ) : (
          <>
            <div className={`space-y-1.5 ${expanded ? 'max-h-[300px] overflow-y-auto' : ''}`}>
              {shown.map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                >
                  <span className={`text-xs font-bold w-5 text-center ${
                    i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                      {entry.playedBy.displayName}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {entry.difficulty} &middot; {(entry.timeMs / 1000).toFixed(1)}s
                      {entry.playedAt ? ` \u00b7 ${formatDate(entry.playedAt)}` : ''}
                    </p>
                  </div>
                  <span className={`text-xs font-bold text-${color}-600 dark:text-${color}-400`}>
                    {entry.score}
                  </span>
                </div>
              ))}
            </div>
            {scores.length > TOP_N && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full mt-2 text-[10px] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition text-center"
              >
                {expanded ? t('games.showLess') : t('games.showMore').replace('{n}', String(scores.length))}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Scoreboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('games.scoreboard')}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {GAME_ORDER.map(type => (
          <GameScoreCard key={type} gameType={type} t={t} />
        ))}
      </div>
    </div>
  );
}
