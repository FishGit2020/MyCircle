import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDeals } from './useDeals';

const mockRefetch = vi.fn();

vi.mock('@mycircle/shared', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
  useQuery: vi.fn(() => ({
    loading: false,
    refetch: mockRefetch,
  })),
  GET_DEALS: { kind: 'Document', definitions: [] },
}));

describe('useDeals', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns demo deals when GraphQL has no data yet', () => {
    const { result } = renderHook(() => useDeals());

    // Should have initial demo deals (cache empty, no GraphQL response yet)
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
