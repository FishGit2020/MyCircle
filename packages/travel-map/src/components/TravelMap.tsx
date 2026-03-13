import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, PageContent, useLazyQuery, SEARCH_LOCATIONS } from '@mycircle/shared';
import type { SearchLocationsQuery } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';
import MapView from './MapView';
import PinForm from './PinForm';
import { useTravelPins } from '../hooks/useTravelPins';
import type { TravelPin, PinType } from '../types';
import { PIN_COLORS } from '../types';

const SOURCE_ID = 'travel-pins-source';
const CIRCLE_LAYER_ID = 'travel-pins-circle';
const LABEL_LAYER_ID = 'travel-pins-label';
const PENDING_SOURCE_ID = 'travel-pending-source';
const PENDING_LAYER_ID = 'travel-pending-circle';

/** Draw or update a GeoJSON source+layer on the map. Modeled after hiking map's setPointLayer. */
function setPinLayers(
  map: maplibregl.Map,
  pins: TravelPin[],
) {
  try {
    if (map.getLayer(LABEL_LAYER_ID)) map.removeLayer(LABEL_LAYER_ID);
    if (map.getLayer(CIRCLE_LAYER_ID)) map.removeLayer(CIRCLE_LAYER_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    if (pins.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: pins.map((pin) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pin.lon, pin.lat] },
        properties: {
          id: pin.id,
          name: pin.name,
          type: pin.type,
          color: PIN_COLORS[pin.type] || '#3b82f6',
        },
      })),
    };

    map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
    map.addLayer({
      id: CIRCLE_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': 8,
        'circle-color': ['get', 'color'],
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#ffffff',
      },
    });
    map.addLayer({
      id: LABEL_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 11,
        'text-offset': [0, 1.5],
        'text-anchor': 'top',
        'text-optional': true,
      },
      paint: {
        'text-color': '#374151',
        'text-halo-color': '#ffffff',
        'text-halo-width': 1,
      },
    });
  } catch {
    // Map may have been destroyed during navigation
  }
}

/** Draw or update a single pending-pin marker on the map. */
function setPendingLayer(
  map: maplibregl.Map,
  coords: [number, number] | null,
) {
  try {
    if (map.getLayer(PENDING_LAYER_ID)) map.removeLayer(PENDING_LAYER_ID);
    if (map.getSource(PENDING_SOURCE_ID)) map.removeSource(PENDING_SOURCE_ID);
    if (!coords) return;
    map.addSource(PENDING_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} },
    });
    map.addLayer({
      id: PENDING_LAYER_ID,
      type: 'circle',
      source: PENDING_SOURCE_ID,
      paint: {
        'circle-radius': 10,
        'circle-color': '#8b5cf6',
        'circle-stroke-width': 3,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8,
      },
    });
  } catch {
    // Map may have been destroyed during navigation
  }
}

/** Parse cross-MFE URL params (e.g. from Trip Planner "View on Map" button). */
function parseMapUrlParams(): { lat: number; lon: number; zoom?: number } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lon = params.get('lon');
    if (!lat || !lon) return null;
    const zoom = params.get('zoom') ? Number(params.get('zoom')) : undefined;
    return { lat: Number(lat), lon: Number(lon), zoom };
  } catch {
    return null;
  }
}

