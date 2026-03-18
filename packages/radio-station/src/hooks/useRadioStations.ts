import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys, useQuery, GET_RADIO_STATIONS, GET_RADIO_STATIONS_BY_UUIDS } from '@mycircle/shared';
import type { RadioStation } from '../types';

function loadFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(StorageKeys.RADIO_FAVORITES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // Migrate old format: array of full station objects → store just UUIDs
    if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
      const ids = (parsed as RadioStation[]).map((s) => s.stationuuid).filter(Boolean);
      localStorage.setItem(StorageKeys.RADIO_FAVORITES, JSON.stringify(ids));
      return ids;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavoriteIds(ids: string[]): void {
  localStorage.setItem(StorageKeys.RADIO_FAVORITES, JSON.stringify(ids));
  window.dispatchEvent(new Event(WindowEvents.RADIO_CHANGED));
}

export function useRadioStations() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavoriteIds);

  const { data: stationsData, loading, error: stationsError, refetch } = useQuery(GET_RADIO_STATIONS, {
    variables: { limit: 50 },
  });

  const { data: favoritesData, refetch: refetchFavorites } = useQuery(GET_RADIO_STATIONS_BY_UUIDS, {
    variables: { uuids: favoriteIds },
    skip: favoriteIds.length === 0,
  });

  const stations: RadioStation[] = (stationsData?.radioStations ?? []) as RadioStation[];
  const favorites: RadioStation[] = (favoritesData?.radioStationsByUuids ?? []) as RadioStation[];

  const error = stationsError ? stationsError.message : null;

  const search = useCallback(
    (query: string) => {
      refetch({ query: query.trim() || undefined, limit: 50 });
    },
    [refetch],
  );

  const topStations = useCallback(() => {
    refetch({ query: undefined, limit: 50 });
  }, [refetch]);

  const toggleFavorite = useCallback(
    (station: RadioStation) => {
      setFavoriteIds((prev) => {
        const exists = prev.includes(station.stationuuid);
        const next = exists
          ? prev.filter((id) => id !== station.stationuuid)
          : [...prev, station.stationuuid];
        saveFavoriteIds(next);
        return next;
      });
    },
    [],
  );

  // Re-fetch favorite station details when IDs change
  useEffect(() => {
    if (favoriteIds.length > 0) {
      refetchFavorites({ uuids: favoriteIds });
    }
  }, [favoriteIds, refetchFavorites]);

  const isFavorite = useCallback(
    (stationuuid: string) => favoriteIds.includes(stationuuid),
    [favoriteIds],
  );

  return { stations, favorites, favoriteIds, loading, error, search, topStations, toggleFavorite, isFavorite };
}
