import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import { CHAPTERS, toSlug } from '../hooks/useInterviewStateMachine';
import type { BankQuestion, Difficulty } from '../hooks/useInterviewStateMachine';

interface QuestionManagerProps {
  questions: BankQuestion[];
  onBack: () => void;
  onCreateQuestion: (question: Omit<BankQuestion, 'id'>) => Promise<BankQuestion | null>;
  onUpdateQuestion: (id: string, updates: Partial<BankQuestion>) => Promise<BankQuestion | null>;
  onDeleteQuestion: (id: string) => Promise<boolean>;
}

type ViewMode = 'list' | 'detail';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

function difficultyColor(d: Difficulty): string {
  switch (d) {
    case 'easy':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'hard':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  }
}

export default function QuestionManager({
  questions,
  onBack,
  onCreateQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
}: QuestionManagerProps) {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingQuestion, setEditingQuestion] = useState<BankQuestion | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChapter, setFilterChapter] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formChapter, setFormChapter] = useState(CHAPTERS[0]);
  const [formDifficulty, setFormDifficulty] = useState<Difficulty>('medium');
  const [formDescription, setFormDescription] = useState('');
  const [formTags, setFormTags] = useState('');

  const filteredQuestions = useMemo(() => {
    let result = questions;
    if (filterChapter) {
      result = result.filter((q) => q.chapter === filterChapter);
    }
    if (filterDifficulty) {
      result = result.filter((q) => q.difficulty === filterDifficulty);
    }
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.title.toLowerCase().includes(lower) ||
          q.description.toLowerCase().includes(lower) ||
          q.tags.some((tag) => tag.toLowerCase().includes(lower)),
      );
    }
    return result;
  }, [questions, filterChapter, filterDifficulty, searchQuery]);

  // Group by chapter
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, BankQuestion[]> = {};
    for (const q of filteredQuestions) {
      if (!groups[q.chapter]) groups[q.chapter] = [];
      groups[q.chapter].push(q);
    }
    return groups;
  }, [filteredQuestions]);

  const openNewForm = useCallback(() => {
    setIsNew(true);
    setEditingQuestion(null);
    setFormTitle('');
    setFormChapter(CHAPTERS[0]);
    setFormDifficulty('medium');
    setFormDescription('');
    setFormTags('');
    setViewMode('detail');
  }, []);

  const openEditForm = useCallback((question: BankQuestion) => {
    setIsNew(false);
    setEditingQuestion(question);
    setFormTitle(question.title);
    setFormChapter(question.chapter);
    setFormDifficulty(question.difficulty);
    setFormDescription(question.description);
    setFormTags(question.tags.join(', '));
    setViewMode('detail');
  }, []);

  const handleCancel = useCallback(() => {
    setViewMode('list');
    setEditingQuestion(null);
    setIsNew(false);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formTitle.trim() || !formDescription.trim()) return;

    setSaving(true);
    const tags = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (isNew) {
      await onCreateQuestion({
        chapter: formChapter,
        chapterSlug: toSlug(formChapter),
        difficulty: formDifficulty,
        title: formTitle.trim(),
        description: formDescription.trim(),
        tags,
      });
    } else if (editingQuestion) {
      await onUpdateQuestion(editingQuestion.id, {
        chapter: formChapter,
        chapterSlug: toSlug(formChapter),
        difficulty: formDifficulty,
        title: formTitle.trim(),
        description: formDescription.trim(),
        tags,
      });
    }

    setSaving(false);
    setViewMode('list');
    setEditingQuestion(null);
    setIsNew(false);
  }, [
    formTitle,
    formChapter,
    formDifficulty,
    formDescription,
    formTags,
    isNew,
    editingQuestion,
    onCreateQuestion,
    onUpdateQuestion,
  ]);

  const handleDelete = useCallback(
    async (id: string) => {
      await onDeleteQuestion(id);
      setDeleteConfirmId(null);
    },
    [onDeleteQuestion],
  );

  if (viewMode === 'detail') {
    return (
      <div className="flex flex-col h-full min-h-0 p-4 gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? t('aiInterviewer.addQuestion') : t('aiInterviewer.editQuestion')}
          </h2>
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            {t('aiInterviewer.cancel')}
          </button>
        </div>

        <div className="flex flex-col flex-1 min-h-0 gap-3 overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('aiInterviewer.questionTitle')}
            </label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('aiInterviewer.questionTitle')}
            />
          </div>

          {/* Chapter */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('aiInterviewer.chapter')}
            </label>
            <select
              value={formChapter}
              onChange={(e) => setFormChapter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('aiInterviewer.chapter')}
            >
              {CHAPTERS.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('aiInterviewer.selectDifficulty')}
            </span>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 w-fit">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setFormDifficulty(d)}
                  className={`px-4 py-1.5 text-xs font-medium transition-colors ${
                    formDifficulty === d
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {t(`aiInterviewer.${d}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col flex-1 min-h-0">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('aiInterviewer.questionDescription')}
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="flex-1 min-h-[120px] w-full resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm font-mono leading-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('aiInterviewer.questionDescription')}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
              {t('aiInterviewer.questionTags')}
            </label>
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="array, hash-map, sorting"
              aria-label={t('aiInterviewer.questionTags')}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !formTitle.trim() || !formDescription.trim()}
          className="rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '...' : t('aiInterviewer.save')}
        </button>
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col h-full min-h-0 p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          {t('aiInterviewer.backToSetup')}
        </button>
        <button
          type="button"
          onClick={openNewForm}
          className="rounded-lg bg-blue-600 dark:bg-blue-500 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          {t('aiInterviewer.addQuestion')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('aiInterviewer.searchQuestions')}
          className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.searchQuestions')}
        />
        <select
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.chapter')}
        >
          <option value="">{t('aiInterviewer.allChapters')}</option>
          {CHAPTERS.map((ch) => (
            <option key={ch} value={ch}>
              {ch}
            </option>
          ))}
        </select>
        <select
          value={filterDifficulty}
          onChange={(e) => setFilterDifficulty(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('aiInterviewer.allDifficulties')}
        >
          <option value="">{t('aiInterviewer.allDifficulties')}</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {t(`aiInterviewer.${d}`)}
            </option>
          ))}
        </select>
      </div>

      {/* Question list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {filteredQuestions.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {t('aiInterviewer.noQuestionsFound')}
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedQuestions).map(([chapter, qs]) => (
              <div key={chapter}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                  {chapter} ({qs.length})
                </h3>
                <div className="space-y-1">
                  {qs.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <button
                        type="button"
                        onClick={() => openEditForm(q)}
                        className="flex-1 text-left min-w-0"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {q.title}
                          </span>
                          <span
                            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}
                          >
                            {t(`aiInterviewer.${q.difficulty}`)}
                          </span>
                        </div>
                        {q.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {q.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs text-gray-400 dark:text-gray-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                      {deleteConfirmId === q.id ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDelete(q.id)}
                            className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
                          >
                            {t('aiInterviewer.deleteQuestion')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            {t('aiInterviewer.cancel')}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(q.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-opacity"
                          aria-label={t('aiInterviewer.deleteQuestion')}
                        >
                          {t('aiInterviewer.deleteQuestion')}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
