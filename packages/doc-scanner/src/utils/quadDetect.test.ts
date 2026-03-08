import { describe, it, expect } from 'vitest';
import { detectQuad } from './quadDetect';
import type { Point } from './contourTrace';

describe('detectQuad', () => {
  it('returns null when no contours are provided', () => {
    const result = detectQuad([], 100, 100);
    expect(result).toBeNull();
  });

  it('returns null when contours do not simplify to 4 points', () => {
    // A straight line of points — simplifies to 2 points, not 4
    const line: Point[] = Array.from({ length: 50 }, (_, i) => ({ x: i, y: 0 }));
    const result = detectQuad([line], 100, 100);
    expect(result).toBeNull();
  });

  it('detects a quadrilateral from a rectangular contour', () => {
    // Create a rectangle contour with enough points along each edge
    const contour: Point[] = [];
    // Top edge: (10,10) → (90,10)
    for (let x = 10; x <= 90; x++) contour.push({ x, y: 10 });
    // Right edge: (90,10) → (90,90)
    for (let y = 11; y <= 90; y++) contour.push({ x: 90, y });
    // Bottom edge: (90,90) → (10,90)
    for (let x = 89; x >= 10; x--) contour.push({ x, y: 90 });
    // Left edge: (10,90) → (10,10)
    for (let y = 89; y >= 11; y--) contour.push({ x: 10, y });

    const result = detectQuad([contour], 100, 100);

    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);

    // Should be ordered TL, TR, BR, BL
    const [tl, tr, br, bl] = result!;
    // TL should have smallest x+y sum
    expect(tl.x + tl.y).toBeLessThanOrEqual(tr.x + tr.y);
    expect(tl.x + tl.y).toBeLessThanOrEqual(br.x + br.y);
    expect(tl.x + tl.y).toBeLessThanOrEqual(bl.x + bl.y);
    // BR should have largest x+y sum
    expect(br.x + br.y).toBeGreaterThanOrEqual(tl.x + tl.y);
  });

  it('rejects quads smaller than minAreaRatio', () => {
    // Tiny 4-point contour in a large image
    const contour: Point[] = [];
    for (let x = 0; x <= 3; x++) contour.push({ x, y: 0 });
    for (let y = 1; y <= 3; y++) contour.push({ x: 3, y });
    for (let x = 2; x >= 0; x--) contour.push({ x, y: 3 });
    for (let y = 2; y >= 1; y--) contour.push({ x: 0, y });

    // Area ~9, image area = 1000*1000 = 1_000_000, ratio << 0.05
    const result = detectQuad([contour], 1000, 1000, 0.05);
    expect(result).toBeNull();
  });
});
