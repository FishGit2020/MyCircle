import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const EMOJIS = [
  '\ud83d\ude00', '\ud83d\ude0d', '\ud83e\udd29', '\ud83e\udd2f', '\ud83e\udd73', '\ud83e\udd20',
  '\ud83d\udc36', '\ud83d\udc31', '\ud83d\udc35', '\ud83d\udc3c', '\ud83e\udd81', '\ud83d\udc22',
  '\ud83c\udf53', '\ud83c\udf52', '\ud83c\udf4e', '\ud83c\udf4a', '\ud83c\udf4b', '\ud83c\udf49',
];

type Difficulty = 'easy' | 'medium' | 'hard';
const GRID_SIZES: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 };

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function createDeck(gridSize: number): Card[] {
  const pairCount = (gridSize * gridSize) / 2;
  const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
  const pairs = [...selectedEmojis, ...selectedEmojis];
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }));
}

interface MemoryGameProps {
  onBack: () => void;
}

type Phase = 'menu' | 'playing' | 'over';

export default function MemoryGame({ onBack }: MemoryGameProps) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [flipCount, setFlipCount] = useState(0);
  const [matchCount, setMatchCount] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lockRef = useRef(false);

  const gridSize = GRID_SIZES[difficulty];
  const totalPairs = (gridSize * gridSize) / 2;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startGame = useCallback((diff: Difficulty) => {
    const size = GRID_SIZES[diff];
    // For odd grid sizes, use size * (size-1) to ensure even number of cards
    const adjustedTotal = size % 2 !== 0 ? size * (size - 1) : size * size;
    setDifficulty(diff);

    const pairCount = adjustedTotal / 2;
    const selectedEmojis = [...EMOJIS].sort(() => Math.random() - 0.5).slice(0, pairCount);
    const pairs = [...selectedEmojis, ...selectedEmojis];
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    setCards(pairs.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })));
    setFlippedIds([]);
    setFlipCount(0);
    setMatchCount(0);
    setPhase('playing');
    const now = Date.now();
    setStartTime(now);
    setElapsed(0);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - now);
    }, 100);
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const handleFlip = useCallback((id: number) => {
    if (lockRef.current) return;
    const card = cards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;
    if (flippedIds.includes(id)) return;

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);
    setFlipCount(f => f + 1);

    // Update card state
    setCards(prev => prev.map(c => c.id === id ? { ...c, flipped: true } : c));

    if (newFlipped.length === 2) {
      lockRef.current = true;
      const [firstId, secondId] = newFlipped;
      const first = cards.find(c => c.id === firstId)!;
      const second = cards.find(c => c.id === secondId)!;

      if (first.emoji === second.emoji) {
        // Match!
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, matched: true } : c
          ));
          setFlippedIds([]);
          setMatchCount(m => {
            const newCount = m + 1;
            const adjustedTotal = (GRID_SIZES[difficulty] % 2 !== 0)
              ? GRID_SIZES[difficulty] * (GRID_SIZES[difficulty] - 1) / 2
              : GRID_SIZES[difficulty] * GRID_SIZES[difficulty] / 2;
            if (newCount >= adjustedTotal) {
              stopTimer();
              setPhase('over');
            }
            return newCount;
          });
          lockRef.current = false;
        }, 300);
      } else {
        // No match — flip back
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            c.id === firstId || c.id === secondId ? { ...c, flipped: false } : c
          ));
          setFlippedIds([]);
          lockRef.current = false;
        }, 800);
      }
    }
  }, [cards, flippedIds, difficulty, stopTimer]);

  if (phase === 'over') {
    const finalElapsed = elapsed || (Date.now() - startTime);
    // Score: lower time + fewer flips = higher score
    const timeBonus = Math.max(0, 300_000 - finalElapsed) / 1000;
    const flipPenalty = flipCount * 2;
    const score = Math.round(Math.max(0, timeBonus * 10 - flipPenalty));
    return (
      <GameOver
        gameType="memory"
        score={score}
        timeMs={finalElapsed}
        difficulty={difficulty}
        onPlayAgain={() => startGame(difficulty)}
        onBack={onBack}
      />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.memoryMatch')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.difficulty')}</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-orange-700 dark:text-orange-300">{t('games.scoringRules' as any)}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">{t('games.memoryRules' as any)}</p>
        </div>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button
              key={d}
              type="button"
              onClick={() => startGame(d)}
              className={`px-6 py-3 rounded-xl font-medium transition active:scale-95 ${
                d === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                d === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}
            >
              {t(`games.${d}` as 'games.easy' | 'games.medium' | 'games.hard')}
              <span className="block text-xs opacity-60">
                {d === 'easy' ? '4x4' : d === 'medium' ? '5x4' : '6x6'}
              </span>
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

  const seconds = (elapsed / 1000).toFixed(1);
  const cols = gridSize % 2 !== 0 ? gridSize : gridSize;
  const gridCols = `grid-cols-${cols}`;

  return (
    <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {t('games.backToGames')}
        </button>
        <div className="text-center">
          <span className="text-sm text-gray-500 dark:text-gray-400">{seconds}s</span>
          <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
          <span className="text-sm text-orange-600 dark:text-orange-400">{matchCount}/{cards.length / 2} pairs</span>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">Flips: {flipCount}</span>
      </div>

      {/* Card Grid */}
      <div
        className="grid gap-2 w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {cards.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={() => handleFlip(card.id)}
            disabled={card.matched || card.flipped}
            className={`aspect-square rounded-xl text-2xl md:text-3xl flex items-center justify-center transition-all duration-200 ${
              card.matched
                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 scale-95 opacity-60'
                : card.flipped
                  ? 'bg-white dark:bg-gray-700 border-2 border-orange-400 dark:border-orange-500 shadow-md'
                  : 'bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-500 hover:shadow-md active:scale-95 cursor-pointer'
            }`}
            aria-label={card.flipped || card.matched ? card.emoji : 'Hidden card'}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
