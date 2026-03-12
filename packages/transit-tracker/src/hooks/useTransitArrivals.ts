import { useState, useEffect, useCallback, useRef } from 'react';
import type { ArrivalDeparture, TransitStop } from '../types';

const POLL_INTERVAL = 30_000; // 30 seconds

interface UseTransitArrivalsResult {
  arrivals: ArrivalDeparture[];
  stop: TransitStop | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: number | null;
}

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/mycircle-dash/us-central1/transitProxy';
  }
  return '/transit-api';
}

export function useTransitArrivals(stopId: string | null): UseTransitArrivalsResult {
  const [arrivals, setArrivals] = useState<ArrivalDeparture[]>([]);
  const [stop, setStop] = useState<TransitStop | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchArrivals = useCallback(async () => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBase()}/arrivals/${encodeURIComponent(stopId)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Failed to fetch arrivals' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setStop(data.stop || null);
      const now = Date.now();
      // Filter to upcoming arrivals only
      const upcoming = (data.arrivalsAndDepartures || [])
        .filter((a: ArrivalDeparture) => {
          const arrivalTime = a.predicted ? a.predictedArrivalTime : a.scheduledArrivalTime;
          return arrivalTime > now;
        })
        .sort((a: ArrivalDeparture, b: ArrivalDeparture) => {
          const timeA = a.predicted ? a.predictedArrivalTime : a.scheduledArrivalTime;
          const timeB = b.predicted ? b.predictedArrivalTime : b.scheduledArrivalTime;
          return timeA - timeB;
        });
      setArrivals(upcoming);
      setLastUpdated(now);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [stopId]);

  const refresh = useCallback(() => {
    fetchArrivals();
  }, [fetchArrivals]);

  useEffect(() => {
    if (!stopId) {
      setArrivals([]);
      setStop(null);
      setError(null);
      setLastUpdated(null);
      return;
    }

    fetchArrivals();

    intervalRef.current = setInterval(fetchArrivals, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [stopId, fetchArrivals]);

  return { arrivals, stop, loading, error, refresh, lastUpdated };
}
