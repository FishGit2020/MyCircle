import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import { CHAPTERS, toSlug } from '../hooks/useInterviewStateMachine';
import type { InterviewConfig, Difficulty } from '../hooks/useInterviewStateMachine';

interface InterviewSetupProps {
  onStartStructured: (config: InterviewConfig) => void;
  onStartCustom: (question: string) => void;
  onManageQuestions: () => void;
  loading: boolean;
  modelSelected: boolean;
  questionBankLoading: boolean;
  questionBankError: string | null;
  questionBankAvailable: boolean;
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const QUESTION_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function InterviewSetup({
  onStartStructured,
  onStartCustom,
  onManageQuestions,
  loading,
  modelSelected,
  questionBankLoading,
  questionBankError,
  questionBankAvailable,
}: InterviewSetupProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'question-bank' | 'custom'>('question-bank');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState(3);
  const [customQuestion, setCustomQuestion] = useState('');

  const toggleChapter = useCallback((chapter: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((c) => c !== chapter) : [...prev, chapter],
    );
  }, []);

  const selectAll = useCallback(() => {
    setSelectedChapters([...CHAPTERS]);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedChapters([]);
  }, []);

  const handleStart = useCallback(() => {
    if (mode === 'question-bank') {
      if (selectedChapters.length === 0) return;
      onStartStructured({
        mode: 'question-bank',
        chapters: selectedChapters,
        difficulty,
        questionCount,
      });
    } else {
      if (!customQuestion.trim()) return;
      onStartCustom(customQuestion.trim());
    }
  }, [mode, selectedChapters, difficulty, questionCount, customQuestion, onStartStructured, onStartCustom]);

  const canStart =
    modelSelected &&
    !loading &&
    (mode === 'question-bank'
      ? selectedChapters.length > 0 && questionBankAvailable && !questionBankLoading
      : customQuestion.trim().length > 0);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-4">
      {/* Mode toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
        <button
          type="button"
          onClick={() => setMode('question-bank')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'question-bank'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {t('aiInterviewer.questionBankMode')}
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            mode === 'custom'
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          {t('aiInterviewer.customMode')}
        </button>
      </div>

      {mode === 'question-bank' ? (
        <div className="flex flex-col flex-1 min-h-0 gap-4 overflow-y-auto">
          {questionBankLoading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse">
              {t('aiInterviewer.loadingQuestions')}
            </p>
          )}

          {questionBankError && (
            <p className="text-sm text-red-500 dark:text-red-400">{questionBankError}</p>
          )}

          {/* Chapter selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('aiInterviewer.selectChapters')}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onManageQuestions}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('aiInterviewer.manageQuestions')}
                </button>
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('aiInterviewer.selectAll')}
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t('aiInterviewer.deselectAll')}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHAPTERS.map((chapter) => {
                const slug = toSlug(chapter);
                const isSelected = selectedChapters.includes(chapter);
                return (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => toggleChapter(chapter)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white dark:bg-blue-500'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t(`aiInterviewer.chapter.${slug}`)}
                  </button>
                );
              })}
            </div>
            {selectedChapters.length === 0 && (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                {t('aiInterviewer.atLeastOneChapter')}
              </p>
            )}
          </div>

          {/* Difficulty toggle */}
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              {t('aiInterviewer.selectDifficulty')}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-fit">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                    difficulty === d
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`aiInterviewer.${d}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Question count */}
          <div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
              {t('aiInterviewer.questionCount')}
            </span>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('aiInterviewer.questionCount')}
            >
              {QUESTION_COUNTS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
            {t('aiInterviewer.questionSection')}
          </span>
          <textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder={t('aiInterviewer.questionPlaceholder')}
            className="flex-1 min-h-[120px] w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('aiInterviewer.questionLabel')}
          />
        </div>
      )}

      {/* Start button */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!canStart}
        className="rounded-lg bg-green-600 dark:bg-green-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {!modelSelected
          ? t('aiInterviewer.selectModelFirst')
          : t('aiInterviewer.startInterview')}
      </button>
    </div>
  );
}
