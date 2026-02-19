import { useState, useEffect, useCallback } from 'react';
import { WindowEvents } from '@mycircle/shared';
import type { WorkEntry } from '../types';

declare global {
  interface Window {
    __workTracker?: {
      getAll: () => Promise<WorkEntry[]>;
      add: (entry: { date: string; content: string }) => Promise<string>;
      update: (id: string, updates: Partial<{ content: string }>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (entries: WorkEntry[]) => void) => () => void;
    };
    __getFirebaseIdToken?: () => Promise<string | null>;
  }
}

export function useWorkEntries() {
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Auth state detection
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const token = await window.__getFirebaseIdToken?.();
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
      if (mounted) setAuthChecked(true);
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (window.__workTracker) {
        const data = await window.__workTracker.getAll();
        setEntries(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Real-time subscription with fallback
  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    if (window.__workTracker?.subscribe) {
      let received = false;
      const unsubscribe = window.__workTracker.subscribe((data) => {
        received = true;
        setEntries(data);
        setLoading(false);
      });
      // Fallback: if subscribe returns a no-op and callback never fires
      const timeout = setTimeout(() => {
        if (!received) setLoading(false);
      }, 3000);
      return () => { unsubscribe(); clearTimeout(timeout); };
    }

    loadEntries();
    const handler = () => { loadEntries(); };
    window.addEventListener(WindowEvents.WORK_TRACKER_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WORK_TRACKER_CHANGED, handler);
  }, [loadEntries, isAuthenticated]);

  const addEntry = useCallback(async (content: string) => {
    if (!window.__workTracker) throw new Error('Work tracker API not available');
    const date = new Date().toISOString().split('T')[0];
    const id = await window.__workTracker.add({ date, content });
    window.dispatchEvent(new Event(WindowEvents.WORK_TRACKER_CHANGED));
    return id;
  }, []);

  const updateEntry = useCallback(async (id: string, content: string) => {
    if (!window.__workTracker) throw new Error('Work tracker API not available');
    await window.__workTracker.update(id, { content });
    window.dispatchEvent(new Event(WindowEvents.WORK_TRACKER_CHANGED));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    if (!window.__workTracker) throw new Error('Work tracker API not available');
    await window.__workTracker.delete(id);
    window.dispatchEvent(new Event(WindowEvents.WORK_TRACKER_CHANGED));
  }, []);

  return {
    entries,
    loading,
    isAuthenticated,
    authChecked,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: loadEntries,
  };
}
