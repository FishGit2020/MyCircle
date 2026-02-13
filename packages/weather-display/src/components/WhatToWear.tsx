import React, { useState } from 'react';
import { CurrentWeather, useTranslation, TranslationKey } from '@mycircle/shared';

interface Suggestion {
  icon: string;
  key: TranslationKey;
}

interface Category {
  labelKey: TranslationKey;
  icon: string;
  items: Suggestion[];
}

function getComfortLabel(temp: number, humidity: number, windSpeed: number): { key: TranslationKey; color: string } {
  // Wind chill makes cold feel colder
  const windChill = temp <= 10 && windSpeed > 4.8
    ? 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed * 3.6, 0.16) + 0.3965 * temp * Math.pow(windSpeed * 3.6, 0.16)
    : temp;
  // Heat index makes heat feel hotter
  const heatIndex = temp >= 27 && humidity >= 40
    ? temp + 0.33 * (humidity / 100 * 6.105 * Math.exp(17.27 * temp / (237.7 + temp))) - 4
    : temp;

  const effective = temp <= 10 ? windChill : temp >= 27 ? heatIndex : temp;

  if (effective <= -10) return { key: 'wear.comfortExtremeCold', color: 'text-blue-600 dark:text-blue-300' };
  if (effective <= 5) return { key: 'wear.comfortCold', color: 'text-cyan-600 dark:text-cyan-300' };
  if (effective <= 15) return { key: 'wear.comfortCool', color: 'text-teal-600 dark:text-teal-300' };
  if (effective <= 25) return { key: 'wear.comfortComfortable', color: 'text-green-600 dark:text-green-300' };
  if (effective <= 33) return { key: 'wear.comfortWarm', color: 'text-orange-600 dark:text-orange-300' };
  return { key: 'wear.comfortHot', color: 'text-red-600 dark:text-red-300' };
}

