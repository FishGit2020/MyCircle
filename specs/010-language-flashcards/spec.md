# Feature Specification: Language Flashcard Decks with Spaced Repetition

**Feature Branch**: `010-language-flashcards`
**Created**: 2026-03-23
**Status**: Draft
**Input**: User description: "Language learning flashcard decks with spaced repetition, build on top of current MFE"

## Overview

Extend the existing Flashcards feature with the ability to organize cards into named language learning **decks** and review them using a **spaced repetition** schedule. The system automatically determines which cards are due for review each day based on the learner's past performance, surfacing cards just before they are likely to be forgotten — maximizing retention with minimal study time.

This is built on top of the existing flashcards MFE, which already supports Chinese characters, English phrases, Bible verse cards, and custom cards. The new feature adds deck organization and intelligent scheduling without replacing the existing practice mode.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Review Due Cards with Spaced Repetition (Priority: P1)

A language learner opens the Flashcards app and sees how many cards across their decks are due for review today. They start a review session: each card is shown one side at a time, they recall the answer, flip the card, then self-rate how well they remembered it (Again / Hard / Good / Easy). The system schedules the next review based on their rating — an "Easy" card might not appear for two weeks, while an "Again" card returns within minutes. The session ends when all due cards have been reviewed.

**Why this priority**: This is the core value proposition. Without spaced repetition review, the feature has no differentiation from the existing practice mode. All other stories depend on having cards in decks first, but reviewing is the daily action that drives retention.

**Independent Test**: Can be tested by pre-seeding a deck with cards that have past due dates, starting a review session, rating each card, and verifying the next scheduled review date changes appropriately for each rating.

**Acceptance Scenarios**:

1. **Given** a deck with 5 cards due for review today, **When** the user opens the deck and starts review, **Then** all 5 cards are presented one by one in a session.
2. **Given** a card is shown front-side up, **When** the user taps "Flip", **Then** the answer side is revealed and four rating buttons appear (Again, Hard, Good, Easy).
3. **Given** the user rates a card "Easy", **When** the session updates, **Then** the card's next review is scheduled more than 7 days in the future.
4. **Given** the user rates a card "Again", **When** the session updates, **Then** the card is re-queued to appear again within the same session (within 10 minutes).
5. **Given** a review session is in progress, **When** the last card is rated, **Then** a session summary is shown with cards reviewed, average rating, and next scheduled review date for the deck.
6. **Given** no cards are due today, **When** the user views a deck, **Then** a message shows the next scheduled review date and the review session cannot be started.

---

### User Story 2 — Create and Manage Language Decks (Priority: P2)

A user creates a named deck for a specific language learning goal (e.g., "Spanish — Travel Vocabulary"). They add existing flashcards from the card library to the deck, or create new cards directly inside the deck. They can rename or delete decks, and remove cards from a deck without deleting the underlying card.

**Why this priority**: Decks are the container for spaced repetition. Without deck creation, there is nothing to review. However, a single pre-seeded deck could theoretically test P1, so deck management is P2.

**Independent Test**: Can be tested by creating a deck, adding cards, renaming the deck, and verifying card counts update correctly.

**Acceptance Scenarios**:

1. **Given** the user is on the Flashcards home screen, **When** they tap "New Deck", **Then** a form appears to enter a deck name and optional language pair label (e.g., English → Spanish).
2. **Given** a deck exists, **When** the user opens it and taps "Add Cards", **Then** they can search the card library and select cards to add to the deck.
3. **Given** a deck exists, **When** the user taps "New Card" inside the deck, **Then** a card is created and automatically added to that deck.
4. **Given** a deck has cards, **When** the user removes a card from the deck, **Then** the card is removed from the deck but still exists in the card library.
5. **Given** a deck exists, **When** the user renames it, **Then** the new name is saved and reflected everywhere the deck name appears.
6. **Given** a deck exists, **When** the user deletes it, **Then** a confirmation is required; on confirm the deck and its spaced repetition data are removed while cards remain in the library.

---

### User Story 3 — Track Learning Progress Across Decks (Priority: P3)

A user can see at a glance how their learning is progressing: how many cards in each deck are New (never reviewed), Learning (reviewed fewer than 3 times), or Mature (consistently recalled correctly). They can also see a total count of cards due today across all decks, and a streak of consecutive days with at least one review completed.

**Why this priority**: Progress visibility motivates continued use but does not block learning. It can be added after the core review and deck creation flows are working.

**Independent Test**: Can be tested by reviewing cards over several sessions and verifying the maturity counts transition correctly (New → Learning → Mature).

**Acceptance Scenarios**:

1. **Given** a user has multiple decks, **When** they view the Flashcards home, **Then** each deck card shows its name, total card count, and how many cards are due today.
2. **Given** a deck, **When** the user opens its detail view, **Then** they see a breakdown: New / Learning / Mature card counts and a progress bar.
3. **Given** a user reviews at least one card on consecutive days, **When** they view the Flashcards home, **Then** a daily review streak count is shown.
4. **Given** a user has not reviewed any cards today, **When** they view the home screen, **Then** the total due count across all decks is prominently displayed as a call-to-action.

