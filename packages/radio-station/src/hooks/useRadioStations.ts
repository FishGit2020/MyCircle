import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  WindowEvents,
  StorageKeys,
  useQuery,
  useMutation,
  GET_RADIO_STATIONS,
  GET_RADIO_STATIONS_BY_UUIDS,
  VOTE_RADIO_STATION,
} from '@mycircle/shared';
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

function loadVotedIds(): string[] {
  try {
    const raw = localStorage.getItem(StorageKeys.RADIO_VOTED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useRadioStations() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavoriteIds);
  const [votedIds, setVotedIds] = useState<string[]>(loadVotedIds);
  const [activeTag, setActiveTag] = useState<string | undefined>(undefined);
  const [activeCountry, setActiveCountry] = useState<string | undefined>(undefined);

  const { data: stationsData, loading, error: stationsError, refetch } = useQuery(GET_RADIO_STATIONS, {
    variables: { limit: 50 },
  });

  const { data: favoritesData, refetch: refetchFavorites } = useQuery(GET_RADIO_STATIONS_BY_UUIDS, {
    variables: { uuids: favoriteIds },
    skip: favoriteIds.length === 0,
  });

  const [voteRadioStation] = useMutation(VOTE_RADIO_STATION);

  const stationsRaw = stationsData?.radioStations;
  const stations: RadioStation[] = useMemo(
    () => (stationsRaw ?? []) as RadioStation[],
    [stationsRaw],
  );
  const favorites: RadioStation[] = (favoritesData?.radioStationsByUuids ?? []) as RadioStation[];

  const countries = useMemo(() => {
    const all = stations.map((s) => s.country).filter(Boolean);
    return [...new Set(all)].sort();
  }, [stations]);

  const error = stationsError ? stationsError.message : null;

  const search = useCallback(
    (query: string) => {
      refetch({ query: query.trim() || undefined, limit: 50, tag: activeTag, country: activeCountry });
    },
    [refetch, activeTag, activeCountry],
  );

  const topStations = useCallback(() => {
    refetch({ query: undefined, limit: 50, tag: activeTag, country: activeCountry });
  }, [refetch, activeTag, activeCountry]);

  const handleSetActiveTag = useCallback(
    (tag: string | undefined) => {
      setActiveTag(tag);
      refetch({ query: undefined, limit: 50, tag, country: activeCountry });
    },
    [refetch, activeCountry],
  );

  const handleSetActiveCountry = useCallback(
    (country: string | undefined) => {
      setActiveCountry(country);
      refetch({ query: undefined, limit: 50, tag: activeTag, country });
    },
    [refetch, activeTag],
  );

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

  const vote = useCallback(
    async (uuid: string): Promise<boolean> => {
      if (votedIds.includes(uuid)) return false;
      try {
        const result = await voteRadioStation({ variables: { uuid } });
        const success = result.data?.voteRadioStation === true;
        if (success) {
          const next = [...votedIds, uuid];
          localStorage.setItem(StorageKeys.RADIO_VOTED, JSON.stringify(next));
          setVotedIds(next);
        }
        return success;
      } catch {
        return false;
      }
    },
    [votedIds, voteRadioStation],
  );

  const isVoted = useCallback(
    (uuid: string) => votedIds.includes(uuid),
    [votedIds],
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

  return {
    stations,
    favorites,
    favoriteIds,
    loading,
    error,
    search,
    topStations,
    toggleFavorite,
    isFavorite,
    activeTag,
    activeCountry,
    countries,
    setActiveTag: handleSetActiveTag,
    setActiveCountry: handleSetActiveCountry,
    vote,
    isVoted,
    votedIds,
  };
}
