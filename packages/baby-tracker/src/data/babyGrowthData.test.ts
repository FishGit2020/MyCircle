import { describe, it, expect } from 'vitest';
import { babyGrowthData, getGrowthDataForWeek, getTrimester } from './babyGrowthData';

describe('babyGrowthData', () => {
  it('has 40 weeks of data', () => {
    expect(babyGrowthData).toHaveLength(40);
  });

  it('has week numbers from 1 to 40', () => {
    expect(babyGrowthData[0].week).toBe(1);
    expect(babyGrowthData[39].week).toBe(40);
  });

  it('each entry has all required fields', () => {
    for (const week of babyGrowthData) {
      expect(week).toHaveProperty('week');
      expect(week).toHaveProperty('fruit');
      expect(week).toHaveProperty('lengthCm');
      expect(week).toHaveProperty('weightG');
      expect(week).toHaveProperty('lengthIn');
      expect(week).toHaveProperty('weightOz');
    }
  });

  it('growth data generally increases over time', () => {
    // Weight at week 40 should be greater than week 10
    const week10 = babyGrowthData[9];
    const week40 = babyGrowthData[39];
    expect(week40.weightG).toBeGreaterThan(week10.weightG);
    expect(week40.lengthCm).toBeGreaterThan(week10.lengthCm);
  });
});

describe('getGrowthDataForWeek', () => {
  it('returns data for valid week numbers', () => {
    const week1 = getGrowthDataForWeek(1);
    expect(week1).not.toBeNull();
    expect(week1!.week).toBe(1);
    expect(week1!.fruit).toBe('poppy seed');
  });

  it('returns correct data for week 40', () => {
    const week40 = getGrowthDataForWeek(40);
    expect(week40).not.toBeNull();
    expect(week40!.fruit).toBe('watermelon');
  });

  it('returns null for week 0', () => {
    expect(getGrowthDataForWeek(0)).toBeNull();
  });

  it('returns null for week 41', () => {
    expect(getGrowthDataForWeek(41)).toBeNull();
  });

  it('returns null for negative week', () => {
    expect(getGrowthDataForWeek(-1)).toBeNull();
  });
});

describe('getTrimester', () => {
  it('returns 1 for weeks 1-13', () => {
    expect(getTrimester(1)).toBe(1);
    expect(getTrimester(13)).toBe(1);
  });

  it('returns 2 for weeks 14-26', () => {
    expect(getTrimester(14)).toBe(2);
    expect(getTrimester(26)).toBe(2);
  });

  it('returns 3 for weeks 27-40', () => {
    expect(getTrimester(27)).toBe(3);
    expect(getTrimester(40)).toBe(3);
  });
});
