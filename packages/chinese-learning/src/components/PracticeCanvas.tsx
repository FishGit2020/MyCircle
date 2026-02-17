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
  const isDrawing = useRef(false);

  const chars = [...character.character];
  const [charIndex, setCharIndex] = useState(0);
  const [strokesByChar, setStrokesByChar] = useState<Point[][][]>(() => chars.map(() => []));
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);

  const currentChar = chars[charIndex];
  const strokes = strokesByChar[charIndex];

  const canvasSize = 300;

  // Reset state when a different character entry is selected
  useEffect(() => {
    const newChars = [...character.character];
    setCharIndex(0);
    setStrokesByChar(newChars.map(() => []));
    setCurrentStroke([]);
  }, [character.character]);

  // Draw watermark reference character (single glyph)
  const drawReference = useCallback((ctx: CanvasRenderingContext2D, glyph: string) => {
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.font = `${canvasSize * 0.7}px serif`;
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, canvasSize / 2, canvasSize / 2);
    ctx.restore();
  }, []);

  // Redraw all strokes
  const redraw = useCallback((ctx: CanvasRenderingContext2D, glyph: string, allStrokes: Point[][]) => {
    ctx.clearRect(0, 0, canvasSize, canvasSize);
    drawReference(ctx, glyph);

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

  // Redraw when char index or strokes change
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redraw(ctx, currentChar, strokes);
  }, [redraw, currentChar, strokes]);

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
      if (ctx) redraw(ctx, currentChar, [...strokes, next]);
      return next;
    });
  };

  const handlePointerUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    if (currentStroke.length > 1) {
      setStrokesByChar((prev) => {
        const next = [...prev];
        next[charIndex] = [...next[charIndex], currentStroke];
        return next;
      });
    }
    setCurrentStroke([]);
  };

  const handleClear = () => {
    setStrokesByChar((prev) => {
      const next = [...prev];
      next[charIndex] = [];
      return next;
    });
    setCurrentStroke([]);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      drawReference(ctx, currentChar);
    }
  };

  const handleUndo = () => {
    setStrokesByChar((prev) => {
      const next = [...prev];
      next[charIndex] = next[charIndex].slice(0, -1);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) redraw(ctx, currentChar, next[charIndex]);
      return next;
    });
  };

  const hasMultipleChars = chars.length > 1;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Header with character info */}
      <div className="text-center">
        <span className="text-4xl">{character.character}</span>
        <div className="text-lg text-blue-600 dark:text-blue-400">{character.pinyin}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{character.meaning}</div>
      </div>

      {/* Per-character indicator */}
      {hasMultipleChars && (
        <div className="flex items-center gap-2">
          {chars.map((ch, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCharIndex(i)}
              className={`text-2xl px-2 py-1 rounded-lg transition ${
                i === charIndex
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
              data-testid={`char-tab-${i}`}
            >
              {ch}
            </button>
          ))}
        </div>
      )}

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

      {/* Per-character navigation */}
      {hasMultipleChars && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setCharIndex((i) => i - 1)}
            disabled={charIndex === 0}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 transition"
            data-testid="prev-char-btn"
          >
            {t('chinese.previous')}
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {charIndex + 1} / {chars.length}
          </span>
          <button
            type="button"
            onClick={() => setCharIndex((i) => i + 1)}
            disabled={charIndex === chars.length - 1}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition"
            data-testid="next-char-btn"
          >
            {t('chinese.next')}
          </button>
        </div>
      )}

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
