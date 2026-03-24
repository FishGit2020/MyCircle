import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import type { BenchmarkRun } from '../hooks/useBenchmarkHistory';

const SERIES_COLORS = [
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#a855f7', // purple-500
  '#f97316', // orange-500
  '#ec4899', // pink-500
  '#14b8a6', // teal-500
];

interface TrendPoint {
  runId: string;
  runIndex: number;
  createdAt: string;
  tps: number | null;
  quality: number | null;
}

interface TrendSeries {
  key: string;
  label: string;
  color: string;
  points: TrendPoint[];
}

function deriveSeries(runs: BenchmarkRun[], filter: string): TrendSeries[] {
  // Sort runs by createdAt ascending
  const sorted = [...runs].sort((a, b) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  // Collect all unique endpoint::model keys
  const allKeys = new Set<string>();
  for (const run of sorted) {
    const results = Array.isArray(run.results) ? run.results : [];
    for (const r of results as any[]) { // eslint-disable-line @typescript-eslint/no-explicit-any
      if (r.endpointName && r.model) {
        allKeys.add(`${r.endpointName}::${r.model}`);
      }
    }
  }

  const keysToRender = filter
    ? allKeys.has(filter) ? [filter] : []
    : [...allKeys];

  return keysToRender.map((key, colorIndex) => {
    const [endpointName, model] = key.split('::');
    const points: TrendPoint[] = [];

    sorted.forEach((run, runIndex) => {
      const results = Array.isArray(run.results) ? run.results : [];
      const match = (results as any[]).find( // eslint-disable-line @typescript-eslint/no-explicit-any
        (r: any) => r.endpointName === endpointName && r.model === model // eslint-disable-line @typescript-eslint/no-explicit-any
      );
      points.push({
        runId: run.id,
        runIndex: runIndex + 1,
        createdAt: run.createdAt,
        tps: match?.timing?.tokensPerSecond ?? null,
        quality: match?.qualityScore ?? null,
      });
    });

    return {
      key,
      label: `${endpointName} / ${model}`,
      color: SERIES_COLORS[colorIndex % SERIES_COLORS.length],
      points,
    };
  });
}

function buildPolylineSegments(
  points: TrendPoint[],
  getValue: (p: TrendPoint) => number | null,
  maxValue: number,
  svgWidth: number,
  svgHeight: number,
  padding: number,
): string[] {
  // Split at null gaps — return multiple polyline point strings
  const segments: string[] = [];
  let current: string[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const value = getValue(p);
    const x = points.length > 1 ? (i / (points.length - 1)) * svgWidth : svgWidth / 2;
    const y = value != null && maxValue > 0
      ? svgHeight - padding - ((value / maxValue) * (svgHeight - padding * 2))
      : null;

    if (y == null) {
      if (current.length >= 2) segments.push(current.join(' '));
      current = [];
    } else {
      current.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
  }
  if (current.length >= 2) segments.push(current.join(' '));
  return segments;
}

function getGapPoints(
  points: TrendPoint[],
  getValue: (p: TrendPoint) => number | null,
  svgWidth: number,
  svgHeight: number,
  _padding: number,
): Array<{ x: number; y: number; label: string }> {
  return points
    .map((p, i) => {
      const value = getValue(p);
      if (value != null) return null;
      const x = points.length > 1 ? (i / (points.length - 1)) * svgWidth : svgWidth / 2;
      const y = svgHeight / 2; // center for gap markers
      return { x, y, label: `Run ${p.runIndex}: No data` };
    })
    .filter(Boolean) as Array<{ x: number; y: number; label: string }>;
}

interface Props {
  runs: BenchmarkRun[];
  filter: string;
}

export default function TrendChart({ runs, filter }: Props) {
  const { t } = useTranslation();
  const [metric, setMetric] = useState<'tps' | 'quality'>('tps');

  const series = deriveSeries(runs, filter);

  // Check if any series has at least 2 non-null points
  const getValue = (p: TrendPoint) => metric === 'tps' ? p.tps : p.quality;
  const hasEnoughData = series.some(s => s.points.filter(p => getValue(p) != null).length >= 2);

  if (!hasEnoughData) {
    return (
      <div className="py-6 text-center text-sm text-gray-400 dark:text-gray-500">
        {t('benchmark.history.noTrendData')}
      </div>
    );
  }

  const SVG_W = 200;
  const SVG_H = 60;
  const PAD = 5;

  // Compute max across all series for the selected metric
  const allValues = series.flatMap(s => s.points.map(p => getValue(p))).filter((v): v is number => v != null);
  const maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;

  // Take point labels from the first series (run indices are the same for all)
  const xLabels = (series[0]?.points ?? []).map(p => `${t('benchmark.history.trendRun', { n: String(p.runIndex) })}`);
  const maxLabel = maxValue >= 10 ? Math.round(maxValue) : maxValue.toFixed(1);

  return (
    <div className="space-y-2">
      {/* Metric toggle */}
      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden w-fit">
        <button
          type="button"
          onClick={() => setMetric('tps')}
          className={`px-3 py-1.5 text-xs transition-colors min-h-[36px] ${
            metric === 'tps'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {t('benchmark.history.trendTps')}
        </button>
        <button
          type="button"
          onClick={() => setMetric('quality')}
          className={`px-3 py-1.5 text-xs transition-colors min-h-[36px] ${
            metric === 'quality'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {t('benchmark.history.trendQuality')}
        </button>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          {/* Y-axis label */}
          <div className="flex flex-col justify-between text-[9px] text-gray-400 dark:text-gray-500 w-6 text-right flex-shrink-0">
            <span>{maxLabel}</span>
            <span>0</span>
          </div>

          {/* SVG chart */}
          <div className="flex-1 min-w-0">
            <svg
              viewBox={`0 0 ${SVG_W} ${SVG_H}`}
              className="w-full h-32"
              aria-label={`${metric === 'tps' ? t('benchmark.history.trendTps') : t('benchmark.history.trendQuality')} trend chart`}
            >
              {series.map(s => {
                const segments = buildPolylineSegments(s.points, getValue, maxValue, SVG_W, SVG_H, PAD);
                const gaps = getGapPoints(s.points, getValue, SVG_W, SVG_H, PAD);
                return (
                  <g key={s.key}>
                    {segments.map((pts, i) => (
                      <polyline
                        key={i}
                        points={pts}
                        fill="none"
                        stroke={s.color}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {gaps.map((g, i) => (
                      <circle
                        key={i}
                        cx={g.x}
                        cy={g.y}
                        r="3"
                        fill="none"
                        stroke={s.color}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        aria-label={g.label}
                      />
                    ))}
                  </g>
                );
              })}
            </svg>

            {/* X-axis labels */}
            {xLabels.length > 0 && (
              <div className="flex justify-between mt-1">
                {xLabels.map((label, i) => (
                  <span key={i} className="text-[9px] text-gray-400 dark:text-gray-500 flex-1 text-center">
                    {i === 0 || i === xLabels.length - 1 ? label : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {series.length > 1 && (
          <div className="flex flex-wrap gap-3 mt-3">
            {series.map(s => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 inline-block rounded" style={{ backgroundColor: s.color }} />
                <span className="text-xs text-gray-600 dark:text-gray-400">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
