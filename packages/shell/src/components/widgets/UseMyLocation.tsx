import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useLazyQuery } from '@apollo/client/react';
import { REVERSE_GEOCODE, useTranslation } from '@mycircle/shared';

interface ReverseGeocodeData {
  reverseGeocode: {
    id: string;
    name: string;
    country: string;
    state?: string;
    lat: number;
    lon: number;
  } | null;
}

interface ReverseGeocodeVars {
  lat: number;
  lon: number;
}

export default function UseMyLocation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reverseGeocode, { data, error: queryError }] = useLazyQuery<ReverseGeocodeData, ReverseGeocodeVars>(REVERSE_GEOCODE);

  useEffect(() => {
    if (!data) {
      return;
    }

    if (data.reverseGeocode) {
      const { lat, lon, name, country } = data.reverseGeocode;
      // Store city info for display
      sessionStorage.setItem('selectedCity', JSON.stringify({
        name,
        country,
        lat,
        lon
      }));
      // Navigate to weather page with city name
      navigate(`/weather/${lat},${lon}?name=${encodeURIComponent(name)}`);
    } else {
      setError(t('error.couldNotDetermineLocation'));
    }
    setLoading(false);
  }, [data, navigate]);

  useEffect(() => {
    if (!queryError) {
      return;
    }
    setError(queryError.message);
    setLoading(false);
  }, [queryError]);

  const handleClick = useCallback(() => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError(t('error.geolocationNotSupported'));
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        reverseGeocode({
          variables: { lat: latitude, lon: longitude }
        });
      },
      (err) => {
        let errorMessage = t('error.unableToGetLocation');
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = t('error.locationPermissionDenied');
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = t('error.locationUnavailable');
            break;
          case err.TIMEOUT:
            errorMessage = t('error.locationTimeout');
            break;
        }
        setError(errorMessage);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes cache
      }
    );
  }, [reverseGeocode]);

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg shadow-md transition-colors duration-200"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>{t('search.gettingLocation')}</span>
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <span>{t('search.useMyLocation')}</span>
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm text-center max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}
