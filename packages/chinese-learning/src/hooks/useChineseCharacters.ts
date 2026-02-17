import { useState, useEffect, useCallback } from 'react';
import { WindowEvents, StorageKeys } from '@mycircle/shared';
import type { ChineseCharacter } from '../data/characters';

declare global {
  interface Window {
    __getFirebaseIdToken?: () => Promise<string | null>;
    __chineseCharacters?: {
      getAll: () => Promise<ChineseCharacter[]>;
      add: (char: Omit<ChineseCharacter, 'id' | 'createdBy' | 'editedBy'>) => Promise<string>;
      update: (id: string, updates: Partial<ChineseCharacter>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe?: (callback: (chars: ChineseCharacter[]) => void) => () => void;
    };
  }
}

function getCachedCharacters(): ChineseCharacter[] {
  try {
    const cached = localStorage.getItem(StorageKeys.CHINESE_CHARACTERS_CACHE);
    if (cached) return JSON.parse(cached);
  } catch { /* ignore */ }
  return [];
}

function setCachedCharacters(chars: ChineseCharacter[]) {
  try {
    localStorage.setItem(StorageKeys.CHINESE_CHARACTERS_CACHE, JSON.stringify(chars));
  } catch { /* ignore */ }
}

export function useChineseCharacters() {
  const [characters, setCharacters] = useState<ChineseCharacter[]>(getCachedCharacters);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // One-shot fetch fallback
  const loadCharacters = useCallback(async () => {
    setLoading(true);
    try {
      if (window.__chineseCharacters) {
        const data = await window.__chineseCharacters.getAll();
        setCharacters(data);
        setCachedCharacters(data);
      }
    } catch (err) {
      console.error('Failed to load Chinese characters:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription with fallback
  useEffect(() => {
    if (window.__chineseCharacters?.subscribe) {
      const unsubscribe = window.__chineseCharacters.subscribe((data) => {
        setCharacters(data);
        setCachedCharacters(data);
        setLoading(false);
      });
      return unsubscribe;
    }

    loadCharacters();
    const handler = () => { loadCharacters(); };
    window.addEventListener(WindowEvents.CHINESE_CHARACTERS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.CHINESE_CHARACTERS_CHANGED, handler);
  }, [loadCharacters]);

  const addCharacter = useCallback(async (char: Omit<ChineseCharacter, 'id' | 'createdBy' | 'editedBy'>) => {
    if (!window.__chineseCharacters) throw new Error('Chinese characters API not available');
    const id = await window.__chineseCharacters.add(char);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
    return id;
  }, []);

  const updateCharacter = useCallback(async (id: string, updates: Partial<ChineseCharacter>) => {
    if (!window.__chineseCharacters) throw new Error('Chinese characters API not available');
    await window.__chineseCharacters.update(id, updates);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
  }, []);

  const deleteCharacter = useCallback(async (id: string) => {
    if (!window.__chineseCharacters) throw new Error('Chinese characters API not available');
    await window.__chineseCharacters.delete(id);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
  }, []);

  return {
    characters,
    loading,
    isAuthenticated,
    addCharacter,
    updateCharacter,
    deleteCharacter,
    refresh: loadCharacters,
  };
}
