import { useState, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';

interface MilestonePhotoProps {
  stageId: number;
  photoUrl?: string;
  caption?: string;
  isAuthenticated: boolean;
  loading?: boolean;
  onUpload: (stageId: number, file: File, caption?: string) => Promise<void>;
  onDelete: (stageId: number) => Promise<void>;
  uploading: boolean;
  error?: string | null;
  onClearError?: () => void;
}

export default function MilestonePhoto({
  stageId,
  photoUrl,
  caption,
  isAuthenticated,
  loading,
  onUpload,
  onDelete,
  uploading,
  error,
  onClearError,
}: MilestonePhotoProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset input so same file can be re-selected
    e.target.value = '';
    onClearError?.();

    try {
      if (showCaptionInput) {
        await onUpload(stageId, file, captionInput || undefined);
      } else {
        await onUpload(stageId, file);
      }
    } finally {
      // Always reset caption UI regardless of success/failure
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
    await onDelete(stageId);
    setConfirmDelete(false);
  };

  if (!isAuthenticated && !loading) return null;

  // Loading state — waiting for Firestore auth + data fetch
  // Skeleton dimensions match the actual photo button (w-16 h-16 md:w-20 md:h-20) to prevent CLS
  if (loading) {
    return (
      <div className="flex items-center gap-3 mt-2">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-2 w-14 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Uploading state
  if (uploading) {
    return (
      <div className="flex items-center gap-3 mt-2">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-pink-100 dark:bg-pink-900/30 animate-pulse shrink-0" />
        <span className="text-xs text-pink-500 dark:text-pink-400">{t('baby.uploading')}</span>
      </div>
    );
  }

  // Error state — show inline error with retry option
  if (error && !photoUrl) {
    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-red-500 dark:text-red-400">{t('baby.uploadFailed')}</span>
        <button
          type="button"
          onClick={onClearError}
          className="text-xs text-pink-500 dark:text-pink-400 underline"
        >
          {t('baby.tryAgain')}
        </button>
      </div>
    );
  }

  // Photo exists — show thumbnail + actions
  if (photoUrl) {
    return (
      <>
        <div className="flex items-center gap-3 mt-2">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-pink-200 dark:border-pink-800 hover:border-pink-400 dark:hover:border-pink-600 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500"
            aria-label={t('baby.viewPhoto')}
          >
            <img
              src={photoUrl}
              alt={t('baby.milestonePhoto')}
              width={80}
              height={80}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
          <div className="flex-1 min-w-0">
            {caption && (
              <p className="text-xs text-gray-600 dark:text-gray-400 italic truncate">{caption}</p>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-1 text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              aria-label={t('baby.deletePhoto')}
            >
              {t('baby.deletePhoto')}
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDelete && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
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
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                {t('baby.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Lightbox */}
        {lightboxOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            onClick={() => setLightboxOpen(false)}
            role="dialog"
            aria-label={t('baby.milestonePhoto')}
          >
            <div
              className="relative max-w-3xl max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photoUrl}
                alt={t('baby.milestonePhoto')}
                className="max-w-full max-h-[85vh] object-contain rounded-lg"
              />
              {caption && (
                <p className="text-center text-white/90 text-sm mt-2 italic">{caption}</p>
              )}
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
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
      </>
    );
  }

  // No photo — show "Add Photo" button or caption input
  return (
    <div className="mt-2">
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
            className="shrink-0 px-2 py-1.5 text-xs bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => { setShowCaptionInput(false); setCaptionInput(''); }}
            className="shrink-0 px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors min-h-[44px] min-w-[44px]"
          aria-label={t('baby.addPhoto')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {t('baby.addPhoto')}
        </button>
      )}
    </div>
  );
}
