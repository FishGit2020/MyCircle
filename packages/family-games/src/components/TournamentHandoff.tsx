import React, { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

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

interface TournamentHandoffProps {
  playerName: string;
  playerColor: string;
  gameName: string;
  roundLabel: string;
  onReady: () => void;
}

export default function TournamentHandoff({ playerName, playerColor, gameName, roundLabel, onReady }: TournamentHandoffProps) {
  const { t } = useTranslation();
  const [revealed, setRevealed] = useState(false);

  const colorClass = COLOR_CLASSES[playerColor] ?? 'bg-blue-500';

  const handleReveal = () => {
    if (!revealed) {
      setRevealed(true);
    } else {
      onReady();
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[70vh] gap-8 text-center px-6"
    >
      {/* Avatar */}
      <div className={`w-20 h-20 rounded-full ${colorClass} flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
        {playerName.charAt(0).toUpperCase()}
      </div>

      <div className="space-y-2">
        <p className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
          {roundLabel}
        </p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('games.passDeviceTo' as any, { player: playerName })} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {t('games.handoffInstruction' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      </div>

      {revealed ? (
        <div className="space-y-4">
          <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 border border-fuchsia-200 dark:border-fuchsia-700 rounded-2xl px-6 py-4">
            <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-wide mb-1">
              {t('games.yourGame' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <p className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-300">{gameName}</p>
          </div>
          <button
            type="button"
            onClick={onReady}
            className="w-full py-4 px-8 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl font-bold text-lg transition active:scale-95 min-h-[56px]"
          >
            {t('games.tapToStart' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleReveal}
          className="w-full py-4 px-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-2xl font-bold text-lg transition active:scale-95 min-h-[56px]"
        >
          {t('games.yourTurn' as any)} — {t('games.tapToReveal' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      )}
    </div>
  );
}
