import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ChineseCharacter } from '../data/characters';

interface FlashcardViewProps {
  characters: ChineseCharacter[];
  masteredIds: Set<string>;
  onToggleMastered: (id: string) => void;
  onPractice: (character: ChineseCharacter) => void;
}

export default function FlashcardView({ characters, masteredIds, onToggleMastered, onPractice }: FlashcardViewProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (characters.length === 0) return null;

  const character = characters[currentIndex];
  const isMastered = masteredIds.has(character.id);

  const goNext = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % characters.length);
  };

  const goPrev = () => {
    setFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + characters.length) % characters.length);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress indicator */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} / {characters.length}
      </div>

      {/* Flashcard */}
      <div
        className="relative w-64 h-80 cursor-pointer [perspective:600px]"
        onClick={() => setFlipped(!flipped)}
        data-testid="flashcard"
      >
        <div
          className={`absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] ${
            flipped ? '[transform:rotateY(180deg)]' : ''
          }`}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 [backface-visibility:hidden]">
            <span className="text-7xl mb-2" data-testid="flashcard-character">{character.character}</span>
            <span className="text-sm text-gray-400 dark:text-gray-500 mt-4">
              {flipped ? t('chinese.hideAnswer') : t('chinese.showAnswer')}
            </span>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-800 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <span className="text-5xl mb-3">{character.character}</span>
            <span className="text-2xl text-blue-600 dark:text-blue-400 font-medium" data-testid="flashcard-pinyin">{character.pinyin}</span>
            <span className="text-lg text-gray-600 dark:text-gray-300 mt-1" data-testid="flashcard-meaning">{character.meaning}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('chinese.previous')}
        </button>
        <button
          type="button"
          onClick={goNext}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          {t('chinese.next')}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onToggleMastered(character.id)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            isMastered
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
          data-testid="toggle-mastered"
        >
          {isMastered ? t('chinese.unmarkMastered') : t('chinese.markMastered')}
        </button>
        <button
          type="button"
          onClick={() => onPractice(character)}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
        >
          {t('chinese.practice')}
        </button>
      </div>
    </div>
  );
}
