import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

type Cell = { top: boolean; right: boolean; bottom: boolean; left: boolean; visited: boolean };

function generateMaze(rows: number, cols: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ top: true, right: true, bottom: true, left: true, visited: false }))
  );

  // Recursive backtracker
  const stack: [number, number][] = [];
  const start: [number, number] = [0, 0];
  grid[0][0].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const [r, c] = stack[stack.length - 1];
    const neighbors: [number, number, 'top' | 'right' | 'bottom' | 'left', 'top' | 'right' | 'bottom' | 'left'][] = [];
    if (r > 0 && !grid[r - 1][c].visited) neighbors.push([r - 1, c, 'top', 'bottom']);
    if (c < cols - 1 && !grid[r][c + 1].visited) neighbors.push([r, c + 1, 'right', 'left']);
    if (r < rows - 1 && !grid[r + 1][c].visited) neighbors.push([r + 1, c, 'bottom', 'top']);
    if (c > 0 && !grid[r][c - 1].visited) neighbors.push([r, c - 1, 'left', 'right']);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const [nr, nc, wall, opposite] = neighbors[Math.floor(Math.random() * neighbors.length)];
      grid[r][c][wall] = false;
      grid[nr][nc][opposite] = false;
      grid[nr][nc].visited = true;
      stack.push([nr, nc]);
    }
  }
  return grid;
}

const SIZES = { easy: 6, medium: 8, hard: 10 } as const;
type Difficulty = keyof typeof SIZES;

export default function MazeGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<'menu' | 'playing' | 'over'>('menu');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [maze, setMaze] = useState<Cell[][] | null>(null);
  const [pos, setPos] = useState<[number, number]>([0, 0]);
  const [moves, setMoves] = useState(0);
  const startRef = useRef(Date.now());
  const sizeRef = useRef(8);

  const startGame = useCallback((diff: Difficulty) => {
    const size = SIZES[diff];
    sizeRef.current = size;
    setDifficulty(diff);
    setMaze(generateMaze(size, size));
    setPos([0, 0]);
    setMoves(0);
    startRef.current = Date.now();
    setPhase('playing');
  }, []);

  const move = useCallback((dr: number, dc: number) => {
    if (!maze) return;
    const [r, c] = pos;
    const cell = maze[r][c];
    // Check walls
    if (dr === -1 && cell.top) return;
    if (dr === 1 && cell.bottom) return;
    if (dc === -1 && cell.left) return;
    if (dc === 1 && cell.right) return;
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= sizeRef.current || nc < 0 || nc >= sizeRef.current) return;
    setPos([nr, nc]);
    setMoves(m => m + 1);
    // Check win
    if (nr === sizeRef.current - 1 && nc === sizeRef.current - 1) {
      setPhase('over');
    }
  }, [maze, pos]);

  // Keyboard controls
  useEffect(() => {
    if (phase !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': move(-1, 0); break;
        case 'ArrowDown': case 's': move(1, 0); break;
        case 'ArrowLeft': case 'a': move(0, -1); break;
        case 'ArrowRight': case 'd': move(0, 1); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, move]);

  if (phase === 'over') {
    const elapsed = Date.now() - startRef.current;
    const size = sizeRef.current;
    const optimalMoves = (size - 1) * 2;
    const efficiency = Math.max(0, 1 - (moves - optimalMoves) / (optimalMoves * 3));
    const timeBonus = Math.max(0, 120_000 - elapsed) / 1000;
    const score = Math.round((efficiency * 500 + timeBonus * 5) * (size / 8));
    return (
      <GameOver gameType="maze" score={score} timeMs={elapsed} difficulty={difficulty} onPlayAgain={() => startGame(difficulty)} onBack={onBack} />
    );
  }

  if (phase === 'menu') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('games.mazeRunner' as any)}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.mazeDesc' as any)}</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-4 py-2.5 max-w-xs">
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">{t('games.scoringRules' as any)}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">{t('games.mazeRules' as any)}</p>
        </div>
        <div className="flex gap-3">
          {(['easy', 'medium', 'hard'] as const).map(d => (
            <button key={d} type="button" onClick={() => startGame(d)}
              className={`px-6 py-3 rounded-xl font-medium transition active:scale-95 ${
                d === 'easy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                d === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
              }`}>
              {t(`games.${d}` as any)}
            </button>
          ))}
        </div>
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition">
          {t('games.backToGames')}
        </button>
      </div>
    );
  }

  const size = sizeRef.current;
  const cellPx = Math.min(Math.floor(300 / size), 40);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('games.score')}: {moves} moves &middot; {difficulty}</p>

      {/* Maze grid */}
      <div className="border-2 border-gray-800 dark:border-gray-200" style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellPx}px)` }}>
        {maze?.map((row, r) => row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{ width: cellPx, height: cellPx,
              borderTop: cell.top ? '2px solid' : '2px solid transparent',
              borderRight: cell.right ? '2px solid' : '2px solid transparent',
              borderBottom: cell.bottom ? '2px solid' : '2px solid transparent',
              borderLeft: cell.left ? '2px solid' : '2px solid transparent',
              borderColor: undefined,
            }}
            className={`relative border-gray-400 dark:border-gray-500 ${
              r === 0 && c === 0 ? 'bg-green-100 dark:bg-green-900/30' :
              r === size - 1 && c === size - 1 ? 'bg-red-100 dark:bg-red-900/30' : ''
            }`}
          >
            {pos[0] === r && pos[1] === c && (
              <div className="absolute inset-1 rounded-full bg-emerald-500" />
            )}
            {r === size - 1 && c === size - 1 && pos[0] !== r && (
              <div className="absolute inset-1 flex items-center justify-center text-xs">🏁</div>
            )}
          </div>
        )))}
      </div>

      {/* D-pad controls for touch */}
      <div className="grid grid-cols-3 gap-1 w-36">
        <div />
        <button type="button" onClick={() => move(-1, 0)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 flex items-center justify-center" aria-label="Up">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
        </button>
        <div />
        <button type="button" onClick={() => move(0, -1)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 flex items-center justify-center" aria-label="Left">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button type="button" onClick={() => move(1, 0)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 flex items-center justify-center" aria-label="Down">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        <button type="button" onClick={() => move(0, 1)} className="p-3 bg-gray-200 dark:bg-gray-700 rounded-lg active:bg-gray-300 dark:active:bg-gray-600 flex items-center justify-center" aria-label="Right">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}
