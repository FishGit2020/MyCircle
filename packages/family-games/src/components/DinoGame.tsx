import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import GameOver from './GameOver';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const GROUND_Y = 160;
const DINO_WIDTH = 40;
const DINO_HEIGHT = 44;
const GRAVITY = 0.6;
const JUMP_VELOCITY = -12;
const OBSTACLE_WIDTH = 20;
const OBSTACLE_GAP_MIN = 300;
const OBSTACLE_GAP_MAX = 500;

interface Obstacle {
  x: number;
  width: number;
  height: number;
}

export default function DinoGame({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<'menu' | 'playing' | 'gameOver'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem('dino-high-score')) || 0; } catch { return 0; }
  });
  const startTimeRef = useRef(0);

  const gameRef = useRef({
    dinoY: GROUND_Y - DINO_HEIGHT,
    dinoVelocity: 0,
    isJumping: false,
    obstacles: [] as Obstacle[],
    speed: 4,
    score: 0,
    frameCount: 0,
    running: false,
    isDucking: false,
  });

  const startGame = useCallback(() => {
    const g = gameRef.current;
    g.dinoY = GROUND_Y - DINO_HEIGHT;
    g.dinoVelocity = 0;
    g.isJumping = false;
    g.isDucking = false;
    g.obstacles = [];
    g.speed = 4;
    g.score = 0;
    g.frameCount = 0;
    g.running = true;
    startTimeRef.current = Date.now();
    setPhase('playing');
    setScore(0);
  }, []);

  const jump = useCallback(() => {
    const g = gameRef.current;
    if (!g.isJumping && g.running) {
      g.dinoVelocity = JUMP_VELOCITY;
      g.isJumping = true;
    }
  }, []);

  // Input handling
  useEffect(() => {
    if (phase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
      if (e.code === 'ArrowDown') {
        gameRef.current.isDucking = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        gameRef.current.isDucking = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [phase, jump]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const g = gameRef.current;

    function spawnObstacle() {
      const lastObs = g.obstacles[g.obstacles.length - 1];
      const lastX = lastObs ? lastObs.x : CANVAS_WIDTH;
      if (!lastObs || lastX < CANVAS_WIDTH - OBSTACLE_GAP_MIN) {
        const gap = OBSTACLE_GAP_MIN + Math.random() * (OBSTACLE_GAP_MAX - OBSTACLE_GAP_MIN);
        const height = 20 + Math.random() * 30;
        g.obstacles.push({
          x: Math.max(CANVAS_WIDTH, lastX + gap),
          width: OBSTACLE_WIDTH + Math.random() * 15,
          height,
        });
      }
    }

    function update() {
      // Dino physics
      g.dinoVelocity += GRAVITY;
      g.dinoY += g.dinoVelocity;
      const dinoH = g.isDucking ? DINO_HEIGHT * 0.6 : DINO_HEIGHT;
      if (g.dinoY >= GROUND_Y - dinoH) {
        g.dinoY = GROUND_Y - dinoH;
        g.dinoVelocity = 0;
        g.isJumping = false;
      }

      // Move obstacles
      for (const obs of g.obstacles) {
        obs.x -= g.speed;
      }
      // Remove off-screen
      g.obstacles = g.obstacles.filter(o => o.x + o.width > -10);

      // Spawn new
      spawnObstacle();

      // Collision detection
      const dinoLeft = 40;
      const dinoRight = dinoLeft + DINO_WIDTH - 8;
      const dinoTop = g.dinoY + 4;
      const dinoBottom = g.dinoY + dinoH - 4;

      for (const obs of g.obstacles) {
        const obsLeft = obs.x;
        const obsRight = obs.x + obs.width;
        const obsTop = GROUND_Y - obs.height;
        const obsBottom = GROUND_Y;

        if (dinoRight > obsLeft && dinoLeft < obsRight && dinoBottom > obsTop && dinoTop < obsBottom) {
          g.running = false;
          const finalScore = g.score;
          setScore(finalScore);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            try { localStorage.setItem('dino-high-score', String(finalScore)); } catch { /* */ }
          }
          setPhase('gameOver');
          return;
        }
      }

      // Score and speed
      g.frameCount++;
      if (g.frameCount % 6 === 0) {
        g.score++;
        setScore(g.score);
      }
      if (g.frameCount % 500 === 0) {
        g.speed += 0.5;
      }
    }

    function draw() {
      if (!ctx) return;
      const isDark = document.documentElement.classList.contains('dark');
      const bgColor = isDark ? '#1f2937' : '#f9fafb';
      const fgColor = isDark ? '#e5e7eb' : '#374151';
      const groundColor = isDark ? '#4b5563' : '#9ca3af';
      const obsColor = isDark ? '#6b7280' : '#4b5563';
      const dinoColor = isDark ? '#34d399' : '#059669';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Ground
      ctx.fillStyle = groundColor;
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 2);

      // Ground texture
      ctx.fillStyle = groundColor;
      for (let x = (g.frameCount * g.speed) % 20; x < CANVAS_WIDTH; x += 20) {
        ctx.fillRect(CANVAS_WIDTH - x, GROUND_Y + 5, 8, 1);
      }

      // Dino
      const dinoH = g.isDucking ? DINO_HEIGHT * 0.6 : DINO_HEIGHT;
      ctx.fillStyle = dinoColor;
      ctx.fillRect(40, g.dinoY, DINO_WIDTH, dinoH);
      // Eye
      ctx.fillStyle = bgColor;
      ctx.fillRect(40 + DINO_WIDTH - 12, g.dinoY + 6, 5, 5);
      // Leg animation
      ctx.fillStyle = dinoColor;
      const legOffset = g.frameCount % 10 < 5 ? 0 : 6;
      ctx.fillRect(40 + 8, g.dinoY + dinoH, 6, 4 + legOffset);
      ctx.fillRect(40 + 22, g.dinoY + dinoH, 6, 10 - legOffset);

      // Obstacles (cactus-like)
      ctx.fillStyle = obsColor;
      for (const obs of g.obstacles) {
        ctx.fillRect(obs.x, GROUND_Y - obs.height, obs.width, obs.height);
        // Cactus arms
        ctx.fillRect(obs.x - 4, GROUND_Y - obs.height * 0.6, 4, 8);
        ctx.fillRect(obs.x + obs.width, GROUND_Y - obs.height * 0.7, 4, 8);
      }

      // Score
      ctx.fillStyle = fgColor;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${String(g.score).padStart(5, '0')}`, CANVAS_WIDTH - 10, 24);
      if (highScore > 0) {
        ctx.fillStyle = groundColor;
        ctx.fillText(`HI ${String(highScore).padStart(5, '0')}`, CANVAS_WIDTH - 80, 24);
      }
    }

    function loop() {
      if (!g.running) return;
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    }

    g.running = true;
    loop();

    return () => {
      g.running = false;
      cancelAnimationFrame(animationId);
    };
  }, [phase, highScore]);

  if (phase === 'gameOver') {
    return (
      <GameOver
        gameType="dino"
        score={score}
        timeMs={Date.now() - startTimeRef.current}
        difficulty="endless"
        onPlayAgain={startGame}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-between w-full max-w-[600px]">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
        >
          {t('games.backToGames')}
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('games.dinoRun' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </h2>
        <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300">
          {String(score).padStart(5, '0')}
        </span>
      </div>

      <div
        className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden cursor-pointer"
        onClick={phase === 'playing' ? jump : startGame}
        onTouchStart={phase === 'playing' ? (e) => { e.preventDefault(); jump(); } : undefined}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block max-w-full"
          style={{ imageRendering: 'pixelated' }}
        />
        {phase === 'menu' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/80 dark:bg-gray-800/80">
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">
              {t('games.dinoRun' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('games.tapOrSpaceToStart' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          </div>
        )}
      </div>

      {phase === 'playing' && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('games.dinoControls' as any)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
        </p>
      )}
    </div>
  );
}
