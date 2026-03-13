import { useState, useCallback } from 'react';
import { useTranslation, PageContent } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import MapView from './MapView';
import PinForm from './PinForm';
import PinMarker from './PinMarker';
import { useTravelPins } from '../hooks/useTravelPins';
import type { TravelPin, PinType } from '../types';
import { PIN_COLORS } from '../types';

export default function TravelMap() {
  const { t } = useTranslation();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const { pins, addPin, updatePin, deletePin } = useTravelPins();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPin, setEditingPin] = useState<TravelPin | null>(null);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<PinType | 'all'>('all');

  const filteredPins = filterType === 'all' ? pins : pins.filter((p) => p.type === filterType);

  const handleStyleLoad = useCallback(() => {
    setStyleVersion((v) => v + 1);
  }, []);

  const handleMapClick = useCallback((lngLat: [number, number]) => {
    setClickedCoords(lngLat);
    setEditingPin(null);
    setShowForm(true);
  }, []);

  const handlePinClick = useCallback((pin: TravelPin) => {
    setEditingPin(pin);
    setShowForm(true);
    setClickedCoords(null);
  }, []);

  const handleFormSubmit = useCallback(
    async (pinData: Omit<TravelPin, 'id' | 'createdAt'>) => {
      if (editingPin) {
        await updatePin(editingPin.id, pinData);
      } else {
        await addPin(pinData);
      }
      setShowForm(false);
      setEditingPin(null);
      setClickedCoords(null);
    },
    [editingPin, addPin, updatePin],
  );

  const handleFormCancel = useCallback(() => {
    setShowForm(false);
    setEditingPin(null);
    setClickedCoords(null);
  }, []);

  const handleDeletePin = useCallback(
    async (id: string) => {
      await deletePin(id);
      setShowForm(false);
      setEditingPin(null);
    },
    [deletePin],
  );

  const handlePinSelect = useCallback(
    (pin: TravelPin) => {
      if (map) {
        map.flyTo({ center: [pin.lon, pin.lat], zoom: 10, duration: 800 });
      }
      setEditingPin(pin);
      setShowForm(true);
    },
    [map],
  );

  const counts = {
    lived: pins.filter((p) => p.type === 'lived').length,
    visited: pins.filter((p) => p.type === 'visited').length,
    wishlist: pins.filter((p) => p.type === 'wishlist').length,
  };

  return (
    <PageContent fill>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('travelMap.title' as any)}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {t('travelMap.subtitle' as any)}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="flex items-center gap-1 text-red-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
            {counts.lived}
          </span>
          <span className="flex items-center gap-1 text-blue-500">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" />
            {counts.visited}
          </span>
          <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-500" />
            {counts.wishlist}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:flex-1 md:min-h-0">
        {/* Map */}
        <div className="relative h-[55vh] md:h-auto md:flex-1 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="absolute inset-0">
            <MapView onMapReady={setMap} onMapClick={handleMapClick} onStyleLoad={handleStyleLoad} />
          </div>

          {/* Tap hint */}
          {map && pins.length === 0 && !showForm && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
              <div className="bg-black/50 text-white text-xs rounded-full px-3 py-1 whitespace-nowrap">
                {t('travelMap.tapToPin' as any)}
              </div>
            </div>
          )}

          {/* Pin layers */}
          <PinMarker map={map} pins={filteredPins} styleVersion={styleVersion} onPinClick={handlePinClick} />
        </div>

        {/* Sidebar */}
        <div className="md:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {showForm ? (
            <div>
              <PinForm
                initialLat={clickedCoords ? clickedCoords[1] : undefined}
                initialLon={clickedCoords ? clickedCoords[0] : undefined}
                editPin={editingPin || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
              {editingPin && (
                <button
                  type="button"
                  onClick={() => handleDeletePin(editingPin.id)}
                  className="mt-3 w-full rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
                >
                  {t('travelMap.deletePin' as any)}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter buttons */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {t('travelMap.filter' as any)}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {(['all', 'lived', 'visited', 'wishlist'] as const).map((ft) => (
                    <button
                      key={ft}
                      type="button"
                      onClick={() => setFilterType(ft)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                        filterType === ft
                          ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {ft !== 'all' && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: PIN_COLORS[ft] }}
                        />
                      )}
                      {ft === 'all' ? t('travelMap.filterAll' as any) : t(`travelMap.type${ft.charAt(0).toUpperCase() + ft.slice(1)}` as any)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add pin button */}
              <button
                type="button"
                onClick={() => { setEditingPin(null); setClickedCoords(null); setShowForm(true); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('travelMap.addPin' as any)}
              </button>

              {/* Pin list */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {t('travelMap.pinList' as any)} ({filteredPins.length})
                </h3>
                {filteredPins.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('travelMap.noPins' as any)}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {filteredPins.map((pin) => (
                      <li key={pin.id}>
                        <button
                          type="button"
                          onClick={() => handlePinSelect(pin)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <span
                            className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: PIN_COLORS[pin.type] }}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-gray-900 dark:text-white">
                              {pin.name}
                            </span>
                            {pin.notes && (
                              <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                {pin.notes}
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContent>
  );
}
