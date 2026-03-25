import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import Timer from './Timer';
import { BEAT_THE_CLOCK_PROMPTS } from '../data/beatTheClockPrompts';
import type { BeatTheClockCategory } from '../data/beatTheClockPrompts';

const CATEGORIES: BeatTheClockCategory[] = ['animals', 'foods', 'countries', 'colors', 'movies'];

const CATEGORY_KEYS: Record<BeatTheClockCategory, string> = {
  animals: 'games.category.animals',
  foods: 'games.category.foods',
  countries: 'games.category.countries',
  colors: 'games.category.colors',
  movies: 'games.category.movies',
};

const DURATIONS: { label: string; ms: number }[] = [
  { label: '30s', ms: 30_000 },
  { label: '60s', ms: 60_000 },
  { label: '90s', ms: 90_000 },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface BeatTheClockProps {
  onBack: () => void;
  onTurnComplete?: (score: number, timeMs: number) => void;
}

type Phase = 'setup' | 'playing' | 'over';

export default function BeatTheClock({ onBack, onTurnComplete }: BeatTheClockProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('setup');
  const [category, setCategory] = useState<BeatTheClockCategory>('animals');
  const [durationMs, setDurationMs] = useState(60_000);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [confirmed, setConfirmed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const startRef = useRef(Date.now());

  const startGame = useCallback(() => {
    const shuffled = shuffle([...BEAT_THE_CLOCK_PROMPTS[category]]);
    setPrompts(shuffled);
    setCurrentIndex(0);
    setConfirmed(0);
    setExhausted(false);
    startRef.current = Date.now();
    setPhase('playing');
    setTimerRunning(true);
  }, [category]);

  const handleGotIt = useCallback(() => {
    const next = currentIndex + 1;
    const newConfirmed = confirmed + 1;
    setConfirmed(newConfirmed);
    if (next >= prompts.length) {
      setExhausted(true);
      setTimerRunning(false);
      setPhase('over');
    } else {
      setCurrentIndex(next);
    }
  }, [currentIndex, confirmed, prompts.length]);

  const handleTimeUp = useCallback(() => {
    setTimerRunning(false);
    setPhase('over');
  }, []);

  if (phase === 'over') {
    const elapsed = Date.now() - startRef.current;
    if (onTurnComplete) { onTurnComplete(confirmed, elapsed); return null; }
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <p className="text-5xl">🎉</p>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {exhausted ? t('games.youNamedThemAll' as any) : t('games.gameOver')} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          </h2>
          <p className="text-5xl font-bold text-fuchsia-600 dark:text-fuchsia-400 mt-4">{confirmed}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('games.confirmed' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <div className="flex gap-3 w-full max-w-xs">
          <button type="button" onClick={startGame}
            className="flex-1 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-medium transition active:scale-95">
            {t('games.playAgain')}
          </button>
          <button type="button" onClick={onBack}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition">
            {t('games.backToGames')}
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'playing') {
    const currentPrompt = prompts[currentIndex] ?? '';
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 px-4 select-none">
        <div className="w-full max-w-xs">
          <Timer durationMs={durationMs} running={timerRunning} onTimeUp={handleTimeUp} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('games.confirmed' as any)}: <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">{confirmed}</span> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
        <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-3xl px-10 py-14 shadow-2xl min-w-[260px] text-center">
          <p className="text-3xl md:text-4xl font-bold uppercase tracking-wide">{currentPrompt}</p>
        </div>
        <button
          type="button"
          onClick={handleGotIt}
          className="w-full max-w-xs py-5 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white rounded-2xl font-bold text-xl transition active:scale-95 min-h-[64px]"
        >
          {t('games.gotIt')}! ✓
        </button>
      </div>
    );
  }

  // Setup screen
  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-500">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('games.beatTheClock' as any)}</h2> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('games.beatTheClockDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </div>

      {/* Category */}
      <div className="w-full">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('games.chooseCategory' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`py-2.5 px-3 rounded-lg text-sm font-medium transition ${
                category === cat
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t(CATEGORY_KEYS[cat] as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div className="w-full">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('games.duration' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button
              key={d.ms}
              type="button"
              onClick={() => setDurationMs(d.ms)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                durationMs === d.ms
                  ? 'bg-fuchsia-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={startGame}
        className="w-full py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-bold text-lg transition active:scale-95">
        {t('games.startGame')}
      </button>
      <button type="button" onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
        {t('games.backToGames')}
      </button>
    </div>
  );
}
