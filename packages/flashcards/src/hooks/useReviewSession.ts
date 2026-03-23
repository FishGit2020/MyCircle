import { useState, useCallback, useEffect } from 'react';
import { applyRating } from '../lib/sm2';
import type { Rating, DeckCard } from '../types';

export interface SessionStats {
  cardsReviewed: number;
  ratings: { again: number; hard: number; good: number; easy: number };
  nextReviewDate: number | null; // Unix ms — earliest future due date
}

export type SessionStatus = 'loading' | 'idle' | 'active' | 'complete' | 'no-cards';

interface SessionState {
  queue: DeckCard[];               // Remaining cards to rate
  srUpdates: Map<string, DeckCard>; // Final SR state per card
  ratings: { again: number; hard: number; good: number; easy: number };
  requeued: Set<string>;            // Cards rated 'again' — need non-again rating
  requeuePassed: Set<string>;       // Requeued cards that have been rated non-again
  startTime: number;
}

interface UseReviewSessionReturn {
  status: SessionStatus;
  currentCard: DeckCard | null;
  progressCurrent: number;
  progressTotal: number;
  sessionStats: SessionStats | null;
  startSession: () => void;
  rateCard: (rating: Rating) => void;
  resetSession: () => void;
}

export function useReviewSession(deckId: string | null): UseReviewSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [dueCards, setDueCards] = useState<DeckCard[]>([]);
  const [session, setSession] = useState<SessionState | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  // Load due cards when deckId changes
  useEffect(() => {
    if (!deckId) {
      setStatus('idle');
      return;
    }
    setStatus('loading');
    if (!window.__flashcardDecks) {
      setStatus('no-cards');
      return;
    }
    window.__flashcardDecks.getDeckCards(deckId).then((cards) => {
      const now = Date.now();
      const due = cards.filter(c => c.dueDate <= now);
      setDueCards(due);
      setStatus(due.length > 0 ? 'idle' : 'no-cards');
    }).catch(() => {
      setStatus('no-cards');
    });
  }, [deckId]);

  const startSession = useCallback(() => {
    if (dueCards.length === 0) return;
    setSession({
      queue: [...dueCards],
      srUpdates: new Map(dueCards.map(c => [c.cardId, { ...c }])),
      ratings: { again: 0, hard: 0, good: 0, easy: 0 },
      requeued: new Set(),
      requeuePassed: new Set(),
      startTime: Date.now(),
    });
    setSessionStats(null);
    setStatus('active');
  }, [dueCards]);

  // Detect session completion via useEffect so act() flushes it properly in tests
  useEffect(() => {
    if (status !== 'active' || !session || session.queue.length !== 0 || !deckId) return;

    const now = Date.now();
    let nextReviewDate: number | null = null;
    session.srUpdates.forEach(card => {
      if (nextReviewDate === null || card.dueDate < nextReviewDate) {
        nextReviewDate = card.dueDate;
      }
    });
    const stats: SessionStats = {
      cardsReviewed: session.srUpdates.size,
      ratings: { ...session.ratings },
      nextReviewDate,
    };
    setSessionStats(stats);
    setStatus('complete');

    if (window.__flashcardDecks) {
      const bridge = window.__flashcardDecks;
      const persistUpdates = Array.from(session.srUpdates.entries()).map(([cardId, card]) =>
        bridge.updateCardSR(deckId, cardId, {
          interval: card.interval,
          easeFactor: card.easeFactor,
          repetitions: card.repetitions,
          dueDate: card.dueDate,
          maturity: card.maturity,
          lastReviewedAt: card.lastReviewedAt ?? now,
        })
      );
      const localDate = new Date().toLocaleDateString('en-CA');
      Promise.all([
        ...persistUpdates,
        bridge.saveSession({ deckId, startTime: session.startTime, completedTime: now, cardsReviewed: session.srUpdates.size, ratings: { ...session.ratings } }),
        bridge.updateStreak(localDate),
      ]).catch(() => { /* offline — Firebase SDK queues writes */ });
    }
  }, [session, status, deckId]);

  const rateCard = useCallback((rating: Rating) => {
    setSession(prev => {
      if (!prev || prev.queue.length === 0) return prev;

      const card = prev.queue[0];
      const currentState = prev.srUpdates.get(card.cardId) ?? card;
      const result = applyRating(currentState, rating);
      const updatedCard: DeckCard = {
        ...card,
        interval: result.interval,
        easeFactor: result.easeFactor,
        repetitions: result.repetitions,
        maturity: result.maturity,
        dueDate: result.dueDate,
        lastReviewedAt: Date.now(),
      };

      const newSrUpdates = new Map(prev.srUpdates);
      newSrUpdates.set(card.cardId, updatedCard);

      const newRatings = { ...prev.ratings, [rating]: prev.ratings[rating] + 1 };
      const newRequeued = new Set(prev.requeued);
      const newRequeuePassed = new Set(prev.requeuePassed);

      let newQueue: DeckCard[];
      if (rating === 'again') {
        // Re-queue: move to end of remaining queue
        newRequeued.add(card.cardId);
        newQueue = [...prev.queue.slice(1), card];
      } else {
        if (prev.requeued.has(card.cardId)) {
          newRequeuePassed.add(card.cardId);
        }
        newQueue = prev.queue.slice(1);
      }

      return {
        ...prev,
        queue: newQueue,
        srUpdates: newSrUpdates,
        ratings: newRatings,
        requeued: newRequeued,
        requeuePassed: newRequeuePassed,
      };
    });
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
    setSessionStats(null);
    setStatus(dueCards.length > 0 ? 'idle' : 'no-cards');
  }, [dueCards]);

  const currentCard = status === 'active' && session && session.queue.length > 0
    ? session.queue[0]
    : null;

  const progressCurrent = session ? dueCards.length - session.queue.length : 0;

  return {
    status,
    currentCard,
    progressCurrent: Math.max(0, progressCurrent),
    progressTotal: dueCards.length,
    sessionStats,
    startSession,
    rateCard,
    resetSession,
  };
}
