# Data Model: Language Flashcard Decks with Spaced Repetition

**Phase**: 1 — Design
**Date**: 2026-03-23
**Branch**: `010-language-flashcards`

---

## Entities

### 1. Deck

A named collection of cards for a specific learning goal.

**Firestore path**: `users/{uid}/flashcardDecks/{deckId}`

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `id` | `string` | auto | Firestore doc ID | Auto-generated |
| `name` | `string` | yes | 1–100 chars | Free text, no uniqueness constraint |
| `languagePair` | `string \| undefined` | no | max 50 chars | e.g. "English → Spanish" |
| `createdAt` | `Timestamp` | auto | — | Set on create |
| `updatedAt` | `Timestamp` | auto | — | Updated on rename |

**TypeScript interface**:
```typescript
interface Deck {
  id: string;
  name: string;
  languagePair?: string;
  createdAt: number;     // Unix ms (from Timestamp.toMillis())
  updatedAt: number;
}
```

**Computed (not stored)**:
- `cardCount`: `deckCards.length`
- `dueTodayCount`: count of `deckCards` where `dueDate <= now()`
- `newCount`: count where `maturity === 'new'`
- `learningCount`: count where `maturity === 'learning'`
- `matureCount`: count where `maturity === 'mature'`

---

### 2. DeckCard

A card's membership in a specific deck, carrying that deck's independent spaced repetition state.

**Firestore path**: `users/{uid}/flashcardDecks/{deckId}/deckCards/{cardId}`

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| `cardId` | `string` | yes | non-empty | References `flashcards/{cardId}` or deterministic built-in ID |
| `interval` | `number` | yes | integer ≥ 0 | Days until next review (SM-2 I); 0 = new/reset |
| `easeFactor` | `number` | yes | ≥ 1.3 | SM-2 EF; starts at 2.5 |
| `repetitions` | `number` | yes | integer ≥ 0 | Successful consecutive reviews |
| `dueDate` | `Timestamp` | yes | — | Next scheduled review; set to `now()` for new cards |
| `maturity` | `'new' \| 'learning' \| 'mature'` | yes | enum | Derived from repetitions but stored for query efficiency |
| `addedAt` | `Timestamp` | auto | — | When card was added to deck |
| `lastReviewedAt` | `Timestamp \| undefined` | no | — | Set after each review |

**TypeScript interface**:
```typescript
interface DeckCard {
  cardId: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  dueDate: number;           // Unix ms
  maturity: 'new' | 'learning' | 'mature';
  addedAt: number;           // Unix ms
  lastReviewedAt?: number;   // Unix ms
}
```

**Maturity derivation rule**:
- `repetitions === 0` → `'new'`
- `repetitions > 0 && repetitions < 3` → `'learning'`
- `repetitions >= 3` → `'mature'`

**Constraints**:
- A card can belong to multiple decks; each deck has an independent `DeckCard` entry
- Deleting a card from a deck removes the `DeckCard` doc but does NOT delete the underlying `flashcards/{cardId}` doc
- Deleting a deck removes all `deckCards` subcollection docs

---

### 3. ReviewSession

A single completed review sitting. Persisted for streak calculation; not used for card scheduling.

**Firestore path**: `users/{uid}/reviewSessions/{sessionId}`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | auto | Firestore doc ID |
| `deckId` | `string` | yes | References `flashcardDecks/{deckId}` |
| `startTime` | `Timestamp` | yes | Session start |
| `completedTime` | `Timestamp` | yes | Session end |
| `cardsReviewed` | `number` | yes | Total unique cards rated (not re-queue count) |
| `ratings` | `object` | yes | `{ again, hard, good, easy }` counts |

**TypeScript interface**:
```typescript
interface ReviewSession {
  id: string;
  deckId: string;
  startTime: number;       // Unix ms
  completedTime: number;   // Unix ms
  cardsReviewed: number;
  ratings: {
    again: number;
    hard: number;
    good: number;
    easy: number;
  };
}
```

---

### 4. DailyStreak

Per-user review habit tracking. Single Firestore document.

