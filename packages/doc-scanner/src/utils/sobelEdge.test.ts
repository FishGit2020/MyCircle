import { describe, it, expect } from 'vitest';
import { sobelEdge } from './sobelEdge';

describe('sobelEdge', () => {
  it('detects a vertical edge', () => {
    // 3x3 image: left column dark, right column bright
    // [0, 0, 255]
    // [0, 0, 255]
    // [0, 0, 255]
    const gray = new Uint8Array([
      0, 0, 255,
      0, 0, 255,
      0, 0, 255,
    ]);
    const { magnitude } = sobelEdge(gray, 3, 3);

    // Border pixels stay 0 (Sobel skips edges)
    // Center pixel (1,1) should have strong horizontal gradient
    expect(magnitude[4]).toBeGreaterThan(0); // center pixel index = 1*3+1 = 4
    // Gx = -0 + 255 - 0 + 2*255 - 0 + 255 = 1020, Gy = 0
    expect(magnitude[4]).toBeCloseTo(1020, 0);
  });

  it('detects a horizontal edge', () => {
    // 3x3: top row dark, bottom row bright
    const gray = new Uint8Array([
      0, 0, 0,
      0, 0, 0,
      255, 255, 255,
    ]);
    const { magnitude, direction } = sobelEdge(gray, 3, 3);

    // Center pixel should have strong vertical gradient
    expect(magnitude[4]).toBeGreaterThan(0);
    // Gy should dominate, so direction should be near PI/2 or -PI/2
    expect(Math.abs(direction[4])).toBeCloseTo(Math.PI / 2, 1);
  });

  it('returns zero magnitude for a uniform image', () => {
    const gray = new Uint8Array(9).fill(128);
    const { magnitude } = sobelEdge(gray, 3, 3);

    for (let i = 0; i < 9; i++) {
      expect(magnitude[i]).toBe(0);
    }
  });

  it('returns arrays of correct size', () => {
    const gray = new Uint8Array(20).fill(0); // 5x4
    const { magnitude, direction } = sobelEdge(gray, 5, 4);

    expect(magnitude.length).toBe(20);
    expect(direction.length).toBe(20);
  });
});
