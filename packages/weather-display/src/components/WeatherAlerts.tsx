import React, { useState, useCallback } from 'react';
import { CurrentWeather, ForecastDay, useTranslation, TranslationKey } from '@mycircle/shared';

interface Alert {
  id: string;
  severity: 'warning' | 'watch' | 'info';
  titleKey: TranslationKey;
  message: string;
}

const DISMISSED_KEY = 'weather-dismissed-alerts';

function getDismissedAlerts(): Set<string> {
  try {
    const stored = sessionStorage.getItem(DISMISSED_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveDismissedAlerts(ids: Set<string>) {
  try { sessionStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids])); } catch { /* ignore */ }
}

function generateAlerts(current: CurrentWeather, forecast: ForecastDay[]): Alert[] {
  const alerts: Alert[] = [];

  // Extreme heat
  if (current.temp >= 38) {
    alerts.push({ id: 'extreme-heat', severity: 'warning', titleKey: 'alert.extremeHeat', message: `Current temperature is ${Math.round(current.temp)}\u00B0C. Stay hydrated and avoid prolonged outdoor exposure.` });
  } else if (current.temp >= 33) {
    alerts.push({ id: 'heat-advisory', severity: 'watch', titleKey: 'alert.heatAdvisory', message: `Temperature is ${Math.round(current.temp)}\u00B0C. Take precautions if spending time outdoors.` });
  }

  // Extreme cold
  if (current.temp <= -20) {
    alerts.push({ id: 'extreme-cold', severity: 'warning', titleKey: 'alert.extremeCold', message: `Temperature is ${Math.round(current.temp)}\u00B0C. Risk of frostbite \u2014 limit outdoor exposure.` });
  } else if (current.temp <= -10) {
    alerts.push({ id: 'cold-advisory', severity: 'watch', titleKey: 'alert.coldAdvisory', message: `Temperature is ${Math.round(current.temp)}\u00B0C. Dress warmly and watch for ice.` });
  }

  // High wind
  if (current.wind.speed >= 20) {
    alerts.push({ id: 'high-wind', severity: 'warning', titleKey: 'alert.highWindWarning', message: `Wind speeds at ${Math.round(current.wind.speed)} m/s${current.wind.gust ? ` with gusts up to ${Math.round(current.wind.gust)} m/s` : ''}. Secure loose objects.` });
  } else if (current.wind.speed >= 13) {
    alerts.push({ id: 'wind-advisory', severity: 'watch', titleKey: 'alert.windAdvisory', message: `Wind speeds at ${Math.round(current.wind.speed)} m/s. Be cautious driving.` });
  }

  // Severe weather conditions (thunderstorm)
  const weatherId = current.weather[0]?.id || 0;
  if (weatherId >= 200 && weatherId < 300) {
    alerts.push({ id: 'thunderstorm', severity: 'warning', titleKey: 'alert.thunderstorm', message: 'Thunderstorm activity detected. Seek shelter indoors.' });
  }

  // UV index warning (clear sky + high temp)
  const mainWeather = current.weather[0]?.main?.toLowerCase() || '';
  if (mainWeather === 'clear' && current.temp >= 28) {
    alerts.push({ id: 'uv-warning', severity: 'watch', titleKey: 'alert.uvWarning', message: 'Clear skies and high temperature suggest strong UV. Wear sunscreen and seek shade during peak hours (10am-4pm).' });
  }

  // Heavy rain from forecast
  const upcomingRain = forecast.slice(0, 3).filter(d => d.pop >= 0.7);
  if (upcomingRain.length > 0) {
    alerts.push({ id: 'rain-expected', severity: 'info', titleKey: 'alert.rainExpected', message: `High chance of rain in the next ${upcomingRain.length} day(s). Don't forget an umbrella!` });
  }

  // Temperature swing warning
  if (forecast.length >= 2) {
    const todayMax = forecast[0]?.temp?.max ?? current.temp;
    const tomorrowMax = forecast[1]?.temp?.max ?? current.temp;
    const swing = Math.abs(todayMax - tomorrowMax);
    if (swing >= 10) {
      alerts.push({ id: 'temp-swing', severity: 'info', titleKey: 'alert.tempSwing', message: `Temperature expected to ${tomorrowMax > todayMax ? 'rise' : 'drop'} by ${Math.round(swing)}\u00B0C tomorrow. Dress accordingly.` });
    }
  }

  // Poor visibility / fog
  if (mainWeather === 'fog' || mainWeather === 'mist' || mainWeather === 'haze') {
    alerts.push({ id: 'low-visibility', severity: 'info', titleKey: 'alert.lowVisibility', message: `${current.weather[0]?.description}. Drive carefully and use fog lights.` });
  }

  return alerts;
}

const severityConfig = {
  warning: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  },
  watch: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
    badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
};

interface Props {
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export default function WeatherAlerts({ current, forecast }: Props) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissedAlerts);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(() => new Set());

  const allAlerts = generateAlerts(current, forecast);
  const visibleAlerts = allAlerts.filter(a => !dismissed.has(a.id));

  const dismissAlert = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      saveDismissedAlerts(next);
      return next;
    });
  }, []);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const restoreAll = useCallback(() => {
    setDismissed(new Set());
    saveDismissedAlerts(new Set());
  }, []);

  if (allAlerts.length === 0) return null;

  const dismissedCount = allAlerts.length - visibleAlerts.length;
  // Sort: warnings first, then watch, then info
  const sortOrder = { warning: 0, watch: 1, info: 2 };
  const sortedAlerts = [...visibleAlerts].sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

  return (
    <div className="space-y-2">
      {/* Alert count summary */}
      {visibleAlerts.length > 0 && (
        <div className="flex items-center gap-2 mb-1">
          {(['warning', 'watch', 'info'] as const).map(sev => {
            const count = visibleAlerts.filter(a => a.severity === sev).length;
            if (count === 0) return null;
            return (
              <span key={sev} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${severityConfig[sev].badge}`}>
                {count} {t(`alert.severity.${sev}` as any)}
              </span>
            );
          })}
        </div>
      )}

      {sortedAlerts.map((alert) => {
        const config = severityConfig[alert.severity];
        const isExpanded = expandedAlerts.has(alert.id) || alert.severity === 'warning';
        return (
          <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border} transition-all`}>
            <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
            </svg>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => toggleExpanded(alert.id)}
                className={`font-medium text-sm ${config.text} flex items-center gap-1 hover:underline`}
              >
                {t(alert.titleKey)}
                {alert.severity !== 'warning' && (
                  <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </button>
              {isExpanded && (
                <p className={`text-sm mt-0.5 ${config.text} opacity-80`}>{alert.message}</p>
              )}
            </div>
            <button
              onClick={() => dismissAlert(alert.id)}
              className={`flex-shrink-0 p-1 rounded-md ${config.text} opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition`}
              aria-label={t('alert.dismiss')}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* Restore dismissed alerts */}
      {dismissedCount > 0 && visibleAlerts.length === 0 && (
        <button
          onClick={restoreAll}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
        >
          {t('alert.showDismissed')} ({dismissedCount})
        </button>
      )}
    </div>
  );
}
