import { useQuery, GET_ANNIVERSARY } from '@mycircle/shared';
import type { GetAnniversaryQuery, GetAnniversaryQueryVariables } from '@mycircle/shared';

export function useAnniversaryDetail(id: string | undefined) {
  const { data, loading, error, refetch } = useQuery<GetAnniversaryQuery, GetAnniversaryQueryVariables>(GET_ANNIVERSARY, {
    variables: { id: id! },
    skip: !id,
  });
  return { anniversary: data?.anniversary ?? null, loading, error, refetch };
}
