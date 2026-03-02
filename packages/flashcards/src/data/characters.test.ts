import { describe, it, expect } from 'vitest';
import { categoryOrder } from './characters';
import type { CharacterCategory } from './characters';

describe('characters data', () => {
  it('exports categoryOrder with all expected categories', () => {
    const expected: CharacterCategory[] = ['family', 'feelings', 'food', 'body', 'house', 'nature', 'numbers', 'phrases'];
    expect(categoryOrder).toEqual(expected);
  });

  it('has no duplicate categories', () => {
    const unique = new Set(categoryOrder);
    expect(unique.size).toBe(categoryOrder.length);
  });
});
