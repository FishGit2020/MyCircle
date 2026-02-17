import { useState, useEffect, useCallback } from 'react';
import { useTranslation, StorageKeys, WindowEvents, type TranslationKey } from '@mycircle/shared';
import { phrases, categoryOrder, type PhraseCategory } from '../data/phrases';
import LessonView from './LessonView';
import QuizView from './QuizView';
import ProgressDashboard from './ProgressDashboard';

type View = 'lessons' | 'quiz' | 'dashboard';

const categoryKeyMap: Record<PhraseCategory, TranslationKey> = {
  greetings: 'english.category.greetings',
  feelings: 'english.category.feelings',
  house: 'english.category.house',
  food: 'english.category.food',
  goingOut: 'english.category.goingOut',
  people: 'english.category.people',
  time: 'english.category.time',
  emergency: 'english.category.emergency',
};

interface Progress {
  completedIds: string[];
  quizScores: Array<{ date: string; correct: number; total: number }>;
  lastDate: string;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(StorageKeys.ENGLISH_LEARNING_PROGRESS);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completedIds: [], quizScores: [], lastDate: '' };
}

function saveProgress(progress: Progress) {
  localStorage.setItem(StorageKeys.ENGLISH_LEARNING_PROGRESS, JSON.stringify(progress));
  window.dispatchEvent(new Event(WindowEvents.ENGLISH_PROGRESS_CHANGED));
}

function calculateStreak(quizScores: Array<{ date: string }>): number {
  if (quizScores.length === 0) return 0;
  const dates = [...new Set(quizScores.map((s) => s.date))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let expected = today;

  for (const date of dates) {
    if (date === expected) {
      streak++;
      // Go back one day
      const d = new Date(expected);
      d.setDate(d.getDate() - 1);
      expected = d.toISOString().slice(0, 10);
    } else if (date < expected) {
      break;
    }
  }
  return streak;
}

export default function EnglishLearning() {
  const { t } = useTranslation();
  const [view, setView] = useState<View>('lessons');
  const [selectedCategory, setSelectedCategory] = useState<PhraseCategory | null>(null);
  const [progress, setProgress] = useState<Progress>(loadProgress);

  const completedIds = new Set(progress.completedIds);
  const streak = calculateStreak(progress.quizScores);

  const filteredPhrases = selectedCategory
    ? phrases.filter((p) => p.category === selectedCategory)
    : phrases;

  const handleComplete = useCallback((id: string) => {
    setProgress((prev) => {
      const isNew = !prev.completedIds.includes(id);
      const next = {
        ...prev,
        completedIds: [...new Set([...prev.completedIds, id])],
        lastDate: new Date().toISOString().slice(0, 10),
      };
      saveProgress(next);
      if (isNew && next.completedIds.length === filteredPhrases.length) {
        window.__logAnalyticsEvent?.('english_lesson_complete');
      }
      return next;
    });
  }, [filteredPhrases.length]);

  const handleQuizComplete = useCallback((score: { correct: number; total: number }) => {
    setProgress((prev) => {
      const next = {
        ...prev,
        quizScores: [...prev.quizScores, { ...score, date: new Date().toISOString().slice(0, 10) }],
        lastDate: new Date().toISOString().slice(0, 10),
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    const empty: Progress = { completedIds: [], quizScores: [], lastDate: '' };
    setProgress(empty);
    saveProgress(empty);
  }, []);

  // Listen for external progress changes
  useEffect(() => {
    function handleProgressChanged() {
      setProgress(loadProgress());
    }
    window.addEventListener(WindowEvents.ENGLISH_PROGRESS_CHANGED, handleProgressChanged);
    return () => window.removeEventListener(WindowEvents.ENGLISH_PROGRESS_CHANGED, handleProgressChanged);
  }, []);

  return (
    <div className="max-w-2xl mx-auto" data-testid="english-learning">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('english.title')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('english.subtitle')}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-green-600 dark:text-green-400 font-medium">
            {t('english.progress')}: {completedIds.size} / {phrases.length}
          </span>
          {completedIds.size > 0 && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
            >
              {t('english.reset')}
            </button>
          )}
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-2 mb-4">
        {(['lessons', 'quiz', 'dashboard'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              view === v
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {v === 'lessons' ? t('english.lessons') : v === 'quiz' ? t('english.quiz') : t('english.dashboard')}
          </button>
        ))}
      </div>

      {/* Category filter (for lesson view) */}
      {view === 'lessons' && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
              !selectedCategory
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            All
          </button>
          {categoryOrder.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}
            >
              {t(categoryKeyMap[cat])}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {view === 'lessons' && (
        <LessonView
          phrases={filteredPhrases}
          completedIds={completedIds}
          onComplete={handleComplete}
        />
      )}

      {view === 'quiz' && (
        <QuizView
          phrases={filteredPhrases}
          onQuizComplete={handleQuizComplete}
        />
      )}

      {view === 'dashboard' && (
        <ProgressDashboard
          completedIds={completedIds}
          quizScores={progress.quizScores}
          streak={streak}
        />
      )}
    </div>
  );
}
