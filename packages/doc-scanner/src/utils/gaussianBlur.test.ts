import { describe, it, expect } from 'vitest';
import { gaussianBlur } from './gaussianBlur';

describe('gaussianBlur', () => {
  it('does not change a uniform image', () => {
    // 5x5 image of constant value 100
    const gray = new Uint8Array(25).fill(100);
    const result = gaussianBlur(gray, 5, 5);

    expect(result.length).toBe(25);
    // Every pixel should remain 100 (weighted average of identical values)
    for (let i = 0; i < 25; i++) {
      expect(result[i]).toBe(100);
    }
  });

  it('smooths a single bright pixel toward surrounding dark pixels', () => {
    // 5x5 all-zero except center pixel = 255
    const gray = new Uint8Array(25);
    gray[12] = 255; // center of 5x5

    const result = gaussianBlur(gray, 5, 5);

    // Center should be reduced (blurred with zeros)
    expect(result[12]).toBeLessThan(255);
    expect(result[12]).toBeGreaterThan(0);
    // Center gets kernel weight 15/159 * 255 ≈ 24
    expect(result[12]).toBe(Math.round((15 / 159) * 255));
  });

  it('produces symmetric output for a symmetric input', () => {
    // 5x5 with center pixel bright
    const gray = new Uint8Array(25);
    gray[12] = 200;

    const result = gaussianBlur(gray, 5, 5);

    // Pixels equidistant from center should have equal values
    // (6,8) are left/right of center, (7,17) are above/below
    expect(result[11]).toBe(result[13]); // left == right of center
    expect(result[7]).toBe(result[17]);  // above == below center
  });

  it('handles a 1x1 image', () => {
    const gray = new Uint8Array([42]);
    const result = gaussianBlur(gray, 1, 1);
    expect(result.length).toBe(1);
    // Edge clamping means all kernel samples hit the same pixel
    expect(result[0]).toBe(42);
  });
});
