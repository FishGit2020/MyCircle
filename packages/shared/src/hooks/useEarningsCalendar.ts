import { useQuery } from '@apollo/client/react';
import { GET_EARNINGS_CALENDAR } from '../apollo/queries';
import type { EarningsEvent } from '../types/earnings';

interface EarningsCalendarResponse {
  earningsCalendar: EarningsEvent[];
}

export function useEarningsCalendar(from: string, to: string) {
  const { data, loading, error, refetch } = useQuery<EarningsCalendarResponse>(GET_EARNINGS_CALENDAR, {
    variables: { from, to },
    fetchPolicy: 'cache-and-network',
  });

  return {
    earnings: data?.earningsCalendar ?? [],
    loading,
    error: error?.message ?? null,
    refetch: () => { refetch(); },
  };
}
