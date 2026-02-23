import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createLogger, StorageKeys, WindowEvents } from '@mycircle/shared';
import type { FlashCard, FlashCardProgress, CardType, VisibilityFilter } from '../types';
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
      getAllPublic: () => Promise<any[]>;
      subscribePublic: (callback: (cards: any[]) => void) => () => void;
      publish: (card: Record<string, any>) => Promise<string>;
      deletePublic: (id: string) => Promise<void>;
      migrateChineseToPublic: () => Promise<void>;
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
  const [chineseCards, setChineseCards] = useState<FlashCard[]>([]);
  const [publicCards, setPublicCards] = useState<FlashCard[]>(() =>
    loadFromStorage(StorageKeys.FLASHCARD_PUBLIC_CARDS, [])
  );
  const [progress, setProgress] = useState<FlashCardProgress>(() =>
    loadFromStorage(StorageKeys.FLASHCARD_PROGRESS, { masteredIds: [], lastPracticed: '' })
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const migratedRef = useRef(false);
  const chineseMigratedRef = useRef(false);

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

  // Load Chinese characters from bridge API (fallback for unauthenticated users)
  useEffect(() => {
    if (isAuthenticated) return; // When authenticated, Chinese cards come from user flashcards subscription
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
  }, [mapChineseToCards, isAuthenticated]);

  // Subscribe to public flashcards (no auth gate — public read)
  useEffect(() => {
    if (!window.__flashcards?.subscribePublic) return;
    let mounted = true;

    const unsubscribe = window.__flashcards.subscribePublic((firestoreCards) => {
      const cards: FlashCard[] = firestoreCards.map((c: any) => ({
        id: c.id,
        type: c.type || 'chinese',
        category: c.category || '',
        front: c.front,
        back: c.back,
        meta: c.meta,
        isPublic: true,
        createdBy: c.createdBy,
      }));
      if (mounted) {
        setPublicCards(cards);
        saveToStorage(StorageKeys.FLASHCARD_PUBLIC_CARDS, cards);
      }
    });

    return () => { mounted = false; unsubscribe(); };
  }, []);

  // Firestore real-time subscription for private cards when authenticated
  useEffect(() => {
    if (!isAuthenticated || !window.__flashcards?.subscribe) return;

    let received = false;
    const unsubscribe = window.__flashcards.subscribe((firestoreCards) => {
      received = true;
      // Split into bible, custom, and chinese cards
      const bible: FlashCard[] = [];
      const custom: FlashCard[] = [];
      const chinese: FlashCard[] = [];
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
        } else if (card.type === 'chinese') {
          chinese.push(card);
        }
      }
      setBibleCards(bible);
      setCustomCards(custom);
      setChineseCards(chinese);
      setLoading(false);
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

    // Fallback: stop loading after 3s if no data arrives (empty collection, etc.)
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

  // One-time migration: Chinese characters → publicFlashcards + user flashcards
  useEffect(() => {
    if (!isAuthenticated || chineseMigratedRef.current || !window.__flashcards?.migrateChineseToPublic) return;
    const migrated = localStorage.getItem('chinese-to-public-migrated');
    if (migrated) { chineseMigratedRef.current = true; return; }
    chineseMigratedRef.current = true;

    log.info('Running Chinese → publicFlashcards migration');
    window.__flashcards.migrateChineseToPublic().then(() => {
      localStorage.setItem('chinese-to-public-migrated', '1');
      log.info('Chinese migration complete');
    }).catch((err) => {
      log.warn('Chinese migration failed:', err);
    });
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

  // Merge private + English + public cards (dedup public cards already in private)
  const privateCards: FlashCard[] = [...chineseCards, ...bibleCards, ...customCards];
  const privateIds = useMemo(() => new Set(privateCards.map(c => c.id)), [privateCards]);

  // Public cards that the user doesn't already have privately (avoid duplicates)
  const publicCardsFiltered = useMemo(() =>
    publicCards.filter(c => !privateIds.has(c.id) && !privateIds.has(`zh-${c.id}`)),
    [publicCards, privateIds]
  );

  // Apply visibility filter
  const allCards = useMemo(() => {
    const combined = [...privateCards, ...ENGLISH_PHRASES, ...publicCardsFiltered];
    if (visibilityFilter === 'all') return combined;
    if (visibilityFilter === 'private') return combined.filter(c => !c.isPublic);
    // 'published' — only public cards
    return publicCards;
  }, [privateCards, publicCardsFiltered, publicCards, visibilityFilter]);

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

  const addCustomCard = useCallback((card: Omit<FlashCard, 'id' | 'type'> & { type?: CardType }) => {
    const cardType = card.type || 'custom';
    const prefix = cardType === 'chinese' ? 'zh' : 'custom';
    const newCard: FlashCard = {
      ...card,
      id: `${prefix}-${Date.now()}`,
      type: cardType,
    };
    if (cardType === 'chinese') {
      setChineseCards(prev => {
        const next = [...prev, newCard];
        return next;
      });
    } else {
      setCustomCards(prev => {
        const next = [...prev, newCard];
        saveToStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, next);
        return next;
      });
    }
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
    // Fire-and-forget Firestore write
    window.__flashcards?.add(newCard).catch(() => { /* ignore */ });
  }, []);

  const updateCard = useCallback((cardId: string, updates: { front: string; back: string; category: string }) => {
    setChineseCards(prev => {
      if (!prev.some(c => c.id === cardId)) return prev;
      return prev.map(c => c.id === cardId ? { ...c, ...updates } : c);
    });
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
    // Check if this is a public card
    const isPublicCard = publicCards.some(c => c.id === cardId);
    if (isPublicCard) {
      setPublicCards(prev => {
        const next = prev.filter(c => c.id !== cardId);
        saveToStorage(StorageKeys.FLASHCARD_PUBLIC_CARDS, next);
        return next;
      });
      window.__flashcards?.deletePublic?.(cardId).catch(() => { /* ignore */ });
    } else {
      setChineseCards(prev => prev.filter(c => c.id !== cardId));
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
      window.__flashcards?.delete(cardId).catch(() => { /* ignore */ });
    }
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
  }, [publicCards]);

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

  // Publish a card to the public collection, then remove the private copy
  const publishCard = useCallback(async (card: FlashCard) => {
    if (!window.__flashcards?.publish) return;
    await window.__flashcards.publish({
      type: card.type,
      front: card.front,
      back: card.back,
      category: card.category,
      meta: card.meta,
    });
    // Remove the private copy — the card now lives in publicFlashcards
    deleteCard(card.id);
  }, [deleteCard]);

  return {
    allCards,
    chineseCards,
    englishCards: ENGLISH_PHRASES,
    bibleCards,
    customCards,
    publicCards,
    progress,
    loading,
    categories,
    cardTypes,
    isAuthenticated,
    visibilityFilter,
    setVisibilityFilter,
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
    publishCard,
  };
}
