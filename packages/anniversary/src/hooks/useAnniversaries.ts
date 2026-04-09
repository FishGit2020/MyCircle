import { useQuery, GET_ANNIVERSARIES } from '@mycircle/shared';
import type { GetAnniversariesQuery } from '@mycircle/shared';

export function useAnniversaries() {
  const { data, loading, error, refetch } = useQuery<GetAnniversariesQuery>(GET_ANNIVERSARIES);
  return { anniversaries: data?.anniversaries ?? [], loading, error, refetch };
}
