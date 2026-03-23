export type CardType = 'chinese' | 'english' | 'bible-first-letter' | 'bible-full' | 'custom';

export interface FlashCard {
  id: string;
  type: CardType;
  category: string;
  front: string;
  back: string;
  isPublic?: boolean;
  createdBy?: { uid: string; displayName: string };
  meta?: {
    pinyin?: string;
    phonetic?: string;
    reference?: string;
    book?: string;
    chapter?: number;
    verses?: string;
  };
}

export type VisibilityFilter = 'all' | 'private' | 'published';

export interface FlashCardProgress {
  masteredIds: string[];
  lastPracticed: string;
}

// ── Spaced Repetition ────────────────────────────────────────────────────────

export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type Maturity = 'new' | 'learning' | 'mature';

export interface Deck {
  id: string;
  name: string;
  languagePair?: string;
  createdAt: number; // Unix ms
  updatedAt: number; // Unix ms
}

export interface DeckCard {
  cardId: string;
  interval: number;      // Days until next review (SM-2 interval)
  easeFactor: number;    // SM-2 EF, starts at 2.5, min 1.3
  repetitions: number;   // Successful consecutive review count
  dueDate: number;       // Unix ms — next scheduled review date
  maturity: Maturity;
  addedAt: number;       // Unix ms
  lastReviewedAt?: number; // Unix ms
}

export interface ReviewSession {
  id: string;
  deckId: string;
  startTime: number;     // Unix ms
  completedTime: number; // Unix ms
  cardsReviewed: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}

export interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string; // 'YYYY-MM-DD'
}
