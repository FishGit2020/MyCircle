import { describe, it, expect } from 'vitest';
import {
  DOMAINS,
  AGE_RANGES,
  MILESTONES,
  getMilestonesByDomain,
  getMilestonesByAgeRange,
  getMilestonesByDomainAndAge,
  getAgeRangeForMonths,
  getDomainMeta,
} from './milestones';
import type { DomainId, AgeRangeId } from './milestones';

describe('milestones data', () => {
  it('defines all 6 domains', () => {
    const ids = DOMAINS.map(d => d.id);
    expect(ids).toEqual(['physical', 'speech', 'cognitive', 'social', 'health', 'sensory']);
  });

  it('defines all 9 age ranges', () => {
    const ids = AGE_RANGES.map(a => a.id);
    expect(ids).toEqual([
      '0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m', '2-3y', '3-4y', '4-5y',
    ]);
  });

  it('has exactly 270 milestones (6 domains × 9 age ranges × 5)', () => {
    expect(MILESTONES).toHaveLength(270);
  });

  it('each domain has milestones in every age range', () => {
    const domainIds: DomainId[] = ['physical', 'speech', 'cognitive', 'social', 'health', 'sensory'];
    const ageIds: AgeRangeId[] = ['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m', '2-3y', '3-4y', '4-5y'];

    for (const domain of domainIds) {
      for (const age of ageIds) {
        const milestones = getMilestonesByDomainAndAge(domain, age);
        expect(milestones).toHaveLength(5);
      }
    }
  });

  it('milestone IDs match {domain}-{ageRange}-{nn} pattern', () => {
    const pattern = /^(physical|speech|cognitive|social|health|sensory)-(0_3m|3_6m|6_9m|9_12m|12_18m|18_24m|2_3y|3_4y|4_5y)-\d{2}$/;
    for (const m of MILESTONES) {
      expect(m.id).toMatch(pattern);
    }
  });

  it('milestone nameKeys follow childDev.ms_{id} pattern', () => {
    for (const m of MILESTONES) {
      const expected = `childDev.ms_${m.id.replace(/-/g, '_')}`;
      expect(m.nameKey).toBe(expected);
    }
  });

  it('all milestone IDs are unique', () => {
    const ids = MILESTONES.map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has 10-15% red flags', () => {
    const redFlags = MILESTONES.filter(m => m.isRedFlag);
    const pct = (redFlags.length / MILESTONES.length) * 100;
    expect(pct).toBeGreaterThanOrEqual(10);
    expect(pct).toBeLessThanOrEqual(15);
  });

  it('getMilestonesByDomain returns 45 milestones for each domain', () => {
    for (const d of DOMAINS) {
      expect(getMilestonesByDomain(d.id)).toHaveLength(45);
    }
  });

  it('getMilestonesByAgeRange returns 30 milestones for each age range', () => {
    for (const a of AGE_RANGES) {
      expect(getMilestonesByAgeRange(a.id)).toHaveLength(30);
    }
  });

  it('getAgeRangeForMonths maps correctly', () => {
    expect(getAgeRangeForMonths(0)?.id).toBe('0-3m');
    expect(getAgeRangeForMonths(2)?.id).toBe('0-3m');
    expect(getAgeRangeForMonths(3)?.id).toBe('3-6m');
    expect(getAgeRangeForMonths(6)?.id).toBe('6-9m');
    expect(getAgeRangeForMonths(12)?.id).toBe('12-18m');
    expect(getAgeRangeForMonths(24)?.id).toBe('2-3y');
    expect(getAgeRangeForMonths(36)?.id).toBe('3-4y');
    expect(getAgeRangeForMonths(48)?.id).toBe('4-5y');
    expect(getAgeRangeForMonths(59)?.id).toBe('4-5y');
    expect(getAgeRangeForMonths(60)).toBeUndefined();
  });

  it('getDomainMeta returns correct metadata', () => {
    const physical = getDomainMeta('physical');
    expect(physical).toBeDefined();
    expect(physical!.nameKey).toBe('childDev.domainPhysical');
    expect(physical!.icon).toBe('runner');

    const speech = getDomainMeta('speech');
    expect(speech).toBeDefined();
    expect(speech!.icon).toBe('speech-bubble');
  });
});
