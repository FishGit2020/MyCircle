import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import { useTrips } from '../hooks/useTrips';
import TripList from './TripList';
import TripForm from './TripForm';
import TripDetail from './TripDetail';
import type { Trip } from '../types';

type View = 'list' | 'new' | 'detail';

export default function TripPlanner() {
  const { t } = useTranslation();
  const { trips, loading, error, addTrip, updateTrip, deleteTrip } = useTrips();
  const [view, setView] = useState<View>('list');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const handleSave = useCallback(async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTrip) {
      await updateTrip(selectedTrip.id, data);
    } else {
      await addTrip(data);
    }
    setView('list');
    setSelectedTrip(null);
  }, [selectedTrip, updateTrip, addTrip]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm(t('tripPlanner.deleteConfirm'))) return;
    await deleteTrip(id);
    setView('list');
    setSelectedTrip(null);
  }, [deleteTrip, t]);

  const handleSelect = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setView('detail');
  }, []);

  const handleEdit = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setView('new');
  }, []);

  const handleBack = useCallback(() => {
    setView('list');
    setSelectedTrip(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-red-500 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (view === 'new') {
    return (
      <PageContent>
        <TripForm
          trip={selectedTrip}
          onSave={handleSave}
          onCancel={handleBack}
        />
      </PageContent>
    );
  }

  if (view === 'detail' && selectedTrip) {
    const currentTrip = trips.find(tr => tr.id === selectedTrip.id) || selectedTrip;
    return (
      <PageContent>
        <TripDetail
          trip={currentTrip}
          onEdit={() => handleEdit(currentTrip)}
          onDelete={() => handleDelete(currentTrip.id)}
          onBack={handleBack}
          onUpdate={updateTrip}
        />
      </PageContent>
    );
  }

  return (
    <PageContent className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-7 h-7 text-cyan-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          {t('tripPlanner.title')}
        </h1>
        <button
          type="button"
          onClick={() => { setSelectedTrip(null); setView('new'); }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition"
        >
          {t('tripPlanner.newTrip')}
        </button>
      </div>
      <TripList trips={trips} onSelect={handleSelect} onDelete={handleDelete} />
    </PageContent>
  );
}
