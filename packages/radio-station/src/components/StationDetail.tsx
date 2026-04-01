import React from 'react';
import { useTranslation } from '@mycircle/shared';
import type { RadioStation } from '../types';

interface StationDetailProps {
  station: RadioStation | null;
  isOpen: boolean;
  isFavorite: boolean;
  isPlaying: boolean;
  isVoted?: boolean;
  onClose: () => void;
  onPlay: (station: RadioStation) => void;
  onToggleFavorite: (station: RadioStation) => void;
  onVote?: (uuid: string) => void;
}

const StationDetail: React.FC<StationDetailProps> = ({
  station,
  isOpen,
  isFavorite,
  isPlaying,
  isVoted = false,
  onClose,
  onPlay,
  onToggleFavorite,
  onVote,
}) => {
  const { t } = useTranslation();

  if (!station) return null;

  const tags = station.tags ? station.tags.split(',').filter(Boolean) : [];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-over panel */}
      <div
        role="dialog"
        aria-label={t('radio.detail.title')}
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t('radio.detail.title')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Station logo + name */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-orange-100 dark:bg-orange-900">
              {station.favicon ? (
                <img
                  src={station.favicon}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <svg className="h-8 w-8 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{station.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{station.country}</p>
            </div>
          </div>

          {/* Metadata */}
          <dl className="mb-4 space-y-2 text-sm">
            {station.language && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">{t('radio.detail.language')}</dt>
                <dd className="text-gray-900 dark:text-gray-100">{station.language}</dd>
              </div>
            )}
            {station.codec && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">{t('radio.detail.codec')}</dt>
                <dd className="text-gray-900 dark:text-gray-100">{station.codec}</dd>
              </div>
            )}
            {station.bitrate > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">{t('radio.detail.bitrate').replace('{kbps}', String(station.bitrate))}</dt>
                <dd className="text-gray-900 dark:text-gray-100">{station.bitrate} kbps</dd>
              </div>
            )}
            <div className="flex items-center justify-between">
              <dt className="text-gray-500 dark:text-gray-400">
                {t('radio.detail.votes').replace('{count}', String(station.votes))}
              </dt>
              <dd>
                {onVote && (
                  <button
                    type="button"
                    disabled={isVoted}
                    onClick={() => onVote(station.stationuuid)}
                    aria-label={isVoted ? t('radio.voted') : t('radio.vote')}
                    className={`flex min-h-[44px] items-center gap-1 rounded-lg px-3 py-1 text-sm transition-colors ${
                      isVoted
                        ? 'cursor-not-allowed bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-orange-900 dark:hover:text-orange-300'
                    }`}
                  >
                    <svg className="h-4 w-4" fill={isVoted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                    </svg>
                    {isVoted ? t('radio.voted') : t('radio.vote')}
                  </button>
                )}
              </dd>
            </div>
          </dl>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">{t('radio.detail.tags')}</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag.trim()}
                    className="rounded-full bg-orange-100 px-2.5 py-1 text-xs text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-700">
          <button
            type="button"
            onClick={() => onPlay(station)}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600 dark:bg-orange-600 dark:hover:bg-orange-500"
            aria-label={isPlaying ? t('radio.pause') : t('radio.play')}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              {isPlaying ? (
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
            {isPlaying ? t('radio.pause') : t('radio.play')}
          </button>

          <button
            type="button"
            onClick={() => onToggleFavorite(station)}
            className={`flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isFavorite
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-400 dark:hover:bg-red-800'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
};

export default StationDetail;
