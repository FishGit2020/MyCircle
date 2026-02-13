import { useQuery } from '@apollo/client/react';
import { GET_HISTORICAL_WEATHER } from '../apollo/queries';
import type { HistoricalWeatherDay } from '../types';

interface HistoricalWeatherResponse {
  historicalWeather: HistoricalWeatherDay | null;
}

export function useHistoricalWeather(lat: number | null, lon: number | null) {
  const now = new Date();
  const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const dateStr = lastYear.toISOString().split('T')[0];

  const { data, loading, error } = useQuery<HistoricalWeatherResponse>(GET_HISTORICAL_WEATHER, {
    variables: { lat, lon, date: dateStr },
    skip: lat === null || lon === null,
    fetchPolicy: 'cache-first',
  });

  return {
    historical: data?.historicalWeather ?? null,
    loading,
    error: error?.message ?? null,
  };
}
