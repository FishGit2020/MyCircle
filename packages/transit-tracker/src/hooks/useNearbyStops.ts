import { useState, useCallback } from 'react';
import { useLazyQuery, GET_TRANSIT_NEARBY_STOPS } from '@mycircle/shared';
import type { NearbyStop } from '../types';

interface UseNearbyStopsResult {
  stops: NearbyStop[];
  loading: boolean;
  error: string | null;
  findNearby: () => void;
}

export function useNearbyStops(): UseNearbyStopsResult {
  const [geoError, setGeoError] = useState<string | null>(null);

  const [fetchNearby, { data, loading: queryLoading, error: queryError }] = useLazyQuery(
    GET_TRANSIT_NEARBY_STOPS,
    { fetchPolicy: 'cache-and-network' }
  );

  const stops: NearbyStop[] = (data?.transitNearbyStops || []).map(
    (s: { id: string; name: string; direction: string; lat: number; lon: number }) => ({
      id: s.id,
      name: s.name,
      direction: s.direction,
      lat: s.lat,
      lon: s.lon,
      distance: 0,
    })
  );

  const loading = queryLoading;
  const error = geoError || queryError?.message || null;

  const findNearby = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchNearby({ variables: { lat: latitude, lon: longitude, radius: 500 } });
      },
      (err) => {
        setGeoError(err.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchNearby]);

  return { stops, loading, error, findNearby };
}
