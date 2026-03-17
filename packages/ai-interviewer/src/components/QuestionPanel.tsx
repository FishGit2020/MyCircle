import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { BankQuestion, EvaluationScore } from '../hooks/useInterviewStateMachine';

interface QuestionPanelProps {
  question: string;
  document: string;
  onQuestionChange: (text: string) => void;
  onDocumentChange: (text: string) => void;
  interviewActive: boolean;
  onStart: () => void;
  onRepeat: () => void;
  onHint: () => void;
  onEnd: () => void;
  loading: boolean;
  modelSelected: boolean;
  onNextQuestion?: () => void;
  isStructuredMode?: boolean;
  currentBankQuestion?: BankQuestion;
  progress?: { current: number; total: number } | null;
  scores?: EvaluationScore[];
  evaluating?: boolean;
  isLastQuestion?: boolean;
}

export default function QuestionPanel({
  question,
  document,
  onQuestionChange,
  onDocumentChange,
  interviewActive,
  onStart,
  onRepeat,
  onHint,
  onEnd,
  loading,
  modelSelected,
  onNextQuestion,
  isStructuredMode,
  currentBankQuestion,
  progress,
  scores = [],
  evaluating = false,
  isLastQuestion = false,
}: QuestionPanelProps) {
  const { t } = useTranslation();
  const [questionCollapsed, setQuestionCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      {/* Progress indicator for structured mode */}
      {isStructuredMode && progress && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            {t('aiInterviewer.progress', { current: progress.current, total: progress.total })}
          </span>
          <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {scores.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('aiInterviewer.score')}:{' '}
              {(
                scores.reduce(
                  (sum, s) => sum + (s.technical + s.problemSolving + s.communication + s.depth) / 4,
                  0,
                ) / scores.length
              ).toFixed(1)}
              /10
            </span>
          )}
        </div>
      )}

      {/* Question section */}
      {isStructuredMode && currentBankQuestion ? (
        /* Read-only question card for structured mode */
        <div className="rounded-lg border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">
              {currentBankQuestion.chapter}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              currentBankQuestion.difficulty === 'easy'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                : currentBankQuestion.difficulty === 'medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            }`}>
              {t(`aiInterviewer.${currentBankQuestion.difficulty}`)}
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {currentBankQuestion.title}
          </h3>
          <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-5">
            {currentBankQuestion.description}
          </p>
        </div>
      ) : (
        /* Editable question section for custom mode */
        <div className="flex flex-col">
          <button
            type="button"
            onClick={() => setQuestionCollapsed(!questionCollapsed)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              className={`w-3 h-3 transition-transform ${questionCollapsed ? '' : 'rotate-90'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            {t('aiInterviewer.questionSection')}
          </button>
          {!questionCollapsed && (
            <textarea
              value={question}
              onChange={(e) => onQuestionChange(e.target.value)}
              disabled={interviewActive}
              placeholder={t('aiInterviewer.questionPlaceholder')}
              className="mt-1.5 w-full h-24 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              aria-label={t('aiInterviewer.questionLabel')}
            />
          )}
        </div>
      )}

      {/* Score badges for completed questions */}
      {isStructuredMode && scores.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {scores.map((score, idx) => {
            const avg = ((score.technical + score.problemSolving + score.communication + score.depth) / 4).toFixed(1);
            return (
              <span
                key={score.questionId || idx}
                className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-medium"
                title={score.feedback}
              >
                Q{idx + 1}: {avg}/10
              </span>
            );
          })}
        </div>
      )}

      {/* Working document (main area) */}
      <div className="flex flex-col flex-1 min-h-0">
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
          {t('aiInterviewer.workingDocument')}
        </span>
        <textarea
          value={document}
          onChange={(e) => onDocumentChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Tab') {
              e.preventDefault();
              const target = e.currentTarget;
              const start = target.selectionStart;
              const end = target.selectionEnd;
              const val = target.value;
              onDocumentChange(val.substring(0, start) + '  ' + val.substring(end));
              requestAnimationFrame(() => {
                target.selectionStart = target.selectionEnd = start + 2;
              });
            }
          }}
          placeholder={t('aiInterviewer.documentPlaceholder')}
          className="flex-1 min-h-0 w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.documentLabel')}
        />
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!interviewActive ? (
          <button
            type="button"
            onClick={onStart}
            disabled={!question.trim() || loading || !modelSelected}
            className="flex-1 rounded-lg bg-green-600 dark:bg-green-500 text-white px-4 py-2 text-sm font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!modelSelected ? t('aiInterviewer.selectModelFirst') : t('aiInterviewer.startInterview')}
          </button>
        ) : (
          <>
            {isStructuredMode ? (
              <button
                type="button"
                onClick={onNextQuestion}
                disabled={loading || evaluating}
                className="rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-3 py-2 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLastQuestion
                  ? t('aiInterviewer.interviewComplete')
                  : t('aiInterviewer.nextQuestion')}
              </button>
            ) : (
              <button
                type="button"
                onClick={onRepeat}
                disabled={loading}
                className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('aiInterviewer.repeatQuestion')}
              </button>
            )}
            <button
              type="button"
              onClick={onHint}
              disabled={loading}
              className="rounded-lg bg-yellow-500 dark:bg-yellow-600 text-white px-3 py-2 text-sm font-medium hover:bg-yellow-600 dark:hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.hint')}
            </button>
            <button
              type="button"
              onClick={onEnd}
              disabled={loading}
              className="rounded-lg bg-red-600 dark:bg-red-500 text-white px-3 py-2 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.endInterview')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
