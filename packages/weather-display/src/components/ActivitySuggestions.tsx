import React, { useState } from 'react';
import { CurrentWeather, useTranslation, TranslationKey } from '@mycircle/shared';

interface ActivityItem {
  icon: string;
  key: TranslationKey;
}

interface ActivityCategory {
  titleKey: TranslationKey;
  icon: string;
  items: ActivityItem[];
}

function getActivitySuggestions(weather: CurrentWeather): ActivityCategory[] {
  const temp = weather.temp;
  const windSpeed = weather.wind.speed;
  const mainWeather = weather.weather[0]?.main?.toLowerCase() || '';
  const isRainy = mainWeather.includes('rain') || mainWeather.includes('drizzle') || mainWeather.includes('thunderstorm');
  const isSnowy = mainWeather.includes('snow');
  const isClear = mainWeather === 'clear' || mainWeather === 'clouds';
  const isWindy = windSpeed > 10;
  const isPoorVisibility = mainWeather.includes('fog') || mainWeather.includes('mist') || mainWeather.includes('haze');

  const outdoor: ActivityItem[] = [];
  const indoor: ActivityItem[] = [];

  if (isRainy || isPoorVisibility) {
    // Bad weather — indoor only
    indoor.push(
      { icon: '\u{1F3DB}\uFE0F', key: 'activity.museum' },
      { icon: '\u{1F3AC}', key: 'activity.movie' },
      { icon: '\u{1F373}', key: 'activity.cooking' },
      { icon: '\u{1F3B2}', key: 'activity.boardGames' },
      { icon: '\u{1F4D6}', key: 'activity.reading' },
    );
  } else if (isSnowy) {
    outdoor.push(
      { icon: '\u26F7\uFE0F', key: 'activity.skiing' },
      { icon: '\u2603\uFE0F', key: 'activity.snowman' },
    );
    indoor.push(
      { icon: '\u2615', key: 'activity.hotChocolate' },
      { icon: '\u{1F3B2}', key: 'activity.boardGames' },
    );
  } else if (temp > 28 && isClear) {
    // Hot weather
    outdoor.push(
      { icon: '\u{1F3CA}', key: 'activity.swimming' },
      { icon: '\u{1F3C4}', key: 'activity.waterSports' },
    );
    indoor.push(
      { icon: '\u{1F3CB}\uFE0F', key: 'activity.gym' },
      { icon: '\u{1F3DB}\uFE0F', key: 'activity.museum' },
      { icon: '\u{1F6CD}\uFE0F', key: 'activity.shopping' },
    );
  } else if (temp < 5) {
    // Cold weather
    outdoor.push(
      { icon: '\u{1F6B6}', key: 'activity.briskWalk' },
    );
    if (isSnowy) {
      outdoor.push({ icon: '\u{1F3BF}', key: 'activity.winterSports' });
    }
    indoor.push(
      { icon: '\u{1F3CB}\uFE0F', key: 'activity.gym' },
      { icon: '\u{1F9D8}', key: 'activity.yoga' },
      { icon: '\u{1F4D6}', key: 'activity.reading' },
    );
  } else {
    // Clear + comfortable (5-28C)
    outdoor.push(
      { icon: '\u{1F6B6}', key: 'activity.hiking' },
      { icon: '\u{1F6B2}', key: 'activity.cycling' },
      { icon: '\u{1F9FA}', key: 'activity.picnic' },
      { icon: '\u{1F3C3}', key: 'activity.jogging' },
      { icon: '\u{1F33B}', key: 'activity.gardening' },
    );
    indoor.push(
      { icon: '\u{1F9D8}', key: 'activity.yoga' },
      { icon: '\u{1F4D6}', key: 'activity.reading' },
    );
  }

  // Windy bonus
  if (isWindy && !isRainy) {
    outdoor.push({ icon: '\u{1FA81}', key: 'activity.kiteFlying' });
  }

  const categories: ActivityCategory[] = [];
  if (outdoor.length > 0) {
    categories.push({ titleKey: 'activity.outdoorTitle', icon: '\u{1F3DE}\uFE0F', items: outdoor });
  }
  if (indoor.length > 0) {
    categories.push({ titleKey: 'activity.indoorTitle', icon: '\u{1F3E0}', items: indoor });
  }

  return categories;
}

interface Props {
  data: CurrentWeather;
}

export default function ActivitySuggestions({ data }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const categories = getActivitySuggestions(data);
  if (categories.length === 0) return null;

  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('weather.activitySuggestions')}
        </h3>
        <button
          onClick={() => setExpanded(prev => !prev)}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <span className="text-sm font-medium text-green-600 dark:text-green-300">{totalItems} {t('activity.suggestions')}</span>
      </div>

      {expanded && (
        <div className="space-y-3 animate-fadeIn">
          {categories.map((cat) => (
            <div key={cat.titleKey}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>{cat.icon}</span>
                {t(cat.titleKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((item, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span>{item.icon}</span>
                    {t(item.key)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
