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

  // Load songs
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

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  // Listen for external changes
  useEffect(() => {
    const handler = () => { loadSongs(); };
    window.addEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.WORSHIP_SONGS_CHANGED, handler);
  }, [loadSongs]);

  const addSong = useCallback(async (song: Omit<WorshipSong, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    const id = await window.__worshipSongs.add(song);
    await loadSongs();
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
    return id;
  }, [loadSongs]);

  const updateSong = useCallback(async (id: string, updates: Partial<WorshipSong>) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    await window.__worshipSongs.update(id, updates);
    await loadSongs();
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  }, [loadSongs]);

  const deleteSong = useCallback(async (id: string) => {
    if (!window.__worshipSongs) throw new Error('Worship songs API not available');
    await window.__worshipSongs.delete(id);
    await loadSongs();
    window.dispatchEvent(new Event(WindowEvents.WORSHIP_SONGS_CHANGED));
  }, [loadSongs]);

  const getSong = useCallback(async (id: string) => {
    if (!window.__worshipSongs) return null;
    return window.__worshipSongs.get(id);
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
