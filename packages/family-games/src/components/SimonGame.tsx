import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const COLORS = ['red', 'green', 'blue', 'yellow'] as const;
type Color = typeof COLORS[number];
const COLOR_CLASSES: Record<Color, { idle: string; active: string }> = {
  red:    { idle: 'bg-red-500 dark:bg-red-600',       active: 'bg-red-300 dark:bg-red-400 scale-105' },
  green:  { idle: 'bg-green-500 dark:bg-green-600',   active: 'bg-green-300 dark:bg-green-400 scale-105' },
  blue:   { idle: 'bg-blue-500 dark:bg-blue-600',     active: 'bg-blue-300 dark:bg-blue-400 scale-105' },
  yellow: { idle: 'bg-yellow-500 dark:bg-yellow-600', active: 'bg-yellow-300 dark:bg-yellow-400 scale-105' },
};

type Phase = 'menu' | 'showing' | 'input' | 'over';

export default function SimonGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [sequence, setSequence] = useState<Color[]>([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [score, setScore] = useState(0);
  const startTimeRef = useRef(Date.now());
  const showingRef = useRef(false);

  const _addToSequence = useCallback(() => {
    const next = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence(prev => [...prev, next]);
  }, []);

  const playSequence = useCallback((seq: Color[]) => {
    showingRef.current = true;
    setPhase('showing');
    let i = 0;
    const interval = setInterval(() => {
      if (i < seq.length) {
        setActiveColor(seq[i]);
        setTimeout(() => setActiveColor(null), 400);
        i++;
      } else {
        clearInterval(interval);
        showingRef.current = false;
        setPlayerIndex(0);
        setPhase('input');
      }
    }, 700);
  }, []);

  const startGame = useCallback(() => {
    const first = COLORS[Math.floor(Math.random() * COLORS.length)];
    setSequence([first]);
    setScore(0);
    setPlayerIndex(0);
    startTimeRef.current = Date.now();
    setTimeout(() => playSequence([first]), 500);
  }, [playSequence]);

  const handlePress = useCallback((color: Color) => {
    if (phase !== 'input' || showingRef.current) return;

    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    if (color !== sequence[playerIndex]) {
      setScore(sequence.length - 1);
      setPhase('over');
      return;
    }

    const nextIndex = playerIndex + 1;
    if (nextIndex >= sequence.length) {
      // Completed the sequence — add one more
      setScore(sequence.length);
      setPlayerIndex(0);
      const next = COLORS[Math.floor(Math.random() * COLORS.length)];
      const newSeq = [...sequence, next];
      setSequence(newSeq);
      setTimeout(() => playSequence(newSeq), 800);
    } else {
      setPlayerIndex(nextIndex);
    }
  }, [phase, sequence, playerIndex, playSequence]);

  if (phase === 'over') {
    return (
      <GameOver
        gameType="simon"
        score={score * 100}
        timeMs={Date.now() - startTimeRef.current}
        difficulty="pattern"
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-yellow-50 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.simonSays' as any)}</h2> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.simonDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">{t('games.scoringRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">{t('games.simonRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <button type="button" onClick={startGame} className="px-8 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-medium transition active:scale-95">
          {t('games.startGame')}
        </button>
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          {t('games.backToGames')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('games.round' as any)} {sequence.length} &middot; {phase === 'showing' ? t('games.simonWatch' as any) : t('games.simonRepeat' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </p>
      <div className="grid grid-cols-2 gap-3 w-64 h-64">
        {COLORS.map(color => (
          <button
            key={color}
            type="button"
            disabled={phase !== 'input'}
            onClick={() => handlePress(color)}
            className={`rounded-2xl transition-all duration-200 ${
              activeColor === color ? COLOR_CLASSES[color].active : COLOR_CLASSES[color].idle
            } ${phase === 'input' ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-80'}`}
            aria-label={color}
          />
        ))}
      </div>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{t('games.score')}: {score * 100}</p>
    </div>
  );
}
