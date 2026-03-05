import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const COLORS = ['red', 'green', 'blue', 'yellow'] as const;
type ColorName = typeof COLORS[number];

const COLOR_DISPLAY: Record<ColorName, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308',
};

const COLOR_LABEL_KEYS: Record<ColorName, string> = {
  red: 'games.colorRed',
  green: 'games.colorGreen',
  blue: 'games.colorBlue',
  yellow: 'games.colorYellow',
};

const ROUND_TIME = 30_000;

interface Challenge {
  word: ColorName;     // the text displayed
  displayColor: ColorName; // the CSS color the text is rendered in
}

function generateChallenge(): Challenge {
  const word = COLORS[Math.floor(Math.random() * COLORS.length)];
  // 60% mismatch for Stroop effect
  const mismatch = Math.random() < 0.6;
  let displayColor = word;
  if (mismatch) {
    const others = COLORS.filter(c => c !== word);
    displayColor = others[Math.floor(Math.random() * others.length)];
  }
  return { word, displayColor };
}

export default function ColorMatchGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'menu' | 'playing' | 'over'>('menu');
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_TIME / 1000);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const startGame = useCallback(() => {
    setScore(0);
    setTotal(0);
    setSecondsLeft(ROUND_TIME / 1000);
    setFeedback(null);
    startRef.current = Date.now();
    setChallenge(generateChallenge());
    setPhase('playing');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, Math.ceil((ROUND_TIME - elapsed) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setPhase('over');
      }
    }, 250);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const handleAnswer = useCallback((color: ColorName) => {
    if (phase !== 'playing' || !challenge) return;
    setTotal(n => n + 1);
    // Player must tap the COLOR the text is displayed in, not the word
    if (color === challenge.displayColor) {
      setScore(s => s + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
    setTimeout(() => {
      setFeedback(null);
      setChallenge(generateChallenge());
    }, 300);
  }, [phase, challenge]);

  if (phase === 'over') {
    const finalScore = score * 10;
    return (
      <GameOver
        gameType="colormatch"
        score={finalScore}
        timeMs={ROUND_TIME}
        difficulty="stroop"
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.colorMatch' as any)}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.colorMatchDesc' as any)}</p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{t('games.scoringRules' as any)}</p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{t('games.colorMatchRules' as any)}</p>
        </div>
        <button type="button" onClick={startGame} className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition active:scale-95">
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
      <div className="flex items-center justify-between w-full max-w-xs">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.score')}: {score}/{total}</p>
        <p className={`text-sm font-bold ${secondsLeft <= 5 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{secondsLeft}s</p>
      </div>

      {challenge && (
        <div className={`py-8 px-12 rounded-2xl text-center transition ${
          feedback === 'correct' ? 'bg-green-50 dark:bg-green-900/20' :
          feedback === 'incorrect' ? 'bg-red-50 dark:bg-red-900/20' :
          'bg-gray-50 dark:bg-gray-800'
        }`}>
          <p className="text-5xl font-black uppercase select-none" style={{ color: COLOR_DISPLAY[challenge.displayColor] }}>
            {t(COLOR_LABEL_KEYS[challenge.word] as any)}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">{t('games.colorMatchHint' as any)}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 w-64">
        {COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => handleAnswer(color)}
            className="py-4 rounded-xl text-white font-bold text-sm transition active:scale-95"
            style={{ backgroundColor: COLOR_DISPLAY[color] }}
          >
            {t(COLOR_LABEL_KEYS[color] as any)}
          </button>
        ))}
      </div>
    </div>
  );
}
