import { useState, useEffect, useCallback } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import type { Deck, DeckCard, DailyStreak } from '../types';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

export function useDecks() {
  const [decks, setDecks] = useState<Deck[]>(() =>
    loadFromStorage<Deck[]>(StorageKeys.FLASHCARD_DECKS, [])
  );
  const [streak, setStreak] = useState<DailyStreak | null>(() =>
    loadFromStorage<DailyStreak | null>(StorageKeys.FLASHCARD_STREAK, null)
  );
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
    const handler = () => { checkAuth(); };
    window.addEventListener(WindowEvents.AUTH_STATE_CHANGED, handler);
    return () => { mounted = false; window.removeEventListener(WindowEvents.AUTH_STATE_CHANGED, handler); };
  }, []);

  // Subscribe to decks (real-time or localStorage)
  useEffect(() => {
    if (!window.__flashcardDecks) {
      setLoading(false);
      return;
    }
    const unsubscribe = window.__flashcardDecks.subscribe((updated) => {
      setDecks(updated);
      saveToStorage(StorageKeys.FLASHCARD_DECKS, updated);
      setLoading(false);
    });

    // Fetch streak on mount
    window.__flashcardDecks.getStreak().then(s => {
      if (s) {
        setStreak(s);
        saveToStorage(StorageKeys.FLASHCARD_STREAK, s);
      }
    }).catch(() => { /* ignore — streak is cosmetic */ });

    return unsubscribe;
  }, [isAuthenticated]);

  const createDeck = useCallback(async (name: string, languagePair?: string) => {
    if (!window.__flashcardDecks) {
      // localStorage fallback
      const newDeck: Deck = {
        id: `deck-${Date.now()}`,
        name,
        languagePair,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setDecks(prev => {
        const next = [...prev, newDeck];
        saveToStorage(StorageKeys.FLASHCARD_DECKS, next);
        return next;
      });
      return newDeck.id;
    }
    return window.__flashcardDecks.create({ name, languagePair });
  }, []);

  const updateDeck = useCallback(async (id: string, updates: { name?: string; languagePair?: string }) => {
    if (!window.__flashcardDecks) {
      setDecks(prev => {
        const next = prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d);
        saveToStorage(StorageKeys.FLASHCARD_DECKS, next);
        return next;
      });
      return;
    }
    return window.__flashcardDecks.update(id, updates);
  }, []);

  const deleteDeck = useCallback(async (id: string) => {
    if (!window.__flashcardDecks) {
      setDecks(prev => {
        const next = prev.filter(d => d.id !== id);
        saveToStorage(StorageKeys.FLASHCARD_DECKS, next);
        return next;
      });
      return;
    }
    return window.__flashcardDecks.delete(id);
  }, []);

  const refreshStreak = useCallback(async () => {
    if (!window.__flashcardDecks) return;
    try {
      const s = await window.__flashcardDecks.getStreak();
      if (s) {
        setStreak(s);
        saveToStorage(StorageKeys.FLASHCARD_STREAK, s);
      }
    } catch { /* ignore */ }
  }, []);

  return {
    decks,
    streak,
    loading,
    isAuthenticated,
    createDeck,
    updateDeck,
    deleteDeck,
    refreshStreak,
  };
}

export function useDeckCards(deckId: string | null) {
  const [deckCards, setDeckCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deckId) {
      setDeckCards([]);
      setLoading(false);
      return;
    }

    if (!window.__flashcardDecks) {
      // localStorage fallback
      try {
        const stored = localStorage.getItem(StorageKeys.FLASHCARD_DECK_CARDS);
        if (stored) {
          const all = JSON.parse(stored) as Record<string, DeckCard[]>;
          setDeckCards(all[deckId] ?? []);
        }
      } catch { /* ignore */ }
      setLoading(false);
      return;
    }

    const unsubscribe = window.__flashcardDecks.subscribeDeckCards(deckId, (cards) => {
      setDeckCards(cards);
      setLoading(false);
    });
    return unsubscribe;
  }, [deckId]);

  const addCard = useCallback(async (cardId: string) => {
    if (!deckId) return;
    if (!window.__flashcardDecks) {
      // localStorage fallback
      const initial: DeckCard = { cardId, interval: 0, easeFactor: 2.5, repetitions: 0, dueDate: Date.now(), maturity: 'new', addedAt: Date.now() };
      setDeckCards(prev => {
        if (prev.some(c => c.cardId === cardId)) return prev;
        const next = [...prev, initial];
        saveStorageDeckCards(deckId, next);
        return next;
      });
      return;
    }
    return window.__flashcardDecks.addCard(deckId, cardId);
  }, [deckId]);

  const removeCard = useCallback(async (cardId: string) => {
    if (!deckId) return;
    if (!window.__flashcardDecks) {
      setDeckCards(prev => {
        const next = prev.filter(c => c.cardId !== cardId);
        saveStorageDeckCards(deckId, next);
        return next;
      });
      return;
    }
    return window.__flashcardDecks.removeCard(deckId, cardId);
  }, [deckId]);

  return { deckCards, loading, addCard, removeCard };
}

function saveStorageDeckCards(deckId: string, cards: DeckCard[]) {
  try {
    const stored = localStorage.getItem(StorageKeys.FLASHCARD_DECK_CARDS);
    const all = stored ? JSON.parse(stored) as Record<string, DeckCard[]> : {};
    all[deckId] = cards;
    localStorage.setItem(StorageKeys.FLASHCARD_DECK_CARDS, JSON.stringify(all));
  } catch { /* ignore */ }
}
