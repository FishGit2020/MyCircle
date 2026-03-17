import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const ROUNDS = 5;
const MIN_DELAY = 1500;
const MAX_DELAY = 4000;

type Phase = 'menu' | 'waiting' | 'ready' | 'result' | 'over';

export default function ReactionGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [times, setTimes] = useState<number[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [tooEarly, setTooEarly] = useState(false);
  const readyAtRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const startTimeRef = useRef(0);

  const startRound = useCallback(() => {
    setTooEarly(false);
    setPhase('waiting');
    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timerRef.current = setTimeout(() => {
      readyAtRef.current = Date.now();
      setPhase('ready');
    }, delay);
  }, []);

  const handleTap = useCallback(() => {
    if (phase === 'waiting') {
      clearTimeout(timerRef.current);
      setTooEarly(true);
      setPhase('result');
      return;
    }
    if (phase === 'ready') {
      const reactionMs = Date.now() - readyAtRef.current;
      setCurrentTime(reactionMs);
      setTimes(prev => {
        const next = [...prev, reactionMs];
        if (next.length >= ROUNDS) {
          setTimeout(() => setPhase('over'), 1500);
        }
        return next;
      });
      setPhase('result');
    }
  }, [phase]);

  const handleNext = useCallback(() => {
    if (times.length >= ROUNDS) {
      setPhase('over');
    } else {
      startRound();
    }
  }, [times.length, startRound]);

  const startGame = useCallback(() => {
    setTimes([]);
    setCurrentTime(0);
    startTimeRef.current = Date.now();
    startRound();
  }, [startRound]);

  if (phase === 'over') {
    const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 999;
    const score = Math.max(0, Math.round(1000 - avg));
    return (
      <GameOver
        gameType="reaction"
        score={score}
        timeMs={Date.now() - startTimeRef.current}
        difficulty="reflex"
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.reactionTime' as any)}</h2> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-sm text-gray-500 dark:text-gray-400">{ROUNDS} {t('games.round' as any)}s</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-red-700 dark:text-red-300">{t('games.scoringRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{t('games.reactionRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <button type="button" onClick={startGame} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition active:scale-95">
          {t('games.startGame')}
        </button>
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          {t('games.backToGames')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.round' as any)} {times.length + 1}/{ROUNDS}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}

      {phase === 'waiting' && (
        <button
          type="button"
          onClick={handleTap}
          className="w-64 h-64 rounded-3xl bg-red-500 flex items-center justify-center text-white text-xl font-bold transition active:scale-95"
        >
          {t('games.reactionWait' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      )}

      {phase === 'ready' && (
        <button
          type="button"
          onClick={handleTap}
          className="w-64 h-64 rounded-3xl bg-green-500 flex items-center justify-center text-white text-xl font-bold transition active:scale-95 animate-pulse"
        >
          {t('games.reactionTap' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </button>
      )}

      {phase === 'result' && (
        <div className="text-center space-y-4">
          {tooEarly ? (
            <div className="w-64 h-64 rounded-3xl bg-yellow-500 flex items-center justify-center">
              <p className="text-white text-xl font-bold">{t('games.reactionTooEarly' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </div>
          ) : (
            <div className="w-64 h-64 rounded-3xl bg-blue-500 flex items-center justify-center flex-col">
              <p className="text-white text-4xl font-bold">{currentTime}ms</p>
            </div>
          )}
          <button type="button" onClick={tooEarly ? startRound : handleNext} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-900 dark:text-white transition">
            {t('games.nextQuestion')}
          </button>
        </div>
      )}
    </div>
  );
}
