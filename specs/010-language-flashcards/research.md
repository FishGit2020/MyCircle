# Research: Language Flashcard Decks with Spaced Repetition

**Phase**: 0 — Research
**Date**: 2026-03-23
**Branch**: `010-language-flashcards`

---

## 1. Existing Flashcards MFE Architecture

### Decision
The flashcards MFE uses **direct Firestore via shell window bridge API** — NOT GraphQL. New deck/SR data will follow the same pattern.

### Rationale
- `packages/flashcards/src/hooks/useFlashCards.ts` calls `window.__flashcards.getAll()`, `.subscribe()`, `.add()`, `.update()`, `.delete()` — all wrapping `users/{uid}/flashcards/{cardId}` Firestore subcollection.
- Shell exposes `window.__flashcards` and `window.__chineseCharacters` from `packages/shell/src/lib/firebase.ts`.
- Migrating the entire flashcards MFE to GraphQL is outside scope and would require touching `functions/src/schema.ts`, `pnpm codegen`, resolvers, and all existing hooks simultaneously.
- The GraphQL-First principle violation is justified and documented in the plan's Complexity Tracking table.

### Alternatives Considered
- **GraphQL via Apollo**: Correct long-term approach but requires a separate refactor PR for existing flashcards. Out of scope here.
- **Hybrid (GraphQL for new, Firestore for old)**: Mixed architecture within a single MFE package would be harder to maintain than consistent window bridge.

---

## 2. SM-2 Spaced Repetition Algorithm

### Decision
Use **SM-2** with a 4-button quality mapping (Again=0, Hard=2, Good=4, Easy=5).

### Algorithm Parameters

**Ease Factor (EF)**:
- Starting value: `2.5`
- Minimum value: `1.3`
- Update formula: `EF' = max(1.3, EF + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))`
  - q=5 (Easy): EF increases by 0.1
  - q=4 (Good): EF unchanged (≈ +0.0)
  - q=2 (Hard): EF decreases by 0.14
  - q=0 (Again): EF decreases by 0.20

**Interval Schedule**:
- First successful review (rep=1): interval = 1 day
- Second successful review (rep=2): interval = 6 days
- Subsequent (rep≥3): interval = round(prev_interval × EF)

**"Again" handling**:
- Reset `repetitions` to 0
- Reset `interval` to 1
- Re-queue card within same session (not persisted until session end)
- EF is still reduced at session save

**Maturity states** (from FR-012):
- `new`: `repetitions === 0` (never reviewed)
- `learning`: `repetitions > 0 && repetitions < 3`
- `mature`: `repetitions >= 3` (3+ consecutive successful reviews)

**Within-session re-queue**:
- "Again" cards reappear after the currently queued cards (not immediately), with a minimum gap of 1 card
- Session ends only when all re-queued cards have been rated with Hard/Good/Easy at least once

### Quality Mapping (4 buttons → SM-2 quality 0–5)

| Button | SM-2 Quality | Meaning |
|--------|-------------|---------|
| Again  | 0           | Complete blackout / wrong |
| Hard   | 2           | Incorrect but recalled on seeing answer |
| Good   | 4           | Correct with some difficulty |
| Easy   | 5           | Perfect recall, no hesitation |

### Alternatives Considered
- **Anki-style modified SM-2**: Similar but adds "learning steps" for new cards (1 min, 10 min, 1 day). Rejected for simplicity — spec's 4-button model maps cleanly to classic SM-2.
- **FSRS algorithm**: More accurate but significantly more complex. Rejected per simplicity principle.
- **Leitner box system**: Simpler but less accurate scheduling. Rejected since spec explicitly calls for SM-2.

---

## 3. Firestore Data Structure for Decks and SR

### Decision
New Firestore subcollections under `users/{uid}/`:

```
users/{uid}/flashcardDecks/{deckId}           # Deck metadata
users/{uid}/flashcardDecks/{deckId}/deckCards/{cardId}  # Card membership + SR state
users/{uid}/reviewSessions/{sessionId}        # Session history (for streak)
users/{uid}/dailyStreak                       # Single document, streak state
```

### Rationale
- Mirrors existing `users/{uid}/flashcards/{cardId}` pattern
- `deckCards` as subcollection keeps deck doc size bounded (no array growth)
- `cardId` in `deckCards` references an existing `flashcards/{cardId}` — no data duplication for card content
- `dailyStreak` as a single document avoids collection overhead for simple state

### Firestore Document Schemas

