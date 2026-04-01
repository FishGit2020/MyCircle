import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { RadioStation } from '../types';

interface StationCardProps {
  station: RadioStation;
  isFavorite: boolean;
  isPlaying: boolean;
  isVoted?: boolean;
  onPlay: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
  onVote?: (uuid: string) => void;
  onSelectStation?: (station: RadioStation) => void;
}

const StationCard: React.FC<StationCardProps> = ({
  station,
  isFavorite,
  isPlaying,
  isVoted = false,
  onPlay,
  onToggleFavorite,
  onVote,
  onSelectStation,
}) => {
  const { t } = useTranslation();
  const isSignedIn = !!(window as Window & { __currentUid?: string }).__currentUid;

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
        {/* Vote button */}
        {onVote && (
          <button
            type="button"
            disabled={isVoted || !isSignedIn}
            onClick={() => {
              if (!isSignedIn) return;
              onVote(station.stationuuid);
            }}
            title={!isSignedIn ? t('radio.voteSignIn') : isVoted ? t('radio.voted') : t('radio.vote')}
            aria-label={isVoted ? t('radio.voted') : t('radio.vote')}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
              isVoted
                ? 'cursor-not-allowed text-green-600 dark:text-green-400'
                : 'text-gray-400 hover:text-orange-500 dark:text-gray-500 dark:hover:text-orange-400'
            }`}
          >
            <svg className="h-4 w-4" fill={isVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
          </button>
        )}

        {/* Info button */}
        {onSelectStation && (
          <button
            type="button"
            onClick={() => onSelectStation(station)}
            aria-label={t('radio.detail.title')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-blue-500 dark:text-gray-500 dark:hover:text-blue-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}

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
