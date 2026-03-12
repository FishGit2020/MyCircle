import { useState, useEffect, useCallback } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';

export interface FavoriteStop {
  stopId: string;
  stopName: string;
  direction: string;
  routes: string[];
  addedAt: number;
}

function loadFromStorage(): FavoriteStop[] {
  try {
    const raw = localStorage.getItem(StorageKeys.TRANSIT_FAVORITES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveToStorage(favorites: FavoriteStop[]) {
  try {
    localStorage.setItem(StorageKeys.TRANSIT_FAVORITES, JSON.stringify(favorites));
    window.dispatchEvent(new Event(WindowEvents.TRANSIT_FAVORITES_CHANGED));
  } catch { /* ignore */ }
}

export function useFavoriteStops() {
  const [favorites, setFavorites] = useState<FavoriteStop[]>(loadFromStorage);

  // Subscribe to Firestore bridge if available
  useEffect(() => {
    const bridge = window.__transitFavorites;
    if (bridge) {
      const unsub = bridge.subscribe((data) => {
        setFavorites(data);
        try {
          localStorage.setItem(StorageKeys.TRANSIT_FAVORITES, JSON.stringify(data));
        } catch { /* ignore */ }
      });
      return unsub;
    }

    // Fallback: listen for window events (localStorage-only mode)
    function handleChange() {
      setFavorites(loadFromStorage());
    }
    window.addEventListener(WindowEvents.TRANSIT_FAVORITES_CHANGED, handleChange);
    return () => window.removeEventListener(WindowEvents.TRANSIT_FAVORITES_CHANGED, handleChange);
  }, []);

  const isFavorite = useCallback(
    (stopId: string) => favorites.some((f) => f.stopId === stopId),
    [favorites],
  );

  const addFavorite = useCallback(
    async (stop: { stopId: string; stopName: string; direction: string; routes: string[] }) => {
      const bridge = window.__transitFavorites;
      if (bridge) {
        await bridge.add(stop);
      } else {
        // localStorage fallback
        const current = loadFromStorage();
        if (current.some((f) => f.stopId === stop.stopId)) return;
        const next = [...current, { ...stop, addedAt: Date.now() }];
        saveToStorage(next);
        setFavorites(next);
      }
    },
    [],
  );

  const removeFavorite = useCallback(async (stopId: string) => {
    const bridge = window.__transitFavorites;
    if (bridge) {
      await bridge.remove(stopId);
    } else {
      // localStorage fallback
      const current = loadFromStorage();
      const next = current.filter((f) => f.stopId !== stopId);
      saveToStorage(next);
      setFavorites(next);
    }
  }, []);

  const toggleFavorite = useCallback(
    async (stop: { stopId: string; stopName: string; direction: string; routes: string[] }) => {
      if (isFavorite(stop.stopId)) {
        await removeFavorite(stop.stopId);
      } else {
        await addFavorite(stop);
      }
    },
    [isFavorite, addFavorite, removeFavorite],
  );

  return { favorites, isFavorite, addFavorite, removeFavorite, toggleFavorite };
}
