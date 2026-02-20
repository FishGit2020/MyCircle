import React, { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard } from '../types';
import type { ChineseCharacter } from '../data/characters';
import FlipCard from './FlipCard';
import PracticeCanvas from './PracticeCanvas';

interface CardPracticeProps {
  cards: FlashCard[];
  masteredIds: string[];
  onToggleMastered: (cardId: string) => void;
  onClose: () => void;
  startIndex?: number;
}

function CardFront({ card }: { card: FlashCard }) {
  return (
    <div>
      <p className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
        {card.front}
      </p>
      {card.meta?.pinyin && (
        <p className="text-lg text-gray-500 dark:text-gray-400">{card.meta.pinyin}</p>
      )}
      {card.meta?.reference && (
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">{card.meta.reference}</p>
      )}
    </div>
  );
}

function CardBack({ card }: { card: FlashCard }) {
  return (
    <div>
      <p className="text-xl text-gray-800 dark:text-white leading-relaxed">
        {card.back}
      </p>
      {card.meta?.reference && (
        <p className="text-sm text-blue-600 dark:text-blue-400 mt-3">{card.meta.reference}</p>
      )}
    </div>
  );
}

export default function CardPractice({ cards, masteredIds, onToggleMastered, onClose, startIndex = 0 }: CardPracticeProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [flipped, setFlipped] = useState(false);
  const [showWritingPractice, setShowWritingPractice] = useState(false);

  const card = cards[currentIndex];
  const isMastered = card ? masteredIds.includes(card.id) : false;

  const goNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1);
      setFlipped(false);
    }
  }, [currentIndex, cards.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
      setFlipped(false);
    }
  }, [currentIndex]);

  if (!card) return null;

  // Map current card to ChineseCharacter for PracticeCanvas
  const chineseCharForCanvas: ChineseCharacter | null = card.type === 'chinese' ? {
    id: card.id.replace('zh-', ''),
    character: card.front,
    pinyin: card.meta?.pinyin || '',
    meaning: card.back,
    category: card.category as any,
  } : null;

  if (showWritingPractice && chineseCharForCanvas) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex-1 overflow-y-auto p-4">
          <PracticeCanvas
            character={chineseCharForCanvas}
            onBack={() => setShowWritingPractice(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition"
        >
          {t('flashcards.done')}
        </button>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {t('flashcards.progress').replace('{current}', String(currentIndex + 1)).replace('{total}', String(cards.length))}
        </span>
        <button
          type="button"
          onClick={() => onToggleMastered(card.id)}
          className={`text-sm font-medium px-3 py-1 rounded-lg transition ${
            isMastered
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          {isMastered ? t('flashcards.unmarkMastered') : t('flashcards.markMastered')}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4">
        <FlipCard
          flipped={flipped}
          onFlip={() => setFlipped(f => !f)}
          front={<CardFront card={card} />}
          back={<CardBack card={card} />}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 px-4 py-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 transition hover:bg-gray-200 dark:hover:bg-gray-600"
          aria-label={t('flashcards.previous')}
        >
          {t('flashcards.previous')}
        </button>
        <button
          type="button"
          onClick={() => setFlipped(f => !f)}
          className="px-6 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          {t('flashcards.flip')}
        </button>
        {card.type === 'chinese' && (
          <button
            type="button"
            onClick={() => setShowWritingPractice(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 transition"
          >
            {t('chinese.practice')}
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={currentIndex === cards.length - 1}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-30 transition hover:bg-gray-200 dark:hover:bg-gray-600"
          aria-label={t('flashcards.next')}
        >
          {t('flashcards.next')}
        </button>
      </div>
    </div>
  );
}
