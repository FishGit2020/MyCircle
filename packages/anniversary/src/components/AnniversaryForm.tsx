import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { useCreateAnniversary } from '../hooks/useAnniversaryMutations';

interface AnniversaryFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (id: string) => void;
}

export default function AnniversaryForm({ open, onClose, onCreated }: AnniversaryFormProps) {
  const { t } = useTranslation();
  const [createAnniversary, { loading }] = useCreateAnniversary();

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [locationName, setLocationName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !date) return;

    try {
      const result = await createAnniversary({
        variables: {
          input: {
            title: title.trim(),
            originalDate: date,
            ...(locationName.trim() ? { location: { lat: 0, lon: 0, name: locationName.trim() } } : {}),
          },
        },
      });
      const newId = result.data?.createAnniversary?.id;
      setTitle('');
      setDate('');
      setLocationName('');
      onClose();
      if (newId && onCreated) onCreated(newId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create anniversary');
    }
  };

  const handleCancel = () => {
    setTitle('');
    setDate('');
    setLocationName('');
    setError('');
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={t('anniversary.createNew')}
    >
      <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          {t('anniversary.createNew')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label
              htmlFor="anniversary-title"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.titleLabel')} *
            </label>
            <input
              id="anniversary-title"
              type="text"
              required
              maxLength={100}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.titleLabel')}
            />
          </div>

          {/* Date */}
          <div>
            <label
              htmlFor="anniversary-date"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.dateLabel')} *
            </label>
            <input
              id="anniversary-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
              aria-label={t('anniversary.dateLabel')}
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="anniversary-location"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('anniversary.locationLabel')}
            </label>
            <input
              id="anniversary-location"
              type="text"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
              aria-label={t('anniversary.locationLabel')}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label={t('anniversary.cancel')}
            >
              {t('anniversary.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || !title.trim() || !date}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label={t('anniversary.create')}
            >
              {loading ? '...' : t('anniversary.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
