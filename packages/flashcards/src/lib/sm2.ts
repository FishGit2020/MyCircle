/**
 * SM-2 Spaced Repetition Algorithm
 *
 * Pure function module — no side effects, fully unit-testable.
 * Based on the SuperMemo SM-2 algorithm.
 *
 * Quality mapping for 4-button review UI:
 *   again → 0  (failed, resets repetitions, requeued in session)
 *   hard  → 2  (failed threshold, resets repetitions)
 *   good  → 4  (passed with some difficulty)
 *   easy  → 5  (perfect recall, no hesitation)
 */

import type { Rating, Maturity } from '../types';

export interface SM2State {
  interval: number;    // Days until next review
  easeFactor: number;  // Ease multiplier (≥ 1.3)
  repetitions: number; // Successful consecutive review count
  maturity: Maturity;
}

export interface SM2Result extends SM2State {
  dueDate: number; // Unix ms — next review date (start of local day)
}

const QUALITY: Record<Rating, number> = {
  again: 0,
  hard: 2,
  good: 4,
  easy: 5,
};

const EF_MIN = 1.3;
const EF_DEFAULT = 2.5;

export function getMaturity(repetitions: number): Maturity {
  if (repetitions === 0) return 'new';
  if (repetitions < 3) return 'learning';
  return 'mature';
}

function nextDueDateMs(intervalDays: number): number {
  const d = new Date();
  d.setDate(d.getDate() + intervalDays);
  d.setHours(0, 0, 0, 0); // Start of local day
  return d.getTime();
}

export function createInitialState(): SM2Result {
  return {
    interval: 0,
    easeFactor: EF_DEFAULT,
    repetitions: 0,
    maturity: 'new',
    dueDate: Date.now(), // Immediately due when added
  };
}

export function applyRating(state: SM2State, rating: Rating): SM2Result {
  const q = QUALITY[rating];

  // Update ease factor
  const newEF = Math.max(
    EF_MIN,
    state.easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  if (q < 3) {
    // Failed review (again=0, hard=2) — reset
    return {
      interval: 1,
      easeFactor: newEF,
      repetitions: 0,
      maturity: 'new',
      dueDate: nextDueDateMs(1),
    };
  }

  // Passed review (good=4, easy=5)
  const newReps = state.repetitions + 1;
  let newInterval: number;
  if (newReps === 1) {
    newInterval = 1;
  } else if (newReps === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(state.interval * newEF);
  }

  return {
    interval: newInterval,
    easeFactor: newEF,
    repetitions: newReps,
    maturity: getMaturity(newReps),
    dueDate: nextDueDateMs(newInterval),
  };
}
