import { useState, useRef, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { MilestonePhotoData } from '../hooks/useBabyPhotos';

interface MilestonePhotoProps {
  stageId: number;
  photos: MilestonePhotoData[];
  notes?: string;
  isAuthenticated: boolean;
  loading?: boolean;
  onUpload: (stageId: number, file: File, caption?: string) => Promise<void>;
  onDelete: (stageId: number, photoId: string) => Promise<void>;
  onSaveNotes: (stageId: number, notes: string) => Promise<void>;
  uploading: boolean;
  savingNotes: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export default function MilestonePhoto({
  stageId,
  photos,
  notes,
  isAuthenticated,
  loading,
  onUpload,
  onDelete,
  onSaveNotes,
  uploading,
  savingNotes,
  error,
  onClearError,
}: MilestonePhotoProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<MilestonePhotoData | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [captionInput, setCaptionInput] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [notesInput, setNotesInput] = useState<string | undefined>(undefined);
  const [notesSaved, setNotesSaved] = useState(false);

  // Use local notes input if editing, otherwise show saved notes
  const currentNotes = notesInput !== undefined ? notesInput : (notes ?? '');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    onClearError?.();
    try {
      await onUpload(stageId, file, captionInput || undefined);
    } finally {
      setCaptionInput('');
      setShowCaptionInput(false);
    }
  };

  const handleAddClick = () => {
    setShowCaptionInput(true);
  };

  const handleCaptionSubmit = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    await onDelete(stageId, confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const handleNotesSave = useCallback(async () => {
    await onSaveNotes(stageId, currentNotes);
    setNotesInput(undefined);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }, [stageId, currentNotes, onSaveNotes]);

  if (!isAuthenticated && !loading) return null;

  if (loading) {
    return (
      <div className="mt-2 space-y-2">
        <div className="flex gap-2">
          <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
          <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
        </div>
        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-3">
      {/* Photo gallery */}
      <div>
        {/* Photo thumbnails */}
        {(photos.length > 0 || uploading) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {photos.map((photo) => (
              <div key={photo.photoId} className="relative group">
                <button
                  type="button"
                  onClick={() => setLightboxPhoto(photo)}
                  className="w-16 h-16 rounded-lg overflow-hidden border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 shrink-0"
                  aria-label={t('baby.viewPhoto')}
                >
                  <img
                    src={photo.photoUrl}
                    alt={t('baby.milestonePhoto')}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
                {/* Delete button overlay */}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(photo.photoId)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 shadow"
                  aria-label={t('baby.deletePhoto')}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {/* Uploading placeholder */}
            {uploading && (
              <div className="w-16 h-16 rounded-lg bg-pink-100 dark:bg-pink-900/30 animate-pulse shrink-0 flex items-center justify-center">
                <span className="text-xs text-pink-500 dark:text-pink-400">{t('baby.uploading')}</span>
              </div>
            )}
          </div>
        )}

        {/* Upload error */}
        {error && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-red-500 dark:text-red-400">{t('baby.uploadFailed')}</span>
            <button type="button" onClick={onClearError} className="text-xs text-pink-500 dark:text-pink-400 underline">
              {t('baby.tryAgain')}
            </button>
          </div>
        )}

        {/* Add photo input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden="true"
        />
        {showCaptionInput ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              placeholder={t('baby.photoCaptionPlaceholder')}
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-pink-500 outline-none"
              onKeyDown={(e) => { if (e.key === 'Enter') handleCaptionSubmit(); }}
              aria-label={t('baby.photoCaption')}
            />
            <button
              type="button"
              onClick={handleCaptionSubmit}
              className="shrink-0 px-2 py-1.5 text-xs bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setShowCaptionInput(false); setCaptionInput(''); }}
              className="shrink-0 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors min-h-[44px]"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleAddClick}
            disabled={uploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={photos.length > 0 ? t('baby.addAnotherPhoto') : t('baby.addPhoto')}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {photos.length > 0 ? t('baby.addAnotherPhoto') : t('baby.addPhoto')}
          </button>
        )}
      </div>

      {/* Notes section */}
      <div>
        <textarea
          value={currentNotes}
          onChange={(e) => setNotesInput(e.target.value)}
          placeholder={t('baby.notesPlaceholder')}
          rows={2}
          className="w-full text-xs px-2.5 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 outline-none resize-none"
          aria-label={t('baby.notes')}
        />
        {notesInput !== undefined && notesInput !== (notes ?? '') && (
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={handleNotesSave}
              disabled={savingNotes}
              className="text-xs px-2.5 py-1 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[36px]"
            >
              {savingNotes ? t('baby.saving') : t('baby.saveNotes')}
            </button>
            <button
              type="button"
              onClick={() => setNotesInput(undefined)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              {t('baby.cancel')}
            </button>
          </div>
        )}
        {notesSaved && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('baby.notesSaved')}</p>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-xs text-red-700 dark:text-red-300 mb-2">{t('baby.deletePhotoConfirm')}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-3 py-1 text-xs bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              {t('baby.deletePhoto')}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {t('baby.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
          role="dialog"
          aria-label={t('baby.milestonePhoto')}
        >
          <div
            className="relative max-w-3xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.photoUrl}
              alt={t('baby.milestonePhoto')}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {lightboxPhoto.caption && (
              <p className="text-center text-white/90 text-sm mt-2 italic">{lightboxPhoto.caption}</p>
            )}
            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-gray-800 rounded-full shadow-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={t('baby.closeLightbox')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
