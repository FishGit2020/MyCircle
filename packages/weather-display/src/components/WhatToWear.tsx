import React from 'react';
import { CurrentWeather, useTranslation, TranslationKey } from '@mycircle/shared';

interface Suggestion {
  icon: string;
  key: TranslationKey;
}

function getSuggestions(weather: CurrentWeather): Suggestion[] {
  const temp = weather.temp;
  const mainWeather = weather.weather[0]?.main?.toLowerCase() || '';
  const suggestions: Suggestion[] = [];

  // ── One main outfit recommendation based on temperature ─────
  if (temp <= 0) {
    suggestions.push({ icon: '\u{1F9E5}', key: 'wear.winterCoat' });
    suggestions.push({ icon: '\u{1F97E}', key: 'wear.winterBoots' });
  } else if (temp <= 10) {
    suggestions.push({ icon: '\u{1F9E5}', key: 'wear.warmJacket' });
    suggestions.push({ icon: '\u{1F45F}', key: 'wear.closedShoes' });
  } else if (temp <= 18) {
    suggestions.push({ icon: '\u{1F9E5}', key: 'wear.lightJacketSweater' });
  } else if (temp <= 25) {
    suggestions.push({ icon: '\u{1F455}', key: 'wear.tshirtLightShirt' });
  } else {
    suggestions.push({ icon: '\u{1F455}', key: 'wear.lightBreathable' });
    suggestions.push({ icon: '\u{1FA73}', key: 'wear.shorts' });
  }

  // ── One weather-condition item ──────────────────────────────
  if (mainWeather.includes('rain') || mainWeather.includes('drizzle') || mainWeather.includes('thunderstorm')) {
    suggestions.push({ icon: '\u2602\uFE0F', key: 'wear.umbrella' });
  } else if (mainWeather.includes('snow')) {
    suggestions.push({ icon: '\u{1F9E4}', key: 'wear.gloves' });
  } else if (temp > 25 && (mainWeather === 'clear' || mainWeather === '')) {
    suggestions.push({ icon: '\u{1F576}\uFE0F', key: 'wear.sunglasses' });
  }

  // ── Cold accessories (one item) ─────────────────────────────
  if (temp <= 5) {
    suggestions.push({ icon: '\u{1F9E3}', key: 'wear.scarf' });
  }

  return suggestions;
}

interface Props {
  data: CurrentWeather;
}

export default function WhatToWear({ data }: Props) {
  const { t } = useTranslation();
  const suggestions = getSuggestions(data);
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        {t('weather.whatToWear')}
      </h3>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
          >
            <span>{s.icon}</span>
            {t(s.key)}
          </span>
        ))}
      </div>
    </div>
  );
}
