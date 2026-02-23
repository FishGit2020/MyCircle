import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard } from '../types';

interface CardThumbnailProps {
  card: FlashCard;
  isMastered: boolean;
  onClick: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onPublish?: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  chinese: 'border-red-300 dark:border-red-700',
  english: 'border-green-300 dark:border-green-700',
  'bible-first-letter': 'border-purple-300 dark:border-purple-700',
  'bible-full': 'border-indigo-300 dark:border-indigo-700',
  custom: 'border-yellow-300 dark:border-yellow-700',
};

export default function CardThumbnail({ card, isMastered, onClick, onDelete, onEdit, onPublish }: CardThumbnailProps) {
  const { t } = useTranslation();
  const borderColor = TYPE_COLORS[card.type] || 'border-gray-300 dark:border-gray-600';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full p-3 rounded-xl border-2 ${borderColor} bg-white dark:bg-gray-800 hover:shadow-md transition-shadow text-left min-h-[80px] flex flex-col justify-between ${
        isMastered ? 'opacity-60' : ''
      }`}
    >
      {/* Action icons */}
      {(onDelete || onEdit || onPublish) && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          {onPublish && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('flashcards.publish')}
              onClick={e => { e.stopPropagation(); onPublish(); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onPublish(); } }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
              </svg>
            </span>
          )}
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('flashcards.edit')}
              onClick={e => { e.stopPropagation(); onEdit(); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onEdit(); } }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </span>
          )}
          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              aria-label={t('flashcards.delete')}
              onClick={e => { e.stopPropagation(); onDelete(); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(); } }}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
      )}

      <p className="text-sm font-medium text-gray-800 dark:text-white line-clamp-2">
        {card.front}
      </p>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {card.type}
          </span>
          {/* Shared/Private badge */}
          {card.isPublic ? (
            <span className="text-[9px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-1.5 py-0.5 rounded-full">
              {t('flashcards.shared')}
            </span>
          ) : card.type !== 'english' ? (
            <span className="text-[9px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full">
              {t('flashcards.private')}
            </span>
          ) : null}
        </div>
        {isMastered && (
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
            ✓
          </span>
        )}
      </div>
      {card.meta?.pinyin && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.meta.pinyin}</p>
      )}
      {/* Creator info for public cards */}
      {card.isPublic && card.createdBy?.displayName && (
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
          {card.createdBy.displayName}
        </p>
      )}
    </button>
  );
}
