# Quickstart: Language Flashcard Decks with Spaced Repetition

**Phase**: 1 — Design
**Date**: 2026-03-23
**Branch**: `010-language-flashcards`

---

## Overview

This guide shows how to integrate and manually test the deck + spaced repetition feature in a local development environment.

---

## Prerequisites

1. Local dev environment running: `pnpm dev`
2. Firebase emulator running: `pnpm emulator`
3. User account signed in (sign-in via the app's auth flow)

---

## Scenario 1: Create a Deck and Add Cards

**Goal**: Verify deck creation and card management (User Story 2)

1. Navigate to `/flashcards`
2. Click the **"Decks"** tab (new tab alongside existing "Practice" / "Quiz")
3. Click **"New Deck"**
4. Enter name: `"Spanish Travel"`, language pair: `"English → Spanish"`
5. Click **Create**
6. Verify deck card appears with `0 cards`, `0 due today`
7. Open the deck → click **"Add Cards"**
8. Search for `"hello"` → select an English phrase card → click **Add**
9. Verify card appears in deck list with `maturity: New`
10. Click **"New Card"** inside the deck → create a custom card (`front: "gracias"`, `back: "thank you"`)
11. Verify new card is added to the deck automatically
12. Remove the "hello" card from the deck → verify it still appears in the main card library

**Expected**: Deck shows 1 card, all operations persist after page refresh.

---

## Scenario 2: Review Due Cards

**Goal**: Verify spaced repetition review loop (User Story 1 — core flow)

**Setup** (pre-seed via Firestore emulator or by seeding `dueDate` in the past):
```javascript
// In browser console after sign-in:
window.__flashcardDecks.updateCardSR('DECK_ID', 'CARD_ID', {
  interval: 1,
  easeFactor: 2.5,
  repetitions: 1,
  dueDate: Date.now() - 86400000, // 1 day ago
  maturity: 'learning',
  lastReviewedAt: Date.now() - 86400000,
});
```

1. Navigate to `/flashcards?mode=decks`
2. Verify deck shows `1 due today`
3. Click **"Review"** button on the deck card
4. Verify card is shown **front side only** (e.g. "gracias")
5. Click **"Flip"** → verify back side appears ("thank you") and 4 rating buttons appear
6. Click **"Easy"** → verify session continues (or ends with summary if no more cards)
7. **Session summary**: verify it shows `1 card reviewed` and a `Next review date`

---

## Scenario 3: "Again" Re-queuing

**Goal**: Verify FR-010 — "Again" cards reappear in the same session

1. Pre-seed 3 cards as due today in a deck
2. Start review session
3. Rate first card **"Again"**
4. Rate second card **"Good"**
5. Rate third card **"Good"**
6. Verify the first card reappears (re-queued after the other cards)
7. Rate it **"Hard"** → verify session ends (all requeued cards have now been rated with non-Again)
8. Session summary shows `3 cards reviewed` (not 4 — requeue doesn't inflate unique count)

---

## Scenario 4: No Cards Due

**Goal**: Verify FR-007 and spec scenario 6

1. Rate all cards in a deck as "Easy" (schedules them 7+ days out)
2. Navigate back to deck list
3. Open the deck → verify **"Review"** button is disabled or absent
4. Verify message: `"All caught up! Next review: [date]"`

---

## Scenario 5: Progress Tracking and Streak

**Goal**: Verify User Story 3

1. Complete a review session with at least 1 card rated (any rating except "Again")
2. Navigate to flashcards home (deck list)
3. Verify **streak counter** appears (e.g. "🔥 1 day streak")
4. Verify per-deck progress: **New / Learning / Mature** counts in deck detail view
5. Check home screen shows **total due today** across all decks as a prominent number

---

## Scenario 6: Offline Review

**Goal**: Verify FR-016

1. Open the deck review while online → start session
2. Turn off Wi-Fi / enable airplane mode in browser DevTools (Network → Offline)
3. Rate several cards
4. Complete the session → verify summary appears
5. Turn network back on
6. Verify SR updates synced to Firestore (check Firestore emulator or cloud console)

---

## Scenario 7: Card Shared Across Decks

**Goal**: Verify edge case — independent SR state per deck

1. Add the same card to two different decks: `"Deck A"` and `"Deck B"`
2. In `Deck A`, rate the card as **"Easy"** (schedules 7+ days out)
3. Verify `Deck B` still shows the card as **due today** (independent schedule)

---

## Key File Locations

| Purpose | File |
|---------|------|
| Window bridge API | `packages/shell/src/lib/firebase.ts` |
| SM-2 algorithm | `packages/flashcards/src/lib/sm2.ts` |
| Deck hooks | `packages/flashcards/src/hooks/useDecks.ts` |
| Review session hook | `packages/flashcards/src/hooks/useReviewSession.ts` |
| Deck list UI | `packages/flashcards/src/components/DeckList.tsx` |
| Review UI | `packages/flashcards/src/components/ReviewSession.tsx` |
| i18n keys | `packages/shared/src/i18n/locales/en.ts` (prefix: `flashcards.deck.*`) |

---

## Local Seed Script

To quickly seed a deck with cards overdue for review:

```bash
# After starting the emulator: pnpm emulator
node scripts/seed-flashcard-decks.mjs --uid <your-test-uid>
```

> This script is created as part of the implementation (T003 in tasks.md).