function getSuggestions(weather: CurrentWeather): Category[] {
  const temp = weather.temp;
  const humidity = weather.humidity;
  const windSpeed = weather.wind.speed;
  const mainWeather = weather.weather[0]?.main?.toLowerCase() || '';
  const isRainy = mainWeather.includes('rain') || mainWeather.includes('drizzle') || mainWeather.includes('thunderstorm');
  const isSnowy = mainWeather.includes('snow');
  const isClear = mainWeather === 'clear';
  const isWindy = windSpeed >= 10;

  const tops: Suggestion[] = [];
  const bottoms: Suggestion[] = [];
  const footwear: Suggestion[] = [];
  const accessories: Suggestion[] = [];
  const protection: Suggestion[] = [];
  const tips: Suggestion[] = [];

  // ── Tops based on temperature ─────────────────────────────
  if (temp <= -10) {
    tops.push({ icon: '\u{1F9E5}', key: 'wear.heavyWinterCoat' });
    tops.push({ icon: '\u{1F9F5}', key: 'wear.thermalBaseLayer' });
    tops.push({ icon: '\u{1F9E3}', key: 'wear.fleeceMiddleLayer' });
  } else if (temp <= 0) {
    tops.push({ icon: '\u{1F9E5}', key: 'wear.winterCoat' });
    tops.push({ icon: '\u{1F9F5}', key: 'wear.thermalBaseLayer' });
  } else if (temp <= 10) {
    tops.push({ icon: '\u{1F9E5}', key: 'wear.warmJacket' });
    tops.push({ icon: '\u{1F455}', key: 'wear.layeredTop' });
  } else if (temp <= 18) {
    tops.push({ icon: '\u{1F9E5}', key: 'wear.lightJacketSweater' });
    tops.push({ icon: '\u{1F455}', key: 'wear.longSleeveShirt' });
  } else if (temp <= 25) {
    tops.push({ icon: '\u{1F455}', key: 'wear.tshirtLightShirt' });
  } else if (temp <= 35) {
    tops.push({ icon: '\u{1F455}', key: 'wear.lightBreathable' });
    if (isClear) tops.push({ icon: '\u{1F455}', key: 'wear.uvProtectiveShirt' });
  } else {
    tops.push({ icon: '\u{1FA72}', key: 'wear.tankTopSleeveless' });
    tops.push({ icon: '\u{1F455}', key: 'wear.minimalLight' });
  }

  // ── Bottoms based on temperature ──────────────────────────
  if (temp <= -10) {
    bottoms.push({ icon: '\u{1F9F5}', key: 'wear.insulatedPants' });
    bottoms.push({ icon: '\u{1F9F5}', key: 'wear.thermalLeggings' });
  } else if (temp <= 5) {
    bottoms.push({ icon: '\u{1F456}', key: 'wear.longPants' });
  } else if (temp <= 18) {
    bottoms.push({ icon: '\u{1F456}', key: 'wear.jeansPants' });
  } else if (temp <= 25) {
    bottoms.push({ icon: '\u{1F456}', key: 'wear.lightPantsJeans' });
  } else {
    bottoms.push({ icon: '\u{1FA73}', key: 'wear.shorts' });
    if (humidity > 70) bottoms.push({ icon: '\u{1F456}', key: 'wear.lightLinenPants' });
  }

  // ── Footwear ──────────────────────────────────────────────
  if (temp <= -5 || isSnowy) {
    footwear.push({ icon: '\u{1F97E}', key: 'wear.winterBoots' });
    if (temp <= -10) footwear.push({ icon: '\u{1F9E6}', key: 'wear.woolSocks' });
  } else if (isRainy) {
    footwear.push({ icon: '\u{1F97E}', key: 'wear.waterproofBoots' });
  } else if (temp <= 18) {
    footwear.push({ icon: '\u{1F45F}', key: 'wear.closedShoes' });
  } else if (temp <= 28) {
    footwear.push({ icon: '\u{1F45F}', key: 'wear.sneakers' });
  } else {
    footwear.push({ icon: '\u{1FA74}', key: 'wear.openShoesSandals' });
  }

  // ── Accessories ───────────────────────────────────────────
  if (temp <= -10) {
    accessories.push({ icon: '\u{1F9E4}', key: 'wear.insulatedGloves' });
    accessories.push({ icon: '\u{1F9E3}', key: 'wear.scarfWarmHat' });
    if (isWindy) accessories.push({ icon: '\u{1F32C}\uFE0F', key: 'wear.faceCovering' });
  } else if (temp <= 0) {
    accessories.push({ icon: '\u{1F9E4}', key: 'wear.gloves' });
    accessories.push({ icon: '\u{1F9E3}', key: 'wear.scarf' });
    accessories.push({ icon: '\u{1F9E2}', key: 'wear.warmHat' });
  } else if (temp <= 10) {
    accessories.push({ icon: '\u{1F9E3}', key: 'wear.lightScarf' });
    if (temp <= 5) accessories.push({ icon: '\u{1F9E2}', key: 'wear.beanie' });
  }

  if (temp > 25 && isClear) {
    accessories.push({ icon: '\u{1F576}\uFE0F', key: 'wear.sunglasses' });
    accessories.push({ icon: '\u{1F452}', key: 'wear.hatSunProtection' });
  }

  if (isSnowy && temp <= -5) {
    accessories.push({ icon: '\u{1F97D}', key: 'wear.snowGoggles' });
  }

  // ── Protection ────────────────────────────────────────────
  if (isRainy) {
    protection.push({ icon: '\u2602\uFE0F', key: 'wear.umbrella' });
    protection.push({ icon: '\u{1F9E5}', key: 'wear.waterproofJacket' });
    if (mainWeather.includes('thunderstorm') || mainWeather.includes('rain')) {
      protection.push({ icon: '\u{1F456}', key: 'wear.waterproofPants' });
    }
  }
  if (isWindy && !isRainy) {
    protection.push({ icon: '\u{1F32C}\uFE0F', key: 'wear.windbreaker' });
  }
  if (temp > 25 && isClear) {
    protection.push({ icon: '\u2600\uFE0F', key: 'wear.sunscreen' });
  }

  // ── Tips ──────────────────────────────────────────────────
  if (temp > 30 || (temp > 25 && humidity > 60)) {
    tips.push({ icon: '\u{1F4A7}', key: 'wear.moistureWicking' });
    tips.push({ icon: '\u{1F455}', key: 'wear.looseFittingClothes' });
    tips.push({ icon: '\u{1F4A7}', key: 'wear.waterBottle' });
  }
  if (temp > 35) {
    tips.push({ icon: '\u{1F455}', key: 'wear.cottonOrLinen' });
    tips.push({ icon: '\u{1F9CA}', key: 'wear.coolingTowel' });
  }
  if (isWindy) {
    tips.push({ icon: '\u{1F455}', key: 'wear.secureFittingClothes' });
  }
  if (temp >= 5 && temp <= 18) {
    tips.push({ icon: '\u{1F9E5}', key: 'wear.dressInLayers' });
  }
  if (temp <= -5 || (temp <= 0 && isWindy)) {
    tips.push({ icon: '\u26A0\uFE0F', key: 'wear.brightReflective' });
  }

  const categories: Category[] = [];
  if (tops.length) categories.push({ labelKey: 'wear.catTops', icon: '\u{1F455}', items: tops });
  if (bottoms.length) categories.push({ labelKey: 'wear.catBottoms', icon: '\u{1F456}', items: bottoms });
  if (footwear.length) categories.push({ labelKey: 'wear.catFootwear', icon: '\u{1F45F}', items: footwear });
  if (accessories.length) categories.push({ labelKey: 'wear.catAccessories', icon: '\u{1F9E3}', items: accessories });
  if (protection.length) categories.push({ labelKey: 'wear.catProtection', icon: '\u2602\uFE0F', items: protection });
  if (tips.length) categories.push({ labelKey: 'wear.catTips', icon: '\u{1F4A1}', items: tips });

  return categories;
}

interface Props {
  data: CurrentWeather;
}

export default function WhatToWear({ data }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const categories = getSuggestions(data);
  if (categories.length === 0) return null;

  const comfort = getComfortLabel(data.temp, data.humidity, data.wind.speed);
  const totalItems = categories.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {t('weather.whatToWear')}
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

      {/* Comfort summary */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <span className={`text-sm font-medium ${comfort.color}`}>{t(comfort.key)}</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{totalItems} {t('wear.suggestions')}</span>
      </div>

      {expanded && (
        <div className="space-y-3 animate-fadeIn">
          {categories.map((cat) => (
            <div key={cat.labelKey}>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <span>{cat.icon}</span>
                {t(cat.labelKey)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cat.items.map((s, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                  >
                    <span>{s.icon}</span>
                    {t(s.key)}
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
