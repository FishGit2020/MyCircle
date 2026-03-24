import type { MoodValue, WorkEntry } from '../types';
import { getLocalDateString } from './localDate';

export interface MoodDistributionItem {
  mood: MoodValue;
  count: number;
  percentage: number;
}

export interface TagFrequencyItem {
  tag: string;
  count: number;
}

export interface DayCount {
  date: string;
  count: number;
}

export function computeMoodDistribution(entries: WorkEntry[]): MoodDistributionItem[] {
  const counts: Partial<Record<MoodValue, number>> = {};
  for (const e of entries) {
    if (e.mood) counts[e.mood] = (counts[e.mood] ?? 0) + 1;
  }
  const total = Object.values(counts).reduce((s, n) => s + (n ?? 0), 0);
  if (total === 0) return [];

  return (Object.entries(counts) as [MoodValue, number][]).map(([mood, count]) => ({
    mood,
    count,
    percentage: Math.round((count / total) * 100),
  })).sort((a, b) => b.count - a.count);
}

export function computeTopTags(entries: WorkEntry[], limit = 5): TagFrequencyItem[] {
  const counts: Record<string, number> = {};
  for (const e of entries) {
    for (const tag of e.tags ?? []) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function compute30DayChart(entries: WorkEntry[]): DayCount[] {
  const countByDate: Record<string, number> = {};
  for (const e of entries) {
    countByDate[e.date] = (countByDate[e.date] ?? 0) + 1;
  }

  const result: DayCount[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const date = getLocalDateString(d);
    result.push({ date, count: countByDate[date] ?? 0 });
  }
  return result;
}
