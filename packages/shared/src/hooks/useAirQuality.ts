import { useQuery } from '@apollo/client/react';
import { GET_AIR_QUALITY } from '../apollo/queries';
import type { GetAirQualityQuery } from '../apollo/generated';

export function useAirQuality(lat: number | null, lon: number | null) {
  const { data, loading, error } = useQuery<GetAirQualityQuery>(GET_AIR_QUALITY, {
    variables: { lat, lon },
    skip: lat === null || lon === null,
    fetchPolicy: 'cache-and-network',
  });

  return {
    airQuality: data?.airQuality ?? null,
    loading,
    error: error?.message ?? null,
  };
}
