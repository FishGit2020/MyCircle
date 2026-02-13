import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useLazyQuery } from '@apollo/client/react';
import { SEARCH_CITIES, REVERSE_GEOCODE, City, eventBus, MFEvents, useTranslation, fuzzySearchCities, MAJOR_CITIES, StorageKeys } from '@mycircle/shared';
import WeatherPreview from './WeatherPreview';
import './CitySearch.css';

interface SearchCitiesResponse {
  searchCities: City[];
}

interface ReverseGeocodeResponse {
  reverseGeocode: City | null;
}

interface RecentCity {
  id: string;
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
  searchedAt?: number;
}

const POPULAR_CITIES: RecentCity[] = [
  { id: '40.71,-74.01', name: 'New York', country: 'US', state: 'New York', lat: 40.7128, lon: -74.006 },
  { id: '51.51,-0.13', name: 'London', country: 'GB', lat: 51.5074, lon: -0.1278 },
  { id: '35.68,139.69', name: 'Tokyo', country: 'JP', lat: 35.6762, lon: 139.6503 },
  { id: '48.86,2.35', name: 'Paris', country: 'FR', lat: 48.8566, lon: 2.3522 },
  { id: '-33.87,151.21', name: 'Sydney', country: 'AU', state: 'New South Wales', lat: -33.8688, lon: 151.2093 },
];

const MAX_LOCAL_RECENTS = 10;

