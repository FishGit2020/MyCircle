import { useCallback } from 'react';
import {
  useQuery,
  useLazyQuery,
  useMutation,
  GET_QUESTION_BANK,
  CREATE_INTERVIEW_QUESTION,
  UPDATE_INTERVIEW_QUESTION,
  DELETE_INTERVIEW_QUESTION,
  EXPORT_QUESTION_BANK,
  IMPORT_QUESTIONS,
} from '@mycircle/shared';
import type { BankQuestion } from './useInterviewStateMachine';

export interface QuestionBankData {
  chapters: string[];
  questions: BankQuestion[];
}

export interface ImportResult {
  added: number;
  skipped: number;
  errors: string[];
}

export function useQuestionBank() {
  const { data: queryData, loading, error: queryError, refetch } = useQuery(GET_QUESTION_BANK);
  const [createMutation] = useMutation(CREATE_INTERVIEW_QUESTION);
  const [updateMutation] = useMutation(UPDATE_INTERVIEW_QUESTION);
  const [deleteMutation] = useMutation(DELETE_INTERVIEW_QUESTION);
  const [exportQuery] = useLazyQuery(EXPORT_QUESTION_BANK, { fetchPolicy: 'network-only' });
  const [importMutation] = useMutation(IMPORT_QUESTIONS);

  const data: QuestionBankData | null = queryData?.questionBank
    ? {
        chapters: queryData.questionBank.chapters,
        questions: queryData.questionBank.questions as BankQuestion[],
      }
    : null;

  const error = queryError ? queryError.message : null;

  const createQuestion = useCallback(
    async (question: Omit<BankQuestion, 'id'>): Promise<BankQuestion | null> => {
      try {
        const { data: result } = await createMutation({
          variables: {
            input: {
              chapter: question.chapter,
              chapterSlug: question.chapterSlug,
              difficulty: question.difficulty,
              title: question.title,
              description: question.description,
              tags: question.tags,
            },
          },
        });
        await refetch();
        return (result?.createInterviewQuestion as BankQuestion) ?? null;
      } catch {
        return null;
      }
    },
    [createMutation, refetch],
  );

  const updateQuestion = useCallback(
    async (id: string, updates: Partial<BankQuestion>): Promise<BankQuestion | null> => {
      try {
        const { data: result } = await updateMutation({
          variables: { id, input: updates },
        });
        await refetch();
        return (result?.updateInterviewQuestion as BankQuestion) ?? null;
      } catch {
        return null;
      }
    },
    [updateMutation, refetch],
  );

  const deleteQuestion = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await deleteMutation({ variables: { id } });
        await refetch();
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation, refetch],
  );

  const exportQuestions = useCallback(
    async (chapter?: string): Promise<boolean> => {
      try {
        const { data: result } = await exportQuery({
          variables: { chapter: chapter || null },
        });
        const json = result?.exportQuestionBank;
        if (!json) return false;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = chapter ? `questions-${chapter}.json` : 'questions.json';
        a.click();
        URL.revokeObjectURL(url);
        return true;
      } catch {
        return false;
      }
    },
    [exportQuery],
  );

  const importQuestions = useCallback(
    async (questions: Omit<BankQuestion, 'id'>[]): Promise<ImportResult | null> => {
      try {
        const { data: result } = await importMutation({
          variables: {
            questions: questions.map((q) => ({
              chapter: q.chapter,
              chapterSlug: q.chapterSlug,
              difficulty: q.difficulty,
              title: q.title,
              description: q.description,
              tags: q.tags ?? [],
            })),
          },
        });
        await refetch();
        return (result?.importQuestions as ImportResult) ?? null;
      } catch {
        return null;
      }
    },
    [importMutation, refetch],
  );

  return {
    data,
    loading,
    error,
    retry: refetch,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    exportQuestions,
    importQuestions,
  };
}
