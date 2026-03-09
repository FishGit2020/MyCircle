import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys, createLogger } from '@mycircle/shared';
import type { Trip } from '../types';

const logger = createLogger('useTrips');
const CACHE_KEY = 'trip-planner-cache';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    try {
      // Try API first
      const api = window.__tripPlanner;
      if (api?.getAll) {
        const data = await api.getAll();
        setTrips(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
        setLoading(false);
        return;
      }

      // Try subscription
      if (api?.subscribe) {
        api.subscribe((data: Trip[]) => {
          setTrips(data);
          try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
          setLoading(false);
        });
        return;
      }

      // Fallback to cache
      try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) setTrips(JSON.parse(cached));
      } catch { /* */ }
      setLoading(false);
    } catch (err) {
      logger.error('Failed to load trips:', err);
      setError('Failed to load trips');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();

    const handler = () => loadTrips();
    window.addEventListener(WindowEvents.TRIP_PLANNER_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.TRIP_PLANNER_CHANGED, handler);
  }, [loadTrips]);

  const addTrip = useCallback(async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const api = window.__tripPlanner;
    if (api?.add) {
      await api.add(trip);
      window.dispatchEvent(new Event(WindowEvents.TRIP_PLANNER_CHANGED));
      return;
    }
    // Local fallback
    const newTrip: Trip = {
      ...trip,
      id: `trip-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setTrips(prev => {
      const updated = [newTrip, ...prev];
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  const updateTrip = useCallback(async (id: string, data: Partial<Trip>) => {
    const api = window.__tripPlanner;
    if (api?.update) {
      await api.update(id, data);
      window.dispatchEvent(new Event(WindowEvents.TRIP_PLANNER_CHANGED));
      return;
    }
    setTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    const api = window.__tripPlanner;
    if (api?.delete) {
      await api.delete(id);
      window.dispatchEvent(new Event(WindowEvents.TRIP_PLANNER_CHANGED));
      return;
    }
    setTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  return { trips, loading, error, addTrip, updateTrip, deleteTrip, reload: loadTrips };
}
