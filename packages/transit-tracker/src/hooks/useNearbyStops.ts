import { useState, useCallback } from 'react';
import type { NearbyStop } from '../types';

interface UseNearbyStopsResult {
  stops: NearbyStop[];
  loading: boolean;
  error: string | null;
  findNearby: () => void;
}

function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return 'http://localhost:5001/mycircle-dash/us-central1/transitProxy';
  }
  return '/transit-api';
}

export function useNearbyStops(): UseNearbyStopsResult {
  const [stops, setStops] = useState<NearbyStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `${getApiBase()}/stops-nearby?lat=${latitude}&lon=${longitude}&radius=500`
          );
          if (!res.ok) {
            const body = await res.json().catch(() => ({ error: 'Failed to fetch nearby stops' }));
            throw new Error(body.error || `HTTP ${res.status}`);
          }
          const data = await res.json();
          setStops(data.stops || []);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to find nearby stops');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setError(err.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { stops, loading, error, findNearby };
}
