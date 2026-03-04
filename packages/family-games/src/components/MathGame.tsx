import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

type Difficulty = 'easy' | 'medium' | 'hard';
type Op = '+' | '-' | '\u00d7' | '\u00f7';

const NUMPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '='],
];

const GAME_DURATION_MS = 60_000;

function generateProblem(difficulty: Difficulty): { a: number; b: number; op: Op; answer: number } {
  const ops: Op[] = difficulty === 'easy' ? ['+', '-'] : difficulty === 'medium' ? ['+', '-', '\u00d7'] : ['+', '-', '\u00d7', '\u00f7'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let a: number, b: number, answer: number;
  const max = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 50 : 200;

  switch (op) {
    case '+':
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * max) + 1;
      answer = a + b;
      break;
    case '-':
      a = Math.floor(Math.random() * max) + 1;
      b = Math.floor(Math.random() * a) + 1; // ensure non-negative
      answer = a - b;
      break;
    case '\u00d7':
      a = Math.floor(Math.random() * (difficulty === 'hard' ? 20 : 12)) + 1;
      b = Math.floor(Math.random() * (difficulty === 'hard' ? 20 : 12)) + 1;
      answer = a * b;
      break;
    case '\u00f7':
      b = Math.floor(Math.random() * 12) + 1;
      answer = Math.floor(Math.random() * 12) + 1;
      a = b * answer; // ensures clean division
      break;
    default:
      a = 1; b = 1; answer = 2;
  }

  return { a, b, op, answer };
}

interface MathGameProps {
  onBack: () => void;
}

type Phase = 'menu' | 'playing' | 'over';

export default function MathGame({ onBack }: MathGameProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [problem, setProblem] = useState(() => generateProblem('easy'));
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);
  const startRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    setDifficulty(diff);
    setProblem(generateProblem(diff));
    setInput('');
    setScore(0);
    setStreak(0);
    setFeedback(null);
    setTimeLeft(GAME_DURATION_MS);
    setPhase('playing');
    startRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, GAME_DURATION_MS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        stopTimer();
        setPhase('over');
      }
    }, 100);
  }, [stopTimer]);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const submitAnswer = useCallback(() => {
    const userAnswer = parseInt(input, 10);
    if (isNaN(userAnswer)) return;

    if (userAnswer === problem.answer) {
      const points = (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30) + streak * 5;
      setScore(s => s + points);
      setStreak(s => s + 1);
      setFeedback('correct');
    } else {
      setStreak(0);
      setFeedback('incorrect');
    }

    setTimeout(() => {
      setProblem(generateProblem(difficulty));
      setInput('');
      setFeedback(null);
    }, 400);
  }, [input, problem, difficulty, streak]);

  const handleKey = useCallback((key: string) => {
    if (phase !== 'playing') return;
    if (key >= '0' && key <= '9') {
      setInput(prev => prev + key);
    } else if (key === 'C') {
      setInput('');
    } else if (key === 'Backspace') {
      setInput(prev => prev.slice(0, -1));
    } else if (key === '=' || key === 'Enter') {
      submitAnswer();
    }
  }, [phase, submitAnswer]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if ((e.key >= '0' && e.key <= '9') || e.key === 'Backspace' || e.key === 'Enter') {
        e.preventDefault();
        handleKey(e.key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  if (phase === 'over') {
    const elapsed = Date.now() - startRef.current;
    return (
      <GameOver
        gameType="math"
        score={score}
        timeMs={Math.min(elapsed, GAME_DURATION_MS)}
        difficulty={difficulty}
        onPlayAgain={() => startGame(difficulty)}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.mathChallenge')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">60s &middot; {t('games.difficulty')}</p>
        </div>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => startGame(d)}
              className={`px-6 py-3 rounded-xl font-medium transition active:scale-95 ${
                d === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50' :
                d === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              {t(`games.${d}` as 'games.easy' | 'games.medium' | 'games.hard')}
            </button>
          ))}
        </div>
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

  const seconds = Math.ceil(timeLeft / 1000);
  const pct = (timeLeft / GAME_DURATION_MS) * 100;
  const isLow = seconds <= 10;

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className={`text-lg font-mono font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-gray-700 dark:text-gray-300'}`}>
          {seconds}s
        </span>
        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
          {t('games.score')}: {score}
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${isLow ? 'bg-red-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Problem */}
      <div className={`bg-white dark:bg-gray-800 rounded-2xl border-2 p-8 text-center transition ${
        feedback === 'correct' ? 'border-green-400 dark:border-green-500' :
        feedback === 'incorrect' ? 'border-red-400 dark:border-red-500' :
        'border-gray-200 dark:border-gray-700'
      }`}>
        <p className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white font-mono">
          {problem.a} {problem.op} {problem.b}
        </p>
        {streak > 2 && (
          <p className="text-xs text-orange-500 mt-2 font-medium">
            Streak: {streak}x
          </p>
        )}
      </div>

      {/* Answer display */}
      <div
        className="w-full px-4 py-3 text-center text-2xl font-mono font-bold bg-gray-50 dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white min-h-[52px]"
        aria-label="Answer"
        aria-live="polite"
      >
        {input || <span className="text-gray-400 dark:text-gray-500">?</span>}
      </div>

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-2">
        {NUMPAD_KEYS.flat().map(key => (
          <button
            key={key}
            type="button"
            onClick={() => handleKey(key)}
            className={`h-14 rounded-xl font-bold text-xl transition active:scale-95 ${
              key === '='
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : key === 'C'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {feedback && (
        <p className={`text-center text-sm font-medium ${
          feedback === 'correct' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          {feedback === 'correct' ? t('games.correct') : `${t('games.incorrect')} (${problem.answer})`}
        </p>
      )}
    </div>
  );
}
