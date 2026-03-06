import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type maplibregl from 'maplibre-gl';

type State = 'idle' | 'locating' | 'error';

interface Props {
  map: maplibregl.Map | null;
}

export default function GpsLocateButton({ map }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<State>('idle');

  const handleLocate = () => {
    if (!map || !navigator.geolocation) return;
    setState('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14 });
        setState('idle');
      },
      () => setState('error'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const label = state === 'locating'
    ? t('hiking.locating')
    : state === 'error'
    ? t('hiking.locationError')
    : t('hiking.locateMe');

  return (
    <button
      type="button"
      onClick={handleLocate}
      disabled={state === 'locating'}
      aria-label={label}
      className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition
        ${state === 'error'
          ? 'bg-red-500 text-white'
          : 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700'
        } disabled:opacity-60`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
      </svg>
    </button>
  );
}
