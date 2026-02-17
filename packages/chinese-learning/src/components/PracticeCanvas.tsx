import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { ChineseCharacter } from '../data/characters';

interface PracticeCanvasProps {
  character: ChineseCharacter;
  onBack: () => void;
}

type Point = { x: number; y: number };

export default function PracticeCanvas({ character, onBack }: PracticeCanvasProps) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const isDrawing = useRef(false);

  const canvasSize = 300;

  // Draw watermark reference character
  const drawReference = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.font = `${canvasSize * 0.7}px serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(character.character, canvasSize / 2, canvasSize / 2);
    ctx.restore();
  }, [character.character]);

  // Redraw all strokes
  const redraw = useCallback((ctx: CanvasRenderingContext2D, allStrokes: Point[][]) => {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawReference(ctx);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
  }, [drawReference]);

  // Initial draw
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redraw(ctx, strokes);
  }, [redraw, strokes]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const pos = getPos(e);
    setCurrentStroke([pos]);
    try { canvasRef.current?.setPointerCapture(e.pointerId); } catch { /* jsdom lacks setPointerCapture */ }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const pos = getPos(e);
    setCurrentStroke((prev) => {
      const next = [...prev, pos];
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redraw(ctx, [...strokes, next]);
      return next;
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.length > 1) {
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke([]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      drawReference(ctx);
    }
  };

  const handleUndo = () => {
    setStrokes((prev) => {
      const next = prev.slice(0, -1);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redraw(ctx, next);
      return next;
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header with character info */}
      <div className="text-center">
        <span className="text-4xl">{character.character}</span>
        <div className="text-lg text-blue-600 dark:text-blue-400">{character.pinyin}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{character.meaning}</div>
      </div>

      <p className="text-sm text-gray-400 dark:text-gray-500">{t('chinese.practiceHint')}</p>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        data-testid="practice-canvas"
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleUndo}
          disabled={strokes.length === 0}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition"
          data-testid="undo-btn"
        >
          {t('chinese.undo')}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
          data-testid="clear-btn"
        >
          {t('chinese.clear')}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          {t('chinese.flashcards')}
        </button>
      </div>
    </div>
  );
}