**`flashcardDecks/{deckId}`**:
```typescript
{
  id: string;
  name: string;
  languagePair?: string;       // e.g. "English → Spanish", free-text
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**`flashcardDecks/{deckId}/deckCards/{cardId}`**:
```typescript
{
  cardId: string;              // References flashcards/{cardId} (or built-in card id)
  interval: number;            // Days until next review (SM-2 interval)
  easeFactor: number;          // SM-2 EF, starts at 2.5
  repetitions: number;         // Successful review count (resets on 'Again')
  dueDate: Timestamp;          // Next scheduled review date
  maturity: 'new' | 'learning' | 'mature';
  addedAt: Timestamp;
  lastReviewedAt?: Timestamp;
}
```

**`reviewSessions/{sessionId}`**:
```typescript
{
  deckId: string;
  startTime: Timestamp;
  completedTime: Timestamp;
  cardsReviewed: number;
  ratings: { again: number; hard: number; good: number; easy: number };
}
```

**`dailyStreak`** (document, not collection):
```typescript
{
  currentStreak: number;
  longestStreak: number;
  lastReviewDate: string;      // 'YYYY-MM-DD' local date string
}
```

### Alternatives Considered
- **Store SR state in parent card doc**: Would require updating `users/{uid}/flashcards/{cardId}` which conflates card content with deck-specific SR scheduling. Rejected — a card in two decks needs two independent schedules.
- **Embed deckCards as array in deck doc**: Firestore array size limits (1MB doc limit). Rejected for scalability.
- **Single `deckCards` flat collection with composite key**: More complex queries needed. Rejected.

---

## 4. Due-Today Count Performance

### Decision
Calculate `dueTodayCount` **at query time** by filtering `deckCards` where `dueDate <= now()`.

### Rationale
- Spec requires due count displayed on home screen within 3 seconds (SC-006) for up to 10 decks / 500 cards
- Firestore query with `where('dueDate', '<=', now())` on `deckCards` subcollection is efficient
- No need to denormalize count into deck document (adds write complexity)
- 500 total cards across 10 decks = 50 cards avg per deck — query is fast

### Alternatives Considered
- **Denormalized `dueTodayCount` field on deck doc**: Fast reads but requires transactional updates on every review. Rejected — race conditions possible.
- **Cloud Function triggers**: More accurate but adds latency. Rejected per simplicity principle.

---

## 5. Offline Support Strategy

### Decision
Use **localStorage cache** for session state during offline periods; sync to Firestore when connectivity restored.

### Rationale
- Matches existing flashcards offline pattern
- In-session ratings are held in React state (not persisted until session complete)
- On session completion, batch-write all SR updates; if offline, queue writes and retry on reconnect via Firestore's built-in offline persistence (enabled by default in Firebase SDK)
- Firebase SDK's offline persistence handles re-delivery automatically — no additional queue needed

### Alternatives Considered
- **Custom sync queue in localStorage**: More control but duplicates Firebase's built-in offline persistence. Rejected.
- **Service Worker**: Too complex for this scope. Rejected.

---

## 6. Window Bridge API Extension

### Decision
Add **`window.__flashcardDecks`** to the existing shell bridge, following the same pattern as `window.__flashcards`.

### Interface (TypeScript):
```typescript
interface FlashcardDecksAPI {
  // Decks
  getAll(): Promise<Deck[]>;
  subscribe(callback: (decks: Deck[]) => void): () => void;  // unsubscribe fn
  create(deck: Omit<Deck, 'id' | 'createdAt' | 'updatedAt'>): Promise<string>;
  update(id: string, updates: Partial<Pick<Deck, 'name' | 'languagePair'>>): Promise<void>;
  delete(id: string): Promise<void>;

  // Deck cards (SR membership)
  getDeckCards(deckId: string): Promise<DeckCard[]>;
  subscribeDeckCards(deckId: string, callback: (cards: DeckCard[]) => void): () => void;
  addCard(deckId: string, cardId: string): Promise<void>;
  removeCard(deckId: string, cardId: string): Promise<void>;
  updateCardSR(deckId: string, cardId: string, srUpdate: SRUpdate): Promise<void>;

  // Sessions
  saveSession(session: Omit<ReviewSession, 'id'>): Promise<void>;

  // Streak
  getStreak(): Promise<DailyStreak>;
  updateStreak(date: string): Promise<DailyStreak>;
}
```

---

## 7. Card Identity for Built-in Cards

### Decision
Built-in cards (Chinese characters, English phrases) use **deterministic IDs** formed from their content when added to a deck.

### Rationale
- Built-in cards (from `data/characters.ts`, `data/phrases.ts`) don't have Firestore doc IDs
- When added to a deck, they receive a deck-card entry keyed by a deterministic ID like `chinese-家-family` or `english-phrase-42`
- The `DeckCard.cardId` stores this deterministic ID; the deck hook resolves the card content from the in-memory data arrays

### Alternatives Considered
- **Write built-in cards to Firestore first**: Creates data redundancy. Rejected.
- **Store full card content in deckCard doc**: Duplicates data. Rejected.

---

## 8. Integration with Existing FlashCards Component

### Decision
Add a **tab/mode toggle** at the top of the existing `FlashCards.tsx` to switch between "Practice" (existing) and "Decks" (new). The deck feature is additive — no existing components are modified in their core logic.

### New Route / Navigation
- No new route needed: Decks are accessible from `/flashcards` via an in-page tab
- URL state: `?mode=decks` for deck list, `?mode=review&deck=<id>` for review session
- Existing `?mode=practice` behavior unchanged

### Alternatives Considered
- **Separate route `/flashcards/decks`**: Would require shell routing changes. Rejected — simpler to keep within existing route.
- **Replace existing UI with decks**: Spec explicitly says "does not replace existing Practice All or Quiz modes". Rejected.
