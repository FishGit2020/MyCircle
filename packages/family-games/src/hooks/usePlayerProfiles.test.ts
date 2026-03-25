import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayerProfiles } from './usePlayerProfiles';

const STORAGE_KEY = 'family-games-profiles';

describe('usePlayerProfiles', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with empty profiles when localStorage is empty', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    expect(result.current.profiles).toHaveLength(0);
  });

  it('loads existing profiles from localStorage on mount', () => {
    const existing = [
      { id: '1', displayName: 'Alice', avatarColor: 'blue', totalWins: 2, personalBests: {}, createdAt: '', updatedAt: '' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    const { result } = renderHook(() => usePlayerProfiles());
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].displayName).toBe('Alice');
  });

  it('addProfile creates a profile and persists it', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    act(() => { result.current.addProfile('Bob', 'red'); });
    expect(result.current.profiles).toHaveLength(1);
    expect(result.current.profiles[0].displayName).toBe('Bob');
    expect(result.current.profiles[0].avatarColor).toBe('red');
    expect(result.current.profiles[0].totalWins).toBe(0);
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
  });

  it('trims and caps displayName at 20 characters', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    act(() => { result.current.addProfile('  A very long name that exceeds limit  ', 'green'); });
    expect(result.current.profiles[0].displayName.length).toBeLessThanOrEqual(20);
    expect(result.current.profiles[0].displayName.startsWith(' ')).toBe(false);
  });

  it('updateProfile changes displayName', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    let id = '';
    act(() => { id = result.current.addProfile('Carol', 'teal').id; });
    act(() => { result.current.updateProfile(id, { displayName: 'Carolyn' }); });
    expect(result.current.profiles[0].displayName).toBe('Carolyn');
  });

  it('removeProfile deletes the profile', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    let id = '';
    act(() => { id = result.current.addProfile('Dave', 'orange').id; });
    act(() => { result.current.removeProfile(id); });
    expect(result.current.profiles).toHaveLength(0);
  });

  it('updatePersonalBest stores a new best', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    let id = '';
    act(() => { id = result.current.addProfile('Eve', 'purple').id; });
    act(() => {
      result.current.updatePersonalBest(id, 'trivia', { score: 500, timeMs: 30000, difficulty: 'medium', achievedAt: new Date().toISOString() });
    });
    expect(result.current.profiles[0].personalBests['trivia']?.score).toBe(500);
  });

  it('updatePersonalBest does not replace a higher existing best', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    let id = '';
    act(() => { id = result.current.addProfile('Frank', 'yellow').id; });
    act(() => {
      result.current.updatePersonalBest(id, 'math', { score: 800, timeMs: 20000, difficulty: 'hard', achievedAt: new Date().toISOString() });
    });
    act(() => {
      result.current.updatePersonalBest(id, 'math', { score: 400, timeMs: 25000, difficulty: 'easy', achievedAt: new Date().toISOString() });
    });
    expect(result.current.profiles[0].personalBests['math']?.score).toBe(800);
  });

  it('incrementWins increases totalWins by 1', () => {
    const { result } = renderHook(() => usePlayerProfiles());
    let id = '';
    act(() => { id = result.current.addProfile('Grace', 'pink').id; });
    act(() => { result.current.incrementWins(id); });
    expect(result.current.profiles[0].totalWins).toBe(1);
  });
});
