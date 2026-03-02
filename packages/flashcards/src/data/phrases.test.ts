import { describe, it, expect } from 'vitest';
import { phrases, categoryOrder } from './phrases';

describe('phrases data', () => {
  it('has 76 phrases', () => {
    expect(phrases).toHaveLength(76);
  });

  it('every phrase has required fields', () => {
    for (const p of phrases) {
      expect(p.id).toBeTruthy();
      expect(p.english).toBeTruthy();
      expect(p.chinese).toBeTruthy();
      expect(p.phonetic).toBeTruthy();
      expect(p.category).toBeTruthy();
      expect([1, 2, 3]).toContain(p.difficulty);
    }
  });

  it('has unique ids', () => {
    const ids = phrases.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all categories match categoryOrder', () => {
    const cats = new Set(phrases.map(p => p.category));
    for (const cat of cats) {
      expect(categoryOrder).toContain(cat);
    }
  });

  it('exports categoryOrder with all expected categories', () => {
    expect(categoryOrder).toEqual(['greetings', 'feelings', 'house', 'food', 'goingOut', 'people', 'time', 'emergency']);
  });
});
