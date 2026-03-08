import { describe, it, expect } from 'vitest';
import { toGrayscale } from './grayscale';

describe('toGrayscale', () => {
  it('converts RGBA pixels to BT.601 luminance', () => {
    // 2x1 image: red pixel, green pixel
    const data = new Uint8ClampedArray([
      255, 0, 0, 255,   // red
      0, 255, 0, 255,   // green
    ]);
    const result = toGrayscale(data, 2, 1);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBe(2);
    // BT.601: Y = 0.299*R + 0.587*G + 0.114*B
    expect(result[0]).toBe(Math.round(0.299 * 255)); // 76
    expect(result[1]).toBe(Math.round(0.587 * 255)); // 150
  });

  it('handles white and black pixels', () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,  // white
      0, 0, 0, 255,        // black
    ]);
    const result = toGrayscale(data, 2, 1);

    expect(result[0]).toBe(255); // white → 255
    expect(result[1]).toBe(0);   // black → 0
  });

  it('ignores the alpha channel', () => {
    const opaque = new Uint8ClampedArray([100, 150, 200, 255]);
    const transparent = new Uint8ClampedArray([100, 150, 200, 0]);

    const r1 = toGrayscale(opaque, 1, 1);
    const r2 = toGrayscale(transparent, 1, 1);

    expect(r1[0]).toBe(r2[0]);
  });

  it('returns correct size for a 3x2 image', () => {
    const data = new Uint8ClampedArray(3 * 2 * 4); // 6 pixels, all black
    const result = toGrayscale(data, 3, 2);
    expect(result.length).toBe(6);
  });
});
