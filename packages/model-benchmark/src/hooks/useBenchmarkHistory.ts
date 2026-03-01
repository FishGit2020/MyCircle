import { useQuery } from '@apollo/client';
import { GET_BENCHMARK_HISTORY } from '@mycircle/shared';

export interface BenchmarkRun {
  id: string;
  userId: string;
  results: any[];
  createdAt: string;
}

export function useBenchmarkHistory(limit = 10) {
  const { data, loading, refetch } = useQuery(GET_BENCHMARK_HISTORY, {
    variables: { limit },
    fetchPolicy: 'cache-and-network',
  });

  const runs: BenchmarkRun[] = data?.benchmarkHistory ?? [];

  return { runs, loading, refetch };
}
