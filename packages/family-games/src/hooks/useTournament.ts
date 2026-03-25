import { useState, useCallback, useEffect } from 'react';
import { StorageKeys } from '@mycircle/shared';
import type { PlayerProfile } from './usePlayerProfiles';

export interface TournamentScore {
  playerId: string;
  gameType: string;
  round: number;
  score: number;
  timeMs: number;
  difficulty: string;
  recordedAt: string;
}

export type TournamentStatus = 'idle' | 'handoff' | 'playing' | 'results';

export interface TournamentSession {
  id: string;
  players: PlayerProfile[];
  gameList: string[];
  roundCount: number;
  status: TournamentStatus;
  currentRound: number;
  currentPlayerIndex: number;
  currentGameIndex: number;
  scores: TournamentScore[];
  startedAt: string;
  completedAt?: string;
}

function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadSession(): TournamentSession | null {
  try {
    const raw = localStorage.getItem(StorageKeys.FAMILY_GAMES_TOURNAMENT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveSession(session: TournamentSession | null): void {
  try {
    if (session === null) {
      localStorage.removeItem(StorageKeys.FAMILY_GAMES_TOURNAMENT);
    } else {
      localStorage.setItem(StorageKeys.FAMILY_GAMES_TOURNAMENT, JSON.stringify(session));
    }
  } catch {
    // Storage unavailable — ignore
  }
}

export function totalScoreByPlayer(session: TournamentSession): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const s of session.scores) {
    totals[s.playerId] = (totals[s.playerId] ?? 0) + s.score;
  }
  return totals;
}

export function rankingByPlayer(session: TournamentSession): Array<{ player: PlayerProfile; total: number; rank: number }> {
  const totals = totalScoreByPlayer(session);
  const entries = session.players.map(p => ({ player: p, total: totals[p.id] ?? 0 }));
  entries.sort((a, b) => b.total - a.total);
  let rank = 1;
  return entries.map((e, i) => {
    if (i > 0 && e.total < entries[i - 1].total) rank = i + 1;
    return { ...e, rank };
  });
}

export function useTournament() {
  const [session, setSession] = useState<TournamentSession | null>(() => loadSession());

  useEffect(() => {
    saveSession(session);
  }, [session]);

  const startSession = useCallback((players: PlayerProfile[], games: string[], rounds: number) => {
    const newSession: TournamentSession = {
      id: generateId(),
      players,
      gameList: games,
      roundCount: rounds,
      status: 'handoff',
      currentRound: 1,
      currentPlayerIndex: 0,
      currentGameIndex: 0,
      scores: [],
      startedAt: new Date().toISOString(),
    };
    setSession(newSession);
  }, []);

  const beginTurn = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;
      return { ...prev, status: 'playing' };
    });
  }, []);

  const recordTurnScore = useCallback((score: number, timeMs: number, difficulty: string) => {
    setSession(prev => {
      if (!prev) return prev;
      const entry: TournamentScore = {
        playerId: prev.players[prev.currentPlayerIndex].id,
        gameType: prev.gameList[prev.currentGameIndex],
        round: prev.currentRound,
        score,
        timeMs,
        difficulty,
        recordedAt: new Date().toISOString(),
      };
      return { ...prev, scores: [...prev.scores, entry] };
    });
  }, []);

  const advanceTurn = useCallback(() => {
    setSession(prev => {
      if (!prev) return prev;

      const totalPlayers = prev.players.length;
      const totalGames = prev.gameList.length;
      const nextPlayerIdx = prev.currentPlayerIndex + 1;

      // Still more players in this round for this game
      if (nextPlayerIdx < totalPlayers) {
        return { ...prev, status: 'handoff', currentPlayerIndex: nextPlayerIdx };
      }

      // All players done with this game — move to next game
      const nextGameIdx = prev.currentGameIndex + 1;
      if (nextGameIdx < totalGames) {
        return { ...prev, status: 'handoff', currentPlayerIndex: 0, currentGameIndex: nextGameIdx };
      }

      // All games done — check rounds
      const nextRound = prev.currentRound + 1;
      if (nextRound <= prev.roundCount) {
        return { ...prev, status: 'handoff', currentPlayerIndex: 0, currentGameIndex: 0, currentRound: nextRound };
      }

      // Tournament complete
      return { ...prev, status: 'results', completedAt: new Date().toISOString() };
    });
  }, []);

  const resetSession = useCallback(() => {
    setSession(null);
  }, []);

  const currentTurn = session && session.status !== 'idle' && session.status !== 'results'
    ? {
        player: session.players[session.currentPlayerIndex],
        gameType: session.gameList[session.currentGameIndex],
        round: session.currentRound,
      }
    : null;

  const isComplete = session?.status === 'results';

  return { session, startSession, beginTurn, recordTurnScore, advanceTurn, resetSession, currentTurn, isComplete };
}
