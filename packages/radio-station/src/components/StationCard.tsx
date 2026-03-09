import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { RadioStation } from '../types';

interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  isPlaying: boolean;
  onPlay: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  isFavorite,
  isPlaying,
  onPlay,
  onToggleFavorite,
}) => {
  const { t } = useTranslation();

  const tags = station.tags
    ? station.tags.split(',').filter(Boolean).slice(0, 3)
    : [];

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors
        ${isPlaying
          ? 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950'
          : 'border-gray-200 bg-white hover:border-orange-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-orange-600'
        }`}
    >
      {/* Station icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-100 dark:bg-orange-900">
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
            className="h-6 w-6 text-orange-500 dark:text-orange-400"
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
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {station.name}
        </h3>
        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
          {station.country}
          {station.bitrate > 0 && ` \u00B7 ${station.bitrate} kbps`}
        </p>
        {tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onPlay(station)}
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
        <button
          type="button"
          onClick={() => onToggleFavorite(station)}
          className="flex h-10 w-10 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-orange-500 dark:text-gray-500 dark:hover:text-orange-400"
          aria-label={isFavorite ? t('radio.removeFavorite') : t('radio.addFavorite')}
        >
          <svg
            className="h-5 w-5"
            fill={isFavorite ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={isFavorite ? 0 : 2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default StationCard;
