import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeals } from './useDeals';

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

describe('useDeals', () => {
  beforeEach(() => {
    localStorage.clear();
    (window as any).__getFirebaseIdToken = undefined;
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 404,
    } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns demo deals when not authenticated', async () => {
    const { result } = renderHook(() => useDeals());

    // Should have initial demo deals
    expect(result.current.deals.length).toBeGreaterThan(0);
    expect(result.current.deals[0].title).toContain('Sony');
  });

  it('returns deals array', () => {
    const { result } = renderHook(() => useDeals());
    expect(Array.isArray(result.current.deals)).toBe(true);
  });

  it('provides refresh function', () => {
    const { result } = renderHook(() => useDeals());
    expect(typeof result.current.refresh).toBe('function');
  });

  it('provides loading state', () => {
    const { result } = renderHook(() => useDeals());
    expect(typeof result.current.loading).toBe('boolean');
  });
});
