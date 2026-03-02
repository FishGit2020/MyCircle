import { describe, it, expect } from 'vitest';
import { pregnancyVerses } from './pregnancyVerses';
import type { PregnancyVerse } from './pregnancyVerses';

describe('pregnancyVerses', () => {
  it('has exactly 15 verses', () => {
    expect(pregnancyVerses).toHaveLength(15);
  });

  it('each verse has a non-empty reference string', () => {
    for (const verse of pregnancyVerses) {
      expect(verse.reference).toBeDefined();
      expect(typeof verse.reference).toBe('string');
      expect(verse.reference.length).toBeGreaterThan(0);
    }
  });

  it('each reference matches a Bible reference format', () => {
    // Bible references: optional number prefix (e.g. "3 John"), book name, chapter:verse
    for (const verse of pregnancyVerses) {
      expect(verse.reference).toMatch(/^(\d\s)?[A-Za-z]+\s+\d+:\d+/);
    }
  });

  it('contains expected verses', () => {
    const references = pregnancyVerses.map((v) => v.reference);
    expect(references).toContain('Psalm 139:13-14');
    expect(references).toContain('Jeremiah 1:5');
    expect(references).toContain('Romans 8:28');
  });

  it('has no duplicate references', () => {
    const references = pregnancyVerses.map((v) => v.reference);
    const unique = new Set(references);
    expect(unique.size).toBe(references.length);
  });

  it('does not include verse text (fetched at runtime)', () => {
    for (const verse of pregnancyVerses) {
      expect(verse.text).toBeUndefined();
    }
  });

  it('conforms to PregnancyVerse interface', () => {
    for (const verse of pregnancyVerses) {
      const typed: PregnancyVerse = verse;
      expect(typed).toHaveProperty('reference');
    }
  });
});
