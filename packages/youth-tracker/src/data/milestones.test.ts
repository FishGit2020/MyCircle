import { describe, it, expect } from 'vitest';
import { AGE_RANGES, MILESTONES, DOMAINS, getAgeRangeForMonths } from './milestones';

describe('milestones', () => {
  it('has 7 age ranges covering 5-18 years', () => {
    expect(AGE_RANGES).toHaveLength(7);
    expect(AGE_RANGES[0].minMonths).toBe(60);
    expect(AGE_RANGES[AGE_RANGES.length - 1].maxMonths).toBe(216);
  });

  it('has 4 domains', () => {
    expect(DOMAINS).toHaveLength(4);
  });

  it('has 112 milestones (4 per domain × 7 ranges)', () => {
    expect(MILESTONES).toHaveLength(112);
  });

  it('each age range has exactly 16 milestones (4 domains × 4 each)', () => {
    for (const range of AGE_RANGES) {
      const count = MILESTONES.filter(m => m.ageRangeId === range.id).length;
      expect(count).toBe(16);
    }
  });

  it('getAgeRangeForMonths returns correct range', () => {
    expect(getAgeRangeForMonths(60)?.id).toBe('5-6y');
    expect(getAgeRangeForMonths(100)?.id).toBe('8-10y');
    expect(getAgeRangeForMonths(200)?.id).toBe('16-18y');
    expect(getAgeRangeForMonths(30)).toBeNull();
    expect(getAgeRangeForMonths(220)).toBeNull();
  });

  it('all milestone IDs are unique', () => {
    const ids = MILESTONES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
