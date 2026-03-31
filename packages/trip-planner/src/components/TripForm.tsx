import { useState, useCallback } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { Trip, TripStatus } from '../types';
import DestinationSearch from './DestinationSearch';

interface TripFormProps {
  trip: Trip | null;
  onSave: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialDestination?: string;
  initialLat?: number;
  initialLon?: number;
}

export default function TripForm({ trip, onSave, onCancel, initialDestination, initialLat, initialLon }: TripFormProps) {
  const { t } = useTranslation();
  const [destination, setDestination] = useState(trip?.destination || initialDestination || '');
  const [lat, setLat] = useState<number | undefined>(trip?.lat ?? initialLat);
  const [lon, setLon] = useState<number | undefined>(trip?.lon ?? initialLon);
  const [startDate, setStartDate] = useState(trip?.startDate || '');
  const [endDate, setEndDate] = useState(trip?.endDate || '');
  const [notes, setNotes] = useState(trip?.notes || '');
  const [budget, setBudget] = useState(trip?.budget || 0);
  const [currency, setCurrency] = useState(trip?.currency || 'USD');
  const [status, setStatus] = useState<TripStatus>(trip?.status || 'planning');

  const handleDestinationSelect = useCallback((result: { displayName: string; lat: number; lon: number }) => {
    setDestination(result.displayName);
    setLat(result.lat);
    setLon(result.lon);
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!destination.trim() || !startDate || !endDate) return;
    onSave({
      destination: destination.trim(),
      startDate,
      endDate,
      notes: notes.trim(),
      budget,
      currency,
      lat,
      lon,
      itinerary: trip?.itinerary || [],
      tickets: trip?.tickets,
      checklist: trip?.checklist,
      status,
    });
  }, [destination, startDate, endDate, notes, budget, currency, lat, lon, status, trip, onSave]);

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          {trip ? t('tripPlanner.editTrip') : t('tripPlanner.newTrip')}
        </h2>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          {t('tripPlanner.cancel')}
        </button>
      </div>

      <div>
        <label htmlFor="tp-dest" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('tripPlanner.destination')} *
        </label>
        <DestinationSearch
          id="tp-dest"
          value={destination}
          onChange={setDestination}
          onSelect={handleDestinationSelect}
          placeholder={t('tripPlanner.destinationPlaceholder')}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tp-start" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('tripPlanner.startDate')} *
          </label>
          <input
            id="tp-start"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            aria-required="true"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="tp-end" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('tripPlanner.endDate')} *
          </label>
          <input
            id="tp-end"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            required
            aria-required="true"
            min={startDate}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tp-budget" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('tripPlanner.budget')}
          </label>
          <input
            id="tp-budget"
            type="number"
            value={budget || ''}
            onChange={e => setBudget(Number(e.target.value) || 0)}
            min="0"
            step="1"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="tp-currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('tripPlanner.currency')}
          </label>
          <select
            id="tp-currency"
            value={currency}
            onChange={e => setCurrency(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="CNY">CNY</option>
            <option value="KRW">KRW</option>
            <option value="TWD">TWD</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tp-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('tripPlanner.statusLabel')}
        </label>
        <select
          id="tp-status"
          value={status}
          onChange={e => setStatus(e.target.value as TripStatus)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition"
        >
          <option value="planning">{t('tripPlanner.statusPlanning')}</option>
          <option value="confirmed">{t('tripPlanner.statusConfirmed')}</option>
          <option value="completed">{t('tripPlanner.statusCompleted')}</option>
          <option value="cancelled">{t('tripPlanner.statusCancelled')}</option>
        </select>
      </div>

      <div>
        <label htmlFor="tp-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {t('tripPlanner.notes')}
        </label>
        <textarea
          id="tp-notes"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder={t('tripPlanner.notesPlaceholder')}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none resize-none transition"
        />
      </div>

      <button
        type="submit"
        disabled={!destination.trim() || !startDate || !endDate}
        className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition"
      >
        {trip ? t('tripPlanner.save') : t('tripPlanner.createTrip')}
      </button>
    </form>
  );
}
