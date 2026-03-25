import React from 'react';
import { useTranslation } from '@mycircle/shared';
import { rankingByPlayer } from '../hooks/useTournament';
import type { TournamentSession } from '../hooks/useTournament';

const COLOR_CLASSES: Record<string, string> = {
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
};

const RANK_ICONS = ['🥇', '🥈', '🥉'];

interface TournamentResultsProps {
  session: TournamentSession;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function TournamentResults({ session, onPlayAgain, onExit }: TournamentResultsProps) {
  const { t } = useTranslation();
  const rankings = rankingByPlayer(session);

  const topTotal = rankings[0]?.total ?? 0;
  const winners = rankings.filter(r => r.rank === 1);
  const isTie = winners.length > 1;

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center">
        <p className="text-4xl mb-2">{isTie ? '🤝' : '🏆'}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isTie
            ? t('games.tie' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            : t('games.tournamentWinner' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        {!isTie && (
          <p className="text-lg font-semibold text-fuchsia-600 dark:text-fuchsia-400 mt-1">
            {winners[0].player.displayName}
          </p>
        )}
        {isTie && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {winners.map(w => w.player.displayName).join(' & ')}
          </p>
        )}
      </div>

      {/* Rankings */}
      <div className="w-full space-y-2">
        {rankings.map(({ player, total, rank }) => {
          const isWinner = rank === 1;
          const colorClass = COLOR_CLASSES[player.avatarColor] ?? 'bg-blue-500';
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                isWinner
                  ? 'border-fuchsia-300 dark:border-fuchsia-700 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              <span className="w-8 text-center text-xl">
                {RANK_ICONS[rank - 1] ?? `${rank}`}
              </span>
              <div className={`w-9 h-9 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                {player.displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {player.displayName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('games.totalScore' as any)}: {total} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
                </p>
              </div>
              {topTotal > 0 && (
                <div className="flex-shrink-0">
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fuchsia-500 rounded-full transition-all"
                      style={{ width: `${Math.round((total / topTotal) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          type="button"
          onClick={onPlayAgain}
          className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-medium transition active:scale-95"
        >
          {t('games.playAgain')}
        </button>
        <button
          type="button"
          onClick={onExit}
          className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('games.exitTournament' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>
    </div>
  );
}
