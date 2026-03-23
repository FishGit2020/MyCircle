import { useEffect, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { JournalPhoto } from '../hooks/useJournalPhotos';

interface PhotoLightboxProps {
  photos: JournalPhoto[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function PhotoLightbox({ photos, currentIndex, onClose, onNavigate }: PhotoLightboxProps) {
  const { t } = useTranslation();
  const photo = photos[currentIndex];

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1);
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1);
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrev, onClose]);

  if (!photo) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption ?? photo.photoDate}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative max-w-3xl w-full mx-4">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t('babyJournal.photoAlbum.close')}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image */}
        <img
          src={photo.photoUrl}
          alt={photo.caption ?? `Photo from ${photo.photoDate}`}
          className="w-full max-h-[75vh] object-contain rounded-lg"
        />

        {/* Caption and metadata */}
        <div className="mt-3 px-2 space-y-1">
          {photo.stageLabel && (
            <span className="inline-block text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full">
              {photo.stageLabel}
            </span>
          )}
          {photo.caption && (
            <p className="text-sm text-white">{photo.caption}</p>
          )}
          <p className="text-xs text-gray-300">{formatDate(photo.photoDate)}</p>
        </div>

        {/* Navigation */}
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={t('babyJournal.photoAlbum.prev')}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {currentIndex < photos.length - 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label={t('babyJournal.photoAlbum.next')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
