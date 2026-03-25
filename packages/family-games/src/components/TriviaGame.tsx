import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import triviaQuestions from '../data/triviaQuestions';
import Timer from './Timer';
import GameOver from './GameOver';

const QUESTIONS_PER_ROUND = 10;
const TIME_PER_QUESTION_MS = 15_000;

type Category = 'all' | 'science' | 'history' | 'geography' | 'popculture';

const CATEGORIES: Category[] = ['all', 'science', 'history', 'geography', 'popculture'];

const CATEGORY_LABEL_KEYS: Record<Category, string> = {
  all: 'games.allCategories',
  science: 'games.science',
  history: 'games.history',
  geography: 'games.geography',
  popculture: 'games.popculture',
};

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface TriviaGameProps {
  onBack: () => void;
  onGameEnd?: (score: number, timeMs: number) => void;
}

type Phase = 'menu' | 'playing' | 'feedback' | 'over';

export default function TriviaGame({ onBack, onGameEnd }: TriviaGameProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [category, setCategory] = useState<Category>('all');
  const [questions, setQuestions] = useState(triviaQuestions.slice(0, QUESTIONS_PER_ROUND));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const startTimeRef = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  const startGame = useCallback(() => {
    const pool = category === 'all' ? triviaQuestions : triviaQuestions.filter(q => q.category === category);
    const count = Math.min(QUESTIONS_PER_ROUND, pool.length);
    const shuffled = shuffle(pool).slice(0, count);
    setQuestions(shuffled);
    setQuestionIndex(0);
    setScore(0);
    setSelected(null);
    setPhase('playing');
    setTimerRunning(true);
    setTimerKey(k => k + 1);
    startTimeRef.current = Date.now();
    questionStartRef.current = Date.now();
  }, [category]);

  const handleAnswer = useCallback((optionIndex: number) => {
    if (selected !== null) return;
    setTimerRunning(false);
    setSelected(optionIndex);

    const q = questions[questionIndex];
    const isCorrect = optionIndex === q.correctIndex;
    const responseTime = Date.now() - questionStartRef.current;
    // Speed bonus: max 2x for instant answer, 1x for at-the-wire
    const speedMultiplier = isCorrect ? 1 + Math.max(0, (TIME_PER_QUESTION_MS - responseTime) / TIME_PER_QUESTION_MS) : 0;
    const points = isCorrect ? Math.round(100 * speedMultiplier) : 0;

    setScore(s => s + points);
    setPhase('feedback');

    setTimeout(() => {
      if (questionIndex + 1 >= questions.length) {
        setPhase('over');
      } else {
        setQuestionIndex(i => i + 1);
        setSelected(null);
        setPhase('playing');
        setTimerRunning(true);
        setTimerKey(k => k + 1);
        questionStartRef.current = Date.now();
      }
    }, 1200);
  }, [selected, questionIndex, questions]);

  const handleTimeUp = useCallback(() => {
    if (selected !== null) return;
    setTimerRunning(false);
    setSelected(-1); // no selection
    setPhase('feedback');

    setTimeout(() => {
      if (questionIndex + 1 >= questions.length) {
        setPhase('over');
      } else {
        setQuestionIndex(i => i + 1);
        setSelected(null);
        setPhase('playing');
        setTimerRunning(true);
        setTimerKey(k => k + 1);
        questionStartRef.current = Date.now();
      }
    }, 1200);
  }, [selected, questionIndex, questions]);

  if (phase === 'over') {
    const elapsed = Date.now() - startTimeRef.current;
    if (onGameEnd) { onGameEnd(score, elapsed); return null; }
    return (
      <GameOver
        gameType="trivia"
        score={score}
        timeMs={elapsed}
        difficulty={category === 'all' ? 'mixed' : category}
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.trivia')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{QUESTIONS_PER_ROUND} questions &middot; 15s each</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300">{t('games.scoringRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">{t('games.triviaRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>

        {/* Category picker */}
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                category === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/30'
              }`}
            >
              {t(CATEGORY_LABEL_KEYS[cat] as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={startGame}
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition active:scale-95"
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

  const q = questions[questionIndex];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress & Score */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {questionIndex + 1} / {questions.length}
        </span>
        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
          {t('games.score')}: {score}
        </span>
      </div>

      {/* Timer */}
      <Timer
        key={timerKey}
        durationMs={TIME_PER_QUESTION_MS}
        onTimeUp={handleTimeUp}
        running={timerRunning}
      />

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-xs text-purple-500 dark:text-purple-400 font-medium uppercase mb-2">
          {q.category}
        </p>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {q.question}
        </h3>
      </div>

      {/* Options */}
      <div className="grid grid-cols-1 gap-3">
        {q.options.map((option, i) => {
          let style = 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500';
          if (selected !== null) {
            if (i === q.correctIndex) {
              style = 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500 text-green-700 dark:text-green-300';
            } else if (i === selected && i !== q.correctIndex) {
              style = 'bg-red-50 dark:bg-red-900/30 border-red-400 dark:border-red-500 text-red-700 dark:text-red-300';
            } else {
              style = 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 opacity-50';
            }
          }

          return (
            <button
              key={`${questionIndex}-${i}`}
              type="button"
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition ${style}`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
