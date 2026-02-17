import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Phrase } from '../data/phrases';
import PhraseCard from './PhraseCard';

interface LessonViewProps {
  phrases: Phrase[];
  completedIds: Set<string>;
  onComplete: (id: string) => void;
}

export default function LessonView({ phrases, completedIds, onComplete }: LessonViewProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (phrases.length === 0) return null;

  const allDone = phrases.every((p) => completedIds.has(p.id));

  if (allDone) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2" data-testid="lesson-complete">
          {t('english.lessonComplete')}
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          {completedIds.size} / {phrases.length}
        </p>
      </div>
    );
  }

  // Skip to first incomplete phrase
  const phrase = phrases[currentIndex];
  const isCompleted = completedIds.has(phrase.id);

  const goNext = () => {
    setCurrentIndex((prev) => (prev + 1) % phrases.length);
  };

  const goPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + phrases.length) % phrases.length);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} / {phrases.length}
      </div>

      <PhraseCard phrase={phrase} />

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('english.previous')}
        </button>
        {!isCompleted ? (
          <button
            type="button"
            onClick={() => onComplete(phrase.id)}
            className="px-6 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 transition font-medium"
            data-testid="got-it-btn"
          >
            {t('english.gotIt')}
          </button>
        ) : (
          <span className="px-4 py-2 text-green-600 dark:text-green-400 font-medium">
            ✓ {t('english.gotIt')}
          </span>
        )}
        <button
          type="button"
          onClick={goNext}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition"
        >
          {t('english.next')}
        </button>
      </div>
    </div>
  );
}
