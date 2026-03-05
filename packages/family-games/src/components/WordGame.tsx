import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import wordList from '../data/wordList';
import GameOver from './GameOver';

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

// Derive daily word from date hash (same for all users on same day)
function getDailyWord(): string {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return wordList[Math.abs(hash) % wordList.length];
}

type LetterState = 'correct' | 'present' | 'absent' | 'empty';

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill('absent');
  const targetLetters = target.split('');
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === target[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guess[i] === targetLetters[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

const KEYBOARD_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
];

interface WordGameProps {
  onBack: () => void;
}

export default function WordGame({ onBack }: WordGameProps) {
  const { t } = useTranslation();
  const [target] = useState(getDailyWord);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [shake, setShake] = useState(false);
  const [startTime] = useState(Date.now);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});

  const submitGuess = useCallback(() => {
    if (current.length !== WORD_LENGTH) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    const guess = current.toLowerCase();
    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setCurrent('');

    // Update keyboard states
    const states = evaluateGuess(guess, target);
    setKeyStates(prev => {
      const next = { ...prev };
      for (let i = 0; i < WORD_LENGTH; i++) {
        const letter = guess[i];
        const newState = states[i];
        const existing = next[letter];
        // Priority: correct > present > absent
        if (!existing || newState === 'correct' || (newState === 'present' && existing === 'absent')) {
          next[letter] = newState;
        }
      }
      return next;
    });

    if (guess === target) {
      setGameState('won');
    } else if (newGuesses.length >= MAX_ATTEMPTS) {
      setGameState('lost');
    }
  }, [current, guesses, target]);

  const handleKey = useCallback((key: string) => {
    if (gameState !== 'playing') return;

    if (key === 'Enter') {
      submitGuess();
    } else if (key === 'Backspace') {
      setCurrent(c => c.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(key) && current.length < WORD_LENGTH) {
      setCurrent(c => c + key.toLowerCase());
    }
  }, [gameState, current, submitGuess]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      handleKey(e.key);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleKey]);

  if (gameState !== 'playing') {
    const elapsed = Date.now() - startTime;
    const score = gameState === 'won' ? (MAX_ATTEMPTS - guesses.length + 1) * 100 : 0;
    return (
      <div className="space-y-4">
        {gameState === 'lost' && (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            The word was: <span className="font-bold text-gray-900 dark:text-white uppercase">{target}</span>
          </p>
        )}
        <GameOver
          gameType="word"
          score={score}
          timeMs={elapsed}
          difficulty="daily"
          onPlayAgain={() => window.location.reload()}
          onBack={onBack}
        />
      </div>
    );
  }

  // Build grid rows
  const rows: Array<{ letters: string[]; states: LetterState[] }> = [];
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    if (i < guesses.length) {
      const guess = guesses[i];
      rows.push({ letters: guess.split(''), states: evaluateGuess(guess, target) });
    } else if (i === guesses.length) {
      const letters = current.padEnd(WORD_LENGTH, ' ').split('');
      rows.push({ letters, states: Array(WORD_LENGTH).fill('empty') });
    } else {
      rows.push({ letters: Array(WORD_LENGTH).fill(' '), states: Array(WORD_LENGTH).fill('empty') });
    }
  }

  const tileColor = (state: LetterState) => {
    switch (state) {
      case 'correct': return 'bg-green-500 dark:bg-green-600 text-white border-green-500';
      case 'present': return 'bg-yellow-500 dark:bg-yellow-600 text-white border-yellow-500';
      case 'absent': return 'bg-gray-400 dark:bg-gray-600 text-white border-gray-400';
      default: return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600';
    }
  };

  const keyColor = (key: string) => {
    const state = keyStates[key.toLowerCase()];
    switch (state) {
      case 'correct': return 'bg-green-500 text-white';
      case 'present': return 'bg-yellow-500 text-white';
      case 'absent': return 'bg-gray-400 dark:bg-gray-600 text-white';
      default: return 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {t('games.backToGames')}
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('games.wordGame')}</h2>
        <span className="w-16" />
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-1.5 w-full">
        <p className="text-[10px] text-green-600 dark:text-green-400">{t('games.scoringRules' as any)}: {t('games.wordRules' as any)}</p>
      </div>

      {/* Grid */}
      <div className={`grid gap-1.5 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
        {rows.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.letters.map((letter, li) => (
              <div
                key={li}
                className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center border-2 rounded-lg text-xl font-bold uppercase transition-all ${tileColor(row.states[li])}`}
              >
                {letter.trim()}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Keyboard */}
      <div className="w-full space-y-1.5 mt-2">
        {KEYBOARD_ROWS.map((row, ri) => (
          <div key={ri} className="flex justify-center gap-1">
            {row.map(key => (
              <button
                key={key}
                type="button"
                onClick={() => handleKey(key)}
                className={`${key.length > 1 ? 'px-3 text-xs' : 'w-8 md:w-9 text-sm'} h-12 rounded-md font-bold transition active:scale-95 ${keyColor(key)}`}
              >
                {key === 'Backspace' ? (
                  <svg className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414-6.414A2 2 0 0110.828 5H21v14H10.828a2 2 0 01-1.414-.586L3 12z" />
                  </svg>
                ) : key}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
