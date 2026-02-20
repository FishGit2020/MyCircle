import React, { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard } from '../types';
import CardThumbnail from './CardThumbnail';

interface CardGridProps {
  cards: FlashCard[];
  masteredIds: string[];
  onCardClick: (card: FlashCard) => void;
  onDeleteCard?: (card: FlashCard) => void;
  onEditCard?: (card: FlashCard) => void;
  isAuthenticated?: boolean;
}

function canDelete(card: FlashCard): boolean {
  return card.type !== 'english';
}

function canEdit(card: FlashCard): boolean {
  return card.type !== 'english';
}

export default function CardGrid({ cards, masteredIds, onCardClick, onDeleteCard, onEditCard, isAuthenticated }: CardGridProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const grouped = useMemo(() => {
    const map = new Map<string, FlashCard[]>();
    for (const card of cards) {
      const key = card.category || '';
      const list = map.get(key);
      if (list) list.push(card);
      else map.set(key, [card]);
    }
    return map;
  }, [cards]);

  if (cards.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('flashcards.noCards')}
      </p>
    );
  }

  const toggleCollapse = (category: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {Array.from(grouped.entries()).map(([category, categoryCards]) => {
        const isCollapsed = collapsed.has(category);
        const displayName = category || t('flashcards.uncategorized');
        return (
          <div key={category}>
            <button
              type="button"
              onClick={() => toggleCollapse(category)}
              aria-expanded={!isCollapsed}
              className="flex items-center gap-2 w-full text-left py-2 px-1 group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 capitalize">
                {displayName}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                ({categoryCards.length})
              </span>
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-1">
                {categoryCards.map(card => (
                  <CardThumbnail
                    key={card.id}
                    card={card}
                    isMastered={masteredIds.includes(card.id)}
                    onClick={() => onCardClick(card)}
                    onDelete={isAuthenticated && onDeleteCard && canDelete(card) ? () => onDeleteCard(card) : undefined}
                    onEdit={isAuthenticated && onEditCard && canEdit(card) ? () => onEditCard(card) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