**Firestore path**: `users/{uid}/dailyStreak` (document, not collection)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `currentStreak` | `number` | yes | Consecutive days with ≥1 review |
| `longestStreak` | `number` | yes | Historical maximum |
| `lastReviewDate` | `string` | yes | `'YYYY-MM-DD'` local date |

**TypeScript interface**:
```typescript
interface DailyStreak {
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string;   // 'YYYY-MM-DD'
}
```

**Streak update rules**:
- If `lastReviewDate === yesterday`: `currentStreak += 1`
- If `lastReviewDate === today`: no change (already counted)
- Otherwise (gap > 1 day): `currentStreak = 1`
- Always: `longestStreak = max(longestStreak, currentStreak)`

---

### 5. In-Memory: ReviewSessionState (not persisted mid-session)

Session state held in React component state during an active review. Not written to Firestore until session completes.

```typescript
interface ReviewSessionState {
  deckId: string;
  queue: string[];           // cardIds in review order (mutable)
  reviewed: Map<string, Rating>;  // cardId → last rating
  requeued: Set<string>;     // cardIds that were rated 'again' and re-added
  startTime: number;         // Unix ms
  isComplete: boolean;
}

type Rating = 'again' | 'hard' | 'good' | 'easy';
```

**Session completion rule**:
- Session is complete when `queue` is empty AND every card in `requeued` has been rated with 'hard', 'good', or 'easy' at least once after being re-queued

---

## SM-2 Algorithm (Pure Function Module)

**File**: `packages/flashcards/src/lib/sm2.ts`

```typescript
// Quality mapping
const QUALITY: Record<Rating, number> = {
  again: 0,
  hard:  2,
  good:  4,
  easy:  5,
};

interface SM2Input {
  interval: number;
  easeFactor: number;
  repetitions: number;
  rating: Rating;
}

interface SM2Output {
  interval: number;      // days
  easeFactor: number;
  repetitions: number;
  maturity: 'new' | 'learning' | 'mature';
}

function applyRating(input: SM2Input): SM2Output {
  const q = QUALITY[input.rating];
  const newEF = Math.max(
    1.3,
    input.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  if (q < 3) {
    // Failed review — reset
    return {
      interval: 1,
      easeFactor: newEF,
      repetitions: 0,
      maturity: 'new',
    };
  }

  const newReps = input.repetitions + 1;
  let newInterval: number;
  if (newReps === 1) newInterval = 1;
  else if (newReps === 2) newInterval = 6;
  else newInterval = Math.round(input.interval * newEF);

  return {
    interval: newInterval,
    easeFactor: newEF,
    repetitions: newReps,
    maturity: newReps >= 3 ? 'mature' : 'learning',
  };
}

function nextDueDate(intervalDays: number): number {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  d.setHours(0, 0, 0, 0);    // Start of local day
  return d.getTime();
}
```

---

## Relationships Summary

```
User (uid)
  └── flashcardDecks/{deckId}         [Deck]
        └── deckCards/{cardId}        [DeckCard]  → references flashcards/{cardId}
  └── reviewSessions/{sessionId}      [ReviewSession] → references flashcardDecks/{deckId}
  └── dailyStreak                     [DailyStreak document]
  └── flashcards/{cardId}             [FlashCard — EXISTING, unmodified]
```

**Cross-entity rules**:
- Deleting a `FlashCard` does NOT auto-remove `DeckCard` entries (the card content becomes unresolvable; decks show the card as "deleted card" or silently skip it)
- Deleting a `Deck` MUST delete all `deckCards` subcollection documents (Firestore batch delete)
- A card can appear in multiple `Deck`s; each has an independent `DeckCard` row with separate SR state

---

## localStorage Keys (Unauthenticated / Offline Cache)

| Key (StorageKeys) | Purpose |
|-------------------|---------|
| `FLASHCARD_DECKS` | Serialized `Deck[]` for unauthenticated users |
| `FLASHCARD_DECK_CARDS` | Serialized `{ [deckId]: DeckCard[] }` for unauthenticated users |
| `FLASHCARD_STREAK` | Serialized `DailyStreak` |

> These keys need to be added to `packages/shared/src/storageKeys.ts`.
