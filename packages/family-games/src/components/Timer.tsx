import React, { useEffect, useRef, useState } from 'react';

interface TimerProps {
  durationMs: number;
  onTimeUp: () => void;
  running: boolean;
}

export default function Timer({ durationMs, onTimeUp, running }: TimerProps) {
  const [remaining, setRemaining] = useState(durationMs);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    setRemaining(durationMs);
    startRef.current = Date.now();
  }, [durationMs]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    startRef.current = Date.now() - (durationMs - remaining);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const left = Math.max(0, durationMs - elapsed);
      setRemaining(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        onTimeUp();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, durationMs, onTimeUp]);

  const seconds = Math.ceil(remaining / 1000);
  const pct = (remaining / durationMs) * 100;
  const isLow = seconds <= 5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${
            isLow ? 'bg-red-500' : 'bg-blue-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-sm font-mono font-bold min-w-[2rem] text-right ${
        isLow ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
      }`}>
        {seconds}s
      </span>
    </div>
  );
}
