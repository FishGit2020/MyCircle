# Contract: SM-2 Algorithm Module

**Phase**: 1 — Design
**Date**: 2026-03-23
**File**: `packages/flashcards/src/lib/sm2.ts`
**Type**: Pure function module (no side effects, fully unit-testable)

---

## Public API

```typescript
export type Rating = 'again' | 'hard' | 'good' | 'easy';
export type Maturity = 'new' | 'learning' | 'mature';

export interface SM2State {
  interval: number;      // Days until next review
  easeFactor: number;    // Ease multiplier (≥ 1.3)
  repetitions: number;   // Successful consecutive review count
  maturity: Maturity;
}

export interface SM2Result extends SM2State {
  dueDate: number;       // Unix ms — next review date (start of local day)
}

/**
 * Apply a review rating to the current SM-2 state.
 * Returns the new state with updated interval, easeFactor, repetitions, maturity, and dueDate.
 * Pure function — no side effects.
 */
export function applyRating(state: SM2State, rating: Rating): SM2Result;

/**
 * Create the initial SM-2 state for a new card added to a deck.
 * Due date is set to now (immediately reviewable).
 */
export function createInitialState(): SM2Result;

/**
 * Determine maturity from repetitions count.
 * Exported for use in derived computed properties.
 */
export function getMaturity(repetitions: number): Maturity;
```

---

## Behavioral Contracts

### `createInitialState()`
- Returns `{ interval: 0, easeFactor: 2.5, repetitions: 0, maturity: 'new', dueDate: Date.now() }`
- `dueDate` set to current time (card is immediately due when added)

### `applyRating(state, rating)` — quality mapping

| Rating | SM-2 Quality (q) | Passes threshold? |
|--------|-----------------|-------------------|
| `'again'` | 0 | No (q < 3 → reset) |
| `'hard'` | 2 | No (q < 3 → reset) |
| `'good'` | 4 | Yes |
| `'easy'` | 5 | Yes |

> **Note**: Both `'again'` and `'hard'` reset `repetitions` to 0. The distinction is that `'again'` triggers in-session re-queuing (handled by `useReviewSession` hook, not by this function). `'hard'` is persisted immediately with reset state.

### Interval schedule

| Condition | New interval |
|-----------|-------------|
| Failed (q < 3) | `1` day |
| `repetitions + 1 === 1` (first pass) | `1` day |
| `repetitions + 1 === 2` (second pass) | `6` days |
| `repetitions + 1 >= 3` (subsequent) | `round(prev_interval × newEF)` days |

### EF update formula
```
newEF = max(1.3, state.easeFactor + 0.1 - (5 - q) × (0.08 + (5 - q) × 0.02))
```

Simplified EF deltas per rating:
- `easy` (q=5): `+0.10`
- `good` (q=4): `≈ 0.00` (exactly: `-0.02 + 0.1 = +0.08 - 0.1 = -0.02`... let me recompute)
  - `0.1 - (5-4) * (0.08 + (5-4) * 0.02) = 0.1 - 1 * 0.10 = 0.00` ✓ no change
- `hard` (q=2): `0.1 - 3 * (0.08 + 3 * 0.02) = 0.1 - 3 * 0.14 = 0.1 - 0.42 = -0.32`... wait
  - Actually: `0.1 - (5-2) * (0.08 + (5-2) * 0.02) = 0.1 - 3 * (0.08 + 0.06) = 0.1 - 3 * 0.14 = 0.1 - 0.42 = -0.32` → EF -0.32
- `again` (q=0): `0.1 - 5 * (0.08 + 5 * 0.02) = 0.1 - 5 * 0.18 = 0.1 - 0.90 = -0.80` → clamped to 1.3 minimum

### `dueDate` calculation
```typescript
const d = new Date();
d.setDate(d.getDate() + intervalDays);
d.setHours(0, 0, 0, 0);  // Midnight local time
return d.getTime();
```
- Cards are due at the start of the local calendar day (midnight), not at a specific time
- A card with `interval = 1` from today becomes due tomorrow at 00:00 local time

### Maturity derivation
```typescript
function getMaturity(repetitions: number): Maturity {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  return 'mature';
}
```

---

## Test Cases

| Input state | Rating | Expected output |
|-------------|--------|-----------------|
| `{ interval:0, EF:2.5, reps:0 }` | `again` | `{ interval:1, EF:1.7, reps:0, maturity:'new' }` |
| `{ interval:0, EF:2.5, reps:0 }` | `good` | `{ interval:1, EF:2.5, reps:1, maturity:'learning' }` |
| `{ interval:1, EF:2.5, reps:1 }` | `good` | `{ interval:6, EF:2.5, reps:2, maturity:'learning' }` |
| `{ interval:6, EF:2.5, reps:2 }` | `good` | `{ interval:15, EF:2.5, reps:3, maturity:'mature' }` |
| `{ interval:15, EF:2.5, reps:3 }` | `easy` | `{ interval:41, EF:2.6, reps:4, maturity:'mature' }` |
| `{ interval:15, EF:2.5, reps:3 }` | `hard` | `{ interval:1, EF:2.18, reps:0, maturity:'new' }` |
| `{ interval:1, EF:1.3, reps:1 }` | `again` | `{ interval:1, EF:1.3, reps:0, maturity:'new' }` (EF clamped) |

> Exact EF values: `again` from EF=2.5 → max(1.3, 2.5 - 0.80) = 1.70; `hard` from EF=2.5 → max(1.3, 2.5 - 0.32) = 2.18; `easy` from EF=2.5 → 2.5 + 0.10 = 2.60
