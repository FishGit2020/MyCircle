import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const WORDS = [
  'apple', 'brain', 'chair', 'dance', 'eagle', 'flame', 'grape', 'house',
  'image', 'juice', 'knife', 'lemon', 'music', 'night', 'ocean', 'piano',
  'queen', 'river', 'stone', 'tiger', 'uncle', 'voice', 'water', 'youth',
  'beach', 'cloud', 'dream', 'earth', 'frost', 'giant', 'heart', 'light',
  'magic', 'noble', 'pearl', 'royal', 'shine', 'train', 'umbra', 'vivid',
  'world', 'blaze', 'charm', 'drift', 'ember', 'flora', 'gleam', 'haven',
];

function shuffle(word: string): string {
  const arr = word.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const result = arr.join('');
  // Ensure the shuffle is different from the original
  return result === word ? shuffle(word) : result;
}

const TOTAL_ROUNDS = 10;
const HINT_PENALTY = 30;

export default function AnagramGame({ onBack, onGameEnd }: { onBack: () => void; onGameEnd?: (score: number, timeMs: number) => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'menu' | 'playing' | 'over'>('menu');
  const [words, setWords] = useState<string[]>([]);
  const [round, setRound] = useState(0);
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [hints, setHints] = useState(0);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const startRef = useRef(Date.now());
  const roundStartRef = useRef(Date.now());

  const _gameWords = useMemo(() => {
    const shuffled = [...WORDS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, TOTAL_ROUNDS);
  }, [words]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(() => {
    const selected = [...WORDS].sort(() => Math.random() - 0.5).slice(0, TOTAL_ROUNDS);
    setWords(selected);
    setRound(0);
    setScore(0);
    setHints(0);
    setInput('');
    setRevealed(new Set());
    setFeedback(null);
    setScrambled(shuffle(selected[0]));
    startRef.current = Date.now();
    roundStartRef.current = Date.now();
    setPhase('playing');
  }, []);

  const currentWord = words[round] || '';

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (input.trim().toLowerCase() === currentWord) {
      const speed = Math.max(0, 15_000 - (Date.now() - roundStartRef.current)) / 1000;
      const pts = Math.round(100 + speed * 5 - hints * HINT_PENALTY);
      setScore(s => s + Math.max(10, pts));
      setFeedback('correct');
      const nextRound = round + 1;
      if (nextRound >= TOTAL_ROUNDS) {
        setTimeout(() => setPhase('over'), 800);
      } else {
        setTimeout(() => {
          setRound(nextRound);
          setInput('');
          setRevealed(new Set());
          setHints(0);
          setFeedback(null);
          setScrambled(shuffle(words[nextRound]));
          roundStartRef.current = Date.now();
        }, 800);
      }
    } else {
      setFeedback('incorrect');
      setTimeout(() => { setFeedback(null); setInput(''); }, 600);
    }
  }, [input, currentWord, round, hints, words]);

  const revealHint = useCallback(() => {
    const unrevealed = currentWord.split('').map((_, i) => i).filter(i => !revealed.has(i));
    if (unrevealed.length <= 1) return;
    const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    setRevealed(prev => new Set(prev).add(idx));
    setHints(h => h + 1);
  }, [currentWord, revealed]);

  if (phase === 'over') {
    const elapsed = Date.now() - startRef.current;
    if (onGameEnd) { onGameEnd(score, elapsed); return null; }
    return (
      <GameOver gameType="anagram" score={score} timeMs={elapsed} difficulty="vocabulary" onPlayAgain={startGame} onBack={onBack} />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-900/30 flex items-center justify-center text-sky-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.anagram' as any)}</h2> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.anagramDesc' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <div className="bg-sky-50 dark:bg-sky-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-sky-700 dark:text-sky-300">{t('games.scoringRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
          <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">{t('games.anagramRules' as any)}</p> {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </div>
        <button type="button" onClick={startGame} className="px-8 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-medium transition active:scale-95">
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
      <p className="text-sm text-gray-500 dark:text-gray-400">{round + 1}/{TOTAL_ROUNDS} &middot; {t('games.score')}: {score}</p>

      {/* Scrambled letters */}
      <div className="flex gap-2">
        {scrambled.split('').map((letter, i) => (
          <div key={i} className="w-12 h-12 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-xl font-bold text-sky-700 dark:text-sky-300 uppercase">
            {letter}
          </div>
        ))}
      </div>

      {/* Hint display */}
      {revealed.size > 0 && (
        <div className="flex gap-1">
          {currentWord.split('').map((letter, i) => (
            <span key={i} className="w-8 h-8 flex items-center justify-center text-sm font-mono font-bold text-gray-900 dark:text-white border-b-2 border-gray-300 dark:border-gray-600 uppercase">
              {revealed.has(i) ? letter : '_'}
            </span>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          className={`w-40 px-3 py-2 rounded-lg border text-center text-lg font-bold uppercase outline-none transition ${
            feedback === 'correct' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
            feedback === 'incorrect' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
            'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-sky-500'
          }`}
          autoFocus
          maxLength={currentWord.length}
          aria-label="Answer"
        />
        <button type="submit" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition active:scale-95">
          OK
        </button>
      </form>

      <button type="button" onClick={revealHint}
        className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition"
      >
        {t('games.anagramHint' as any)} (-{HINT_PENALTY} pts) {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
      </button>
    </div>
  );
}
