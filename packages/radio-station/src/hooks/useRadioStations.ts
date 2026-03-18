import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { RadioStation } from '../types';

const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';
const API_BY_UUID = 'https://de1.api.radio-browser.info/json/stations/byuuid';

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

async function fetchStationsByUuids(uuids: string[]): Promise<RadioStation[]> {
  const results = await Promise.all(
    uuids.map(async (uuid) => {
      try {
        const res = await fetch(`${API_BY_UUID}/${uuid}`);
        if (!res.ok) return null;
        const data: RadioStation[] = await res.json();
        return data[0] ?? null;
      } catch {
        return null;
      }
    }),
  );
  return results.filter((s): s is RadioStation => s !== null);
}

export function useRadioStations() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavoriteIds);
  const [favorites, setFavorites] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve favorite UUIDs to full station objects for display
  useEffect(() => {
    if (favoriteIds.length === 0) {
      setFavorites([]);
      return;
    }
    fetchStationsByUuids(favoriteIds).then(setFavorites);
  }, [favoriteIds]);

  const fetchStations = useCallback(async (params: Record<string, string>) => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        ...params,
        limit: '50',
        hidebroken: 'true',
      });
      const res = await fetch(`${API_BASE}?${query.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RadioStation[] = await res.json();
      setStations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stations');
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      if (!query.trim()) {
        topStations();
        return;
      }
      fetchStations({ name: query, order: 'votes', reverse: 'true' });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetchStations],
  );

  const topStations = useCallback(() => {
    fetchStations({ order: 'votes', reverse: 'true' });
  }, [fetchStations]);

  const toggleFavorite = useCallback((station: RadioStation) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(station.stationuuid);
      const next = exists
        ? prev.filter((id) => id !== station.stationuuid)
        : [...prev, station.stationuuid];
      saveFavoriteIds(next);
      return next;
    });
  }, []);

  useEffect(() => {
    topStations();
  }, [topStations]);

  return { stations, favorites, favoriteIds, loading, error, search, topStations, toggleFavorite };
}
