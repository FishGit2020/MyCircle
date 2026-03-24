import { describe, it, expect } from 'vitest';
import { applyRating, createInitialState, getMaturity } from './sm2';

describe('getMaturity', () => {
  it('returns new for 0 repetitions', () => {
    expect(getMaturity(0)).toBe('new');
  });

  it('returns learning for 1-2 repetitions', () => {
    expect(getMaturity(1)).toBe('learning');
    expect(getMaturity(2)).toBe('learning');
  });

  it('returns mature for 3+ repetitions', () => {
    expect(getMaturity(3)).toBe('mature');
    expect(getMaturity(10)).toBe('mature');
  });
});

describe('createInitialState', () => {
  it('returns new card with correct defaults', () => {
    const state = createInitialState();
    expect(state.interval).toBe(0);
    expect(state.easeFactor).toBe(2.5);
    expect(state.repetitions).toBe(0);
    expect(state.maturity).toBe('new');
    expect(state.dueDate).toBeLessThanOrEqual(Date.now() + 100);
  });
});

describe('applyRating', () => {
  const base = { interval: 0, easeFactor: 2.5, repetitions: 0, maturity: 'new' as const };

  it('again resets repetitions to 0 and reduces EF', () => {
    const result = applyRating(base, 'again');
    expect(result.repetitions).toBe(0);
    expect(result.maturity).toBe('new');
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeCloseTo(1.7, 1);
  });

  it('hard resets repetitions to 0 and reduces EF', () => {
    const result = applyRating(base, 'hard');
    expect(result.repetitions).toBe(0);
    expect(result.maturity).toBe('new');
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBeLessThan(2.5);
  });

  it('good on new card gives interval=1, rep=1, maturity=learning', () => {
    const result = applyRating(base, 'good');
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(1);
    expect(result.maturity).toBe('learning');
    expect(result.easeFactor).toBeCloseTo(2.5, 5); // unchanged on good
  });

  it('second good gives interval=6, rep=2, maturity=learning', () => {
    const after1 = applyRating(base, 'good');
    const after2 = applyRating(after1, 'good');
    expect(after2.interval).toBe(6);
    expect(after2.repetitions).toBe(2);
    expect(after2.maturity).toBe('learning');
  });

  it('third good gives interval based on EF, rep=3, maturity=mature', () => {
    const after1 = applyRating(base, 'good');
    const after2 = applyRating(after1, 'good');
    const after3 = applyRating(after2, 'good');
    expect(after3.repetitions).toBe(3);
    expect(after3.maturity).toBe('mature');
    expect(after3.interval).toBe(Math.round(6 * after2.easeFactor));
  });

  it('easy extends interval more and increases EF', () => {
    const reps2 = applyRating(applyRating(base, 'good'), 'good'); // interval=6, EF=2.5
    const result = applyRating(reps2, 'easy');
    expect(result.interval).toBeGreaterThan(6 * 2.5 - 1);
    expect(result.easeFactor).toBeCloseTo(2.6, 1); // EF increases
    expect(result.maturity).toBe('mature');
  });

  it('EF is clamped at 1.3 minimum', () => {
    const lowEF = { ...base, easeFactor: 1.3 };
    const result = applyRating(lowEF, 'again');
    expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it('dueDate is set to start of a future local day', () => {
    const result = applyRating({ ...base, interval: 6, easeFactor: 2.5, repetitions: 2 }, 'good');
    expect(result.dueDate).toBeGreaterThan(Date.now());
    // Should be at midnight (0ms, 0s, 0min, 0hr)
    const d = new Date(result.dueDate);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});
