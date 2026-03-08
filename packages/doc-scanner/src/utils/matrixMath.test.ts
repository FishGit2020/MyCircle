import { describe, it, expect } from 'vitest';
import { solveLinearSystem } from './matrixMath';

describe('solveLinearSystem', () => {
  it('solves a simple 2x2 system', () => {
    // 2x + 3y = 8
    // x + y = 3
    // Solution: x=1, y=2
    const A = [[2, 3], [1, 1]];
    const b = [8, 3];
    const result = solveLinearSystem(A, b);

    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(1, 10);
    expect(result![1]).toBeCloseTo(2, 10);
  });

  it('solves a 3x3 identity system', () => {
    const A = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    const b = [5, 10, 15];
    const result = solveLinearSystem(A, b);

    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(5);
    expect(result![1]).toBeCloseTo(10);
    expect(result![2]).toBeCloseTo(15);
  });

  it('returns null for a singular matrix', () => {
    // Two identical rows → singular
    const A = [[1, 2], [1, 2]];
    const b = [3, 3];
    const result = solveLinearSystem(A, b);

    expect(result).toBeNull();
  });

  it('handles partial pivoting correctly', () => {
    // System where first pivot is zero, requires row swap
    // 0x + 1y = 5
    // 1x + 0y = 3
    const A = [[0, 1], [1, 0]];
    const b = [5, 3];
    const result = solveLinearSystem(A, b);

    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(3);
    expect(result![1]).toBeCloseTo(5);
  });
});
