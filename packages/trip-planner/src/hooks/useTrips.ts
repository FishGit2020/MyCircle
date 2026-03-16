import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@mycircle/shared';
import type { Trip } from '../types';

const logger = createLogger('useTrips');
const CACHE_KEY = 'trip-planner-cache';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = window.__tripPlanner as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Prefer real-time subscription
    if (api?.subscribe) {
      const unsubscribe = api.subscribe((data: Trip[]) => {
        setTrips(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
        setLoading(false);
      });
      return unsubscribe;
    }

    // One-shot fallback
    if (api?.getAll) {
      api.getAll().then((data: Trip[]) => {
        setTrips(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
        setLoading(false);
      }).catch((err: unknown) => {
        logger.error('Failed to load trips:', err);
        setError('Failed to load trips');
        setLoading(false);
      });
      return;
    }

    // Cache fallback
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setTrips(JSON.parse(cached));
    } catch { /* */ }
    setLoading(false);
  }, []);

  const addTrip = useCallback(async (trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    const api = window.__tripPlanner as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.add) {
      await api.add(trip);
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
    const api = window.__tripPlanner as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.update) {
      await api.update(id, data);
      return;
    }
    setTrips(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, ...data, updatedAt: Date.now() } : t);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    const api = window.__tripPlanner as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.delete) {
      await api.delete(id);
      return;
    }
    setTrips(prev => {
      const updated = prev.filter(t => t.id !== id);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  return { trips, loading, error, addTrip, updateTrip, deleteTrip };
}
