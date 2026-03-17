import { useCallback } from 'react';
import {
  useQuery,
  useMutation,
  GET_QUESTION_BANK,
  CREATE_INTERVIEW_QUESTION,
  UPDATE_INTERVIEW_QUESTION,
  DELETE_INTERVIEW_QUESTION,
} from '@mycircle/shared';
import type { BankQuestion } from './useInterviewStateMachine';

export interface QuestionBankData {
  chapters: string[];
  questions: BankQuestion[];
}

export function useQuestionBank() {
  const { data: queryData, loading, error: queryError, refetch } = useQuery(GET_QUESTION_BANK);
  const [createMutation] = useMutation(CREATE_INTERVIEW_QUESTION);
  const [updateMutation] = useMutation(UPDATE_INTERVIEW_QUESTION);
  const [deleteMutation] = useMutation(DELETE_INTERVIEW_QUESTION);

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

  return {
    data,
    loading,
    error,
    retry: refetch,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
