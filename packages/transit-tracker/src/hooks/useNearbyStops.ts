import { useState, useCallback, useRef } from 'react';
import { useLazyQuery, GET_TRANSIT_NEARBY_STOPS } from '@mycircle/shared';
import type { NearbyStop } from '../types';

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface UseNearbyStopsResult {
  stops: NearbyStop[];
  loading: boolean;
  error: string | null;
  findNearby: (coords?: { lat: number; lon: number }) => void;
}

export function useNearbyStops(): UseNearbyStopsResult {
  const [geoError, setGeoError] = useState<string | null>(null);
  const userCoordsRef = useRef<{ lat: number; lon: number } | null>(null);

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
      distance: userCoordsRef.current
        ? haversineDistance(userCoordsRef.current.lat, userCoordsRef.current.lon, s.lat, s.lon)
        : 0,
    })
  );

  const loading = queryLoading;
  const error = geoError || queryError?.message || null;

  const findNearby = useCallback((coords?: { lat: number; lon: number }) => {
    if (coords) {
      setGeoError(null);
      userCoordsRef.current = { lat: coords.lat, lon: coords.lon };
      fetchNearby({ variables: { lat: coords.lat, lon: coords.lon, radius: 500 } });
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser');
      return;
    }

    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        userCoordsRef.current = { lat: latitude, lon: longitude };
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
