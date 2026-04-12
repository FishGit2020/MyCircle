import { useRef, useEffect, useState, useCallback } from 'react';
import { useMapLibre, useTranslation, useLazyQuery, SEARCH_LOCATIONS } from '@mycircle/shared';
import type { SearchLocationsQuery } from '@mycircle/shared';

interface LocationPin {
  lat: number;
  lon: number;
  name: string;
}

interface LocationMapPickerProps {
  locations: LocationPin[];
  onChange: (locations: LocationPin[]) => void;
  maxLocations?: number;
}

export default function LocationMapPicker({
  locations,
  onChange,
  maxLocations = 10,
}: LocationMapPickerProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([]);
  const { map, mapReady } = useMapLibre(containerRef, {
    zoom: 2,
    center: [0, 20],
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocations, { data: searchData, loading: searching }] =
    useLazyQuery<SearchLocationsQuery>(SEARCH_LOCATIONS);
  const [showResults, setShowResults] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ lat: number; lon: number } | null>(null);
  const [pinName, setPinName] = useState('');

  // Debounced search
  useEffect(() => {
    if (searchQuery.length < 3) { setShowResults(false); return; }
    const timer = setTimeout(() => {
      searchLocations({ variables: { query: searchQuery, limit: 5 } });
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchLocations]);

  // Map click handler
  useEffect(() => {
    if (!map || !mapReady) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      if (locations.length >= maxLocations) return;
      setPendingPin({ lat: e.lngLat.lat, lon: e.lngLat.lng });
      setPinName('');
    };
    map.on('click', handler);
    return () => {
      try { map.off('click', handler); } catch { /* destroyed */ }
    };
  }, [map, mapReady, locations.length, maxLocations]);

  // Render markers
  useEffect(() => {
    if (!map || !mapReady) return;

    // Remove existing markers
    markersRef.current.forEach((m) => {
      try { m.remove(); } catch { /* already removed */ }
    });
    markersRef.current = [];

    const allPins = [...locations];
    if (pendingPin) allPins.push({ ...pendingPin, name: '' });
    if (allPins.length === 0) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (import('maplibre-gl') as Promise<any>).then(({ default: ml }) => {
      allPins.forEach((pin, i) => {
        const isPending = i === allPins.length - 1 && pendingPin;
        const el = document.createElement('div');
        el.style.cssText = `width:24px;height:24px;background:${isPending ? '#f59e0b' : '#3b82f6'};border:2px solid white;border-radius:50%;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.3);`;

        const marker = new ml.Marker({ element: el })
          .setLngLat([pin.lon, pin.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });

      // Fit bounds if multiple pins
      if (allPins.length === 1) {
        try { map.flyTo({ center: [allPins[0].lon, allPins[0].lat], zoom: 10 }); } catch { /* */ }
      } else if (allPins.length > 1) {
        const bounds = new ml.LngLatBounds();
        allPins.forEach((p) => bounds.extend([p.lon, p.lat]));
        try { map.fitBounds(bounds, { padding: 50, maxZoom: 12 }); } catch { /* */ }
      }
    });
  }, [map, mapReady, locations, pendingPin]);

  const confirmPin = useCallback(() => {
    if (!pendingPin) return;
    const newPin: LocationPin = {
      lat: pendingPin.lat,
      lon: pendingPin.lon,
      name: pinName.trim() || `${pendingPin.lat.toFixed(4)}, ${pendingPin.lon.toFixed(4)}`,
    };
    onChange([...locations, newPin]);
    setPendingPin(null);
    setPinName('');
  }, [pendingPin, pinName, locations, onChange]);

  const cancelPin = useCallback(() => {
    setPendingPin(null);
    setPinName('');
  }, []);

  const removePin = useCallback((index: number) => {
    onChange(locations.filter((_, i) => i !== index));
  }, [locations, onChange]);

  const handleSearchSelect = (result: { lat: number; lon: number; displayName: string }) => {
    setSearchQuery('');
    setShowResults(false);
    if (locations.length >= maxLocations) return;
    setPendingPin({ lat: result.lat, lon: result.lon });
    setPinName(result.displayName);
    try { map?.flyTo({ center: [result.lon, result.lat], zoom: 12 }); } catch { /* */ }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('anniversary.locations')}
      </label>

      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('anniversary.searchLocation')}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-500"
          aria-label={t('anniversary.searchLocation')}
        />
        {showResults && searchData?.locationSearch && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700">
            {searching && (
              <p className="px-3 py-2 text-xs text-gray-400">{t('anniversary.searching')}</p>
            )}
            {searchData.locationSearch.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSearchSelect(r)}
                className="w-full min-h-[44px] px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                {r.displayName}
              </button>
            ))}
            {searchData.locationSearch.length === 0 && !searching && (
              <p className="px-3 py-2 text-xs text-gray-400">{t('anniversary.noResults')}</p>
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        ref={containerRef}
        className="h-48 w-full overflow-hidden rounded-lg border border-gray-200 md:h-56 dark:border-gray-700"
        role="application"
        aria-label={t('anniversary.clickMapToAdd')}
      />

      <p className="text-xs text-gray-400 dark:text-gray-500">
        {t('anniversary.clickMapToAdd')}
      </p>

      {/* Pending pin name input */}
      {pendingPin && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 dark:border-amber-700 dark:bg-amber-900/20">
          <input
            type="text"
            value={pinName}
            onChange={(e) => setPinName(e.target.value)}
            placeholder={t('anniversary.locationName')}
            className="flex-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
            aria-label={t('anniversary.locationName')}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') confirmPin(); if (e.key === 'Escape') cancelPin(); }}
          />
          <button
            type="button"
            onClick={confirmPin}
            className="min-h-[44px] rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500"
            aria-label={t('anniversary.addLocation')}
          >
            {t('anniversary.addLocation')}
          </button>
          <button
            type="button"
            onClick={cancelPin}
            className="min-h-[44px] rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            aria-label={t('anniversary.cancel')}
          >
            {t('anniversary.cancel')}
          </button>
        </div>
      )}

      {/* Pin list */}
      {locations.length > 0 && (
        <ul className="space-y-1">
          {locations.map((pin, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 dark:bg-gray-700/50"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex-shrink-0 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                  {pin.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePin(i)}
                className="min-h-[44px] flex-shrink-0 px-2 text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                aria-label={t('anniversary.removeLocation')}
              >
                {t('anniversary.removeLocation')}
              </button>
            </li>
          ))}
        </ul>
      )}

      {locations.length === 0 && !pendingPin && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t('anniversary.noLocations')}
        </p>
      )}
    </div>
  );
}
