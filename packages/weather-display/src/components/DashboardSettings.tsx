import React, { useState, useEffect, useRef } from 'react';
import { useTranslation, TranslationKey, StorageKeys } from '@mycircle/shared';

export interface WidgetVisibility {
  currentWeather: boolean;
  forecast: boolean;
  hourlyForecast: boolean;
  hourlyChart: boolean;
  weatherAlerts: boolean;
  whatToWear: boolean;
  sunriseSunset: boolean;
  weatherMap: boolean;
  historicalWeather: boolean;
  airQuality: boolean;
}


const WIDGET_KEYS: Array<keyof WidgetVisibility> = [
  'currentWeather',
  'forecast',
  'hourlyForecast',
  'hourlyChart',
  'weatherAlerts',
  'whatToWear',
  'sunriseSunset',
  'weatherMap',
  'historicalWeather',
  'airQuality',
];

const WIDGET_LABEL_KEYS: Record<keyof WidgetVisibility, TranslationKey> = {
  currentWeather: 'dashboard.currentWeather',
  forecast: 'dashboard.forecast',
  hourlyForecast: 'dashboard.hourlyForecast',
  hourlyChart: 'dashboard.hourlyChart',
  weatherAlerts: 'dashboard.weatherAlerts',
  whatToWear: 'dashboard.whatToWear',
  sunriseSunset: 'dashboard.sunriseSunset',
  weatherMap: 'dashboard.weatherMap',
  historicalWeather: 'dashboard.historicalWeather',
  airQuality: 'dashboard.airQuality',
};

const DEFAULT_VISIBILITY: WidgetVisibility = {
  currentWeather: true,
  forecast: true,
  hourlyForecast: true,
  hourlyChart: true,
  weatherAlerts: true,
  whatToWear: true,
  sunriseSunset: true,
  weatherMap: true,
  historicalWeather: true,
  airQuality: true,
};

export function loadWidgetVisibility(): WidgetVisibility {
  try {
    const stored = localStorage.getItem(StorageKeys.DASHBOARD_WIDGETS);
    if (stored) {
      return { ...DEFAULT_VISIBILITY, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return DEFAULT_VISIBILITY;
}

function saveWidgetVisibility(vis: WidgetVisibility) {
  localStorage.setItem(StorageKeys.DASHBOARD_WIDGETS, JSON.stringify(vis));
}

interface Props {
  visibility: WidgetVisibility;
  onChange: (vis: WidgetVisibility) => void;
}

export default function DashboardSettings({ visibility, onChange }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  const toggle = (key: keyof WidgetVisibility) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    onChange(updated);
    saveWidgetVisibility(updated);
  };

  return (
    <div className="relative z-50" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label={t('dashboard.settings')}
        title={t('dashboard.customizeWidgets')}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-2">
          <p className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('dashboard.showWidgets')}
          </p>
          {WIDGET_KEYS.map((key) => (
            <label
              key={key}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm"
            >
              <input
                type="checkbox"
                checked={visibility[key]}
                onChange={() => toggle(key)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-700 dark:text-gray-300">{t(WIDGET_LABEL_KEYS[key])}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
