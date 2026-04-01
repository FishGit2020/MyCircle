import { useState, useRef, useCallback } from 'react';

interface SleepTimerState {
  active: boolean;
  totalMinutes: number;
  secondsLeft: number;
}

interface UseSleepTimerOptions {
  onExpire: () => void;
}

export function useSleepTimer({ onExpire }: UseSleepTimerOptions) {
  const [state, setState] = useState<SleepTimerState>({
    active: false,
    totalMinutes: 0,
    secondsLeft: 0,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (minutes: 15 | 30 | 45 | 60) => {
      clearTimer();
      const totalSeconds = minutes * 60;
      setState({ active: true, totalMinutes: minutes, secondsLeft: totalSeconds });

      intervalRef.current = setInterval(() => {
        setState((prev) => {
          if (prev.secondsLeft <= 1) {
            clearTimer();
            onExpire();
            return { active: false, totalMinutes: 0, secondsLeft: 0 };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    },
    [clearTimer, onExpire],
  );

  const cancel = useCallback(() => {
    clearTimer();
    setState({ active: false, totalMinutes: 0, secondsLeft: 0 });
  }, [clearTimer]);

  return { active: state.active, secondsLeft: state.secondsLeft, totalMinutes: state.totalMinutes, start, cancel };
}
