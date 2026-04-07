import { useTranslation } from '@mycircle/shared';

export interface TimerConfig {
  enabled: boolean;
  totalMinutes: number;
  startTimestamp: number | null;
}

interface TimerControlProps {
  timerConfig: TimerConfig;
  elapsedMs: number;
  onConfigChange: (config: TimerConfig) => void;
  disabled?: boolean;
}

const PRESETS = [20, 30, 45];

function pad(n: number): string {
  return String(Math.floor(n)).padStart(2, '0');
}

export default function TimerControl({ timerConfig, elapsedMs, onConfigChange, disabled }: TimerControlProps) {
  const { t } = useTranslation();
  const { enabled, totalMinutes, startTimestamp } = timerConfig;
  const isRunning = enabled && startTimestamp != null;
  const totalMs = totalMinutes * 60 * 1000;
  const remainingMs = Math.max(0, totalMs - elapsedMs);
  const remainingMinutes = Math.floor(remainingMs / 60000);
  const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
  const isWarning = isRunning && remainingMs <= 5 * 60 * 1000 && remainingMs > 0;

  return (
    <div className="flex flex-col gap-2">
      {/* Enable toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={t('aiInterviewer.timerEnabled')}
          disabled={disabled || isRunning}
          onClick={() => onConfigChange({ ...timerConfig, enabled: !enabled })}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
            enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
        <span className="text-sm text-gray-700 dark:text-gray-300">{t('aiInterviewer.timerLabel')}</span>
      </div>

      {/* Duration selector */}
      {enabled && !isRunning && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {PRESETS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => onConfigChange({ ...timerConfig, totalMinutes: minutes })}
              className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors min-h-[44px] ${
                totalMinutes === minutes
                  ? 'bg-blue-600 dark:bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('aiInterviewer.timerMinutes', { n: minutes })}
            </button>
          ))}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('aiInterviewer.timerCustom')}:</span>
            <input
              type="number"
              min={1}
              max={120}
              value={PRESETS.includes(totalMinutes) ? '' : totalMinutes}
              placeholder="—"
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= 120) {
                  onConfigChange({ ...timerConfig, totalMinutes: val });
                }
              }}
              className="w-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={t('aiInterviewer.timerCustom')}
            />
          </div>
        </div>
      )}

      {/* Running countdown */}
      {isRunning && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
          isWarning
            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
        }`}>
          <span className="tabular-nums">
            {t('aiInterviewer.timerRemaining', { m: pad(remainingMinutes), s: pad(remainingSeconds) })}
          </span>
          {isWarning && (
            <span className="text-xs text-amber-600 dark:text-amber-400">{t('aiInterviewer.timerWarning')}</span>
          )}
        </div>
      )}
    </div>
  );
}
