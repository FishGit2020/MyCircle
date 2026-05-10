import { useMemo } from 'react';
import { useQuery, GET_TRANSIT_ARRIVALS, GET_TRANSIT_STOP } from '@mycircle/shared';
import type { ArrivalDeparture, TransitStop } from '../types';

interface UseTransitArrivalsResult {
  arrivals: ArrivalDeparture[];
  stop: TransitStop | null;
  loading: boolean;
  /** Set when there is no data at all (initial fetch failed). */
  error: string | null;
  /** Set when prior data exists AND the most recent fetch failed.
   *  UI shows this inline near the Refresh control while keeping the last-known data visible. */
  refreshError: string | null;
  refresh: () => void;
  lastUpdated: number | null;
}

export function useTransitArrivals(stopId: string | null): UseTransitArrivalsResult {
  const { data: arrivalsData, loading: arrivalsLoading, error: arrivalsError, refetch: refetchArrivals } = useQuery(
    GET_TRANSIT_ARRIVALS,
    {
      variables: { stopId: stopId || '' },
      skip: !stopId,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );

  const { data: stopData, loading: stopLoading, error: stopError } = useQuery(
    GET_TRANSIT_STOP,
    {
      variables: { stopId: stopId || '' },
      skip: !stopId,
      fetchPolicy: 'cache-and-network',
    }
  );

  const arrivals = useMemo(() => {
    const raw = arrivalsData?.transitArrivals || [];
    const now = Date.now();
    return raw
      .map((a: { routeId: string; routeShortName: string; tripHeadsign: string; scheduledArrival: number; predictedArrival: number; isRealTime: boolean; status: string; vehicleId: string }) => {
        const effective = a.isRealTime ? a.predictedArrival : a.scheduledArrival;
        const delta = effective - now;
        // Far past (> 60s past) → omit
        if (delta < -60_000) return null;
        // Recent past (within 60s) → keep with departed=true; UI suppresses negative ETA
        const departed = delta <= 0;
        return {
          routeId: a.routeId,
          routeShortName: a.routeShortName,
          routeLongName: '',
          tripHeadsign: a.tripHeadsign,
          scheduledArrivalTime: a.scheduledArrival,
          predictedArrivalTime: a.predictedArrival,
          predicted: a.isRealTime,
          status: a.status,
          vehicleId: a.vehicleId,
          distanceFromStop: 0,
          departed: departed || undefined,
        } as ArrivalDeparture;
      })
      .filter((a: ArrivalDeparture | null): a is ArrivalDeparture => a !== null)
      .sort((a: ArrivalDeparture, b: ArrivalDeparture) => {
        const timeA = a.predicted ? a.predictedArrivalTime : a.scheduledArrivalTime;
        const timeB = b.predicted ? b.predictedArrivalTime : b.scheduledArrivalTime;
        return timeA - timeB;
      });
  }, [arrivalsData]);

  const stop = stopData?.transitStop || null;
  const loading = arrivalsLoading || stopLoading;

  const hasData = Boolean(arrivalsData);
  const errorMessage = arrivalsError?.message || stopError?.message || null;

  // Split: error = "no data at all"; refreshError = "have data but most recent fetch failed".
  const error = !hasData && errorMessage ? errorMessage : null;
  const refreshError = hasData && errorMessage ? errorMessage : null;

  const refresh = () => {
    if (stopId) {
      refetchArrivals({ stopId });
    }
  };

  const lastUpdated = arrivalsData ? Date.now() : null;

  return { arrivals, stop, loading, error, refreshError, refresh, lastUpdated };
}
