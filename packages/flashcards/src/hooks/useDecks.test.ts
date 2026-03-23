import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDecks, useDeckCards } from './useDecks';
import type { Deck, DeckCard, DailyStreak } from '../types';

const deck1: Deck = { id: 'deck-1', name: 'Spanish', createdAt: 1000, updatedAt: 1000 };
const deck2: Deck = { id: 'deck-2', name: 'French', languagePair: 'en→fr', createdAt: 2000, updatedAt: 2000 };

const streak: DailyStreak = { currentStreak: 3, longestStreak: 5, lastReviewDate: '2026-03-23' };

const card1: DeckCard = {
  cardId: 'card-1', interval: 1, easeFactor: 2.5, repetitions: 1,
  dueDate: Date.now() - 1000, maturity: 'learning', addedAt: Date.now() - 86400000,
};

// Capture subscribe callbacks so tests can trigger them
let deckSubscribeCallback: ((decks: Deck[]) => void) | null = null;
let deckCardsSubscribeCallback: ((cards: DeckCard[]) => void) | null = null;

const mockBridge = {
  getAll: vi.fn(),
  subscribe: vi.fn((cb: (decks: Deck[]) => void) => {
    deckSubscribeCallback = cb;
    return () => { deckSubscribeCallback = null; };
  }),
  create: vi.fn().mockResolvedValue('new-deck-id'),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  getDeckCards: vi.fn().mockResolvedValue([]),
  subscribeDeckCards: vi.fn((deckId: string, cb: (cards: DeckCard[]) => void) => {
    deckCardsSubscribeCallback = cb;
    return () => { deckCardsSubscribeCallback = null; };
  }),
  addCard: vi.fn().mockResolvedValue(undefined),
  removeCard: vi.fn().mockResolvedValue(undefined),
  updateCardSR: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue(undefined),
  getStreak: vi.fn().mockResolvedValue(streak),
  updateStreak: vi.fn().mockResolvedValue(streak),
};

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

beforeEach(() => {
  vi.clearAllMocks();
  deckSubscribeCallback = null;
  deckCardsSubscribeCallback = null;
  localStorageMock.clear();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
  Object.defineProperty(window, '__flashcardDecks', { value: mockBridge, writable: true, configurable: true });
  Object.defineProperty(window, '__getFirebaseIdToken', { value: vi.fn().mockResolvedValue('token'), writable: true, configurable: true });
  // Reset mock implementations
  mockBridge.subscribe.mockImplementation((cb: (decks: Deck[]) => void) => {
    deckSubscribeCallback = cb;
    return () => { deckSubscribeCallback = null; };
  });
  mockBridge.subscribeDeckCards.mockImplementation((_deckId: string, cb: (cards: DeckCard[]) => void) => {
    deckCardsSubscribeCallback = cb;
    return () => { deckCardsSubscribeCallback = null; };
  });
});

afterEach(() => {
  Object.defineProperty(window, '__flashcardDecks', { value: undefined, writable: true, configurable: true });
  Object.defineProperty(window, '__getFirebaseIdToken', { value: undefined, writable: true, configurable: true });
});

describe('useDecks', () => {
  it('starts loading and exposes empty decks until subscribe fires', () => {
    const { result } = renderHook(() => useDecks());
    expect(result.current.loading).toBe(true);
    expect(result.current.decks).toEqual([]);
  });

  it('updates decks when subscribe callback fires', async () => {
    const { result } = renderHook(() => useDecks());

    await act(async () => {
      deckSubscribeCallback?.([deck1, deck2]);
    });

    expect(result.current.decks).toEqual([deck1, deck2]);
    expect(result.current.loading).toBe(false);
  });

  it('fetches streak on mount', async () => {
    const { result } = renderHook(() => useDecks());

    // Wait for streak to load
    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    expect(mockBridge.getStreak).toHaveBeenCalled();
    expect(result.current.streak).toEqual(streak);
  });

  it('calls create() with correct args', async () => {
    const { result } = renderHook(() => useDecks());

    let id: string | undefined;
    await act(async () => {
      id = await result.current.createDeck('Japanese', 'en→ja');
    });

    expect(mockBridge.create).toHaveBeenCalledWith({ name: 'Japanese', languagePair: 'en→ja' });
    expect(id).toBe('new-deck-id');
  });

  it('calls update() with correct args', async () => {
    const { result } = renderHook(() => useDecks());

    await act(async () => {
      await result.current.updateDeck('deck-1', { name: 'Updated' });
    });

    expect(mockBridge.update).toHaveBeenCalledWith('deck-1', { name: 'Updated' });
  });

  it('calls delete() with correct id', async () => {
    const { result } = renderHook(() => useDecks());

    await act(async () => {
      await result.current.deleteDeck('deck-1');
    });

    expect(mockBridge.delete).toHaveBeenCalledWith('deck-1');
  });

  it('uses localStorage fallback when bridge is undefined', async () => {
    Object.defineProperty(window, '__flashcardDecks', { value: undefined, writable: true, configurable: true });

    const { result } = renderHook(() => useDecks());

    expect(result.current.loading).toBe(false);

    // createDeck should work locally
    await act(async () => {
      await result.current.createDeck('Offline Deck');
    });

    expect(result.current.decks).toHaveLength(1);
    expect(result.current.decks[0].name).toBe('Offline Deck');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('deleteDeck removes deck from local state when bridge is undefined', async () => {
    Object.defineProperty(window, '__flashcardDecks', { value: undefined, writable: true, configurable: true });
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify([deck1, deck2]));

    const { result } = renderHook(() => useDecks());

    await act(async () => {
      await result.current.deleteDeck('deck-1');
    });

    expect(result.current.decks.some(d => d.id === 'deck-1')).toBe(false);
    expect(result.current.decks).toHaveLength(1);
  });
});

describe('useDeckCards', () => {
  it('starts with empty deckCards while loading', () => {
    const { result } = renderHook(() => useDeckCards('deck-1'));
    expect(result.current.loading).toBe(true);
    expect(result.current.deckCards).toEqual([]);
  });

  it('updates deckCards when subscribeDeckCards callback fires', async () => {
    const { result } = renderHook(() => useDeckCards('deck-1'));

    await act(async () => {
      deckCardsSubscribeCallback?.([card1]);
    });

    expect(result.current.deckCards).toEqual([card1]);
    expect(result.current.loading).toBe(false);
  });

  it('calls addCard() with correct args', async () => {
    const { result } = renderHook(() => useDeckCards('deck-1'));

    await act(async () => {
      await result.current.addCard('card-2');
    });

    expect(mockBridge.addCard).toHaveBeenCalledWith('deck-1', 'card-2');
  });

  it('calls removeCard() with correct args', async () => {
    const { result } = renderHook(() => useDeckCards('deck-1'));

    await act(async () => {
      await result.current.removeCard('card-1');
    });

    expect(mockBridge.removeCard).toHaveBeenCalledWith('deck-1', 'card-1');
  });

  it('returns empty arrays when deckId is null', async () => {
    const { result } = renderHook(() => useDeckCards(null));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.deckCards).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('uses localStorage fallback when bridge is undefined', async () => {
    Object.defineProperty(window, '__flashcardDecks', { value: undefined, writable: true, configurable: true });
    localStorageMock.getItem.mockReturnValue(
      JSON.stringify({ 'deck-1': [card1] })
    );

    const { result } = renderHook(() => useDeckCards('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.deckCards).toEqual([card1]);
    expect(result.current.loading).toBe(false);
  });
});
