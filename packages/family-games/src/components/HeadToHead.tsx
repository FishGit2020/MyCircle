import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';

const GAMES_AVAILABLE = [
  { id: 'trivia', labelKey: 'games.trivia' },
  { id: 'math', labelKey: 'games.mathChallenge' },
  { id: 'word', labelKey: 'games.wordGame' },
  { id: 'headsup', labelKey: 'games.headsUp' },
  { id: 'reaction', labelKey: 'games.reactionTime' },
  { id: 'simon', labelKey: 'games.simonSays' },
  { id: 'sequence', labelKey: 'games.numberSequence' },
  { id: 'anagram', labelKey: 'games.anagram' },
  { id: 'beatclock', labelKey: 'games.beatTheClock' },
];

interface HeadToHeadProps {
  onBack: () => void;
}

type H2HPhase = 'setup' | 'p1turn' | 'p1done' | 'p2turn' | 'results';

interface PlayerResult {
  name: string;
  score: number;
  timeMs: number;
}

export default function HeadToHead({ onBack }: HeadToHeadProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<H2HPhase>('setup');
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [selectedGame, setSelectedGame] = useState('trivia');
  const [p1Result, setP1Result] = useState<PlayerResult | null>(null);
  const [p2Result, setP2Result] = useState<PlayerResult | null>(null);
  const [GameComp, setGameComp] = useState<React.ComponentType<{ onBack: () => void; onGameEnd?: (score: number, timeMs: number) => void }> | null>(null);
  const [_error, _setError] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const loadGame = useCallback(async (gameId: string) => {
    try {
      let mod: { default: React.ComponentType<{ onBack: () => void; onGameEnd?: (score: number, timeMs: number) => void }> };
      switch (gameId) {
        case 'trivia':    mod = await import('./TriviaGame'); break;
        case 'math':      mod = await import('./MathGame'); break;
        case 'word':      mod = await import('./WordGame'); break;
        case 'headsup':   mod = await import('./HeadsUpGame'); break;
        case 'reaction':  mod = await import('./ReactionGame'); break;
        case 'simon':     mod = await import('./SimonGame'); break;
        case 'sequence':  mod = await import('./SequenceGame'); break;
        case 'anagram':   mod = await import('./AnagramGame'); break;
        case 'beatclock': mod = await import('./BeatTheClock'); break;
        default: return;
      }
      if (isMountedRef.current) setGameComp(() => mod.default);
    } catch { /* load failed */ }
  }, []);

  const startH2H = () => {
    const p1 = player1.trim() || `${t('games.playerName' as any)} 1`; // eslint-disable-line @typescript-eslint/no-explicit-any
    const p2 = player2.trim() || `${t('games.playerName' as any)} 2`; // eslint-disable-line @typescript-eslint/no-explicit-any
    setPlayer1(p1);
    setPlayer2(p2);
    setP1Result(null);
    setP2Result(null);
    loadGame(selectedGame);
    setPhase('p1turn');
  };

  const handleP1Done = (score: number, timeMs: number) => {
    setP1Result({ name: player1.trim() || `${t('games.playerName' as any)} 1`, score, timeMs }); // eslint-disable-line @typescript-eslint/no-explicit-any
    setGameComp(null);
    setPhase('p1done');
  };

  const handleP2Start = () => {
    loadGame(selectedGame);
    setPhase('p2turn');
  };

  const handleP2Done = (score: number, timeMs: number) => {
    setP2Result({ name: player2.trim() || `${t('games.playerName' as any)} 2`, score, timeMs }); // eslint-disable-line @typescript-eslint/no-explicit-any
    setGameComp(null);
    setPhase('results');
  };

  const reset = () => {
    setPhase('setup');
    setP1Result(null);
    setP2Result(null);
    setGameComp(null);
  };

  // ── Setup ─────────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-5 py-6 px-4 max-w-sm mx-auto">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('games.headToHead' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('games.h2hDesc' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={player1}
            onChange={e => setPlayer1(e.target.value)}
            placeholder={`${t('games.playerName' as any)} 1`} // eslint-disable-line @typescript-eslint/no-explicit-any
            maxLength={20}
            aria-label="Player 1 name"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
          <input
            type="text"
            value={player2}
            onChange={e => setPlayer2(e.target.value)}
            placeholder={`${t('games.playerName' as any)} 2`} // eslint-disable-line @typescript-eslint/no-explicit-any
            maxLength={20}
            aria-label="Player 2 name"
            className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
          />
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('games.chooseGames' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {GAMES_AVAILABLE.map(g => (
              <button
                key={g.id}
                type="button"
                onClick={() => setSelectedGame(g.id)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition ${
                  selectedGame === g.id
                    ? 'bg-fuchsia-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t(g.labelKey as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </button>
            ))}
          </div>
        </div>


        <button
          type="button"
          onClick={startH2H}
          className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold text-base transition active:scale-95"
        >
          {t('games.startGame')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition text-center"
        >
          {t('games.backToGames')}
        </button>
      </div>
    );
  }

  // ── P1 handoff cover ──────────────────────────────────────────────────────────
  if (phase === 'p1turn' && !GameComp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4">
        <p className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          {t('games.passDeviceTo' as any, { player: player1 })} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">{t('games.handoffInstruction' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <div className="w-8 h-8 rounded-full border-4 border-fuchsia-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  // ── P1 playing ────────────────────────────────────────────────────────────────
  if (phase === 'p1turn' && GameComp) {
    return <GameComp onBack={reset} onGameEnd={handleP1Done} />;
  }

  // ── Handoff to P2 ─────────────────────────────────────────────────────────────
  if (phase === 'p1done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 text-center">
        <p className="text-2xl">🎉</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">
          {player1}: <span className="text-fuchsia-600 dark:text-fuchsia-400 font-bold">{p1Result?.score ?? 0}</span>
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('games.passDeviceTo' as any, { player: player2 })} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <button
          type="button"
          onClick={handleP2Start}
          className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold transition active:scale-95 min-h-[48px]"
        >
          {t('games.tapToStart' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      </div>
    );
  }

  // ── P2 playing ────────────────────────────────────────────────────────────────
  if (phase === 'p2turn' && GameComp) {
    return <GameComp onBack={reset} onGameEnd={handleP2Done} />;
  }

  // ── P2 loading ────────────────────────────────────────────────────────────────
  if (phase === 'p2turn' && !GameComp) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-8 h-8 rounded-full border-4 border-fuchsia-500 border-t-transparent animate-spin" aria-label="Loading" />
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────────
  if (phase === 'results' && p1Result && p2Result) {
    const p1Wins = p1Result.score > p2Result.score;
    const p2Wins = p2Result.score > p1Result.score;
    const tie = p1Result.score === p2Result.score;

    return (
      <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-sm mx-auto text-center">
        <p className="text-4xl">{tie ? '🤝' : '🏆'}</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {tie
            ? t('games.tie' as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            : `${p1Wins ? p1Result.name : p2Result.name} ${t('games.winner' as any)}`} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>

        <div className="w-full flex flex-col gap-3">
          {[p1Result, p2Result].map((r, idx) => {
            const isWinner = (idx === 0 && p1Wins) || (idx === 1 && p2Wins);
            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  isWinner
                    ? 'border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-900/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                <span className={`text-2xl font-bold ${isWinner ? 'text-fuchsia-600 dark:text-fuchsia-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {r.score}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 w-full">
          <button
            type="button"
            onClick={reset}
            className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-medium transition active:scale-95"
          >
            {t('games.playAgain')}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {t('games.backToGames')}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
