import React, { useState, useMemo } from 'react';
import { useTranslation, useEarningsCalendar } from '@mycircle/shared';
import type { EarningsEvent } from '@mycircle/shared';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatRevenue(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  return `$${value.toLocaleString()}`;
}

function getWeekRange(offset: number): { from: string; to: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + offset * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(monday), to: fmt(friday) };
}

function EarningsRow({ event, onSymbolClick }: { event: EarningsEvent; onSymbolClick?: (symbol: string) => void }) {
  const { t } = useTranslation();
  const hasActual = event.epsActual !== null;
  const epsBeat = hasActual && event.epsEstimate !== null && event.epsActual! > event.epsEstimate;
  const epsMiss = hasActual && event.epsEstimate !== null && event.epsActual! < event.epsEstimate;

  return (
    <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="py-2.5 px-3">
        <button
          onClick={() => onSymbolClick?.(event.symbol)}
          className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition"
        >
          {event.symbol}
        </button>
        {event.quarter && event.year && (
          <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
            {t('earnings.quarter')}{event.quarter} {event.year}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm text-gray-500 dark:text-gray-400">
        {event.hour === 'bmo' ? t('earnings.beforeOpen') : event.hour === 'amc' ? t('earnings.afterClose') : '—'}
      </td>
      <td className="py-2.5 px-3 text-sm text-right">
        {event.epsEstimate !== null && (
          <span className="text-gray-500 dark:text-gray-400">
            {t('earnings.estimate')} ${event.epsEstimate.toFixed(2)}
          </span>
        )}
        {hasActual && (
          <span className={`ml-2 font-medium ${epsBeat ? 'text-green-600 dark:text-green-400' : epsMiss ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
            {t('earnings.actual')} ${event.epsActual!.toFixed(2)}
          </span>
        )}
      </td>
      <td className="py-2.5 px-3 text-sm text-right hidden sm:table-cell">
        {event.revenueEstimate !== null && (
          <span className="text-gray-500 dark:text-gray-400">
            {formatRevenue(event.revenueEstimate)}
          </span>
        )}
      </td>
    </tr>
  );
}

export default function EarningsCalendar({ onSymbolClick }: { onSymbolClick?: (symbol: string) => void }) {
  const { t } = useTranslation();
  const [weekOffset, setWeekOffset] = useState(0);
  const { from, to } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);
  const { earnings, loading, error } = useEarningsCalendar(from, to);

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, EarningsEvent[]>();
    for (const event of earnings) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [earnings]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-700 dark:text-red-300 text-sm">{t('earnings.loadError')}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Week selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset(prev => prev - 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
            aria-label="Previous week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
            {weekOffset === 0 ? t('earnings.thisWeek') : weekOffset === 1 ? t('earnings.nextWeek') : `${from} — ${to}`}
          </span>
          <button
            onClick={() => setWeekOffset(prev => prev + 1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition text-gray-500 dark:text-gray-400"
            aria-label="Next week"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && earnings.length === 0 && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse h-10 bg-gray-100 dark:bg-gray-700 rounded" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && earnings.length === 0 && (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('earnings.noEvents')}</p>
        </div>
      )}

      {/* Earnings table grouped by date */}
      {grouped.map(([date, events]) => (
        <div key={date} className="mb-4">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 px-1">
            {formatDate(date)}
          </h4>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full" role="table">
              <thead className="sr-only">
                <tr>
                  <th>Symbol</th>
                  <th>Time</th>
                  <th>{t('earnings.eps')}</th>
                  <th>{t('earnings.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, i) => (
                  <EarningsRow key={`${event.symbol}-${i}`} event={event} onSymbolClick={onSymbolClick} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
