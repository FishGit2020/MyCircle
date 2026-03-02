import { useQuery, useMutation, GET_BENCHMARK_HISTORY, DELETE_BENCHMARK_RUN } from '@mycircle/shared';
import type { GetBenchmarkHistoryQuery } from '@mycircle/shared';

// Use the generated query result type for individual runs
export type BenchmarkRun = GetBenchmarkHistoryQuery['benchmarkHistory'][number];

export function useBenchmarkHistory(limit = 10) {
  const { data, loading, refetch } = useQuery<GetBenchmarkHistoryQuery>(GET_BENCHMARK_HISTORY, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
  });

  const [deleteMutation] = useMutation(DELETE_BENCHMARK_RUN, {
    refetchQueries: [{ query: GET_BENCHMARK_HISTORY, variables: { limit } }],
  });

  const runs: BenchmarkRun[] = data?.benchmarkHistory ?? [];

  const deleteRun = async (id: string) => {
    await deleteMutation({ variables: { id } });
  };

  return { runs, loading, refetch, deleteRun };
}
