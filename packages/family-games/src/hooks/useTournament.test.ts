import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTournament } from './useTournament';
import type { PlayerProfile } from './usePlayerProfiles';

const STORAGE_KEY = 'family-games-tournament';

const makePlayers = (n: number): PlayerProfile[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    displayName: `Player ${i + 1}`,
    avatarColor: 'blue' as const,
    totalWins: 0,
    personalBests: {},
    createdAt: '',
    updatedAt: '',
  }));

describe('useTournament', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('starts with no session', () => {
    const { result } = renderHook(() => useTournament());
    expect(result.current.session).toBeNull();
    expect(result.current.isComplete).toBe(false);
    expect(result.current.currentTurn).toBeNull();
  });

  it('startSession creates a session in handoff status', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia', 'math'], 1); });
    expect(result.current.session).not.toBeNull();
    expect(result.current.session?.status).toBe('handoff');
    expect(result.current.session?.currentPlayerIndex).toBe(0);
    expect(result.current.session?.currentGameIndex).toBe(0);
    expect(result.current.session?.currentRound).toBe(1);
  });

  it('beginTurn transitions from handoff to playing', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia'], 1); });
    act(() => { result.current.beginTurn(); });
    expect(result.current.session?.status).toBe('playing');
  });

  it('recordTurnScore saves score entry', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia'], 1); });
    act(() => { result.current.beginTurn(); });
    act(() => { result.current.recordTurnScore(200, 30000, 'medium'); });
    expect(result.current.session?.scores).toHaveLength(1);
    expect(result.current.session?.scores[0].score).toBe(200);
    expect(result.current.session?.scores[0].playerId).toBe('p0');
  });

  it('advanceTurn moves to next player (handoff)', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(3), ['trivia'], 1); });
    act(() => { result.current.beginTurn(); });
    act(() => { result.current.recordTurnScore(100, 10000, 'easy'); });
    act(() => { result.current.advanceTurn(); });
    expect(result.current.session?.status).toBe('handoff');
    expect(result.current.session?.currentPlayerIndex).toBe(1);
  });

  it('advanceTurn after last player moves to next game', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia', 'math'], 1); });
    // Player 0 plays trivia
    act(() => { result.current.beginTurn(); result.current.recordTurnScore(100, 10000, 'easy'); result.current.advanceTurn(); });
    // Player 1 plays trivia
    act(() => { result.current.beginTurn(); result.current.recordTurnScore(200, 12000, 'easy'); result.current.advanceTurn(); });
    expect(result.current.session?.currentGameIndex).toBe(1);
    expect(result.current.session?.currentPlayerIndex).toBe(0);
  });

  it('session completes after all rounds/games/players finish', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia'], 1); });
    // Player 0
    act(() => { result.current.beginTurn(); result.current.recordTurnScore(100, 10000, 'easy'); result.current.advanceTurn(); });
    // Player 1
    act(() => { result.current.beginTurn(); result.current.recordTurnScore(200, 12000, 'easy'); result.current.advanceTurn(); });
    expect(result.current.isComplete).toBe(true);
    expect(result.current.session?.status).toBe('results');
  });

  it('session is persisted and restored from localStorage', () => {
    const { result, unmount } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia'], 1); });
    const sessionId = result.current.session?.id;
    unmount();

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();

    const { result: result2 } = renderHook(() => useTournament());
    expect(result2.current.session?.id).toBe(sessionId);
  });

  it('resetSession clears state and localStorage', () => {
    const { result } = renderHook(() => useTournament());
    act(() => { result.current.startSession(makePlayers(2), ['trivia'], 1); });
    act(() => { result.current.resetSession(); });
    expect(result.current.session).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
