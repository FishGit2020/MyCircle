import React from 'react';
import type { FlashCard } from '../types';

interface CardThumbnailProps {
  card: FlashCard;
  isMastered: boolean;
  onClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  chinese: 'border-red-300 dark:border-red-700',
  english: 'border-green-300 dark:border-green-700',
  'bible-first-letter': 'border-purple-300 dark:border-purple-700',
  'bible-full': 'border-indigo-300 dark:border-indigo-700',
  custom: 'border-yellow-300 dark:border-yellow-700',
};

export default function CardThumbnail({ card, isMastered, onClick }: CardThumbnailProps) {
  const borderColor = TYPE_COLORS[card.type] || 'border-gray-300 dark:border-gray-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full p-3 rounded-xl border-2 ${borderColor} bg-white dark:bg-gray-800 hover:shadow-md transition-shadow text-left min-h-[80px] flex flex-col justify-between ${
        isMastered ? 'opacity-60' : ''
      }`}
    >
      <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2">
        {card.front}
      </p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {card.type}
        </span>
        {isMastered && (
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
            ✓
          </span>
        )}
      </div>
      {card.meta?.pinyin && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.meta.pinyin}</p>
      )}
    </button>
  );
}
