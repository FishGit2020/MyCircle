import { describe, it, expect } from 'vitest';
import { computeHomography, estimateOutputSize } from './perspectiveTransform';
import type { Point } from './contourTrace';

describe('computeHomography', () => {
  it('returns identity-like homography when src equals dst', () => {
    const points: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const H = computeHomography(points, points);

    expect(H).not.toBeNull();
    expect(H!.length).toBe(9);
    // For identity mapping: h0=1, h1=0, h2=0, h3=0, h4=1, h5=0, h6=0, h7=0, h8=1
    expect(H![0]).toBeCloseTo(1, 5);
    expect(H![1]).toBeCloseTo(0, 5);
    expect(H![2]).toBeCloseTo(0, 5);
    expect(H![3]).toBeCloseTo(0, 5);
    expect(H![4]).toBeCloseTo(1, 5);
    expect(H![5]).toBeCloseTo(0, 5);
    expect(H![6]).toBeCloseTo(0, 5);
    expect(H![7]).toBeCloseTo(0, 5);
    expect(H![8]).toBe(1); // always 1
  });

  it('maps source points to destination points correctly', () => {
    const src: Point[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
    const dst: Point[] = [
      { x: 10, y: 10 },
      { x: 90, y: 20 },
      { x: 80, y: 90 },
      { x: 20, y: 80 },
    ];
    const H = computeHomography(src, dst);
    expect(H).not.toBeNull();

    // Verify: applying H to each src point should yield the corresponding dst point
    for (let i = 0; i < 4; i++) {
      const { x, y } = src[i];
      const w = H![6] * x + H![7] * y + H![8];
      const mx = (H![0] * x + H![1] * y + H![2]) / w;
      const my = (H![3] * x + H![4] * y + H![5]) / w;
      expect(mx).toBeCloseTo(dst[i].x, 3);
      expect(my).toBeCloseTo(dst[i].y, 3);
    }
  });
});

describe('estimateOutputSize', () => {
  it('returns correct dimensions for a rectangle', () => {
    const corners: Point[] = [
      { x: 0, y: 0 },     // TL
      { x: 200, y: 0 },   // TR
      { x: 200, y: 100 }, // BR
      { x: 0, y: 100 },   // BL
    ];
    const { width, height } = estimateOutputSize(corners);
    expect(width).toBe(200);
    expect(height).toBe(100);
  });

  it('uses the longer side for trapezoid shapes', () => {
    const corners: Point[] = [
      { x: 10, y: 0 },    // TL
      { x: 90, y: 0 },    // TR — top width = 80
      { x: 100, y: 50 },  // BR — bottom width = 100
      { x: 0, y: 50 },    // BL
    ];
    const { width, height } = estimateOutputSize(corners);

    // Bottom edge (100) is longer than top edge (80)
    expect(width).toBe(100);
    // Left height = sqrt(10^2 + 50^2) ≈ 50.99 → rounds to 51
    expect(height).toBe(51);
  });

  it('handles a square', () => {
    const corners: Point[] = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 50, y: 50 },
      { x: 0, y: 50 },
    ];
    const { width, height } = estimateOutputSize(corners);
    expect(width).toBe(50);
    expect(height).toBe(50);
  });
});