export default function TravelMap() {
  const { t } = useTranslation();
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [styleVersion, setStyleVersion] = useState(0);
  const { pins, addPin, updatePin, deletePin } = useTravelPins();
  const urlFlyConsumed = useRef(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPin, setEditingPin] = useState<TravelPin | null>(null);
  const [clickedCoords, setClickedCoords] = useState<[number, number] | null>(null);

  // Filter state
  const [filterType, setFilterType] = useState<PinType | 'all'>('all');

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [searchLocations, { loading: searchLoading, data: searchData }] = useLazyQuery<SearchLocationsQuery>(SEARCH_LOCATIONS);
  const searchResults = locationQuery.trim() ? (searchData?.locationSearch ?? []) : [];

  const filteredPins = filterType === 'all' ? pins : pins.filter((p) => p.type === filterType);

  const handleStyleLoad = useCallback(() => {
    setStyleVersion((v) => v + 1);
  }, []);

  // Fly to URL-provided coordinates on mount (cross-MFE navigation from Trip Planner)
  useEffect(() => {
    if (!map || urlFlyConsumed.current) return;
    const urlTarget = parseMapUrlParams();
    if (urlTarget) {
      urlFlyConsumed.current = true;
      map.flyTo({ center: [urlTarget.lon, urlTarget.lat], zoom: urlTarget.zoom ?? 10, duration: 800 });
      // Clean up URL params without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete('lat');
      url.searchParams.delete('lon');
      url.searchParams.delete('zoom');
      window.history.replaceState({}, '', url.pathname);
    }
  }, [map]);

  // Draw pin layers (same pattern as hiking map's circle layers)
  useEffect(() => {
    if (!map) return;
    setPinLayers(map, filteredPins);
  }, [map, filteredPins, styleVersion]);

  // Draw pending pin marker
  useEffect(() => {
    if (!map) return;
    setPendingLayer(map, clickedCoords);
  }, [map, clickedCoords, styleVersion]);

  // Pin click handler — register on the circle layer
  useEffect(() => {
    if (!map) return;

    const clickHandler = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
      const feature = e.features?.[0];
      if (!feature) return;
      const pinId = feature.properties?.id;
      const clicked = pins.find((p) => p.id === pinId);
      if (clicked) {
        setEditingPin(clicked);
        setShowForm(true);
        setClickedCoords(null);
      }
    };

    const enterHandler = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leaveHandler = () => { map.getCanvas().style.cursor = ''; };

    try {
      map.on('click', CIRCLE_LAYER_ID, clickHandler);
      map.on('mouseenter', CIRCLE_LAYER_ID, enterHandler);
      map.on('mouseleave', CIRCLE_LAYER_ID, leaveHandler);
    } catch {
      // Layer may not exist yet
    }

    return () => {
      try {
        map.off('click', CIRCLE_LAYER_ID, clickHandler);
        map.off('mouseenter', CIRCLE_LAYER_ID, enterHandler);
        map.off('mouseleave', CIRCLE_LAYER_ID, leaveHandler);
      } catch {
        // Map may have been destroyed
      }
    };
  }, [map, pins, styleVersion]);

  const handleMapClick = useCallback((lngLat: [number, number]) => {
    setClickedCoords(lngLat);
    // If not already editing a saved pin, show the new pin form
    if (!editingPin) {
      setShowForm(true);
    }
  }, [editingPin]);

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

  // Location search via GraphQL
  const handleLocationSearch = useCallback((query: string) => {
    setLocationQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!query.trim()) return;
    searchTimerRef.current = setTimeout(() => {
      searchLocations({ variables: { query: query.trim(), limit: 5 } });
    }, 400);
  }, [searchLocations]);

  const handleSelectSearchResult = useCallback((result: { lat: number; lon: number }) => {
    const lngLat: [number, number] = [result.lon, result.lat];
    if (map) {
      map.flyTo({ center: lngLat, zoom: 10, duration: 800 });
    }
    setClickedCoords(lngLat);
    setEditingPin(null);
    setShowForm(true);
    setLocationQuery('');
  }, [map]);

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
            {t('travelMap.title')}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            {t('travelMap.subtitle')}
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

      {/* Location search */}
      <div className="relative mb-3">
        <input
          type="text"
          value={locationQuery}
          onChange={(e) => handleLocationSearch(e.target.value)}
          placeholder={t('travelMap.searchLocation')}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-blue-400 dark:focus:ring-blue-400"
          aria-label={t('travelMap.searchLocation')}
        />
        {searchLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
        {searchResults.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 max-h-48 overflow-y-auto">
            {searchResults.map((result, idx) => (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => handleSelectSearchResult(result)}
                  className="w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {result.displayName}
                </button>
              </li>
            ))}
          </ul>
        )}
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
                {t('travelMap.tapToPin')}
              </div>
            </div>
          )}
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
                  {t('travelMap.deletePin')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Filter buttons */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {t('travelMap.filter')}
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
                      {ft === 'all' ? t('travelMap.filterAll') : t(`travelMap.type${ft.charAt(0).toUpperCase() + ft.slice(1)}`)}
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
                {t('travelMap.addPin')}
              </button>

              {/* Pin list */}
              <div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                  {t('travelMap.pinList')} ({filteredPins.length})
                </h3>
                {filteredPins.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('travelMap.noPins')}
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
