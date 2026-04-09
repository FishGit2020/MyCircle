import { useState, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useUpdateAnniversaryYear } from '../hooks/useAnniversaryMutations';
import PictureGallery from './PictureGallery';

interface YearData {
  yearNumber: number;
  year: number;
  activity?: string | null;
  notes?: string | null;
  pictures: Array<{
    url: string;
    filename: string;
    storagePath: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  location?: { lat: number; lon: number; name?: string | null } | null;
}

interface YearlyEditorProps {
  anniversaryId: string;
  yearNumber: number;
  yearData: YearData | null;
  onClose: () => void;
}

export default function YearlyEditor({
  anniversaryId,
  yearNumber,
  yearData,
  onClose,
}: YearlyEditorProps) {
  const { t } = useTranslation();
  const [updateYear, { loading }] = useUpdateAnniversaryYear(anniversaryId);

  const [activity, setActivity] = useState(yearData?.activity ?? '');
  const [notes, setNotes] = useState(yearData?.notes ?? '');
  const [locationName, setLocationName] = useState(yearData?.location?.name ?? '');
  const [error, setError] = useState('');

  // Sync state when yearData changes (e.g. after refetch)
  useEffect(() => {
    setActivity(yearData?.activity ?? '');
    setNotes(yearData?.notes ?? '');
    setLocationName(yearData?.location?.name ?? '');
  }, [yearData]);

  const handleSave = async () => {
    setError('');
    try {
      await updateYear({
        variables: {
          anniversaryId,
          yearNumber,
          input: {
            activity: activity.trim() || null,
            notes: notes.trim() || null,
            ...(locationName.trim()
              ? {
                  location: {
                    lat: yearData?.location?.lat ?? 0,
                    lon: yearData?.location?.lon ?? 0,
                    name: locationName.trim(),
                  },
                }
              : {}),
          },
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const displayYear = yearData?.year ?? new Date().getFullYear() - yearNumber + 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-8 md:items-center md:pt-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${t('anniversary.year')} ${yearNumber} - ${displayYear}`}
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('anniversary.year')} {yearNumber} - {displayYear}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            aria-label={t('anniversary.cancel')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-4">
          {/* Activity */}
          <div>
            <label
              htmlFor="year-activity"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.activity')}
            </label>
            <textarea
              id="year-activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t('anniversary.activityPlaceholder')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.activity')}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {activity.length}/500
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="year-notes"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.notes')}
            </label>
            <textarea
              id="year-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={5000}
              rows={5}
              placeholder={t('anniversary.notesPlaceholder')}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.notes')}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {notes.length}/5000
            </p>
          </div>

          {/* Location name */}
          <div>
            <label
              htmlFor="year-location"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.location')}
            </label>
            <input
              id="year-location"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.location')}
            />
          </div>

          {/* Picture Gallery */}
          <PictureGallery
            anniversaryId={anniversaryId}
            yearNumber={yearNumber}
            pictures={yearData?.pictures ?? []}
          />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={t('anniversary.cancel')}
          >
            {t('anniversary.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="min-h-[44px] rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            aria-label={t('anniversary.save')}
          >
            {loading ? '...' : t('anniversary.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
