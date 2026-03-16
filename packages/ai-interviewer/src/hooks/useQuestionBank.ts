import { useState, useEffect, useCallback } from 'react';
import type { BankQuestion } from './useInterviewStateMachine';

export interface QuestionBankData {
  chapters: string[];
  questions: BankQuestion[];
}

let cachedData: QuestionBankData | null = null;

/** Reset cached data (for testing). */
export function _resetCache() {
  cachedData = null;
}

export function useQuestionBank() {
  const [data, setData] = useState<QuestionBankData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);

  const fetchBank = useCallback(async () => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/interview-api/question-bank');
      if (!res.ok) throw new Error(`Failed to load question bank: ${res.status}`);
      const json: QuestionBankData = await res.json();
      cachedData = json;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/interview-api/questions');
      if (!res.ok) throw new Error(`Failed to load question bank: ${res.status}`);
      const json: QuestionBankData = await res.json();
      cachedData = json;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestion = useCallback(async (question: Omit<BankQuestion, 'id'>): Promise<BankQuestion | null> => {
    try {
      const res = await fetch('/interview-api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(question),
      });
      if (!res.ok) throw new Error(`Failed to create question: ${res.status}`);
      const json = await res.json();
      const created = json.question as BankQuestion;
      // Invalidate cache and refetch
      cachedData = null;
      await refetch();
      return created;
    } catch {
      return null;
    }
  }, [refetch]);

  const updateQuestion = useCallback(async (id: string, updates: Partial<BankQuestion>): Promise<BankQuestion | null> => {
    try {
      const res = await fetch(`/interview-api/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`Failed to update question: ${res.status}`);
      const json = await res.json();
      const updated = json.question as BankQuestion;
      cachedData = null;
      await refetch();
      return updated;
    } catch {
      return null;
    }
  }, [refetch]);

  const deleteQuestion = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/interview-api/questions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`Failed to delete question: ${res.status}`);
      cachedData = null;
      await refetch();
      return true;
    } catch {
      return false;
    }
  }, [refetch]);

  useEffect(() => {
    fetchBank();
  }, [fetchBank]);

  return {
    data,
    loading,
    error,
    retry: fetchBank,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}
