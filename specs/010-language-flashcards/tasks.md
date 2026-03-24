# Tasks: Language Flashcard Decks with Spaced Repetition

**Input**: Design documents from `/specs/010-language-flashcards/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓, quickstart.md ✓

**Tests**: SM-2 and session hook tests are included in US1 (high value; pure functions and deterministic state machine make these low-cost to write and fast to run).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Types, pure functions, and shared constants that every phase depends on.

- [X] T001 [P] Add `Deck`, `DeckCard`, `ReviewSession`, `DailyStreak`, and `Rating` TypeScript interfaces to `packages/flashcards/src/types.ts`
- [X] T00X [P] Create SM-2 algorithm pure function module at `packages/flashcards/src/lib/sm2.ts` (exports: `createInitialState`, `applyRating`, `getMaturity` per `specs/010-language-flashcards/contracts/sm2.md`)
- [X] T00X [P] Add `FLASHCARD_DECKS`, `FLASHCARD_DECK_CARDS`, and `FLASHCARD_STREAK` keys to `packages/shared/src/storageKeys.ts`
- [X] T00X Add all `flashcards.deck.*` i18n keys to `packages/shared/src/i18n/locales/en.ts`, `es.ts`, and `zh.ts` (keys: `deck.title`, `deck.newDeck`, `deck.deckName`, `deck.languagePair`, `deck.languagePairPlaceholder`, `deck.create`, `deck.rename`, `deck.delete`, `deck.deleteConfirm`, `deck.addCards`, `deck.newCard`, `deck.removeCard`, `deck.review`, `deck.dueToday`, `deck.noDue`, `deck.nextReview`, `deck.allCaughtUp`, `deck.startReview`, `deck.flip`, `deck.again`, `deck.hard`, `deck.good`, `deck.easy`, `deck.sessionSummary`, `deck.cardsReviewed`, `deck.streak`, `deck.streakDays`, `deck.new`, `deck.learning`, `deck.mature`, `deck.noCards`, `deck.addFirstCard`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shell bridge API, Firestore rules, core data hook, and tab navigation. MUST complete before any user story work begins.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T00X Add `window.__flashcardDecks` bridge implementation to `packages/shell/src/lib/firebase.ts` — implement all methods from `specs/010-language-flashcards/contracts/window-api.md` using Firestore SDK: `getAll`, `subscribe`, `create`, `update`, `delete`, `getDeckCards`, `subscribeDeckCards`, `addCard`, `removeCard`, `updateCardSR`, `saveSession`, `getStreak`, `updateStreak`; add `FlashcardDecksAPI` type to `packages/shell/src/types/globals.d.ts` (or the existing window augmentation file)
- [X] T00X Add Firestore security rules for `users/{uid}/flashcardDecks`, `users/{uid}/flashcardDecks/{id}/deckCards`, `users/{uid}/reviewSessions`, and `users/{uid}/dailyStreak` to `firestore.rules` — authenticated user can read/write only their own subcollections
- [X] T00X Create `useDecks` hook at `packages/flashcards/src/hooks/useDecks.ts` — subscribes to `window.__flashcardDecks.subscribe()` for real-time deck list; exposes `decks`, `loading`, `createDeck`, `updateDeck`, `deleteDeck`; localStorage fallback for unauthenticated users using `StorageKeys.FLASHCARD_DECKS`
- [X] T00X Add "Decks" tab/mode toggle to `packages/flashcards/src/components/FlashCards.tsx` — add a tab bar with "Practice" (existing) and "Decks" (new); use URL state `?mode=decks` for deck list, `?mode=review&deck=<id>` for review session; default to existing practice mode when no `?mode` param present

**Checkpoint**: Foundation ready — shell bridge is live, rules deployed, `useDecks` hook returns data, tab toggle switches views.

---

## Phase 3: User Story 1 — Review Due Cards with Spaced Repetition (Priority: P1) 🎯 MVP

**Goal**: A user can open a deck, see how many cards are due, start a review session, flip cards, rate each card (Again / Hard / Good / Easy), receive in-session requeue for "Again" cards, and see a summary when done. SR state is persisted to Firestore.

**Independent Test**: Pre-seed a deck with 3 cards whose `dueDate` is in the past using `window.__flashcardDecks.updateCardSR(...)` in the browser console. Navigate to `?mode=decks`, click Review, rate cards including at least one "Again", verify it reappears before session ends, verify session summary shows correct count and next review date. Check Firestore emulator to confirm `interval`, `easeFactor`, `repetitions`, and `dueDate` updated correctly for each card.

### Implementation for User Story 1

- [X] T00X [US1] Create `useReviewSession` hook at `packages/flashcards/src/hooks/useReviewSession.ts` — accepts `deckId`; fetches due `DeckCard[]` from `window.__flashcardDecks.getDeckCards()` filtered by `dueDate <= now()`; manages in-memory session queue (`string[]`), `reviewed` map (`Map<string, Rating>`), and `requeued` set; exposes `currentCard`, `totalDue`, `rateCard(cardId, rating)` (applies SM-2 via `applyRating`, requeues on "again"), `isComplete`, `sessionStats`; on complete calls `updateCardSR` batch + `saveSession` + `updateStreak`
- [X] T0XX [P] [US1] Create `DeckCard` component at `packages/flashcards/src/components/DeckCard.tsx` — displays deck name, language pair, card count, due-today count (from `deckCards.filter(c => c.dueDate <= now()).length`), and a "Review" button (disabled when `dueTodayCount === 0`); "New Deck" and "All caught up" states; dark mode + touch target ≥44px; `aria-label` on all buttons
- [X] T0XX [P] [US1] Create `DeckList` component at `packages/flashcards/src/components/DeckList.tsx` — renders a grid of `<DeckCard>` components; shows "No decks yet" empty state; "New Deck" button; reads decks from `useDecks()`; navigates to `?mode=review&deck=<id>` on Review click; uses `<PageContent>` wrapper
- [X] T0XX [US1] Create `ReviewSession` component at `packages/flashcards/src/components/ReviewSession.tsx` — full-screen review UI; reads `currentCard` from `useReviewSession`; shows card front only initially; "Flip" button reveals back and rating buttons (Again, Hard, Good, Easy); progress indicator (e.g. "3 / 5 cards"); dark mode + touch targets; navigates to `SessionSummary` when `isComplete`
- [X] T0XX [US1] Create `SessionSummary` component at `packages/flashcards/src/components/SessionSummary.tsx` — shows total cards reviewed, rating breakdown (again/hard/good/easy counts), and next earliest review date across the reviewed cards; "Done" button navigates back to `?mode=decks`
- [X] T0XX [US1] Wire US1 components into `FlashCards.tsx` — render `<DeckList>` when `?mode=decks`, `<ReviewSession deckId={...}>` when `?mode=review&deck=<id>`, `<SessionSummary>` when review complete; pass callbacks for navigation between states
- [X] T0XX [P] [US1] Write unit tests for `sm2.ts` in `packages/flashcards/src/lib/sm2.test.ts` — cover all 7 test cases from `specs/010-language-flashcards/contracts/sm2.md`: new card initial state, "again" resets EF+reps, "hard" resets reps with EF penalty, "good" advances intervals (reps 1→2→3+), "easy" extends interval with EF boost, EF clamped at 1.3, `getMaturity` transitions
- [X] T0XX [P] [US1] Write unit tests for `useReviewSession` in `packages/flashcards/src/hooks/useReviewSession.test.ts` — mock `window.__flashcardDecks`; test: queue initializes with only due cards, `rateCard('again')` requeues card after others, session `isComplete` only after requeued cards rated non-again, `updateCardSR` called for each card on complete with correct SM-2 state, `saveSession` called once with correct rating counts

**Checkpoint**: P1 MVP complete. A user can review cards and SR state persists.

---

## Phase 4: User Story 2 — Create and Manage Language Decks (Priority: P2)

**Goal**: A user can create named decks, add existing cards or create new ones directly inside a deck, rename or delete decks, and remove cards from a deck without deleting the underlying card.

**Independent Test**: Create a deck named "Test Deck", add 2 existing cards, create 1 new card inside the deck (verify it auto-adds), rename the deck to "Renamed Deck", remove one card (verify it still appears in card library), delete the deck with confirmation (verify deck gone, cards still in library, Firestore `deckCards` subcollection removed).

### Implementation for User Story 2

- [X] T0XX [P] [US2] Create `AddDeckModal` component at `packages/flashcards/src/components/AddDeckModal.tsx` — modal form with "Deck Name" (required, max 100 chars) and "Language Pair" (optional, max 50 chars, placeholder "e.g. English → Spanish") fields; Create / Save button calls `createDeck` or `updateDeck`; Cancel closes modal; i18n + dark mode + `type="button"` on non-submit buttons
- [X] T0XX [P] [US2] Create `DeckCardManager` component at `packages/flashcards/src/components/DeckCardManager.tsx` — modal or inline panel; shows search input to filter existing cards from `useFlashCards()`; checkbox list of results; "Add Selected" button calls `window.__flashcardDecks.addCard()` for each selected card; "Add All" option; shows which cards are already in the deck (greyed out); i18n + dark mode
- [X] T0XX [US2] Create `DeckDetail` component at `packages/flashcards/src/components/DeckDetail.tsx` — displays deck name, language pair, card list (fetched via `window.__flashcardDecks.subscribeDeckCards()`); "Add Cards" button opens `DeckCardManager`; "New Card" button opens `AddCardModal` (existing) and then calls `addCard` after creation; per-card delete button calls `removeCard`; "Rename" button opens `AddDeckModal` in edit mode; "Delete Deck" button with confirmation dialog calls `deleteDeck`
- [X] T0XX [US2] Wire US2 into `FlashCards.tsx` and `DeckList.tsx` — "New Deck" button in `DeckList` opens `AddDeckModal`; clicking deck name/body in `DeckCard` navigates to `?mode=deck-detail&deck=<id>`; render `<DeckDetail>` when `?mode=deck-detail&deck=<id>`
- [X] T0XX [US2] Write unit tests for `useDecks` hook in `packages/flashcards/src/hooks/useDecks.test.ts` — mock `window.__flashcardDecks`; test: `decks` updates when subscribe callback fires, `createDeck` calls `window.__flashcardDecks.create()` with correct args, `updateDeck` calls `update()`, `deleteDeck` calls `delete()`, localStorage fallback used when `window.__flashcardDecks` is undefined

**Checkpoint**: P2 complete. Full deck lifecycle works — create, view, add cards, rename, delete.

---

## Phase 5: User Story 3 — Track Learning Progress Across Decks (Priority: P3)

**Goal**: Users see per-deck New/Learning/Mature card counts, a daily review streak on the home screen, and a total due-today aggregate as a call-to-action.

**Independent Test**: Seed a deck with 5 cards (2 never reviewed, 2 with repetitions=1, 1 with repetitions=3+). Open deck detail — verify New=2, Learning=2, Mature=1 and a progress bar. Complete a review session — verify streak increments to 1. Return home — verify total due-today count and streak counter visible.

### Implementation for User Story 3

- [X] T0XX [P] [US3] Extend `useDecks` hook in `packages/flashcards/src/hooks/useDecks.ts` — add `streak: DailyStreak | null` state initialized from `window.__flashcardDecks.getStreak()`; expose `streak` from hook return value
- [X] T0XX [P] [US3] Extend `useReviewSession` hook in `packages/flashcards/src/hooks/useReviewSession.ts` — call `window.__flashcardDecks.updateStreak(localDateString)` on session complete (after `saveSession`); derive `localDateString` from `new Date().toLocaleDateString('en-CA')` (ISO 'YYYY-MM-DD' format)
- [X] T0XX [P] [US3] Add New/Learning/Mature breakdown to `DeckDetail` component in `packages/flashcards/src/components/DeckDetail.tsx` — compute counts from `deckCards` array using `getMaturity(card.repetitions)`; render a segmented progress bar (New=grey, Learning=yellow, Mature=green); show numeric counts below bar; dark mode variants for all colors
- [X] T0XX [US3] Add streak counter and total-due-today aggregate to `DeckList` component in `packages/flashcards/src/components/DeckList.tsx` — read `streak` from `useDecks()`; show streak badge (e.g. "🔥 3 days") when `currentStreak > 0`; compute `totalDueToday` by summing `dueTodayCount` across all decks; render a prominent banner when `totalDueToday > 0` (e.g. "You have 12 cards to review today")

**Checkpoint**: All 3 user stories complete. Progress tracking visible and streak updates correctly.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, docs, and final checks.

- [X] T0XX [P] Create dev seed script at `scripts/seed-flashcard-decks.mjs` — accepts `--uid <uid>` and optional `--overdue` flag; creates a test deck and 5 `deckCard` docs with `dueDate` in the past using `firebase-admin`; matches pattern of `scripts/cleanup-baby-tracker-009.mjs`
- [X] T0XX [P] Run `pnpm build:shared` and fix any TypeScript errors caused by new `StorageKeys` additions
- [X] T0XX Run `pnpm lint && pnpm test:run && pnpm typecheck` from repo root — fix all failures
- [X] T0XX Run `validate_all` MCP tool and fix any integration gaps (i18n key mismatches, widget registry issues)
- [X] T0XX [P] Update `docs/architecture.md` to document `window.__flashcardDecks` bridge API and Firestore collections added by this feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — T001/T002/T003 can all run in parallel; T004 depends on none
- **Foundational (Phase 2)**: T005 depends on T001 (types); T007 depends on T005 (bridge); T008 depends on Phase 1 complete; T006 has no code dependencies
- **US1 (Phase 3)**: All depend on Phase 2 completion; T009 depends on T002 (SM-2); T010/T011/T012/T013 depend on T009; T015 depends on T002; T016 depends on T009
- **US2 (Phase 4)**: Depends on Phase 2; T019 depends on T017+T018; T020 depends on T019; T021 depends on T007
- **US3 (Phase 5)**: Depends on Phase 2; T022 depends on T007; T023 depends on T009; T024 depends on T019; T025 depends on T011+T022
- **Polish (Phase 6)**: Depends on all user story phases

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 complete; independent of US2/US3
- **US2 (P2)**: Starts after Phase 2 complete; independent of US1/US3 (though US1 review button is in `DeckCard` which US2 also uses — no conflicts, different tasks)
- **US3 (P3)**: Depends on T007 (streak from useDecks) and T009 (session completion triggers streak update); can start after Phase 2 + T009 complete

### Parallel Opportunities Within Each Story

- **US1**: T010 + T011 + T015 + T016 can all start in parallel after T009 is done
- **US2**: T017 + T018 can start in parallel immediately; T019 starts after both complete
- **US3**: T022 + T023 + T024 can all start in parallel

---

## Parallel Example: User Story 1

```bash
# Once T009 (useReviewSession) is done, launch these in parallel:
Task T010: Create DeckCard component at packages/flashcards/src/components/DeckCard.tsx
Task T011: Create DeckList component at packages/flashcards/src/components/DeckList.tsx
Task T015: Write sm2.test.ts at packages/flashcards/src/lib/sm2.test.ts
Task T016: Write useReviewSession.test.ts at packages/flashcards/src/hooks/useReviewSession.test.ts