---

### Edge Cases

- What happens when a user adds the same card to multiple decks? Each deck tracks its own independent spaced repetition schedule for that card.
- What happens when a card is edited after it has been reviewed? The spaced repetition schedule for that card is preserved; only the content changes.
- What happens if the user skips a day (or many days)? All overdue cards become due immediately; the system does not penalize the user by artificially increasing intervals.
- What happens when a deck has 0 cards? The deck exists but review cannot be started; a prompt suggests adding cards.
- What happens when network is unavailable during a review session? The session continues locally; results sync when connectivity is restored.
- What happens when all cards in a deck are mature and none are due? The deck shows "All caught up!" with the next upcoming review date.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to create named decks with an optional free-text language pair label (e.g., "English → French").
- **FR-002**: Users MUST be able to add existing flashcards from the card library to any deck.
- **FR-003**: Users MUST be able to create new flashcards directly within a deck, with the card automatically added to that deck.
- **FR-004**: Users MUST be able to remove a card from a deck without deleting the card from the library.
- **FR-005**: Users MUST be able to rename and delete decks (delete requires explicit confirmation).
- **FR-006**: System MUST calculate and persist a next-review date for each card within each deck, updated after every review rating.
- **FR-007**: System MUST present only cards whose next-review date is today or in the past when a review session is started.
- **FR-008**: Each card in a review session MUST be shown front-side first; the back side is only revealed when the user explicitly flips the card.
- **FR-009**: Rating options MUST include exactly four levels: Again (requeue soon), Hard (short interval), Good (standard interval), Easy (extended interval).
- **FR-010**: Cards rated "Again" MUST reappear within the same review session before the session can be marked complete.
- **FR-011**: System MUST display a session summary when all due cards (including re-queued ones) have been rated, showing total cards reviewed and next review date.
- **FR-012**: System MUST classify each card's maturity as New (never reviewed), Learning (fewer than 3 successful reviews), or Mature (3 or more consecutive successful reviews).
- **FR-013**: Users MUST be able to see per-deck counts of New, Learning, and Mature cards.
- **FR-014**: System MUST display a total count of cards due today across all decks on the Flashcards home screen.
- **FR-015**: Review schedule data MUST sync across devices for authenticated users.
- **FR-016**: Review sessions MUST function without network connectivity, with data syncing when connectivity resumes.
- **FR-017**: A single card MAY belong to more than one deck; each deck maintains an independent spaced repetition schedule for that card.
- **FR-018**: System MUST track and display a daily review streak (consecutive days with at least one review completed).

### Key Entities

- **Deck**: Named collection of cards for a learning goal. Attributes: name, language pair label (optional, free-text), card count, due-today count, created date.
- **DeckCard**: A card's membership in a specific deck, carrying that deck's spaced repetition state. Attributes: card reference, interval (days until next review), ease factor (how easily the card is recalled), repetition count, due date, maturity state (New / Learning / Mature).
- **ReviewSession**: A single sitting of reviewing due cards in a deck. Attributes: deck reference, start time, cards reviewed count, ratings given, completion time.
- **DailyStreak**: Per-user review habit tracking. Attributes: current streak (days), longest streak (days), last review date.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can start a review session for a deck with due cards within 2 taps from the Flashcards home screen.
- **SC-002**: A review session with 20 cards can be completed in under 10 minutes at a comfortable pace.
- **SC-003**: Card maturity state transitions correctly from New → Learning → Mature after the expected number of successful reviews with no regressions.
- **SC-004**: Cards rated "Again" reappear before session end in 100% of cases.
- **SC-005**: Review schedule data persists correctly across app restarts and device switches for authenticated users.
- **SC-006**: The home screen accurately reflects due-today counts within 3 seconds of loading for users with up to 10 decks and 500 total cards.
- **SC-007**: Any existing flashcard type (Chinese, English, Bible verse, custom) can be added to a deck and reviewed without modification.

## Assumptions

- The spaced repetition algorithm follows the SM-2 approach (or equivalent): intervals grow on successful recall based on ease ratings; "Again" resets the interval. Exact algorithm parameters are a planning concern.
- Authenticated users have review data stored in the cloud. Unauthenticated users can create decks and review, but data is local-only and does not sync.
- All existing flashcard types (Chinese characters, English phrases, Bible verses, custom cards) are compatible with decks — the deck feature is card-type agnostic.
- The existing "Practice All" and Quiz modes remain available and unmodified.
- Deck names are free-text; no language validation or auto-detection is performed.
- A "day" for streak and due-date purposes is the user's local calendar day.
- Performance targets assume up to 500 cards per deck; larger decks may have degraded performance.

## Out of Scope

- Audio pronunciation playback during review sessions.
- AI-generated card content or automatic deck population.
- Sharing decks with other users or public deck libraries.
- Leaderboards or gamification beyond the daily streak.
- Import from Anki, Quizlet, or other external flashcard services.
- Modification of the existing Practice All or Quiz modes.
