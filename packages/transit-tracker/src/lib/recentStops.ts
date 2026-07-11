import type { RecentStopEntry } from '../types';

const STORAGE_KEY = 'transit-recent-stops';
const MAX_RECENT = 5;

interface RecentStopsCacheV1 {
  version: 1;
  entries: RecentStopEntry[];
}

function isValidEntry(value: unknown): value is RecentStopEntry {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.stopId === 'string' &&
    e.stopId.length > 0 &&
    typeof e.name === 'string' &&
    typeof e.direction === 'string' &&
    Array.isArray(e.routeIds) &&
    typeof e.lastSeenAt === 'number'
  );
}

export function loadRecentStops(): RecentStopEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Legacy string[] shape — discard. The next save replaces it with V1.
      return [];
    }
    if (
      parsed &&
      typeof parsed === 'object' &&
      (parsed as { version?: unknown }).version === 1 &&
      Array.isArray((parsed as { entries?: unknown }).entries)
    ) {
      const entries = (parsed as RecentStopsCacheV1).entries
        .filter(isValidEntry)
        .slice(0, MAX_RECENT);
      return entries;
    }
    return [];
  } catch {
    return [];
  }
}

export function saveRecentStops(entries: RecentStopEntry[]): void {
  try {
    const container: RecentStopsCacheV1 = {
      version: 1,
      entries: entries.slice(0, MAX_RECENT),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(container));
  } catch {
    // Ignore quota / private mode failures.
  }
}

export function upsertRecentStop(
  prev: RecentStopEntry[],
  stop: RecentStopEntry,
): RecentStopEntry[] {
  const filtered = prev.filter((e) => e.stopId !== stop.stopId);
  return [stop, ...filtered].slice(0, MAX_RECENT);
}

export function removeRecentStop(stopId: string): RecentStopEntry[] {
  const filtered = loadRecentStops().filter((e) => e.stopId !== stopId);
  saveRecentStops(filtered);
  return filtered;
}
