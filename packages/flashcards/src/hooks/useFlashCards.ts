import { useState, useEffect, useCallback, useRef } from 'react';
import { createLogger, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { FlashCard, FlashCardProgress, CardType } from '../types';

const log = createLogger('flashcards');

declare global {
  interface Window {
    __chineseCharacters?: {
      getAll: () => Promise<Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>>;
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

// English phrases bundled from english-learning (re-export approach)
const ENGLISH_PHRASES: FlashCard[] = [
  { id: 'en-g01', type: 'english', category: 'greetings', front: 'Hi!', back: '嗨！' },
  { id: 'en-g02', type: 'english', category: 'greetings', front: 'Bye bye!', back: '拜拜！' },
  { id: 'en-g03', type: 'english', category: 'greetings', front: 'Please.', back: '请。' },
  { id: 'en-g04', type: 'english', category: 'greetings', front: 'Thank you!', back: '谢谢你！' },
  { id: 'en-g05', type: 'english', category: 'greetings', front: 'Sorry.', back: '对不起。' },
  { id: 'en-g06', type: 'english', category: 'greetings', front: "You're welcome.", back: '不客气。' },
  { id: 'en-g07', type: 'english', category: 'greetings', front: 'Good morning!', back: '早上好！' },
  { id: 'en-g08', type: 'english', category: 'greetings', front: 'Good night!', back: '晚安！' },
  { id: 'en-fe01', type: 'english', category: 'feelings', front: "I'm happy.", back: '我很开心。' },
  { id: 'en-fe02', type: 'english', category: 'feelings', front: "I'm tired.", back: '我累了。' },
  { id: 'en-fe03', type: 'english', category: 'feelings', front: "I'm hungry.", back: '我饿了。' },
  { id: 'en-fo01', type: 'english', category: 'food', front: 'Water, please.', back: '请给我水。' },
  { id: 'en-fo02', type: 'english', category: 'food', front: "I'm full.", back: '我吃饱了。' },
  { id: 'en-fo03', type: 'english', category: 'food', front: 'Delicious!', back: '好吃！' },
];

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

  // Load Chinese characters from bridge API
  useEffect(() => {
    let mounted = true;
    async function loadChinese() {
      try {
        if (window.__chineseCharacters) {
          const chars = await window.__chineseCharacters.getAll();
          if (mounted) {
            setChineseCards(chars.map(c => ({
              id: `zh-${c.id}`,
              type: 'chinese' as CardType,
              category: c.category,
              front: c.character,
              back: c.meaning,
              meta: { pinyin: c.pinyin },
            })));
          }
        }
      } catch { /* ignore */ }
      if (mounted) setLoading(false);
    }
    loadChinese();
    return () => { mounted = false; };
  }, []);

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

  const updateCustomCard = useCallback((cardId: string, updates: { front: string; back: string; category: string }) => {
    setCustomCards(prev => {
      const next = prev.map(c => c.id === cardId ? { ...c, ...updates } : c);
      saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, next);
      window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
      // Fire-and-forget Firestore write
      window.__flashcards?.update(cardId, updates).catch(() => { /* ignore */ });
      return next;
    });
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
    updateCustomCard,
    deleteCard,
    resetProgress,
  };
}
