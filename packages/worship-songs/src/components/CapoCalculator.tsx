import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { transposeChord } from '../utils/transpose';

const EASY_KEYS = new Set(['C', 'G', 'D', 'A', 'E']);
const MAX_FRET = 9;

interface Props {
  soundingKey: string;
  capoFret: number;
  onCapoChange: (fret: number) => void;
}

export default function CapoCalculator({ soundingKey, capoFret, onCapoChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const options = Array.from({ length: MAX_FRET }, (_, i) => {
    const fret = i + 1;
    const shapeKey = transposeChord(soundingKey, -fret);
    return { fret, shapeKey, isEasy: EASY_KEYS.has(shapeKey) };
  });

  const suggestions = options.filter(o => o.isEasy);
  const activeOption = options.find(o => o.fret === capoFret);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition w-full"
        aria-expanded={open}
      >
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>{t('worship.capoCalculator')}</span>
        {capoFret > 0 && activeOption && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-medium">
            {t('worship.capoFret').replace('{n}', String(capoFret))} &rarr; {activeOption.shapeKey}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {/* Fret selector grid */}
          <div className="flex items-center gap-1.5 flex-wrap" role="radiogroup" aria-label={t('worship.capoCalculator')}>
            <button
              onClick={() => onCapoChange(0)}
              role="radio"
              aria-checked={capoFret === 0}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                capoFret === 0
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t('worship.capoOff')}
            </button>
            {options.map(({ fret, shapeKey, isEasy }) => (
              <button
                key={fret}
                onClick={() => onCapoChange(capoFret === fret ? 0 : fret)}
                role="radio"
                aria-checked={capoFret === fret}
                aria-label={`${t('worship.capoFret').replace('{n}', String(fret))}: ${shapeKey}${isEasy ? ` (${t('worship.capoEasyKey')})` : ''}`}
                className={`flex flex-col items-center px-2 py-1 rounded-lg text-xs font-medium transition min-w-[36px] ${
                  capoFret === fret
                    ? 'bg-blue-500 text-white shadow-sm'
                    : isEasy
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 ring-1 ring-green-300 dark:ring-green-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="text-[10px] opacity-70">{fret}</span>
                <span className="font-bold leading-tight">{shapeKey}</span>
              </button>
            ))}
          </div>

          {/* Current capo info */}
          {capoFret > 0 && activeOption && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {t('worship.capoInstruction')
                  .replace('{fret}', String(capoFret))
                  .replace('{shapeKey}', activeOption.shapeKey)
                  .replace('{soundingKey}', soundingKey)}
              </p>
            </div>
          )}

          {/* Easy key suggestions (when no capo is selected) */}
          {capoFret === 0 && suggestions.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('worship.capoSuggested')}:{' '}
              {suggestions.map((s, i) => (
                <span key={s.fret}>
                  {i > 0 && ', '}
                  <button
                    onClick={() => onCapoChange(s.fret)}
                    className="text-green-600 dark:text-green-400 hover:underline font-medium"
                  >
                    {s.fret}&rarr;{s.shapeKey}
                  </button>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
