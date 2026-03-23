import React, { useState, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useJournalPhotos } from '../hooks/useJournalPhotos';
import type { JournalPhoto } from '../hooks/useJournalPhotos';
import PhotoLightbox from './PhotoLightbox';

interface JournalPhotoSectionProps {
  childId?: string | null;
}

function groupByMonth(photos: JournalPhoto[]): { label: string; photos: JournalPhoto[] }[] {
  const groups: Map<string, JournalPhoto[]> = new Map();
  for (const photo of photos) {
    const [y, m] = photo.photoDate.split('-');
    const dt = new Date(Number(y), Number(m) - 1, 1);
    const label = dt.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(photo);
  }
  return Array.from(groups.entries()).map(([label, photos]) => ({ label, photos }));
}

export default function JournalPhotoSection({ childId }: JournalPhotoSectionProps) {
  const { t } = useTranslation();
  const { photos, loading, uploading, uploadError, clearUploadError, upload, deletePhoto } = useJournalPhotos({ childId });

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await upload(file, {
        caption: captionInput || null,
        photoDate: dateInput || null,
      });
      setCaptionInput('');
      setDateInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // error already set in hook
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deletePhoto(id);
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const groups = groupByMonth(photos);

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={captionInput}
            onChange={(e) => setCaptionInput(e.target.value)}
            placeholder={t('babyJournal.photoAlbum.captionPlaceholder')}
            maxLength={200}
            className="flex-1 min-w-0 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100"
          />
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            aria-label={t('babyJournal.myMoments.datePlaceholder')}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 dark:text-gray-100"
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-pink-600 text-white text-sm font-medium hover:bg-pink-700 disabled:opacity-50 min-h-[44px]"
        >
          {uploading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('babyJournal.photoAlbum.uploading')}
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('babyJournal.photoAlbum.addPhoto')}
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Upload error */}
      {uploadError && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-red-700 dark:text-red-300">{t('babyJournal.photoAlbum.uploadError')}</p>
          <button
            type="button"
            onClick={clearUploadError}
            className="text-sm text-red-600 dark:text-red-400 underline min-h-[44px]"
          >
            {t('babyJournal.photoAlbum.retry')}
          </button>
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && photos.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 py-1">
          {t('babyJournal.photoAlbum.empty')}
        </p>
      )}

      {/* Photo grid grouped by month */}
      {groups.map(({ label, photos: monthPhotos }) => (
        <div key={label} className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {monthPhotos.map((photo) => {
              const globalIndex = photos.indexOf(photo);
              return (
                <div key={photo.id} className="relative group aspect-square">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(globalIndex)}
                    className="w-full h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 rounded-lg overflow-hidden"
                    aria-label={photo.caption ?? `Photo from ${photo.photoDate}`}
                  >
                    <img
                      src={photo.photoUrl}
                      alt={photo.caption ?? `Photo from ${photo.photoDate}`}
                      className="w-full h-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  </button>
                  {/* Stage label badge */}
                  {photo.stageLabel && (
                    <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                      {photo.stageLabel}
                    </span>
                  )}
                  {/* Delete button overlay */}
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(photo.id)}
                    aria-label={t('babyJournal.photoAlbum.delete')}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 transition-opacity min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 space-y-3">
          <p className="text-sm text-red-700 dark:text-red-300">{t('babyJournal.photoAlbum.deleteConfirm')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleDelete(confirmDeleteId)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 min-h-[44px]"
            >
              {t('babyJournal.photoAlbum.delete')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px]"
            >
              {t('babyJournal.myMoments.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
