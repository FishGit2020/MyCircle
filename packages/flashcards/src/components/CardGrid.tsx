import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard } from '../types';
import CardThumbnail from './CardThumbnail';

interface CardGridProps {
  cards: FlashCard[];
  masteredIds: string[];
  onCardClick: (card: FlashCard) => void;
}

export default function CardGrid({ cards, masteredIds, onCardClick }: CardGridProps) {
  const { t } = useTranslation();

  if (cards.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('flashcards.noCards')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {cards.map(card => (
        <CardThumbnail
          key={card.id}
          card={card}
          isMastered={masteredIds.includes(card.id)}
          onClick={() => onCardClick(card)}
        />
      ))}
    </div>
  );
}
