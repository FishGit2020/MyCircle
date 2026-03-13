import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { PinType, TravelPin } from '../types';

interface PinFormProps {
  /** Pre-fill coordinates when user clicks the map */
  initialLat?: number;
  initialLon?: number;
  /** If provided, the form is in edit mode */
  editPin?: TravelPin;
  onSubmit: (pin: Omit<TravelPin, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function PinForm({ initialLat, initialLon, editPin, onSubmit, onCancel }: PinFormProps) {
  const { t } = useTranslation();
  const [type, setType] = useState<PinType>(editPin?.type || 'visited');
  const [name, setName] = useState(editPin?.name || '');
  const [notes, setNotes] = useState(editPin?.notes || '');
  const [lat, setLat] = useState(editPin?.lat?.toString() || initialLat?.toString() || '');
  const [lon, setLon] = useState(editPin?.lon?.toString() || initialLon?.toString() || '');

  // Update coordinates when user taps a new location on the map (not in edit mode)
  useEffect(() => {
    if (!editPin && initialLat !== undefined && initialLon !== undefined) {
      setLat(initialLat.toString());
      setLon(initialLon.toString());
    }
  }, [editPin, initialLat, initialLon]);

  const [startDate, setStartDate] = useState(editPin?.dateRange?.start || '');
  const [endDate, setEndDate] = useState(editPin?.dateRange?.end || '');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmedName = name.trim();
      if (!trimmedName || !lat || !lon) return;

      const pin: Omit<TravelPin, 'id' | 'createdAt'> = {
        type,
        name: trimmedName,
        lat: parseFloat(lat),
        lon: parseFloat(lon),
      };
      if (notes.trim()) pin.notes = notes.trim();
      if (startDate || endDate) {
        pin.dateRange = { start: startDate, end: endDate };
      }
      onSubmit(pin);
    },
    [type, name, notes, lat, lon, startDate, endDate, onSubmit],
  );

  const typeOptions: { value: PinType; label: string; color: string }[] = [
    { value: 'lived', label: t('travelMap.typeLived'), color: 'bg-red-500' },
    { value: 'visited', label: t('travelMap.typeVisited'), color: 'bg-blue-500' },
    { value: 'wishlist', label: t('travelMap.typeWishlist'), color: 'bg-yellow-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
        {editPin ? t('travelMap.editPin') : t('travelMap.addPin')}
      </h3>

      {/* Pin type selector */}
      <div className="flex gap-2">
        {typeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setType(opt.value)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              type === opt.value
                ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>

      {/* Name */}
      <div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('travelMap.namePlaceholder')}
          required
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.namePlaceholder')}
        />
      </div>

      {/* Coordinates */}
      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder={t('travelMap.lat')}
          required
          className="w-1/2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.lat')}
        />
        <input
          type="number"
          step="any"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
          placeholder={t('travelMap.lon')}
          required
          className="w-1/2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.lon')}
        />
      </div>

      {/* Notes */}
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('travelMap.notesPlaceholder')}
          rows={2}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.notesPlaceholder')}
        />
      </div>

      {/* Date range */}
      <div className="flex gap-2">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-1/2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.startDate')}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-1/2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.endDate')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          type="submit"
          className="flex-1 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {editPin ? t('travelMap.save') : t('travelMap.addPin')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          {t('travelMap.cancel')}
        </button>
      </div>
    </form>
  );
}
