import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { WorshipSong } from '../types';

// The shell exposes these on the window object
declare global {
  interface Window {
    __getFirebaseIdToken?: () => Promise<string | null>;
    __worshipSongs?: {
      getAll: () => Promise<WorshipSong[]>;
      get: (id: string) => Promise<WorshipSong | null>;
      add: (song: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
      update: (id: string, updates: Partial<WorshipSong>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (songs: WorshipSong[]) => void) => () => void;
    };
  }
}

function getCachedSongs(): WorshipSong[] {
  try {
    const cached = localStorage.getItem(StorageKeys.WORSHIP_SONGS_CACHE);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  return [];
}

function setCachedSongs(songs: WorshipSong[]) {
  try {
    localStorage.setItem(StorageKeys.WORSHIP_SONGS_CACHE, JSON.stringify(songs));
  } catch { /* ignore */ }
}

export function useWorshipSongs() {
  const [songs, setSongs] = useState<WorshipSong[]>(getCachedSongs);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const token = await window.__getFirebaseIdToken?.();
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };
    checkAuth();

    // Re-check on auth changes (storage event or custom event)
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Load songs — one-shot fallback when subscribe is unavailable
  const loadSongs = useCallback(async () => {
    setLoading(true);
    try {
      if (window.__worshipSongs) {
        const data = await window.__worshipSongs.getAll();
        setSongs(data);
        setCachedSongs(data);
      }
    } catch (err) {
      console.error('Failed to load worship songs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Use real-time subscription if available, fall back to one-shot fetch
  useEffect(() => {
    if (window.__worshipSongs?.subscribe) {
      const unsubscribe = window.__worshipSongs.subscribe((data) => {
        setSongs(data);
        setCachedSongs(data);
        setLoading(false);
      });
      return unsubscribe;
    }
    // Fallback: one-shot fetch + event listener
    loadSongs();
    const handler = () => { loadSongs(); };
    window.addEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, handler);
  }, [loadSongs]);

  const addSong = useCallback(async (song: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    const id = await window.__worshipSongs.add(song);
    // Real-time listener will auto-update; dispatch event for non-real-time consumers
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
    return id;
  }, []);

  const updateSong = useCallback(async (id: string, updates: Partial<WorshipSong>) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    await window.__worshipSongs.update(id, updates);
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  }, []);

  const deleteSong = useCallback(async (id: string) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    await window.__worshipSongs.delete(id);
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  }, []);

  const getSong = useCallback(async (id: string): Promise<WorshipSong | null> => {
    if (!window.__worshipSongs) {
      console.warn('Worship songs API not available');
      return null;
    }
    try {
      return await window.__worshipSongs.get(id);
    } catch (err) {
      console.error('Failed to get worship song:', id, err);
      return null;
    }
  }, []);

  return {
    songs,
    loading,
    isAuthenticated,
    addSong,
    updateSong,
    deleteSong,
    getSong,
    refresh: loadSongs,
  };
}
