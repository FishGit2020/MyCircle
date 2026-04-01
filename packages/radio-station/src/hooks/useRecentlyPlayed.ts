import { useState, useCallback } from 'react';
import { StorageKeys } from '@mycircle/shared';
import type { RadioStation } from '../types';
import type { RecentlyPlayedEntry } from '../types';

const MAX_RECENT = 20;

function loadRecent(): RecentlyPlayedEntry[] {
  try {
    const raw = localStorage.getItem(StorageKeys.RADIO_RECENT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(entries: RecentlyPlayedEntry[]): void {
  localStorage.setItem(StorageKeys.RADIO_RECENT, JSON.stringify(entries));
}

export function useRecentlyPlayed() {
  const [recentStations, setRecentStations] = useState<RecentlyPlayedEntry[]>(loadRecent);

  const addToRecent = useCallback((station: RadioStation) => {
    setRecentStations((prev) => {
      const entry: RecentlyPlayedEntry = {
        stationuuid: station.stationuuid,
        name: station.name,
        favicon: station.favicon,
        country: station.country,
        url: station.url,
        url_resolved: station.url_resolved,
        playedAt: Date.now(),
      };
      // Remove existing entry for this station (dedup by uuid)
      const filtered = prev.filter((e) => e.stationuuid !== station.stationuuid);
      // Add to front, cap at MAX_RECENT
      const next = [entry, ...filtered].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    localStorage.removeItem(StorageKeys.RADIO_RECENT);
    setRecentStations([]);
  }, []);

  return { recentStations, addToRecent, clearRecent };
}
