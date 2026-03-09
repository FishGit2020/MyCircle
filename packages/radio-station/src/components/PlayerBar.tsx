import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { RadioStation } from '../types';

interface PlayerBarProps {
  station: RadioStation;
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
}

const PlayerBar: React.FC<PlayerBarProps> = ({
  station,
  isPlaying,
  volume,
  onPlayPause,
  onStop,
  onVolumeChange,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-orange-200 bg-white px-4 py-2 shadow-lg dark:border-orange-800 dark:bg-gray-900">
      <div className="mx-auto flex max-w-4xl items-center gap-3">
        {/* Station icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-100 dark:bg-orange-900">
          {station.favicon ? (
            <img
              src={station.favicon}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <svg
              className="h-5 w-5 text-orange-500 dark:text-orange-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          )}
        </div>

        {/* Station info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {station.name}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">
            {station.country}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={onPlayPause}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white transition-colors hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
            aria-label={isPlaying ? t('radio.pause') : t('radio.play')}
          >
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume slider - hidden on small screens */}
          <div className="hidden items-center gap-1 md:flex">
            <svg
              className="h-4 w-4 text-gray-500 dark:text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 6v12m-3.536-2.464a5 5 0 010-7.072"
              />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-gray-300 accent-orange-500 dark:bg-gray-600"
              aria-label={t('radio.volume')}
            />
          </div>

          {/* Stop */}
          <button
            type="button"
            onClick={onStop}
            className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
            aria-label={t('radio.stop')}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;
