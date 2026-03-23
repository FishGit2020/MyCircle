# Contract: Window Bridge API — `window.__flashcardDecks`

**Phase**: 1 — Design
**Date**: 2026-03-23
**File**: `packages/shell/src/lib/firebase.ts` (add to existing bridge setup)
**Type**: Shell-to-MFE window bridge (consistent with existing `window.__flashcards` pattern)

---

## Interface Definition

```typescript
// packages/shell/src/types/window.d.ts (or existing window augmentation file)

interface FlashcardDecksAPI {
  // ── Decks ──────────────────────────────────────────────────────────────────

  /** Fetch all decks for the current user once. */
  getAll(): Promise<Deck[]>;

  /**
   * Subscribe to real-time deck updates.
   * @returns unsubscribe function
   */
  subscribe(callback: (decks: Deck[]) => void): () => void;

  /**
   * Create a new deck.
   * @returns the new deck's Firestore document ID
   */
  create(deck: { name: string; languagePair?: string }): Promise<string>;

  /** Rename a deck or update its language pair. */
  update(id: string, updates: { name?: string; languagePair?: string }): Promise<void>;

  /**
   * Delete a deck and all its deckCards subcollection documents.
   * Does NOT delete the underlying flashcard documents.
   */
  delete(id: string): Promise<void>;

  // ── Deck Cards (SR state) ──────────────────────────────────────────────────

  /** Fetch all DeckCard entries for a deck once. */
  getDeckCards(deckId: string): Promise<DeckCard[]>;

  /**
   * Subscribe to real-time deckCards updates for a single deck.
   * @returns unsubscribe function
   */
  subscribeDeckCards(
    deckId: string,
    callback: (cards: DeckCard[]) => void
  ): () => void;

  /**
   * Add a card to a deck. Initializes SR state (EF=2.5, interval=0, reps=0, dueDate=now).
   * No-op if card is already in the deck.
   */
  addCard(deckId: string, cardId: string): Promise<void>;

  /**
   * Remove a card from a deck. Does NOT delete the underlying flashcard.
   */
  removeCard(deckId: string, cardId: string): Promise<void>;

  /**
   * Persist SR state update after a review rating.
   * Called once per card per session completion (batch at session end, not per rating).
   */
  updateCardSR(
    deckId: string,
    cardId: string,
    update: {
      interval: number;
      easeFactor: number;
      repetitions: number;
      dueDate: number;       // Unix ms
      maturity: 'new' | 'learning' | 'mature';
      lastReviewedAt: number; // Unix ms
    }
  ): Promise<void>;

  // ── Sessions ───────────────────────────────────────────────────────────────

  /** Persist a completed review session for streak tracking. */
  saveSession(session: {
    deckId: string;
    startTime: number;
    completedTime: number;
    cardsReviewed: number;
    ratings: { again: number; hard: number; good: number; easy: number };
  }): Promise<void>;

  // ── Streak ─────────────────────────────────────────────────────────────────

  /** Get current streak data. */
  getStreak(): Promise<DailyStreak>;

  /**
   * Update streak for today's date.
   * @param localDate 'YYYY-MM-DD' string in user's local timezone
   * @returns updated streak
   */
  updateStreak(localDate: string): Promise<DailyStreak>;
}

declare global {
  interface Window {
    __flashcardDecks?: FlashcardDecksAPI;  // undefined when user not authenticated
  }
}
```

---

## Behavior Contracts

### Authentication
- All methods MUST check `window.__currentUid`. If no UID, methods throw `Error('Not authenticated')` or return empty results depending on the method:
  - `getAll()`, `getDeckCards()`, `getStreak()`: return `[]` / empty object (no throw)
  - `create()`, `update()`, `delete()`, `addCard()`, `removeCard()`, `updateCardSR()`, `saveSession()`, `updateStreak()`: throw `Error('Not authenticated')`
  - `subscribe()`, `subscribeDeckCards()`: call callback with `[]` immediately, then no-op (return no-op unsubscribe)

### Unauthenticated Fallback
- MFE hooks check `window.__flashcardDecks` availability AND auth state
- When unauthenticated: use `localStorage` with `StorageKeys.FLASHCARD_DECKS` and `StorageKeys.FLASHCARD_DECK_CARDS`
- localStorage schema is identical to the window API return types

### Offline Behavior
- Firebase SDK's built-in offline persistence handles queuing of writes automatically
- The MFE does NOT need to implement a separate retry mechanism
- `subscribeDeckCards` and `subscribe` continue to return cached data when offline

### `delete(deckId)` atomicity
- MUST delete all `deckCards` subcollection docs in a Firestore batch before deleting the deck doc
- If the batch fails, the deck doc is NOT deleted (atomic rollback via Firestore batch)
- Maximum batch size: 500 docs. For decks with >500 cards, use multiple batch operations.

### `addCard(deckId, cardId)` idempotency
- If the `deckCards/{cardId}` doc already exists, do NOT overwrite SR state (keep existing progress)
- Use Firestore's `setDoc` with `{ merge: false }` and check existence first, or use a transaction

### `updateCardSR` batching
- The MFE batches all `updateCardSR` calls at session end (not per rating click)
- Shell MUST support this; each call is an independent `setDoc` write

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Firestore permission denied | Promise rejects with Firebase `PERMISSION_DENIED` error; MFE shows error toast |
| Doc not found on `update`/`delete` | No-op (idempotent); does not throw |
| `addCard` with duplicate | No-op (preserves existing SR state) |
| Network offline on write | Firebase queues write; resolves when reconnected |
| `subscribe` called when not authenticated | Calls callback with `[]`; returns no-op unsubscribe |