# Then sequentially:
Task T012: Create ReviewSession component (uses DeckCard for card display)
Task T013: Create SessionSummary component
Task T014: Wire all into FlashCards.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T008) — **CRITICAL: blocks all stories**
3. Complete Phase 3: User Story 1 (T009–T016)
4. **STOP and VALIDATE**: Use quickstart.md Scenario 2 ("Review Due Cards") to verify independently
5. Demo: Users can review pre-existing cards with spaced repetition

### Incremental Delivery

1. Setup + Foundational → Bridge API live, tabs visible
2. Add US1 → Review sessions work, SR persists → **MVP demoed**
3. Add US2 → Full deck management UI
4. Add US3 → Progress tracking + streak
5. Polish → All checks pass

---

## Notes

- `[P]` tasks = different files, no conflicting changes — safe to run in parallel
- SM-2 tests (T015) are pure function tests — they run in microseconds and have no mocks
- The `window.__flashcardDecks` bridge (T005) is the most complex single task; allocate extra time
- `useDecks` (T007) and `useReviewSession` (T009) are the two central hooks — wire all UI through them
- Do NOT modify existing practice mode or quiz mode components
- Rebuild shared after any StorageKeys or i18n change: `pnpm build:shared`
- Commit after each task or logical group; never commit directly to main
