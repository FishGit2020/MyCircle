import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const HEADS_UP_WORDS = [
  'elephant', 'pizza', 'airplane', 'basketball', 'guitar',
  'butterfly', 'volcano', 'penguin', 'rainbow', 'dinosaur',
  'pirate', 'robot', 'mermaid', 'astronaut', 'ninja',
  'tornado', 'unicorn', 'zombie', 'dragon', 'wizard',
  'surfing', 'karate', 'ballet', 'juggling', 'skiing',
  'banana', 'popcorn', 'hamburger', 'spaghetti', 'chocolate',
  'camera', 'telescope', 'bicycle', 'helicopter', 'submarine',
  'fireworks', 'snowman', 'castle', 'lighthouse', 'waterfall',
  'monkey', 'octopus', 'kangaroo', 'dolphin', 'parrot',
  'sunflower', 'mushroom', 'cactus', 'palm tree', 'snowflake',
  'cowboy', 'superhero', 'clown', 'detective', 'chef',
  'roller coaster', 'trampoline', 'swing', 'slide', 'seesaw',
  'thunder', 'earthquake', 'blizzard', 'sunrise', 'moonlight',
  'dentist', 'teacher', 'firefighter', 'doctor', 'painter',
  'saxophone', 'drums', 'violin', 'trumpet', 'piano',
  'camping', 'fishing', 'hiking', 'swimming', 'dancing',
  'pumpkin', 'watermelon', 'strawberry', 'pineapple', 'coconut',
  'treasure', 'compass', 'anchor', 'crown', 'shield',
  'caterpillar', 'ladybug', 'firefly', 'dragonfly', 'grasshopper',
  'sandbox', 'kite', 'balloon', 'bubble', 'pinwheel',
];

const ROUND_DURATION_MS = 60_000; // 60 seconds per round

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface HeadsUpGameProps {
  onBack: () => void;
}

type GameState = 'menu' | 'ready' | 'playing' | 'over';

export default function HeadsUpGame({ onBack }: HeadsUpGameProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<GameState>('menu');
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_DURATION_MS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    const shuffled = shuffle(HEADS_UP_WORDS);
    setWords(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setSkipped(0);
    setState('ready');
  }, []);

  const beginPlaying = useCallback(() => {
    const now = Date.now();
    setStartTime(now);
    setTimeLeft(ROUND_DURATION_MS);
    setState('playing');

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - now;
      const left = Math.max(0, ROUND_DURATION_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        stopTimer();
        setState('over');
      }
    }, 100);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleGotIt = useCallback(() => {
    setScore(s => s + 1);
    if (currentIndex + 1 >= words.length) {
      stopTimer();
      setState('over');
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, words.length, stopTimer]);

  const handlePass = useCallback(() => {
    setSkipped(s => s + 1);
    if (currentIndex + 1 >= words.length) {
      stopTimer();
      setState('over');
    } else {
      setCurrentIndex(i => i + 1);
    }
  }, [currentIndex, words.length, stopTimer]);

  const elapsed = ROUND_DURATION_MS - timeLeft;
  const secondsLeft = Math.ceil(timeLeft / 1000);

  if (state === 'over') {
    return (
      <GameOver
        gameType="headsup"
        score={score}
        timeMs={elapsed}
        difficulty="party"
        onPlayAgain={startRound}
        onBack={onBack}
      />
    );
  }

  if (state === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('games.headsUp')}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-xs">{t('games.holdUp')}</p>
        <button
          type="button"
          onClick={beginPlaying}
          className="px-8 py-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-2xl text-xl font-bold transition active:scale-95"
        >
          {t('games.ready')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {t('games.backToGames')}
        </button>
      </div>
    );
  }

  if (state === 'playing') {
    const currentWord = words[currentIndex] || '';
    const isLow = secondsLeft <= 10;

    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 select-none">
        {/* Timer */}
        <div className={`text-5xl font-bold font-mono ${isLow ? 'text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500'}`}>
          {secondsLeft}
        </div>

        {/* Word card */}
        <div className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-3xl px-12 py-16 shadow-2xl min-w-[280px] text-center">
          <p className="text-4xl md:text-5xl font-bold uppercase tracking-wide">
            {currentWord}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 w-full max-w-xs">
          <button
            type="button"
            onClick={handlePass}
            className="flex-1 py-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl font-bold text-lg transition active:scale-95"
          >
            {t('games.pass')}
          </button>
          <button
            type="button"
            onClick={handleGotIt}
            className="flex-1 py-4 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl font-bold text-lg transition active:scale-95"
          >
            {t('games.gotIt')}
          </button>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('games.score')}: {score} &middot; {t('games.skipWord')}: {skipped}
        </p>
      </div>
    );
  }

  // Menu state
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-fuchsia-50 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-500">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.headsUp')}</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">{t('games.headsUpDesc')}</p>
      </div>
      <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 rounded-lg px-4 py-2.5 max-w-xs">
        <p className="text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">{t('games.scoringRules' as any)}</p>
        <p className="text-xs text-fuchsia-600 dark:text-fuchsia-400 mt-0.5">{t('games.headsUpRules' as any)}</p>
      </div>
      <button
        type="button"
        onClick={startRound}
        className="px-8 py-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl font-medium transition active:scale-95"
      >
        {t('games.startGame')}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
      >
        {t('games.backToGames')}
      </button>
    </div>
  );
}
