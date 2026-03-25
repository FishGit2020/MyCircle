import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { AtsScore } from '../hooks/useResumeGeneration';

interface Props {
  score: AtsScore;
  onBoost?: () => void;
  boosting?: boolean;
}

export default function AtsScoreCard({ score, onBoost, boosting }: Props) {
  const { t } = useTranslation();

  const color =
    score.overall >= 80
      ? 'text-green-600 dark:text-green-400'
      : score.overall >= 60
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-red-600 dark:text-red-400';

  const ringColor =
    score.overall >= 80
      ? 'stroke-green-500'
      : score.overall >= 60
      ? 'stroke-yellow-500'
      : 'stroke-red-500';

  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference * (1 - score.overall / 100);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Score ring */}
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="6" fill="none" />
            <circle
              cx="40" cy="40" r="36"
              className={ringColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div className={`absolute inset-0 flex flex-col items-center justify-center ${color}`}>
            <span className="text-xl font-bold leading-none">{score.overall}</span>
            <span className="text-[10px] opacity-70">ATS</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {t('resumeTailor.generate.atsScore')}
          </h3>
          <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 dark:text-gray-400">
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{score.hardSkillsScore}</span>
              <span className="ml-1">{t('resumeTailor.generate.skills')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{score.titleScore}</span>
              <span className="ml-1">{t('resumeTailor.generate.title')}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700 dark:text-gray-300">{score.contextScore}</span>
              <span className="ml-1">{t('resumeTailor.generate.context')}</span>
            </div>
          </div>
          {onBoost && (
            <button
              type="button"
              onClick={onBoost}
              disabled={boosting}
              className="mt-2 px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded min-h-[44px] disabled:opacity-50 transition-colors"
            >
              {boosting ? t('resumeTailor.generate.boosting') : t('resumeTailor.generate.boostMode')}
            </button>
          )}
        </div>
      </div>

      {/* Keywords */}
      {score.matchedKeywords.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('resumeTailor.generate.matched')}</p>
          <div className="flex flex-wrap gap-1">
            {score.matchedKeywords.map(kw => (
              <span key={kw} className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {score.missingKeywords.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('resumeTailor.generate.missing')}</p>
          <div className="flex flex-wrap gap-1">
            {score.missingKeywords.map(kw => (
              <span key={kw} className="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
