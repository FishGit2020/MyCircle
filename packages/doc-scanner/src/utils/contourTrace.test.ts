import { describe, it, expect } from 'vitest';
import { traceContours } from './contourTrace';

describe('traceContours', () => {
  it('returns empty array for an all-black image', () => {
    const edges = new Uint8Array(25); // 5x5 all zeros
    const result = traceContours(edges, 5, 5);
    expect(result).toEqual([]);
  });

  it('returns empty array for an all-white image (no background neighbor to start)', () => {
    const edges = new Uint8Array(25).fill(255); // 5x5 all edge
    const result = traceContours(edges, 5, 5);
    // All interior pixels have edge neighbors to the left, so none qualify as border start
    expect(result).toEqual([]);
  });

  it('filters out contours with fewer than 20 points', () => {
    // Small 7x7 image with a tiny square (perimeter < 20 points)
    const edges = new Uint8Array(49);
    // Draw a 3x3 square at (3,3) — only 8 border pixels
    for (let y = 2; y <= 4; y++) {
      for (let x = 3; x <= 5; x++) {
        edges[y * 7 + x] = 255;
      }
    }
    // Ensure left neighbor of start pixel is 0 (it is, since x=3 has x-1=2 which is 0)
    const result = traceContours(edges, 7, 7);
    // Contour has < 20 points, should be filtered
    expect(result).toEqual([]);
  });

  it('traces a contour with >= 20 points', () => {
    // 20x20 image with a large rectangle border
    const w = 20, h = 20;
    const edges = new Uint8Array(w * h);

    // Draw a rectangle from (2,2) to (17,17) — just the border
    for (let x = 2; x <= 17; x++) {
      edges[2 * w + x] = 255;  // top
      edges[17 * w + x] = 255; // bottom
    }
    for (let y = 2; y <= 17; y++) {
      edges[y * w + 2] = 255;  // left
      edges[y * w + 17] = 255; // right
    }

    const result = traceContours(edges, w, h);

    // Should find at least one contour
    expect(result.length).toBeGreaterThanOrEqual(1);
    // The contour should have at least 20 points
    expect(result[0].length).toBeGreaterThanOrEqual(20);
    // All points should be within bounds
    for (const point of result[0]) {
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThan(w);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThan(h);
    }
  });
});
