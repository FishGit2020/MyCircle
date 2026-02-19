import { useState, useEffect, useCallback } from 'react';
import { StorageKeys, WindowEvents } from '@mycircle/shared';
import type { FlashCard, FlashCardProgress, CardType } from '../types';

declare global {
  interface Window {
    __chineseCharacters?: {
      getAll: () => Promise<Array<{ id: string; character: string; pinyin: string; meaning: string; category: string }>>;
    };
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

  // Listen for progress changes from other tabs
  useEffect(() => {
    const handler = () => {
      setProgress(loadFromStorage(StorageKeys.FLASHCARD_PROGRESS, { masteredIds: [], lastPracticed: '' }));
      setBibleCards(loadFromStorage(StorageKeys.FLASHCARD_BIBLE_CARDS, []));
      setCustomCards(loadFromStorage(StorageKeys.FLASHCARD_CUSTOM_CARDS, []));
    };
    window.addEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, handler);
    return () => window.removeEventListener(WindowEvents.FLASHCARD_PROGRESS_CHANGED, handler);
  }, []);

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
  }, []);

  const resetProgress = useCallback(() => {
    const next: FlashCardProgress = { masteredIds: [], lastPracticed: '' };
    setProgress(next);
    saveToStorage(StorageKeys.FLASHCARD_PROGRESS, next);
    window.dispatchEvent(new Event(WindowEvents.FLASHCARD_PROGRESS_CHANGED));
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
    toggleMastered,
    addBibleCards,
    addCustomCard,
    deleteCard,
    resetProgress,
  };
}
