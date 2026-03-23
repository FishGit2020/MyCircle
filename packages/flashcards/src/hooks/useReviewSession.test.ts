import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReviewSession } from './useReviewSession';
import type { DeckCard } from '../types';

function makeCard(cardId: string, overrides: Partial<DeckCard> = {}): DeckCard {
  return {
    cardId,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    dueDate: Date.now() - 1000, // overdue
    maturity: 'learning',
    addedAt: Date.now() - 86400000,
    ...overrides,
  };
}

const cards: DeckCard[] = [
  makeCard('card-1'),
  makeCard('card-2'),
  makeCard('card-3'),
];

const mockBridge = {
  getDeckCards: vi.fn(),
  updateCardSR: vi.fn().mockResolvedValue(undefined),
  saveSession: vi.fn().mockResolvedValue(undefined),
  updateStreak: vi.fn().mockResolvedValue({ currentStreak: 1, longestStreak: 1, lastReviewDate: '2026-03-23' }),
  // Other methods (not used by useReviewSession)
  getAll: vi.fn(),
  subscribe: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  subscribeDeckCards: vi.fn(),
  addCard: vi.fn(),
  removeCard: vi.fn(),
  getStreak: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockBridge.getDeckCards.mockResolvedValue(cards);
  Object.defineProperty(window, '__flashcardDecks', {
    value: mockBridge,
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, '__flashcardDecks', {
    value: undefined,
    writable: true,
    configurable: true,
  });
});

describe('useReviewSession', () => {
  it('loads due cards and shows idle status', async () => {
    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.status).toBe('idle');
    expect(result.current.progressTotal).toBe(3);
  });

  it('starts session with correct initial state', async () => {
    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });

    expect(result.current.status).toBe('active');
    expect(result.current.currentCard?.cardId).toBe('card-1');
    expect(result.current.progressCurrent).toBe(0);
  });

  it('advances to next card on good rating', async () => {
    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });
    act(() => { result.current.rateCard('good'); });

    expect(result.current.currentCard?.cardId).toBe('card-2');
    expect(result.current.progressCurrent).toBe(1);
  });

  it('requeues card at end of queue on "again" rating', async () => {
    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });

    // Rate card-1 as "again" — it should move to end
    act(() => { result.current.rateCard('again'); });

    // Next card should be card-2
    expect(result.current.currentCard?.cardId).toBe('card-2');
    expect(result.current.status).toBe('active');
  });

  it('session is not complete after "again" until card passes', async () => {
    // Single card deck — rate again, then good
    mockBridge.getDeckCards.mockResolvedValue([makeCard('solo')]);

    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });
    act(() => { result.current.rateCard('again'); });

    // Card should be requeued, still active
    expect(result.current.status).toBe('active');
    expect(result.current.currentCard?.cardId).toBe('solo');

    // Now rate good — should complete
    act(() => { result.current.rateCard('good'); });

    expect(result.current.status).toBe('complete');
  });

  it('calls updateCardSR for each card on session complete', async () => {
    mockBridge.getDeckCards.mockResolvedValue([makeCard('solo')]);

    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });
    act(() => { result.current.rateCard('good'); });

    expect(mockBridge.updateCardSR).toHaveBeenCalledOnce();
    expect(mockBridge.updateCardSR).toHaveBeenCalledWith(
      'deck-1',
      'solo',
      expect.objectContaining({ repetitions: 2, maturity: 'learning' })
    );
  });

  it('calls saveSession once with correct rating counts', async () => {
    mockBridge.getDeckCards.mockResolvedValue([makeCard('card-a'), makeCard('card-b')]);

    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    act(() => { result.current.startSession(); });
    act(() => { result.current.rateCard('easy'); });
    act(() => { result.current.rateCard('good'); });

    expect(mockBridge.saveSession).toHaveBeenCalledOnce();
    expect(mockBridge.saveSession).toHaveBeenCalledWith(
      expect.objectContaining({
        deckId: 'deck-1',
        cardsReviewed: 2,
        ratings: { again: 0, hard: 0, good: 1, easy: 1 },
      })
    );
  });

  it('shows no-cards status when deck is empty', async () => {
    mockBridge.getDeckCards.mockResolvedValue([]);

    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.status).toBe('no-cards');
  });

  it('filters out cards not yet due', async () => {
    const futureDue = makeCard('future', { dueDate: Date.now() + 86400000 });
    mockBridge.getDeckCards.mockResolvedValue([makeCard('due'), futureDue]);

    const { result } = renderHook(() => useReviewSession('deck-1'));

    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(result.current.progressTotal).toBe(1);
  });
});
