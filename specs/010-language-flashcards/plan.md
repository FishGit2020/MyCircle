# Implementation Plan: Language Flashcard Decks with Spaced Repetition

**Branch**: `010-language-flashcards` | **Date**: 2026-03-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-language-flashcards/spec.md`

## Summary

Extend the existing `packages/flashcards` MFE with named decks and SM-2 spaced repetition scheduling. Cards can be organized into decks (new or from the existing card library), and each deck tracks its own independent review schedule per card. A new `window.__flashcardDecks` bridge API in the shell exposes Firestore operations following the same direct-Firestore pattern as the existing `window.__flashcards` API. A pure `sm2.ts` module handles scheduling calculations. Three new UI views are added to the existing flashcards route: deck list, deck detail/card management, and review session.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Tailwind CSS, `@mycircle/shared` (i18n, StorageKeys, PageContent), Firebase Firestore SDK (shell-only, via `window.__flashcardDecks` bridge)
**Storage**: Firestore `users/{uid}/flashcardDecks`, `users/{uid}/flashcardDecks/{id}/deckCards`, `users/{uid}/reviewSessions`, `users/{uid}/dailyStreak`; localStorage fallback for unauthenticated users
**Testing**: Vitest + React Testing Library (existing setup in `packages/flashcards`)
**Target Platform**: Web (Vite Module Federation MFE within MyCircle shell)
**Project Type**: MFE extension (adds features to existing `packages/flashcards` package — NOT a new MFE)
**Performance Goals**: Due-today counts visible within 3s for 10 decks / 500 total cards (SC-006)
**Constraints**: Offline-capable (Firebase SDK offline persistence); card-type agnostic (all 4 existing types work); no modification to existing Practice All or Quiz modes
**Scale/Scope**: Up to 500 cards per deck; up to 10 decks per user (per spec assumptions)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Federated Isolation | ✅ PASS | Extending existing `packages/flashcards`; no cross-MFE imports |
| II. Complete Integration | ✅ PASS | Not a new MFE — no new shell route, widget, nav, or 20-point checklist required; `validate_all` already passes for flashcards |
| III. GraphQL-First Data Layer | ⚠️ VIOLATION | See Complexity Tracking table below |
| IV. Inclusive by Default | ✅ PASS | All strings use `t('key')`; all 3 locales updated; dark mode variants required; touch targets ≥44px |
| V. Fast Tests, Safe Code | ✅ PASS | SM-2 is a pure function; hooks mock `window.__flashcardDecks`; no real Firestore in tests |
| VI. Simplicity | ✅ PASS | No new MFE, no new package, no new backend endpoint; extends existing patterns |

## Project Structure

### Documentation (this feature)

```text
specs/010-language-flashcards/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   ├── window-api.md    # window.__flashcardDecks interface contract
│   └── sm2.md           # SM-2 algorithm contract + test cases
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
packages/flashcards/src/
├── lib/
│   └── sm2.ts                        # NEW: Pure SM-2 algorithm module
├── hooks/
│   ├── useFlashCards.ts              # EXISTING (no changes needed)
│   ├── useDecks.ts                   # NEW: Deck CRUD + real-time subscription
│   └── useReviewSession.ts           # NEW: Session state machine (queue, requeue, complete)
├── components/
│   ├── FlashCards.tsx                # MODIFY: Add "Decks" tab/mode toggle
│   ├── DeckList.tsx                  # NEW: Home screen with deck cards + due-today count
│   ├── DeckCard.tsx                  # NEW: Single deck summary widget
│   ├── DeckDetail.tsx                # NEW: Deck detail view — card management
│   ├── ReviewSession.tsx             # NEW: Flip card + rating buttons
│   ├── SessionSummary.tsx            # NEW: Post-session summary
│   ├── AddDeckModal.tsx              # NEW: Create / rename deck form
│   └── DeckCardManager.tsx          # NEW: Search + add/remove cards from deck
├── types.ts                          # MODIFY: Add Deck, DeckCard, ReviewSession, DailyStreak types

packages/shell/src/
└── lib/firebase.ts                   # MODIFY: Add window.__flashcardDecks bridge API

packages/shared/src/
├── storageKeys.ts                    # MODIFY: Add FLASHCARD_DECKS, FLASHCARD_DECK_CARDS, FLASHCARD_STREAK keys
└── i18n/locales/
    ├── en.ts                         # MODIFY: Add flashcards.deck.* keys
    ├── es.ts                         # MODIFY: Add corresponding Spanish keys
    └── zh.ts                         # MODIFY: Add corresponding Chinese keys (Unicode escapes)

scripts/
└── seed-flashcard-decks.mjs         # NEW: Dev seed script for overdue deck cards

firestore.rules                       # MODIFY: Add rules for flashcardDecks, reviewSessions, dailyStreak subcollections
```

**Structure Decision**: Single-package extension of `packages/flashcards`. No new package or backend Cloud Function. All Firestore operations are client-side via the existing shell bridge pattern (see Complexity Tracking for GraphQL-First justification).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| GraphQL-First (Principle III) — Using direct Firestore via `window.__flashcardDecks` bridge | The existing `packages/flashcards` MFE was built entirely on the shell window bridge pattern (no GraphQL). Introducing GraphQL for only the deck/SR data would create a mixed architecture within the same package (some hooks use Apollo, others use window APIs), increasing cognitive overhead and testing complexity. The window bridge pattern already handles auth gating, real-time subscriptions, and offline persistence. | Introducing GraphQL for this feature would require: (1) adding flashcard types and resolvers to `functions/src/schema.ts`, (2) running `pnpm codegen`, (3) writing Apollo queries for the new types, (4) creating `createFlashcardDecksQueryResolvers()` and `createFlashcardDecksMutationResolvers()` factory functions. This is a significant parallel effort and would leave the existing `useFlashCards.ts` still using window APIs — making the package architecturally inconsistent. A full flashcards → GraphQL migration is the correct long-term fix but is out of scope for this feature. |
