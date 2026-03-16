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

  useEffect(() => {
    fetchBank();
  }, [fetchBank]);

  return { data, loading, error, retry: fetchBank };
}
