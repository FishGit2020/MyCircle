import { useQuery, useMutation } from '@apollo/client';
import {
  GET_BENCHMARK_ENDPOINTS,
  SAVE_BENCHMARK_ENDPOINT,
  DELETE_BENCHMARK_ENDPOINT,
} from '@mycircle/shared';

export interface Endpoint {
  id: string;
  url: string;
  name: string;
  hasCfAccess: boolean;
}

export function useEndpoints() {
  const { data, loading, refetch } = useQuery(GET_BENCHMARK_ENDPOINTS, {
    fetchPolicy: 'cache-and-network',
  });

  const [saveMutation, { loading: saving }] = useMutation(SAVE_BENCHMARK_ENDPOINT, {
    refetchQueries: [{ query: GET_BENCHMARK_ENDPOINTS }],
  });

  const [deleteMutation] = useMutation(DELETE_BENCHMARK_ENDPOINT, {
    refetchQueries: [{ query: GET_BENCHMARK_ENDPOINTS }],
  });

  const endpoints: Endpoint[] = data?.benchmarkEndpoints ?? [];

  const saveEndpoint = async (input: {
    url: string;
    name: string;
    cfAccessClientId?: string;
    cfAccessClientSecret?: string;
  }) => {
    await saveMutation({ variables: { input } });
  };

  const deleteEndpoint = async (id: string) => {
    await deleteMutation({ variables: { id } });
  };

  return { endpoints, loading, saving, refetch, saveEndpoint, deleteEndpoint };
}
