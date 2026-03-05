import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

interface Puzzle {
  sequence: number[];
  answer: number;
  hint: string;
}

function generatePuzzle(level: number): Puzzle {
  const type = Math.floor(Math.random() * 4);
  const len = Math.min(4 + Math.floor(level / 3), 7);

  if (type === 0) {
    // Arithmetic: a, a+d, a+2d, ...
    const a = Math.floor(Math.random() * 20) + 1;
    const d = Math.floor(Math.random() * 10) + 2;
    const seq = Array.from({ length: len }, (_, i) => a + i * d);
    return { sequence: seq.slice(0, -1), answer: seq[seq.length - 1], hint: '+' + d };
  } else if (type === 1) {
    // Geometric: a, a*r, a*r^2, ...
    const a = Math.floor(Math.random() * 5) + 2;
    const r = Math.floor(Math.random() * 3) + 2;
    const seq = Array.from({ length: len }, (_, i) => a * Math.pow(r, i));
    return { sequence: seq.slice(0, -1), answer: seq[seq.length - 1], hint: '\u00d7' + r };
  } else if (type === 2) {
    // Add-increasing: +1, +2, +3, ...
    let val = Math.floor(Math.random() * 10) + 1;
    const seq = [val];
    for (let i = 1; i < len; i++) { val += i; seq.push(val); }
    return { sequence: seq.slice(0, -1), answer: seq[seq.length - 1], hint: '+n' };
  } else {
    // Square: 1, 4, 9, 16, ...
    const offset = Math.floor(Math.random() * 5);
    const seq = Array.from({ length: len }, (_, i) => (i + 1 + offset) * (i + 1 + offset));
    return { sequence: seq.slice(0, -1), answer: seq[seq.length - 1], hint: 'n\u00b2' };
  }
}

const TOTAL_PUZZLES = 10;
const TIME_LIMIT = 90_000;

const NUMPAD_KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['C', '0', '='],
];

export default function SequenceGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'menu' | 'playing' | 'over'>('menu');
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const startRef = useRef(Date.now());
  const submitRef = useRef<(() => void) | null>(null);

  const nextPuzzle = useCallback((lvl: number) => {
    setPuzzle(generatePuzzle(lvl));
    setInput('');
    setFeedback(null);
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setLevel(0);
    startRef.current = Date.now();
    setPhase('playing');
    nextPuzzle(0);
  }, [nextPuzzle]);

  const handleKey = useCallback((key: string) => {
    if (phase !== 'playing') return;
    if (key >= '0' && key <= '9') setInput(prev => prev + key);
    else if (key === 'C') setInput('');
    else if (key === 'Backspace') setInput(prev => prev.slice(0, -1));
    else if (key === '=' || key === 'Enter') submitRef.current?.();
  }, [phase]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => { if (/^[0-9]$/.test(e.key) || e.key === 'Enter' || e.key === 'Backspace') handleKey(e.key); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, handleKey]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    if (!puzzle || !input.trim()) return;
    const userAnswer = parseInt(input, 10);
    if (userAnswer === puzzle.answer) {
      const newScore = score + (10 + level * 5);
      const newLevel = level + 1;
      setScore(newScore);
      setLevel(newLevel);
      setFeedback('correct');
      if (newLevel >= TOTAL_PUZZLES) {
        setTimeout(() => setPhase('over'), 800);
      } else {
        setTimeout(() => nextPuzzle(newLevel), 800);
      }
    } else {
      setFeedback('incorrect');
      setTimeout(() => { setFeedback(null); setInput(''); }, 800);
    }
  }, [puzzle, input, score, level, nextPuzzle]);

  submitRef.current = () => handleSubmit();

  if (phase === 'over') {
    return (
      <GameOver
        gameType="sequence"
        score={score}
        timeMs={Date.now() - startRef.current}
        difficulty="pattern"
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.numberSequence' as any)}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.sequenceDesc' as any)}</p>
        </div>
        <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-teal-700 dark:text-teal-300">{t('games.scoringRules' as any)}</p>
          <p className="text-xs text-teal-600 dark:text-teal-400 mt-0.5">{t('games.sequenceRules' as any)}</p>
        </div>
        <button type="button" onClick={startGame} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition active:scale-95">
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
      <p className="text-sm text-gray-500 dark:text-gray-400">{level + 1}/{TOTAL_PUZZLES} &middot; {t('games.score')}: {score}</p>
      {puzzle && (
        <>
          <div className="flex items-center gap-2 text-2xl font-mono font-bold text-gray-900 dark:text-white">
            {puzzle.sequence.map((n, i) => (
              <span key={i}>{n}{i < puzzle.sequence.length - 1 ? ',' : ''}</span>
            ))}
            <span className="text-teal-500">, ?</span>
          </div>
          <div className={`w-32 px-3 py-2 rounded-lg border text-center text-2xl font-bold min-h-[44px] ${
            feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
            feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300' :
            'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
          }`}>
            {input || '\u00a0'}
          </div>
          <div className="grid grid-cols-3 gap-2 w-48">
            {NUMPAD_KEYS.flat().map(key => (
              <button key={key} type="button" onClick={() => handleKey(key)}
                className={`h-12 rounded-xl font-bold text-lg transition active:scale-95 ${
                  key === '=' ? 'bg-teal-600 hover:bg-teal-700 text-white' :
                  key === 'C' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                  'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}>
                {key}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
