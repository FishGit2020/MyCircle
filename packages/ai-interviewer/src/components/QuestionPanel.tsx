import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';

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
}: QuestionPanelProps) {
  const { t } = useTranslation();
  const [questionCollapsed, setQuestionCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      {/* Question section (collapsible) */}
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
            <button
              type="button"
              onClick={onRepeat}
              disabled={loading}
              className="rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('aiInterviewer.repeatQuestion')}
            </button>
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
