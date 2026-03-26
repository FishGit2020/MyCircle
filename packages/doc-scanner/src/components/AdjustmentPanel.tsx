import React from 'react';
import { useTranslation } from '@mycircle/shared';

interface AdjustmentPanelProps {
  brightness: number;
  contrast: number;
  rotation: number;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onRotate: () => void;
  onReset: () => void;
}

export function AdjustmentPanel({
  brightness,
  contrast,
  rotation,
  onBrightnessChange,
  onContrastChange,
  onRotate,
  onReset,
}: AdjustmentPanelProps) {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4">
      {/* Brightness */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="brightness-slider"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('docScanner.brightness')}
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-8 text-right">
            {brightness}
          </span>
        </div>
        <input
          id="brightness-slider"
          type="range"
          min={-100}
          max={100}
          value={brightness}
          onChange={(e) => onBrightnessChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          aria-label={t('docScanner.brightness')}
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={brightness}
        />
      </div>

      {/* Contrast */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="contrast-slider"
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {t('docScanner.contrast')}
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-8 text-right">
            {contrast}
          </span>
        </div>
        <input
          id="contrast-slider"
          type="range"
          min={-100}
          max={100}
          value={contrast}
          onChange={(e) => onContrastChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
          aria-label={t('docScanner.contrast')}
          aria-valuemin={-100}
          aria-valuemax={100}
          aria-valuenow={contrast}
        />
      </div>

      {/* Rotate + Reset row */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onRotate}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium text-sm min-h-[44px]"
          aria-label={`${t('docScanner.rotate')} (${rotation}°)`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t('docScanner.rotate')} {rotation}°
        </button>

        <button
          type="button"
          onClick={onReset}
          className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition font-medium text-sm min-h-[44px]"
          aria-label={t('docScanner.resetAdjustments')}
        >
          {t('docScanner.resetAdjustments')}
        </button>
      </div>
    </div>
  );
}
