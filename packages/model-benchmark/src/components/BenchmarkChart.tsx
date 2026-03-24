import { useState } from 'react';
import { useTranslation } from '@mycircle/shared';
import { BENCHMARK_PROMPTS } from '../hooks/useBenchmark';
import type { BenchmarkRunResult } from '../hooks/useBenchmark';

interface ChartBar {
  label: string;
  tps: number | null;
  quality: number | null;
  isError: boolean;
  isFastest: boolean;
}

interface PromptGroup {
  promptId: string;
  promptLabel: string;
  promptText: string;
  results: BenchmarkRunResult[];
}

function derivePromptGroups(results: BenchmarkRunResult[]): PromptGroup[] {
  const map = new Map<string, BenchmarkRunResult[]>();
  for (const r of results) {
    const key = r.prompt;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const groups: PromptGroup[] = [];
  for (const [promptText, groupResults] of map.entries()) {
    const match = BENCHMARK_PROMPTS.find(p => p.prompt === promptText);
    groups.push({
      promptId: match?.id ?? 'custom',
      promptLabel: match?.id ?? 'Custom',
      promptText,
      results: groupResults,
    });
  }
  return groups;
}

function deriveBars(results: BenchmarkRunResult[]): ChartBar[] {
  const withTiming = results.filter(r => r.timing && !r.error);
  const maxTps = withTiming.length > 0
    ? Math.max(...withTiming.map(r => r.timing!.tokensPerSecond))
    : 0;
  return results.map(r => ({
    label: `${r.endpointName} / ${r.model}`,
    tps: r.timing?.tokensPerSecond ?? null,
    quality: r.qualityScore ?? null,
    isError: !!r.error,
    isFastest: !r.error && r.timing != null && r.timing.tokensPerSecond === maxTps,
  }));
}

function qualityColor(score: number): string {
  if (score >= 8) return 'bg-green-400 dark:bg-green-500';
  if (score >= 5) return 'bg-yellow-400 dark:bg-yellow-500';
  return 'bg-red-400 dark:bg-red-500';
}

interface BarSectionProps {
  bars: ChartBar[];
  maxValue: number;
  getValue: (bar: ChartBar) => number | null;
  getColor: (bar: ChartBar) => string;
  label: string;
}

function BarSection({ bars, maxValue, getValue, getColor, label }: BarSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex-1 min-w-0">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">{label}</p>
      <div className="flex items-end gap-1 h-40">
        {bars.map((bar, i) => {
          const value = getValue(bar);
          const pct = maxValue > 0 && value != null ? (value / maxValue) * 100 : 0;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
              {bar.isError ? (
                <div
                  className="w-full border-2 border-red-400 dark:border-red-500 rounded-t"
                  style={{ height: '4px' }}
                  title={`${bar.label}: Error`}
                  aria-label={`${bar.label}: Error`}
                />
              ) : value == null ? (
                <div
                  className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-t"
                  style={{ height: '4px' }}
                  title={`${bar.label}: No data`}
                  aria-label={`${bar.label}: No data`}
                />
              ) : (
                <div
                  className={`w-full rounded-t transition-all min-h-[2px] ${getColor(bar)}`}
                  style={{ height: `${pct}%` }}
                  title={`${bar.label}: ${value.toFixed(1)}`}
                  aria-label={`${bar.label}: ${value.toFixed(1)}`}
                />
              )}
              <span
                className="text-[9px] text-gray-400 dark:text-gray-500 text-center leading-tight truncate w-full"
                title={bar.label}
              >
                {bar.label.split(' / ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface Props {
  results: BenchmarkRunResult[];
  groupBy?: 'endpoint' | 'prompt';
}

export default function BenchmarkChart({ results, groupBy: groupByProp }: Props) {
  const { t } = useTranslation();
  const [groupBy, setGroupBy] = useState<'endpoint' | 'prompt'>(groupByProp ?? 'endpoint');

  if (results.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
        {t('benchmark.results.noResults')}
      </div>
    );
  }

  const promptGroups = derivePromptGroups(results);
  const hasMultiplePrompts = promptGroups.length > 1;

  // Determine which results to chart
  const chartResults = groupBy === 'prompt' && hasMultiplePrompts ? results : results;
  const bars = deriveBars(chartResults);
  const withTiming = bars.filter(b => b.tps != null && !b.isError);
  const maxTps = withTiming.length > 0 ? Math.max(...withTiming.map(b => b.tps!)) : 1;
  const withQuality = bars.filter(b => b.quality != null && !b.isError);
  const maxQuality = withQuality.length > 0 ? Math.max(...withQuality.map(b => b.quality!)) : 10;

  const renderGroups = () => {
    if (!hasMultiplePrompts || groupBy === 'endpoint') {
      return (
        <div className="flex gap-4">
          <BarSection
            bars={bars}
            maxValue={maxTps}
            getValue={b => b.tps}
            getColor={b => b.isFastest ? 'bg-green-400 dark:bg-green-500' : 'bg-blue-400 dark:bg-blue-500'}
            label={t('benchmark.history.trendTps')}
          />
          {withQuality.length > 0 && (
            <BarSection
              bars={bars}
              maxValue={maxQuality}
              getValue={b => b.quality}
              getColor={b => qualityColor(b.quality ?? 0)}
              label={t('benchmark.history.trendQuality')}
            />
          )}
        </div>
      );
    }

    // groupBy === 'prompt': render one group per prompt
    return (
      <div className="space-y-6">
        {promptGroups.map(group => {
          const groupBars = deriveBars(group.results);
          const groupWithTiming = groupBars.filter(b => b.tps != null && !b.isError);
          const groupMaxTps = groupWithTiming.length > 0 ? Math.max(...groupWithTiming.map(b => b.tps!)) : 1;
          const groupWithQuality = groupBars.filter(b => b.quality != null && !b.isError);
          const groupMaxQuality = groupWithQuality.length > 0 ? Math.max(...groupWithQuality.map(b => b.quality!)) : 10;
          return (
            <div key={group.promptId}>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2 truncate" title={group.promptText}>
                {t(`benchmark.prompt${group.promptLabel.charAt(0).toUpperCase() + group.promptLabel.slice(1)}` as any) || group.promptLabel} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
              <div className="flex gap-4">
                <BarSection
                  bars={groupBars}
                  maxValue={groupMaxTps}
                  getValue={b => b.tps}
                  getColor={b => b.isFastest ? 'bg-green-400 dark:bg-green-500' : 'bg-blue-400 dark:bg-blue-500'}
                  label={t('benchmark.history.trendTps')}
                />
                {groupWithQuality.length > 0 && (
                  <BarSection
                    bars={groupBars}
                    maxValue={groupMaxQuality}
                    getValue={b => b.quality}
                    getColor={b => qualityColor(b.quality ?? 0)}
                    label={t('benchmark.history.trendQuality')}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {hasMultiplePrompts && (
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden w-fit">
          <button
            type="button"
            onClick={() => setGroupBy('endpoint')}
            className={`px-3 py-1.5 text-xs transition-colors min-h-[36px] ${
              groupBy === 'endpoint'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('benchmark.results.groupByEndpoint')}
          </button>
          <button
            type="button"
            onClick={() => setGroupBy('prompt')}
            className={`px-3 py-1.5 text-xs transition-colors min-h-[36px] ${
              groupBy === 'prompt'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {t('benchmark.results.groupByPrompt')}
          </button>
        </div>
      )}
      {renderGroups()}
    </div>
  );
}