function loadLocalRecents(): RecentCity[] {
  try {
    const stored = localStorage.getItem(StorageKeys.RECENT_CITIES);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveLocalRecents(cities: RecentCity[]) {
  try {
    localStorage.setItem(StorageKeys.RECENT_CITIES, JSON.stringify(cities.slice(0, MAX_LOCAL_RECENTS)));
  } catch { /* ignore */ }
}

function formatTimeAgo(timestamp?: number): string {
  if (!timestamp) return '';
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return '<1m';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

interface Props {
  onCitySelect?: (city: City) => void;
  recentCities?: RecentCity[];
  onRemoveCity?: (cityId: string) => void;
  onClearRecents?: () => void;
}

export default function CitySearch({ onCitySelect, recentCities = [], onRemoveCity, onClearRecents }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [localRecents, setLocalRecents] = useState<RecentCity[]>(loadLocalRecents);
  const navigate = useNavigate();
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [searchCities, { loading, data }] = useLazyQuery<SearchCitiesResponse>(SEARCH_CITIES);
  const [reverseGeocode] = useLazyQuery<ReverseGeocodeResponse>(REVERSE_GEOCODE, {
    onCompleted: (data) => {
      setGeoLoading(false);
      if (data.reverseGeocode) {
        handleCityClick(data.reverseGeocode);
      } else {
        setGeoError(t('search.couldNotDetermineLocation'));
      }
    },
    onError: () => {
      setGeoLoading(false);
      setGeoError(t('search.failedToLookUp'));
    }
  });

  // Merge prop-based recents (Firebase, auth users) with local recents (localStorage, non-auth)
  const allRecents = useMemo(() => {
    if (recentCities.length > 0) return recentCities;
    return localRecents;
  }, [recentCities, localRecents]);

  const hasAuthRecents = recentCities.length > 0;

  useEffect(() => {
    if (data?.searchCities) {
      setResults(data.searchCities);
    }
  }, [data]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setInputFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchCities({
        variables: { query, limit: 5 }
      });
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, searchCities]);

  // Reset highlighted index when the list changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results, query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setGeoError(null);
  };

  // Filter recent cities matching the current query for inline autocomplete
  const matchingRecents = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return allRecents.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      (c.state && c.state.toLowerCase().includes(q))
    ).slice(0, 3);
  }, [query, allRecents]);

  // Deduplicate: remove matching recents from API results to avoid duplicates
  const filteredResults = useMemo(() => {
    if (matchingRecents.length === 0) return results;
    const recentIds = new Set(matchingRecents.map(c => c.id));
    return results.filter(r => !recentIds.has(r.id));
  }, [results, matchingRecents]);

  const addToLocalRecents = useCallback((city: City | RecentCity) => {
    setLocalRecents(prev => {
      const id = city.id || `${city.lat},${city.lon}`;
      const filtered = prev.filter(c => c.id !== id);
      const updated: RecentCity[] = [
        { id, name: city.name, country: city.country, state: city.state, lat: city.lat, lon: city.lon, searchedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_LOCAL_RECENTS);
      saveLocalRecents(updated);
      return updated;
    });
  }, []);

  const handleCityClick = useCallback((city: City | RecentCity) => {
    eventBus.publish(MFEvents.CITY_SELECTED, { city });
    addToLocalRecents(city);

    if (onCitySelect) {
      onCitySelect(city as City);
    } else {
      navigate(`/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`);
    }
    setQuery('');
    setResults([]);
    setInputFocused(false);
    setHighlightedIndex(-1);
    setGeoError(null);
  }, [onCitySelect, navigate, addToLocalRecents]);

  const handleClearAllRecents = useCallback(() => {
    if (hasAuthRecents && onClearRecents) {
      onClearRecents();
    }
    setLocalRecents([]);
    saveLocalRecents([]);
  }, [hasAuthRecents, onClearRecents]);

  const handleRemoveCity = useCallback((cityId: string) => {
    if (hasAuthRecents && onRemoveCity) {
      onRemoveCity(cityId);
    } else {
      setLocalRecents(prev => {
        const updated = prev.filter(c => c.id !== cityId);
        saveLocalRecents(updated);
        return updated;
      });
    }
  }, [hasAuthRecents, onRemoveCity]);

  const handleUseMyLocation = useCallback(() => {
    setGeoError(null);
    setGeoLoading(true);

    if (!navigator.geolocation) {
      setGeoError(t('search.geolocationNotSupported'));
      setGeoLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        reverseGeocode({
          variables: { lat: position.coords.latitude, lon: position.coords.longitude }
        });
      },
      (err) => {
        setGeoLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError(t('search.locationPermissionDenied'));
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError(t('search.locationUnavailable'));
            break;
          case err.TIMEOUT:
            setGeoError(t('search.locationTimeout'));
            break;
          default:
            setGeoError(t('search.unableToGetLocation'));
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  // Fuzzy search fallback: when API returns 0 results, try matching against static city list
  const fuzzySuggestions = useMemo(() => {
    if (query.length >= 2 && !loading && results.length === 0 && data?.searchCities !== undefined) {
      return fuzzySearchCities(MAJOR_CITIES, query, 5).map(city => ({
        ...city,
        id: `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`
      }));
    }
    return [];
  }, [query, loading, results, data]);

  // Derive dropdown visibility from current state
  const hasInlineRecents = matchingRecents.length > 0 && !loading;
  const showSearchResults = (filteredResults.length > 0 || hasInlineRecents) && !loading;
  const showFuzzySuggestions = fuzzySuggestions.length > 0 && !loading && !showSearchResults;
  const showNoResults = query.length >= 2 && !loading && results.length === 0 && data?.searchCities !== undefined && fuzzySuggestions.length === 0 && matchingRecents.length === 0;
  const showDropdown = inputFocused && query.length < 2 && !loading && results.length === 0;
  const isShowingRecent = allRecents.length > 0;
  const dropdownCities = isShowingRecent ? allRecents.slice(0, 5) : POPULAR_CITIES;
  const dropdownLabel = isShowingRecent ? t('search.recentSearches') : t('search.popularCities');

  // Build combined visible items for keyboard nav: matching recents + API results
  const visibleItems: (City | RecentCity)[] = showSearchResults
    ? [...matchingRecents, ...filteredResults]
    : showFuzzySuggestions
      ? fuzzySuggestions
      : showDropdown
        ? dropdownCities
        : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setInputFocused(false);
      setHighlightedIndex(-1);
      (e.target as HTMLInputElement).blur();
      return;
    }

    if (visibleItems.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < visibleItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : visibleItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < visibleItems.length) {
          handleCityClick(visibleItems[highlightedIndex]);
        }
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-dropdown-item]');
      items[highlightedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const LocationButton = () => (
    <button
      onClick={handleUseMyLocation}
      disabled={geoLoading}
      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 transition border-b dark:border-gray-700 text-blue-600 dark:text-blue-400"
    >
      {geoLoading ? (
        <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
      <span className="text-sm font-medium">
        {geoLoading ? t('search.gettingLocation') : t('search.useMyLocation')}
      </span>
    </button>
  );

  const RecentBadge = () => (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded ml-2 flex-shrink-0">
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {t('search.recentMatch')}
    </span>
  );

  return (
    <div className="city-search-container max-w-xl mx-auto" ref={containerRef}>
      <div className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setInputFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={t('search.placeholder')}
            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg"
            role="combobox"
            aria-label="Search for a city"
            aria-expanded={visibleItems.length > 0 || showDropdown}
            aria-activedescendant={highlightedIndex >= 0 ? `city-option-${highlightedIndex}` : undefined}
          />
          <svg
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {loading && (
          <div className="city-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center px-4 py-3 border-b dark:border-gray-700 last:border-b-0 animate-pulse">
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20" />
                </div>
                <div className="flex items-center gap-1 ml-auto pl-2">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600" />
                  <div className="w-8 h-4 rounded bg-gray-200 dark:bg-gray-600" />
                </div>
              </div>
            ))}
          </div>
        )}

        {showSearchResults && (
          <div ref={dropdownRef} className="city-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10" role="listbox">
            {/* Matching recent cities shown above API results */}
            {matchingRecents.map((city, index) => (
              <button
                key={`recent-${city.id}`}
                id={`city-option-${index}`}
                data-dropdown-item
                onClick={() => handleCityClick(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center ${
                  index === highlightedIndex
                    ? 'bg-blue-50 dark:bg-gray-700'
                    : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center">
                    <p className="font-medium dark:text-white">{city.name}</p>
                    <RecentBadge />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {city.state && `${city.state}, `}{city.country}
                    {city.searchedAt && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(city.searchedAt)}</span>
                    )}
                  </p>
                </div>
                <WeatherPreview lat={city.lat} lon={city.lon} />
              </button>
            ))}
            {/* API search results */}
            {filteredResults.map((city, index) => {
              const globalIndex = matchingRecents.length + index;
              return (
                <button
                  key={city.id}
                  id={`city-option-${globalIndex}`}
                  data-dropdown-item
                  onClick={() => handleCityClick(city)}
                  onMouseEnter={() => setHighlightedIndex(globalIndex)}
                  className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center ${
                    globalIndex === highlightedIndex
                      ? 'bg-blue-50 dark:bg-gray-700'
                      : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                  }`}
                  role="option"
                  aria-selected={globalIndex === highlightedIndex}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium dark:text-white">{city.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {city.state && `${city.state}, `}{city.country}
                    </p>
                  </div>
                  <WeatherPreview lat={city.lat} lon={city.lon} />
                </button>
              );
            })}
          </div>
        )}

        {showFuzzySuggestions && (
          <div ref={dropdownRef} className="city-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10" role="listbox">
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/30 border-b dark:border-gray-700">
              <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('search.suggestedCities')}</p>
            </div>
            {fuzzySuggestions.map((city, index) => (
              <button
                key={city.id}
                id={`city-option-${index}`}
                data-dropdown-item
                onClick={() => handleCityClick(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center ${
                  index === highlightedIndex
                    ? 'bg-blue-50 dark:bg-gray-700'
                    : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium dark:text-white">{city.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {city.state && `${city.state}, `}{city.country}
                  </p>
                </div>
                <WeatherPreview lat={city.lat} lon={city.lon} />
              </button>
            ))}
          </div>
        )}

        {showNoResults && (
          <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10 px-4 py-6 text-center">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('search.noResults')}</p>
            <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{t('search.noResultsHint')}</p>
          </div>
        )}

        {showDropdown && (
          <div ref={dropdownRef} className="city-search-dropdown absolute top-full mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden z-10" role="listbox">
            <LocationButton />
            {geoError && (
              <div className="px-4 py-2 text-xs text-red-500 dark:text-red-400 border-b dark:border-gray-700">
                {geoError}
              </div>
            )}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{dropdownLabel}</p>
              {isShowingRecent && (
                <button
                  onClick={handleClearAllRecents}
                  className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition-colors"
                  aria-label={t('search.clearAllRecents')}
                >
                  {t('search.clearAllRecents')}
                </button>
              )}
            </div>
            {dropdownCities.map((city, index) => (
              <div
                key={city.id}
                id={`city-option-${index}`}
                data-dropdown-item
                onClick={() => handleCityClick(city)}
                onMouseEnter={() => setHighlightedIndex(index)}
                className={`w-full text-left px-4 py-3 transition border-b dark:border-gray-700 last:border-b-0 flex items-center cursor-pointer ${
                  index === highlightedIndex
                    ? 'bg-blue-50 dark:bg-gray-700'
                    : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                }`}
                role="option"
                aria-selected={index === highlightedIndex}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium dark:text-white">{city.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {city.state && `${city.state}, `}{city.country}
                    {city.searchedAt && (
                      <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">{formatTimeAgo(city.searchedAt)}</span>
                    )}
                  </p>
                </div>
                <WeatherPreview lat={city.lat} lon={city.lon} />
                {isShowingRecent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCity(city.id);
                    }}
                    className="ml-2 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition flex-shrink-0"
                    aria-label={`Remove ${city.name} from recent searches`}
                    title={t('search.removeFromRecent')}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
          {t('mfe.citySearch')}
        </span>
      </div>
    </div>
  );
}
