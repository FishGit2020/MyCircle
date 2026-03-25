import type { WorkEntry } from '../types';
import { getLocalDateString } from './localDate';

export function computeStreak(entries: WorkEntry[]): number {
  if (entries.length === 0) return 0;

  const dateSet = new Set(entries.map(e => e.date));

  let streak = 0;
  const current = new Date();

  while (true) {
    const dateStr = getLocalDateString(current);
    if (dateSet.has(dateStr)) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
