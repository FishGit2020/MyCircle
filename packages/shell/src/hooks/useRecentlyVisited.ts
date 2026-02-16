import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { StorageKeys } from '@mycircle/shared';

export interface RecentPage {
  path: string;
  /** Unix ms timestamp of last visit */
  visitedAt: number;
}

const MAX_RECENT = 5;

/** Routes that should not be tracked (home is always accessible) */
const EXCLUDED = new Set(['/', '/compare']);

function load(): RecentPage[] {
  try {
    const raw = localStorage.getItem(StorageKeys.RECENTLY_VISITED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(pages: RecentPage[]) {
  localStorage.setItem(StorageKeys.RECENTLY_VISITED, JSON.stringify(pages));
}

/**
 * Tracks recently visited routes (excluding home and internal pages).
 * Persists to localStorage and exposes the list for UI consumption.
 */
export function useRecentlyVisited() {
  const location = useLocation();
  const [recent, setRecent] = useState<RecentPage[]>(load);

  // Track route changes
  useEffect(() => {
    const path = location.pathname;

    // Only track top-level MFE routes (e.g. /weather, /stocks)
    if (EXCLUDED.has(path)) return;

    setRecent(prev => {
      // Remove existing entry for this path, then prepend
      const filtered = prev.filter(p => p.path !== path);
      const updated = [{ path, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
      save(updated);
      return updated;
    });
  }, [location.pathname]);

  const clearRecent = useCallback(() => {
    setRecent([]);
    localStorage.removeItem(StorageKeys.RECENTLY_VISITED);
  }, []);

  return { recent, clearRecent };
}
