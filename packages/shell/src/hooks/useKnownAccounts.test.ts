import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKnownAccounts } from './useKnownAccounts';

vi.mock('@mycircle/shared', () => ({
  StorageKeys: { KNOWN_ACCOUNTS: 'known-accounts' },
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const makeUser = (uid: string, providerId = 'google.com') => ({
  uid,
  email: `${uid}@example.com`,
  displayName: uid,
  photoURL: null,
  providerData: [{ providerId }],
});

beforeEach(() => {
  localStorage.clear();
});

describe('useKnownAccounts', () => {
  it('starts empty when localStorage is empty', () => {
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.accounts).toEqual([]);
  });

  it('addOrUpdate inserts a new account', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].uid).toBe('user1');
    expect(result.current.accounts[0].providerId).toBe('google.com');
  });

  it('addOrUpdate updates an existing account and moves it to front', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
      result.current.addOrUpdate(makeUser('user2'));
    });

    // user2 should be first
    expect(result.current.accounts[0].uid).toBe('user2');

    // Now update user1 — should move to front
    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
    });

    expect(result.current.accounts[0].uid).toBe('user1');
    expect(result.current.accounts).toHaveLength(2);
  });

  it('respects max 5 accounts', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      for (let i = 0; i < 6; i++) {
        result.current.addOrUpdate(makeUser(`user${i}`));
      }
    });

    expect(result.current.accounts).toHaveLength(5);
    // user5 should be first (most recent), user0 should be dropped
    expect(result.current.accounts[0].uid).toBe('user5');
    expect(result.current.accounts.find((a) => a.uid === 'user0')).toBeUndefined();
  });

  it('remove deletes an account by uid', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
      result.current.addOrUpdate(makeUser('user2'));
    });

    act(() => {
      result.current.remove('user1');
    });

    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].uid).toBe('user2');
  });

  it('getOthers excludes the current user and sorts by recency', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
      result.current.addOrUpdate(makeUser('user2'));
      result.current.addOrUpdate(makeUser('user3'));
    });

    const others = result.current.getOthers('user3');
    expect(others).toHaveLength(2);
    // user2 was added more recently than user1
    expect(others[0].uid).toBe('user2');
    expect(others[1].uid).toBe('user1');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('known-accounts', 'not-json');
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.accounts).toEqual([]);
  });

  it('handles non-array localStorage gracefully', () => {
    localStorage.setItem('known-accounts', '{"foo":"bar"}');
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.accounts).toEqual([]);
  });

  it('filters out entries missing uid or lastSignedInAt', () => {
    localStorage.setItem('known-accounts', JSON.stringify([
      { uid: 'valid', email: 'test@test.com', lastSignedInAt: 1000 },
      { email: 'no-uid@test.com', lastSignedInAt: 2000 },
      { uid: 'no-timestamp', email: 'test2@test.com' },
    ]));
    const { result } = renderHook(() => useKnownAccounts());
    expect(result.current.accounts).toHaveLength(1);
    expect(result.current.accounts[0].uid).toBe('valid');
  });

  it('detects password provider correctly', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('emailUser', 'password'));
    });

    expect(result.current.accounts[0].providerId).toBe('password');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useKnownAccounts());

    act(() => {
      result.current.addOrUpdate(makeUser('user1'));
    });

    const stored = JSON.parse(localStorage.getItem('known-accounts')!);
    expect(stored).toHaveLength(1);
    expect(stored[0].uid).toBe('user1');
  });
});
