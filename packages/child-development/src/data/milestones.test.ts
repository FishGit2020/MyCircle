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
  it('defines all 5 domains', () => {
    const ids = DOMAINS.map(d => d.id);
    expect(ids).toEqual(['physical', 'speech', 'cognitive', 'social', 'sensory']);
  });

  it('defines all 9 age ranges', () => {
    const ids = AGE_RANGES.map(a => a.id);
    expect(ids).toEqual([
      '0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m', '2-3y', '3-4y', '4-5y',
    ]);
  });

  it('has exactly 195 milestones (4 core×9 ages + sensory×3 baby ages)', () => {
    expect(MILESTONES).toHaveLength(195);
  });

  it('each domain×age cell has 0 or 5 milestones', () => {
    const domainIds: DomainId[] = ['physical', 'speech', 'cognitive', 'social', 'sensory'];
    const ageIds: AgeRangeId[] = ['0-3m', '3-6m', '6-9m', '9-12m', '12-18m', '18-24m', '2-3y', '3-4y', '4-5y'];

    for (const domain of domainIds) {
      for (const age of ageIds) {
        const milestones = getMilestonesByDomainAndAge(domain, age);
        expect(
          milestones.length === 0 || milestones.length === 5,
          `${domain}×${age} has ${milestones.length} milestones (expected 0 or 5)`,
        ).toBe(true);
      }
    }
  });

  it('sensory domain only has milestones for baby ages (0-3m, 3-6m, 6-9m)', () => {
    const babyAges: AgeRangeId[] = ['0-3m', '3-6m', '6-9m'];
    const olderAges: AgeRangeId[] = ['9-12m', '12-18m', '18-24m', '2-3y', '3-4y', '4-5y'];

    for (const age of babyAges) {
      expect(getMilestonesByDomainAndAge('sensory', age)).toHaveLength(5);
    }
    for (const age of olderAges) {
      expect(getMilestonesByDomainAndAge('sensory', age)).toHaveLength(0);
    }
  });

  it('milestone IDs match {domain}-{ageRange}-{nn} pattern', () => {
    const pattern = /^(physical|speech|cognitive|social|sensory)-(0_3m|3_6m|6_9m|9_12m|12_18m|18_24m|2_3y|3_4y|4_5y)-\d{2}$/;
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

  it('has 10-18% red flags', () => {
    const redFlags = MILESTONES.filter(m => m.isRedFlag);
    const pct = (redFlags.length / MILESTONES.length) * 100;
    expect(pct).toBeGreaterThanOrEqual(10);
    expect(pct).toBeLessThanOrEqual(18);
  });

  it('getMilestonesByDomain returns correct counts per domain', () => {
    expect(getMilestonesByDomain('physical')).toHaveLength(45);
    expect(getMilestonesByDomain('speech')).toHaveLength(45);
    expect(getMilestonesByDomain('cognitive')).toHaveLength(45);
    expect(getMilestonesByDomain('social')).toHaveLength(45);
    expect(getMilestonesByDomain('sensory')).toHaveLength(15);
  });

  it('getMilestonesByAgeRange returns correct counts per age', () => {
    // Baby ages: 4 core + sensory = 25
    expect(getMilestonesByAgeRange('0-3m')).toHaveLength(25);
    expect(getMilestonesByAgeRange('3-6m')).toHaveLength(25);
    expect(getMilestonesByAgeRange('6-9m')).toHaveLength(25);
    // Older ages: 4 core only = 20
    expect(getMilestonesByAgeRange('9-12m')).toHaveLength(20);
    expect(getMilestonesByAgeRange('12-18m')).toHaveLength(20);
    expect(getMilestonesByAgeRange('18-24m')).toHaveLength(20);
    expect(getMilestonesByAgeRange('2-3y')).toHaveLength(20);
    expect(getMilestonesByAgeRange('3-4y')).toHaveLength(20);
    expect(getMilestonesByAgeRange('4-5y')).toHaveLength(20);
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
