import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../utils/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

import { useUnits } from './useUnits';

describe('useUnits', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default units when nothing is stored', () => {
    const { result } = renderHook(() => useUnits());

    expect(result.current.tempUnit).toBe('C');
    expect(result.current.speedUnit).toBe('ms');
    expect(result.current.distanceUnit).toBe('km');
  });

  it('reads stored units from localStorage', () => {
    localStorage.setItem('tempUnit', 'F');
    localStorage.setItem('speedUnit', 'mph');
    localStorage.setItem('distanceUnit', 'mi');

    const { result } = renderHook(() => useUnits());

    expect(result.current.tempUnit).toBe('F');
    expect(result.current.speedUnit).toBe('mph');
    expect(result.current.distanceUnit).toBe('mi');
  });

  it('setTempUnit updates state and localStorage', () => {
    const { result } = renderHook(() => useUnits());

    act(() => {
      result.current.setTempUnit('F');
    });

    expect(result.current.tempUnit).toBe('F');
    expect(localStorage.getItem('tempUnit')).toBe('F');
  });

  it('setSpeedUnit updates state and localStorage', () => {
    const { result } = renderHook(() => useUnits());

    act(() => {
      result.current.setSpeedUnit('kmh');
    });

    expect(result.current.speedUnit).toBe('kmh');
    expect(localStorage.getItem('speedUnit')).toBe('kmh');
  });

  it('setDistanceUnit updates state and localStorage', () => {
    const { result } = renderHook(() => useUnits());

    act(() => {
      result.current.setDistanceUnit('mi');
    });

    expect(result.current.distanceUnit).toBe('mi');
    expect(localStorage.getItem('distanceUnit')).toBe('mi');
  });
});
