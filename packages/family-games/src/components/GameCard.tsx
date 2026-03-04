import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { TranslationKey } from '@mycircle/shared';

export type GameType = 'trivia' | 'word' | 'memory' | 'math' | 'headsup';

interface GameCardProps {
  type: GameType;
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: React.ReactNode;
  color: string;
  onSelect: (type: GameType) => void;
}

export default function GameCard({ type, titleKey, descKey, icon, color, onSelect }: GameCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      className={`flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-${color}-300 dark:hover:border-${color}-600 transition-all active:scale-95 min-h-[160px] w-full`}
      aria-label={t(titleKey)}
    >
      <div className={`w-12 h-12 rounded-xl bg-${color}-50 dark:bg-${color}-900/30 flex items-center justify-center text-${color}-500`}>
        {icon}
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
          {t(titleKey)}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {t(descKey)}
        </p>
      </div>
    </button>
  );
}
