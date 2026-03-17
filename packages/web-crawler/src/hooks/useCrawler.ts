import { useState, useCallback } from 'react';
import {
  useQuery,
  useMutation,
  GET_CRAWL_JOBS,
  GET_CRAWL_JOB_DETAIL,
  START_CRAWL,
  STOP_CRAWL,
  DELETE_CRAWL_JOB,
} from '@mycircle/shared';
import type {
  GetCrawlJobsQuery,
  GetCrawlJobDetailQuery,
  GetCrawlJobDetailQueryVariables,
  StartCrawlMutation,
  StartCrawlMutationVariables,
  StopCrawlMutation,
  StopCrawlMutationVariables,
  DeleteCrawlJobMutation,
  DeleteCrawlJobMutationVariables,
} from '@mycircle/shared';

// ─── useCrawlJobs ────────────────────────────────────────────
export function useCrawlJobs() {
  const { data, loading, error, refetch } = useQuery<GetCrawlJobsQuery>(
    GET_CRAWL_JOBS,
    {
      fetchPolicy: 'cache-and-network',
      pollInterval: 5000, // Poll every 5s for live updates
    },
  );

  return {
    jobs: data?.crawlJobs ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useCrawlJobDetail ───────────────────────────────────────
export function useCrawlJobDetail(jobId: string | null) {
  const { data, loading, error, refetch } = useQuery<
    GetCrawlJobDetailQuery,
    GetCrawlJobDetailQueryVariables
  >(GET_CRAWL_JOB_DETAIL, {
    variables: { id: jobId! },
    skip: !jobId,
    fetchPolicy: 'cache-and-network',
    pollInterval: 3000, // Poll every 3s for live updates on active jobs
  });

  return {
    detail: data?.crawlJobDetail ?? null,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useStartCrawl ──────────────────────────────────────────
export function useStartCrawl() {
  const [mutate, { loading }] = useMutation<
    StartCrawlMutation,
    StartCrawlMutationVariables
  >(START_CRAWL, {
    refetchQueries: [{ query: GET_CRAWL_JOBS }],
  });

  const [error, setError] = useState<string | null>(null);

  const startCrawl = useCallback(
    async (url: string, maxDepth: number, maxPages: number) => {
      setError(null);
      try {
        const result = await mutate({
          variables: { input: { url, maxDepth, maxPages } },
        });
        return result.data?.startCrawl ?? null;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        return null;
      }
    },
    [mutate],
  );

  return { startCrawl, loading, error };
}

// ─── useStopCrawl ───────────────────────────────────────────
export function useStopCrawl() {
  const [mutate, { loading }] = useMutation<
    StopCrawlMutation,
    StopCrawlMutationVariables
  >(STOP_CRAWL, {
    refetchQueries: [{ query: GET_CRAWL_JOBS }],
  });

  const stopCrawl = useCallback(
    async (id: string) => {
      await mutate({ variables: { id } });
    },
    [mutate],
  );

  return { stopCrawl, loading };
}

// ─── useDeleteCrawlJob ──────────────────────────────────────
export function useDeleteCrawlJob() {
  const [mutate, { loading }] = useMutation<
    DeleteCrawlJobMutation,
    DeleteCrawlJobMutationVariables
  >(DELETE_CRAWL_JOB, {
    refetchQueries: [{ query: GET_CRAWL_JOBS }],
  });

  const deleteCrawlJob = useCallback(
    async (id: string) => {
      await mutate({ variables: { id } });
    },
    [mutate],
  );

  return { deleteCrawlJob, loading };
}
