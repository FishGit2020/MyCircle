import { useState, useRef } from 'react';
import { useTranslation } from '@mycircle/shared';
import {
  useUploadAnniversaryPicture,
  useDeleteAnniversaryPicture,
} from '../hooks/useAnniversaryMutations';

interface Picture {
  url: string;
  filename: string;
  storagePath: string;
  uploadedAt: string;
  uploadedBy: string;
}

interface PictureGalleryProps {
  anniversaryId: string;
  yearNumber: number;
  pictures: Picture[];
}

const MAX_PICTURES = 10;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PictureGallery({
  anniversaryId,
  yearNumber,
  pictures,
}: PictureGalleryProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPicture, { loading: uploading }] = useUploadAnniversaryPicture(anniversaryId);
  const [deletePicture, { loading: deleting }] = useDeleteAnniversaryPicture(anniversaryId);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmDeletePath, setConfirmDeletePath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');

    try {
      const base64Data = await fileToBase64(file);
      await uploadPicture({
        variables: {
          input: {
            anniversaryId,
            yearNumber,
            filename: file.name,
            mimeType: file.type,
            base64Data,
          },
        },
      });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (storagePath: string) => {
    try {
      await deletePicture({
        variables: { anniversaryId, yearNumber, storagePath },
      });
      setConfirmDeletePath(null);
    } catch {
      // Error handled by Apollo
    }
  };

  const canUpload = pictures.length < MAX_PICTURES;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('anniversary.pictures')}
        </h4>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {pictures.length}/{MAX_PICTURES} — {t('anniversary.maxPictures')}
        </span>
      </div>

      {/* Picture grid */}
      {pictures.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {pictures.map((pic, index) => (
            <div key={pic.storagePath} className="group relative">
              <button
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="aspect-square w-full overflow-hidden rounded-md"
                aria-label={pic.filename}
              >
                <img
                  src={pic.url}
                  alt={pic.filename}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
              </button>

              {/* Delete button overlay */}
              {confirmDeletePath === pic.storagePath ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/60">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(pic.storagePath)}
                      disabled={deleting}
                      className="min-h-[44px] min-w-[44px] rounded bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                      aria-label={t('anniversary.delete')}
                    >
                      {deleting ? '...' : t('anniversary.delete')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeletePath(null)}
                      className="min-h-[44px] min-w-[44px] rounded bg-gray-600 px-2 py-1 text-xs text-white"
                      aria-label={t('anniversary.cancel')}
                    >
                      {t('anniversary.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDeletePath(pic.storagePath)}
                  className="absolute right-1 top-1 hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-black/50 text-white group-hover:flex"
                  aria-label={t('anniversary.delete')}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canUpload && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileChange}
            className="hidden"
            aria-label={t('anniversary.uploadPicture')}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-400 dark:hover:border-blue-500 dark:hover:text-blue-400"
            aria-label={t('anniversary.uploadPicture')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {uploading ? '...' : t('anniversary.uploadPicture')}
          </button>
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {uploadError}
        </p>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && pictures[lightboxIndex] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          role="dialog"
          aria-modal="true"
          aria-label={pictures[lightboxIndex].filename}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 z-10 min-h-[44px] min-w-[44px] rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            aria-label={t('anniversary.cancel')}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous button */}
          {lightboxIndex > 0 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(lightboxIndex - 1)}
              className="absolute left-4 z-10 min-h-[44px] min-w-[44px] rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Previous"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Next button */}
          {lightboxIndex < pictures.length - 1 && (
            <button
              type="button"
              onClick={() => setLightboxIndex(lightboxIndex + 1)}
              className="absolute right-4 z-10 min-h-[44px] min-w-[44px] rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              aria-label="Next"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Image */}
          <img
            src={pictures[lightboxIndex].url}
            alt={pictures[lightboxIndex].filename}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          {/* Caption */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black/50 px-3 py-1 text-sm text-white">
            {lightboxIndex + 1} / {pictures.length} — {pictures[lightboxIndex].filename}
          </div>
        </div>
      )}
    </div>
  );
}
