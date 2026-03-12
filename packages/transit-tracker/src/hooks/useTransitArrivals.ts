import { useMemo } from 'react';
import { useQuery, GET_TRANSIT_ARRIVALS, GET_TRANSIT_STOP } from '@mycircle/shared';
import type { ArrivalDeparture, TransitStop } from '../types';

interface UseTransitArrivalsResult {
  arrivals: ArrivalDeparture[];
  stop: TransitStop | null;
  loading: boolean;
  error: string | null;
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
      .filter((a: { isRealTime: boolean; predictedArrival: number; scheduledArrival: number }) => {
        const arrivalTime = a.isRealTime ? a.predictedArrival : a.scheduledArrival;
        return arrivalTime > now;
      })
      .map((a: { routeId: string; routeShortName: string; tripHeadsign: string; scheduledArrival: number; predictedArrival: number; isRealTime: boolean; status: string; vehicleId: string }) => ({
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
      }))
      .sort((a: ArrivalDeparture, b: ArrivalDeparture) => {
        const timeA = a.predicted ? a.predictedArrivalTime : a.scheduledArrivalTime;
        const timeB = b.predicted ? b.predictedArrivalTime : b.scheduledArrivalTime;
        return timeA - timeB;
      });
  }, [arrivalsData]);

  const stop = stopData?.transitStop || null;
  const loading = arrivalsLoading || stopLoading;
  const error = arrivalsError?.message || stopError?.message || null;

  const refresh = () => {
    if (stopId) {
      refetchArrivals({ stopId });
    }
  };

  const lastUpdated = arrivalsData ? Date.now() : null;

  return { arrivals, stop, loading, error, refresh, lastUpdated };
}
