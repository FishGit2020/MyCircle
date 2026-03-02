import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCases } from './useCases';
import type { ImmigrationCase } from '../types';

// @mycircle/shared is already mocked in test/setup.ts

const mockCases: ImmigrationCase[] = [
  { id: '1', receiptNumber: 'IOE0912345678', formType: 'I-485', nickname: 'Green Card', createdAt: { seconds: 1700000000, nanoseconds: 0 } },
  { id: '2', receiptNumber: 'IOE0987654321', formType: 'I-140', nickname: 'EB2', createdAt: { seconds: 1700100000, nanoseconds: 0 } },
];

describe('useCases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    window.__immigrationTracker = {
      getAll: vi.fn().mockResolvedValue(mockCases),
      add: vi.fn().mockResolvedValue('new-id'),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue('mock-token');
  });

  afterEach(() => {
    delete window.__immigrationTracker;
    delete window.__getFirebaseIdToken;
  });

  it('starts with empty cases', () => {
    const { result } = renderHook(() => useCases());
    expect(result.current.cases).toEqual([]);
  });

  it('detects authenticated state', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.authChecked).toBe(true);
    });
  });

  it('detects unauthenticated state when no token', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authChecked).toBe(true);
    });
  });

  it('detects unauthenticated state when token check throws', async () => {
    window.__getFirebaseIdToken = vi.fn().mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.authChecked).toBe(true);
    });
  });

  it('loads cases via getAll when authenticated', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.cases).toHaveLength(2);
    });

    expect(result.current.cases[0].receiptNumber).toBe('IOE0912345678');
    expect(result.current.loading).toBe(false);
    expect(window.__immigrationTracker!.getAll).toHaveBeenCalled();
  });

  it('does not load cases when not authenticated', async () => {
    window.__getFirebaseIdToken = vi.fn().mockResolvedValue(null);
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cases).toEqual([]);
    expect(window.__immigrationTracker!.getAll).not.toHaveBeenCalled();
  });

  it('addCase calls bridge add', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newCase = { receiptNumber: 'IOE1111111111', formType: 'I-765', nickname: 'EAD' };
    let id: string = '';
    await act(async () => {
      id = await result.current.addCase(newCase);
    });

    expect(id).toBe('new-id');
    expect(window.__immigrationTracker!.add).toHaveBeenCalledWith(newCase);
  });

  it('addCase throws when bridge is unavailable', async () => {
    delete window.__immigrationTracker;
    const { result } = renderHook(() => useCases());

    await expect(
      act(async () => {
        await result.current.addCase({ receiptNumber: 'X', formType: 'Y', nickname: 'Z' });
      })
    ).rejects.toThrow('Immigration tracker API not available');
  });

  it('deleteCase calls bridge delete', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteCase('1');
    });

    expect(window.__immigrationTracker!.delete).toHaveBeenCalledWith('1');
  });

  it('deleteCase throws when bridge is unavailable', async () => {
    delete window.__immigrationTracker;
    const { result } = renderHook(() => useCases());

    await expect(
      act(async () => {
        await result.current.deleteCase('1');
      })
    ).rejects.toThrow('Immigration tracker API not available');
  });

  it('uses subscribe when available', async () => {
    const unsubscribe = vi.fn();
    const subscribeFn = vi.fn((callback: (cases: ImmigrationCase[]) => void) => {
      setTimeout(() => callback(mockCases), 0);
      return unsubscribe;
    });
    window.__immigrationTracker!.subscribe = subscribeFn;

    const { result, unmount } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.cases).toHaveLength(2);
      expect(result.current.loading).toBe(false);
    });

    expect(subscribeFn).toHaveBeenCalled();
    expect(window.__immigrationTracker!.getAll).not.toHaveBeenCalled();

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('refresh reloads cases', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedCases = [...mockCases, { id: '3', receiptNumber: 'IOE2222222222', formType: 'I-130', nickname: 'Family', createdAt: { seconds: 0, nanoseconds: 0 } }];
    (window.__immigrationTracker!.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(updatedCases);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.cases).toHaveLength(3);
  });

  it('re-checks auth when AUTH_STATE_CHANGED event fires', async () => {
    const { result } = renderHook(() => useCases());

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    // Switch to unauthenticated
    (window.__getFirebaseIdToken as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    act(() => {
      window.dispatchEvent(new Event('auth-state-changed'));
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
