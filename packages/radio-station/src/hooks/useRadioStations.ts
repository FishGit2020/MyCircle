import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { RadioStation } from '../types';

const API_BASE = 'https://de1.api.radio-browser.info/json/stations/search';

function loadFavorites(): RadioStation[] {
  try {
    const raw = localStorage.getItem(StorageKeys.RADIO_FAVORITES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveFavorites(stations: RadioStation[]): void {
  localStorage.setItem(StorageKeys.RADIO_FAVORITES, JSON.stringify(stations));
  window.dispatchEvent(new Event(WindowEvents.RADIO_CHANGED));
}

export function useRadioStations() {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [favorites, setFavorites] = useState<RadioStation[]>(loadFavorites);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    [fetchStations],
  );

  const topStations = useCallback(() => {
    fetchStations({ order: 'votes', reverse: 'true' });
  }, [fetchStations]);

  const toggleFavorite = useCallback((station: RadioStation) => {
    setFavorites((prev) => {
      const exists = prev.some((s) => s.stationuuid === station.stationuuid);
      const next = exists
        ? prev.filter((s) => s.stationuuid !== station.stationuuid)
        : [...prev, station];
      saveFavorites(next);
      return next;
    });
  }, []);

  useEffect(() => {
    topStations();
  }, [topStations]);

  return { stations, favorites, loading, error, search, topStations, toggleFavorite };
}
