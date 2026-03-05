import { useTranslation } from '@mycircle/shared';
import { useBrowserTTS } from '../hooks/useBrowserTTS';

interface BrowserTTSProps {
  text: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function BrowserTTS({ text }: BrowserTTSProps) {
  const { t } = useTranslation();
  const {
    speaking, paused, voices, selectedVoice, speed,
    play, pause, resume, stop, setVoice, setSpeed, supported,
  } = useBrowserTTS(text);

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 flex-wrap">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('library.browserTTS')}
      </span>

      <div className="flex items-center gap-1">
        {!speaking ? (
          <button
            type="button"
            onClick={play}
            disabled={!text}
            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('library.play')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : paused ? (
          <button
            type="button"
            onClick={resume}
            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('library.play')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        ) : (
          <button
            type="button"
            onClick={pause}
            className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('library.pause')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
        )}

        {speaking && (
          <button
            type="button"
            onClick={stop}
            className="p-2 rounded-lg text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={t('library.stop')}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6V6z" />
            </svg>
          </button>
        )}
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500 dark:text-gray-400">{t('library.speed')}:</span>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 text-gray-700 dark:text-gray-300 min-h-[44px]"
          aria-label={t('library.speed')}
        >
          {SPEED_OPTIONS.map(s => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
      </div>

      {/* Voice selector */}
      {voices.length > 1 && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">{t('library.voice')}:</span>
          <select
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              if (voice) setVoice(voice);
            }}
            className="text-xs bg-gray-100 dark:bg-gray-700 border-0 rounded px-2 py-1 text-gray-700 dark:text-gray-300 max-w-[150px] min-h-[44px]"
            aria-label={t('library.voice')}
          >
            {voices.map(v => (
              <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
