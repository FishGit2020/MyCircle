import { describe, it, expect } from 'vitest';
import { cannyThreshold, adaptiveThreshold } from './threshold';

describe('cannyThreshold', () => {
  it('marks strong edges as 255', () => {
    // 3x3 with center pixel above high threshold
    const magnitude = new Float32Array([0, 0, 0, 0, 100, 0, 0, 0, 0]);
    const direction = new Float32Array(9); // all 0
    const result = cannyThreshold(magnitude, direction, 3, 3, 30, 80);

    expect(result[4]).toBe(255); // center is strong edge
  });

  it('suppresses weak edges not connected to strong edges', () => {
    // 5x5, one weak pixel (magnitude 50) isolated in the interior
    const magnitude = new Float32Array(25);
    magnitude[12] = 50; // center of 5x5, between low=30 and high=80
    const direction = new Float32Array(25);

    const result = cannyThreshold(magnitude, direction, 5, 5, 30, 80);

    // Weak edge with no strong neighbor should be suppressed to 0
    expect(result[12]).toBe(0);
  });

  it('promotes weak edges connected to strong edges', () => {
    // 7x7 grid. Strong pixel at (3,3)=index 24, weak pixel at (4,3)=index 25.
    // Both use direction=0 (horizontal) so NMS compares left/right neighbors.
    // Place them so left/right neighbors along the edge direction are 0.
    const w = 7, h = 7;
    const magnitude = new Float32Array(w * h);
    // Strong at (3,3), weak at (3,4) — vertically adjacent
    magnitude[3 * w + 3] = 100; // index 24: strong
    magnitude[4 * w + 3] = 50;  // index 31: weak
    const direction = new Float32Array(w * h);
    // direction=0 → angle 0 → NMS compares left (x-1) and right (x+1)
    // For (3,3): compares mag[3*7+2]=0 and mag[3*7+4]=0 → 100>=0 → survives
    // For (3,4): compares mag[4*7+2]=0 and mag[4*7+4]=0 → 50>=0 → survives
    direction[3 * w + 3] = 0;
    direction[4 * w + 3] = 0;

    const result = cannyThreshold(magnitude, direction, w, h, 30, 80);

    expect(result[3 * w + 3]).toBe(255); // strong
    expect(result[4 * w + 3]).toBe(255); // weak promoted to strong (8-neighbor of strong)
  });

  it('returns binary output (only 0 or 255)', () => {
    const magnitude = new Float32Array([0, 10, 50, 100, 200, 0, 40, 90, 0]);
    const direction = new Float32Array(9);
    const result = cannyThreshold(magnitude, direction, 3, 3, 30, 80);

    for (let i = 0; i < result.length; i++) {
      expect(result[i] === 0 || result[i] === 255).toBe(true);
    }
  });
});

describe('adaptiveThreshold', () => {
  it('produces binary output (0 or 255)', () => {
    const gray = new Uint8Array([10, 200, 50, 180, 20, 220, 60, 190, 30]);
    const result = adaptiveThreshold(gray, 3, 3, 3, 5);

    for (let i = 0; i < result.length; i++) {
      expect(result[i] === 0 || result[i] === 255).toBe(true);
    }
  });

  it('makes a uniform image all white (pixel > mean - c is always true for c > 0)', () => {
    const gray = new Uint8Array(9).fill(128);
    const result = adaptiveThreshold(gray, 3, 3, 3, 10);

    // mean == 128, pixel (128) > mean - c (118) → 255
    for (let i = 0; i < 9; i++) {
      expect(result[i]).toBe(255);
    }
  });

  it('separates a dark pixel from bright neighbors', () => {
    // 3x3: all 200 except center is 0
    const gray = new Uint8Array([200, 200, 200, 200, 0, 200, 200, 200, 200]);
    const result = adaptiveThreshold(gray, 3, 3, 3, 5);

    // Center (0) is far below local mean (~178) - c → should be 0 (black)
    expect(result[4]).toBe(0);
    // Bright neighbors should be 255
    expect(result[0]).toBe(255);
  });
});
