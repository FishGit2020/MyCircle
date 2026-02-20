import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { FlashCard, FlashCardProgress, CardType } from '../types';
import { phrases } from '../data/phrases';

const log = createLogger('flashcards');

declare global {
  interface Window {
    __chineseCharacters?: {
      getAll: () => Promise<Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>>;
      add: (char: Record<string, any>) => Promise<string>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (chars: any[]) => void) => () => void;
    };
    __flashcards?: {
      getAll: () => Promise<any[]>;
      add: (card: Record<string, any>) => Promise<string>;
      addBatch: (cards: Array<Record<string, any>>) => Promise<void>;
      update: (id: string, updates: Record<string, any>) => Promise<void>;
      delete: (id: string) => Promise<void>;
      subscribe: (callback: (cards: any[]) => void) => () => void;
      getProgress: () => Promise<any>;
      updateProgress: (progress: Record<string, any>) => Promise<void>;
    };
    __getFirebaseIdToken?: () => Promise<string | null>;
  }
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return fallback;
}

function saveToStorage(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// All 88 English phrases mapped to FlashCards
const ENGLISH_PHRASES: FlashCard[] = phrases.map(p => ({
  id: `en-${p.id}`,
  type: 'english' as CardType,
  category: p.category,
  front: p.english,
  back: p.chinese,
  meta: { phonetic: p.phonetic },
}));

export function useFlashCards() {
  const [bibleCards, setBibleCards] = useState<FlashCard[]>(() =>
    loadFromStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, [])
  );
  const [customCards, setCustomCards] = useState<FlashCard[]>(() =>
    loadFromStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, [])
  );
  const [progress, setProgress] = useState<FlashCardProgress>(() =>
    loadFromStorage(StorageKeys.FLASHCARD_PROGRESS, { masteredIds: [], lastPracticed: '' })
  );
  const [chineseCards, setChineseCards] = useState<FlashCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const migratedRef = useRef(false);

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

  // Map raw Chinese characters to FlashCards
  const mapChineseToCards = useCallback((chars: Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>): FlashCard[] => {
    return chars.map(c => ({
      id: `zh-${c.id}`,
      type: 'chinese' as CardType,
      category: c.category,
      front: c.character,
      back: c.meaning,
      meta: { pinyin: c.pinyin },
    }));
  }, []);

  // Load Chinese characters from bridge API
  useEffect(() => {
    let mounted = true;
    async function loadChinese() {
      try {
        if (window.__chineseCharacters) {
          const chars = await window.__chineseCharacters.getAll();
          if (mounted) setChineseCards(mapChineseToCards(chars));
        }
      } catch { /* ignore */ }
      if (mounted) setLoading(false);
    }
    loadChinese();

    // Subscribe to real-time changes
    const unsub = window.__chineseCharacters?.subscribe?.((chars) => {
      if (mounted) setChineseCards(mapChineseToCards(chars));
    });

    // Listen for CRUD events
    const handleChanged = () => {
      window.__chineseCharacters?.getAll().then(chars => {
        if (mounted) setChineseCards(mapChineseToCards(chars));
      }).catch(() => { /* ignore */ });
    };
    window.addEventListener(WindowEvents.CHINESE_CHARACTERS_CHANGED, handleChanged);

    return () => {
      mounted = false;
      unsub?.();
      window.removeEventListener(WindowEvents.CHINESE_CHARACTERS_CHANGED, handleChanged);
    };
  }, [mapChineseToCards]);

  // Firestore real-time subscription for cards when authenticated
  useEffect(() => {
    if (!isAuthenticated || !window.__flashcards?.subscribe) return;

    let received = false;
    const unsubscribe = window.__flashcards.subscribe((firestoreCards) => {
      received = true;
      // Split into bible and custom cards
      const bible: FlashCard[] = [];
      const custom: FlashCard[] = [];
      for (const c of firestoreCards) {
        const card: FlashCard = {
          id: c.id,
          type: c.type,
          category: c.category || '',
          front: c.front,
          back: c.back,
          meta: c.meta,
        };
        if (card.type === 'bible-first-letter' || card.type === 'bible-full') {
          bible.push(card);
        } else if (card.type === 'custom') {
          custom.push(card);
        }
      }
      setBibleCards(bible);
      setCustomCards(custom);
      // Cache in localStorage
      saveToStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, bible);
      saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, custom);
    });

    // Load progress from Firestore
    window.__flashcards.getProgress?.().then(data => {
      if (data) {
        const p: FlashCardProgress = {
          masteredIds: data.masteredIds || [],
          lastPracticed: data.lastPracticed || '',
        };
        setProgress(p);
        saveToStorage(StorageKeys.FLASHCARD_PROGRESS, p);
      }
    }).catch(() => { /* ignore */ });

    const timeout = setTimeout(() => {
      if (!received) setLoading(false);
    }, 3000);

    return () => { unsubscribe(); clearTimeout(timeout); };
  }, [isAuthenticated]);

  // One-time migration: upload localStorage cards to Firestore on first auth
  useEffect(() => {
    if (!isAuthenticated || migratedRef.current || !window.__flashcards) return;
    migratedRef.current = true;

    const localBible: FlashCard[] = loadFromStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, []);
    const localCustom: FlashCard[] = loadFromStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, []);
    const cardsToMigrate = [...localBible, ...localCustom];

    if (cardsToMigrate.length > 0) {
      window.__flashcards.getAll().then(existing => {
        const existingIds = new Set(existing.map((c: any) => c.id));
        const newCards = cardsToMigrate.filter(c => !existingIds.has(c.id));
        if (newCards.length > 0) {
          log.info(`Migrating ${newCards.length} flashcards to Firestore`);
          window.__flashcards!.addBatch(newCards).catch(() => {
            log.warn('Failed to migrate flashcards');
          });
        }
      }).catch(() => { /* ignore */ });

      // Also migrate progress
      const localProgress = loadFromStorage<FlashCardProgress>(
        StorageKeys.FLASHCARD_PROGRESS,
        { masteredIds: [], lastPracticed: '' }
      );
      if (localProgress.masteredIds.length > 0) {
        window.__flashcards.updateProgress(localProgress).catch(() => { /* ignore */ });
      }
    }
  }, [isAuthenticated]);

  // One-time migration: merge old English/Chinese progress into flashcard progress
  useEffect(() => {
    const migrated = localStorage.getItem('flashcard-progress-migrated');
    if (migrated) return;

    const idsToMerge: string[] = [];
    try {
      const englishRaw = localStorage.getItem(StorageKeys.ENGLISH_LEARNING_PROGRESS);
      if (englishRaw) {
        const english = JSON.parse(englishRaw);
        if (Array.isArray(english.completedIds)) {
          idsToMerge.push(...english.completedIds.map((id: string) => `en-${id}`));
        }
      }
    } catch { /* ignore */ }
    try {
      const chineseRaw = localStorage.getItem(StorageKeys.CHINESE_LEARNING_PROGRESS);
      if (chineseRaw) {
        const chinese = JSON.parse(chineseRaw);
        if (Array.isArray(chinese.masteredIds)) {
          idsToMerge.push(...chinese.masteredIds.map((id: string) => `zh-${id}`));
        }
      }
    } catch { /* ignore */ }

    if (idsToMerge.length > 0) {
      setProgress(prev => {
        const merged = new Set([...prev.masteredIds, ...idsToMerge]);
        const next: FlashCardProgress = {
          masteredIds: Array.from(merged),
          lastPracticed: prev.lastPracticed || new Date().toISOString(),
        };
        saveToStorage(StorageKeys.FLASHCARD_PROGRESS, next);
        window.__flashcards?.updateProgress(next).catch(() => { /* ignore */ });
        log.info(`Migrated ${idsToMerge.length} progress entries from old MFEs`);
        return next;
      });
    }

    localStorage.setItem('flashcard-progress-migrated', '1');
    try { localStorage.removeItem(StorageKeys.ENGLISH_LEARNING_PROGRESS); } catch { /* ignore */ }
    try { localStorage.removeItem(StorageKeys.CHINESE_LEARNING_PROGRESS); } catch { /* ignore */ }
  }, []);

  // Listen for progress changes from other tabs (localStorage-only mode)
  useEffect(() => {
    if (isAuthenticated) return; // Firestore handles sync when authenticated
    const handler = () => {
      setProgress(loadFromStorage(StorageKeys.FLASHCARD_PROGRESS, { masteredIds: [], lastPracticed: '' }));
      setBibleCards(loadFromStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, []));
      setCustomCards(loadFromStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, []));
    };
    window.addEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, handler);
  }, [isAuthenticated]);

  const allCards: FlashCard[] = [...chineseCards, ...ENGLISH_PHRASES, ...bibleCards, ...customCards];

  const categories = Array.from(new Set(allCards.map(c => c.category)));

  const cardTypes = Array.from(new Set(allCards.map(c => c.type)));

  const toggleMastered = useCallback((cardId: string) => {
    setProgress(prev => {
      const isMastered = prev.masteredIds.includes(cardId);
      const next: FlashCardProgress = {
        masteredIds: isMastered
          ? prev.masteredIds.filter(id => id !== cardId)
          : [...prev.masteredIds, cardId],
        lastPracticed: new Date().toISOString(),
      };
      saveToStorage(StorageKeys.FLASHCARD_PROGRESS, next);
      window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
      // Fire-and-forget Firestore write
      window.__flashcards?.updateProgress(next).catch(() => { /* ignore */ });
      return next;
    });
  }, []);

  const addBibleCards = useCallback((cards: FlashCard[]) => {
    setBibleCards(prev => {
      const existingIds = new Set(prev.map(c => c.id));
      const newCards = cards.filter(c => !existingIds.has(c.id));
      const next = [...prev, ...newCards];
      saveToStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, next);
      window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
      // Fire-and-forget Firestore batch add
      if (newCards.length > 0) {
        window.__flashcards?.addBatch(newCards).catch(() => { /* ignore */ });
      }
      return next;
    });
  }, []);

  const addCustomCard = useCallback((card: Omit<FlashCard, 'id' | 'type'>) => {
    const newCard: FlashCard = {
      ...card,
      id: `custom-${Date.now()}`,
      type: 'custom',
    };
    setCustomCards(prev => {
      const next = [...prev, newCard];
      saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, next);
      window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
      // Fire-and-forget Firestore write
      window.__flashcards?.add(newCard).catch(() => { /* ignore */ });
      return next;
    });
  }, []);

  const updateCard = useCallback((cardId: string, updates: { front: string; back: string; category: string }) => {
    setCustomCards(prev => {
      if (!prev.some(c => c.id === cardId)) return prev;
      const next = prev.map(c => c.id === cardId ? { ...c, ...updates } : c);
      saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, next);
      return next;
    });
    setBibleCards(prev => {
      if (!prev.some(c => c.id === cardId)) return prev;
      const next = prev.map(c => c.id === cardId ? { ...c, ...updates } : c);
      saveToStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, next);
      return next;
    });
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
    window.__flashcards?.update(cardId, updates).catch(() => { /* ignore */ });
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setBibleCards(prev => {
      const next = prev.filter(c => c.id !== cardId);
      saveToStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, next);
      return next;
    });
    setCustomCards(prev => {
      const next = prev.filter(c => c.id !== cardId);
      saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, next);
      return next;
    });
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
    // Fire-and-forget Firestore delete
    window.__flashcards?.delete(cardId).catch(() => { /* ignore */ });
  }, []);

  const resetProgress = useCallback(() => {
    const next: FlashCardProgress = { masteredIds: [], lastPracticed: '' };
    setProgress(next);
    saveToStorage(StorageKeys.FLASHCARD_PROGRESS, next);
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
    // Fire-and-forget Firestore write
    window.__flashcards?.updateProgress(next).catch(() => { /* ignore */ });
  }, []);

  // Chinese character CRUD via bridge API
  const addChineseChar = useCallback(async (data: { character: string; pinyin: string; meaning: string; category: string }) => {
    if (!window.__chineseCharacters) return;
    await window.__chineseCharacters.add(data);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
  }, []);

  const updateChineseChar = useCallback(async (id: string, data: { character: string; pinyin: string; meaning: string; category: string }) => {
    if (!window.__chineseCharacters) return;
    await window.__chineseCharacters.update(id, data);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
  }, []);

  const deleteChineseChar = useCallback(async (id: string) => {
    if (!window.__chineseCharacters) return;
    await window.__chineseCharacters.delete(id);
    window.dispatchEvent(new Event(WindowEvents.CHINESE_CHARACTERS_CHANGED));
  }, []);

  const reloadChinese = useCallback(async () => {
    if (!window.__chineseCharacters) return;
    try {
      const chars = await window.__chineseCharacters.getAll();
      setChineseCards(mapChineseToCards(chars));
    } catch { /* ignore */ }
  }, [mapChineseToCards]);

  return {
    allCards,
    chineseCards,
    englishCards: ENGLISH_PHRASES,
    bibleCards,
    customCards,
    progress,
    loading,
    categories,
    cardTypes,
    isAuthenticated,
    toggleMastered,
    addBibleCards,
    addCustomCard,
    updateCard,
    deleteCard,
    resetProgress,
    addChineseChar,
    updateChineseChar,
    deleteChineseChar,
    reloadChinese,
  };
}
