import { useState, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { FlashCard } from '../types';

interface QuizViewProps {
  cards: FlashCard[];
  onQuizComplete: (score: { correct: number; total: number }) => void;
}

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function QuizView({ cards, onQuizComplete }: QuizViewProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Generate quiz questions: show front, pick correct back
  const questions = useMemo(() => {
    if (cards.length < 2) return [];
    const shuffled = shuffle(cards).slice(0, Math.min(10, cards.length));
    return shuffled.map((card) => {
      const wrongOptions = shuffle(cards.filter((c) => c.id !== card.id))
        .slice(0, 3)
        .map((c) => c.back);
      const options = shuffle([card.back, ...wrongOptions]);
      return { card, options, correctAnswer: card.back };
    });
  }, [cards]);

  if (isComplete) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🏆</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2" data-testid="quiz-complete">
          {t('english.quizComplete')}
        </h3>
        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {t('english.score')}: {score} / {questions.length}
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <p className="text-center text-gray-500 dark:text-gray-400 py-8">
        {t('flashcards.noCards')}
      </p>
    );
  }

  const question = questions[currentIndex];

  const handleSelect = (option: string) => {
    if (selected) return; // Already answered
    setSelected(option);
    const isCorrect = option === question.correctAnswer;
    if (isCorrect) setScore((s) => s + 1);

    // Auto-advance after a delay
    setTimeout(() => {
      if (currentIndex + 1 >= questions.length) {
        const finalScore = isCorrect ? score + 1 : score;
        onQuizComplete({ correct: finalScore, total: questions.length });
        setIsComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
        setSelected(null);
      }
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} / {questions.length}
      </div>

      {/* Show front of card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center w-full max-w-md">
        <p className="text-3xl font-bold text-gray-800 dark:text-white" data-testid="quiz-question">
          {question.card.front}
        </p>
        {question.card.meta?.pinyin && (
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-1">{question.card.meta.pinyin}</p>
        )}
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-2 w-full max-w-md">
        {question.options.map((option, idx) => {
          const isCorrectOption = option === question.correctAnswer;
          const isSelected = option === selected;
          let btnClass = 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700';

          if (selected) {
            if (isCorrectOption) {
              btnClass = 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-600 text-green-700 dark:text-green-400';
            } else if (isSelected && !isCorrectOption) {
              btnClass = 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-600 text-red-700 dark:text-red-400';
            }
          }

          return (
            <button
              key={`${option}-${idx}`}
              type="button"
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`p-3 rounded-lg border text-left font-medium transition ${btnClass}`}
              data-testid="quiz-option"
            >
              {option}
            </button>
          );
        })}
      </div>

      {selected && (
        <p className={`text-sm font-medium ${selected === question.correctAnswer ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {selected === question.correctAnswer ? t('english.correct') : t('english.incorrect')}
        </p>
      )}
    </div>
  );
}
