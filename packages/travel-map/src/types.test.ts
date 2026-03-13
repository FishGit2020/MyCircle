import { describe, it, expect } from 'vitest';
import { PIN_COLORS } from './types';
import type { PinType, TravelPin } from './types';

describe('TravelMap types', () => {
  it('has correct pin colors for each type', () => {
    expect(PIN_COLORS.lived).toBe('#ef4444');
    expect(PIN_COLORS.visited).toBe('#3b82f6');
    expect(PIN_COLORS.wishlist).toBe('#eab308');
  });

  it('pin type union includes all three types', () => {
    const types: PinType[] = ['lived', 'visited', 'wishlist'];
    expect(types).toHaveLength(3);
    types.forEach((t) => {
      expect(PIN_COLORS[t]).toBeDefined();
    });
  });

  it('TravelPin interface has required fields', () => {
    const pin: TravelPin = {
      id: 'test-id',
      type: 'visited',
      name: 'Test Place',
      lat: 40.7128,
      lon: -74.006,
      createdAt: Date.now(),
    };
    expect(pin.id).toBe('test-id');
    expect(pin.type).toBe('visited');
    expect(pin.name).toBe('Test Place');
    expect(pin.notes).toBeUndefined();
    expect(pin.dateRange).toBeUndefined();
  });
});
