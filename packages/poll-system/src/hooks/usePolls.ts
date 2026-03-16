import { useState, useEffect, useCallback } from 'react';
import { createLogger } from '@mycircle/shared';
import type { Poll } from '../types';

const logger = createLogger('usePolls');
const CACHE_KEY = 'poll-system-cache';

export function usePolls() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = (window as any).__pollSystem; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Prefer real-time subscription (polls are public — all users see updates)
    if (api?.subscribe) {
      const unsubscribe = api.subscribe((data: Poll[]) => {
        setPolls(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
        setLoading(false);
      });
      return unsubscribe;
    }

    // One-shot fallback
    if (api?.getAll) {
      api.getAll().then((data: Poll[]) => {
        setPolls(data);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch { /* */ }
        setLoading(false);
      }).catch((err: unknown) => {
        logger.error('Failed to load polls:', err);
        setError('Failed to load polls');
        setLoading(false);
      });
      return;
    }

    // Cache fallback
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) setPolls(JSON.parse(cached));
    } catch { /* */ }
    setLoading(false);
  }, []);

  const addPoll = useCallback(async (poll: Omit<Poll, 'id' | 'createdAt' | 'updatedAt'>) => {
    const api = (window as any).__pollSystem; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.add) {
      await api.add(poll);
      return;
    }
    const newPoll: Poll = {
      ...poll,
      id: `poll-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPolls(prev => {
      const updated = [newPoll, ...prev];
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  const deletePoll = useCallback(async (id: string) => {
    const api = (window as any).__pollSystem; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.delete) {
      await api.delete(id);
      return;
    }
    setPolls(prev => {
      const updated = prev.filter(p => p.id !== id);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(updated)); } catch { /* */ }
      return updated;
    });
  }, []);

  const vote = useCallback(async (pollId: string, optionId: string) => {
    const api = (window as any).__pollSystem; // eslint-disable-line @typescript-eslint/no-explicit-any
    if (api?.vote) {
      await api.vote(pollId, optionId);
      return;
    }
    // Optimistic local update
    setPolls(prev => prev.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        updatedAt: Date.now(),
        options: p.options.map(o =>
          o.id === optionId ? { ...o, votes: o.votes + 1 } : o,
        ),
      };
    }));
  }, []);

  return { polls, loading, error, addPoll, deletePoll, vote };
}
