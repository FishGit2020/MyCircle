import { useState, useCallback } from 'react';
import { useLazyQuery, GET_INTERVIEW_SESSIONS } from '@mycircle/shared';
import type { GetInterviewSessionsQuery, GetInterviewSessionsQueryVariables } from '@mycircle/shared';

export interface SessionSummary {
  id: string;
  questionPreview: string;
  messageCount: number;
  mode: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  chapter: string | null;
  difficulty: string | null;
  questionCount: number | null;
  overallScore: number | null;
  avgTechnical: number | null;
  avgProblemSolving: number | null;
  avgCommunication: number | null;
  avgDepth: number | null;
}

export function useSessionHistory() {
  const [chapterFilter, setChapterFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('all');

  const [fetchSessions, { data, loading, error }] = useLazyQuery<
    GetInterviewSessionsQuery,
    GetInterviewSessionsQueryVariables
  >(GET_INTERVIEW_SESSIONS, { fetchPolicy: 'network-only' });

  const loadSessions = useCallback(() => {
    fetchSessions({
      variables: {
        chapter: chapterFilter ?? undefined,
        dateFilter: dateFilter !== 'all' ? dateFilter : undefined,
      },
    });
  }, [fetchSessions, chapterFilter, dateFilter]);

  const setChapterFilterAndRefetch = useCallback(
    (chapter: string | null) => {
      setChapterFilter(chapter);
      fetchSessions({
        variables: {
          chapter: chapter ?? undefined,
          dateFilter: dateFilter !== 'all' ? dateFilter : undefined,
        },
      });
    },
    [fetchSessions, dateFilter],
  );

  const setDateFilterAndRefetch = useCallback(
    (filter: string) => {
      setDateFilter(filter);
      fetchSessions({
        variables: {
          chapter: chapterFilter ?? undefined,
          dateFilter: filter !== 'all' ? filter : undefined,
        },
      });
    },
    [fetchSessions, chapterFilter],
  );

  const sessions: SessionSummary[] = (data?.interviewSessions ?? []).map((s) => ({
    id: s.id,
    questionPreview: s.questionPreview,
    messageCount: s.messageCount,
    mode: s.mode ?? null,
    updatedAt: s.updatedAt ?? null,
    createdAt: s.createdAt ?? null,
    chapter: s.chapter ?? null,
    difficulty: s.difficulty ?? null,
    questionCount: s.questionCount ?? null,
    overallScore: s.overallScore ?? null,
    avgTechnical: s.avgTechnical ?? null,
    avgProblemSolving: s.avgProblemSolving ?? null,
    avgCommunication: s.avgCommunication ?? null,
    avgDepth: s.avgDepth ?? null,
  }));

  return {
    sessions,
    loading,
    error,
    chapterFilter,
    dateFilter,
    setChapterFilter: setChapterFilterAndRefetch,
    setDateFilter: setDateFilterAndRefetch,
    loadSessions,
    refetch: loadSessions,
  };
}
