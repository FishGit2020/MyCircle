import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';

interface MetronomeProps {
  initialBpm?: number;
}

const MIN_BPM = 30;
const MAX_BPM = 240;
const TAP_BUFFER_SIZE = 4;
const TAP_TIMEOUT = 2000; // ms — reset tap buffer after this gap

export default function Metronome({ initialBpm = 120 }: MetronomeProps) {
  const { t } = useTranslation();
  const [bpm, setBpm] = useState(Math.max(MIN_BPM, Math.min(MAX_BPM, initialBpm)));
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, []);

  const playClick = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 1000;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);

    // Flash beat indicator
    setBeat(true);
    setTimeout(() => setBeat(false), 80);
  }, []);

  const startMetronome = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    const interval = 60000 / bpm;
    playClick();
    timerRef.current = setInterval(playClick, interval);
    setPlaying(true);
  }, [bpm, playClick]);

  const stopMetronome = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPlaying(false);
    setBeat(false);
  }, []);

  const toggleMetronome = useCallback(() => {
    if (playing) {
      stopMetronome();
    } else {
      startMetronome();
    }
  }, [playing, startMetronome, stopMetronome]);

  // Restart timer when BPM changes while playing
  useEffect(() => {
    if (playing) {
      if (timerRef.current) clearInterval(timerRef.current);
      const interval = 60000 / bpm;
      timerRef.current = setInterval(playClick, interval);
    }
  }, [bpm, playing, playClick]);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm)));
  }, []);

  const handleTapTempo = useCallback(() => {
    const now = Date.now();
    const taps = tapTimesRef.current;

    // Reset if too much time has passed
    if (taps.length > 0 && now - taps[taps.length - 1] > TAP_TIMEOUT) {
      tapTimesRef.current = [now];
      return;
    }

    taps.push(now);
    if (taps.length > TAP_BUFFER_SIZE) taps.shift();

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avgInterval);
      handleBpmChange(newBpm);
    }
  }, [handleBpmChange]);

  return (
    <div
      className="flex items-center gap-3 flex-wrap"
      role="group"
      aria-label={t('worship.metronome')}
    >
      {/* Beat indicator */}
      <div
        className={`w-3 h-3 rounded-full transition-colors duration-75 ${
          beat
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-gray-300 dark:bg-gray-600'
        }`}
        aria-hidden="true"
      />

      {/* Play/Stop toggle */}
      <button
        type="button"
        onClick={toggleMetronome}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          playing
            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        aria-label={playing ? t('worship.metronomeStop') : t('worship.metronomeStart')}
      >
        {playing ? (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
        )}
        {t('worship.metronome')}
      </button>

      {/* BPM control */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => handleBpmChange(bpm - 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs font-bold"
          aria-label={`${t('worship.bpm')} -1`}
        >
          -
        </button>
        <input
          type="number"
          value={bpm}
          onChange={e => handleBpmChange(parseInt(e.target.value) || MIN_BPM)}
          min={MIN_BPM}
          max={MAX_BPM}
          className="w-14 text-center text-xs font-mono px-1 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 outline-none"
          aria-label={t('worship.bpm')}
        />
        <button
          type="button"
          onClick={() => handleBpmChange(bpm + 1)}
          className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition text-xs font-bold"
          aria-label={`${t('worship.bpm')} +1`}
        >
          +
        </button>
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('worship.bpm')}</span>
      </div>

      {/* Tap tempo */}
      <button
        type="button"
        onClick={handleTapTempo}
        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      >
        {t('worship.tapTempo')}
      </button>
    </div>
  );
}
