import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadRecentStops,
  saveRecentStops,
  upsertRecentStop,
  removeRecentStop,
} from './recentStops';
import type { RecentStopEntry } from '../types';

const STORAGE_KEY = 'transit-recent-stops';

const sampleEntry = (id: string, overrides: Partial<RecentStopEntry> = {}): RecentStopEntry => ({
  stopId: id,
  name: `Stop ${id}`,
  direction: 'N',
  routeIds: ['1_44'],
  lastSeenAt: 1_700_000_000_000,
  ...overrides,
});

describe('recentStops cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadRecentStops', () => {
    it('returns [] when storage is empty', () => {
      expect(loadRecentStops()).toEqual([]);
    });

    it('returns [] for the legacy string[] shape', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['1_29248', '1_75403']));
      expect(loadRecentStops()).toEqual([]);
    });

    it('subsequent save overwrites legacy value with V1 container', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(['1_29248']));
      expect(loadRecentStops()).toEqual([]);

      saveRecentStops([sampleEntry('1_29248')]);
      const raw = localStorage.getItem(STORAGE_KEY) as string;
      const parsed = JSON.parse(raw);
      expect(parsed).toMatchObject({ version: 1 });
      expect(parsed.entries).toHaveLength(1);
      expect(parsed.entries[0].stopId).toBe('1_29248');
    });

    it('returns [] for corrupt JSON', () => {
      localStorage.setItem(STORAGE_KEY, '{not-json');
      expect(loadRecentStops()).toEqual([]);
    });

    it('returns [] when version is not 1', () => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, entries: [] }));
      expect(loadRecentStops()).toEqual([]);
    });

    it('reads valid V1 container and caps at 5 entries', () => {
      const entries = Array.from({ length: 7 }, (_, i) => sampleEntry(`stop_${i}`));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries }));
      const result = loadRecentStops();
      expect(result).toHaveLength(5);
      expect(result[0].stopId).toBe('stop_0');
    });

    it('drops malformed entries', () => {
      const mixed = [
        sampleEntry('valid'),
        { stopId: 'no-name' }, // missing fields
        { stopId: 'bad-routes', name: 'X', direction: '', routeIds: 'not-array', lastSeenAt: 0 },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, entries: mixed }));
      const result = loadRecentStops();
      expect(result).toHaveLength(1);
      expect(result[0].stopId).toBe('valid');
    });
  });

  describe('saveRecentStops', () => {
    it('truncates to 5 on save', () => {
      const entries = Array.from({ length: 8 }, (_, i) => sampleEntry(`stop_${i}`));
      saveRecentStops(entries);
      const result = loadRecentStops();
      expect(result).toHaveLength(5);
      expect(result.map((e) => e.stopId)).toEqual([
        'stop_0',
        'stop_1',
        'stop_2',
        'stop_3',
        'stop_4',
      ]);
    });

    it('writes a V1 container shape', () => {
      saveRecentStops([sampleEntry('a')]);
      const raw = localStorage.getItem(STORAGE_KEY) as string;
      expect(JSON.parse(raw)).toEqual({
        version: 1,
        entries: [sampleEntry('a')],
      });
    });
  });

  describe('upsertRecentStop', () => {
    it('prepends a new entry', () => {
      const result = upsertRecentStop([sampleEntry('a')], sampleEntry('b'));
      expect(result.map((e) => e.stopId)).toEqual(['b', 'a']);
    });

    it('dedupes by stopId and moves the entry to head', () => {
      const prev = [sampleEntry('a'), sampleEntry('b'), sampleEntry('c')];
      const result = upsertRecentStop(prev, sampleEntry('b', { name: 'Updated' }));
      expect(result.map((e) => e.stopId)).toEqual(['b', 'a', 'c']);
      expect(result[0].name).toBe('Updated');
    });

    it('caps the result at 5 entries', () => {
      const prev = Array.from({ length: 5 }, (_, i) => sampleEntry(`s${i}`));
      const result = upsertRecentStop(prev, sampleEntry('new'));
      expect(result).toHaveLength(5);
      expect(result[0].stopId).toBe('new');
      expect(result.map((e) => e.stopId)).not.toContain('s4');
    });
  });

  describe('removeRecentStop', () => {
    it('removes the matching entry and persists', () => {
      saveRecentStops([sampleEntry('a'), sampleEntry('b'), sampleEntry('c')]);
      const result = removeRecentStop('b');
      expect(result.map((e) => e.stopId)).toEqual(['a', 'c']);
      expect(loadRecentStops().map((e) => e.stopId)).toEqual(['a', 'c']);
    });

    it('is a no-op when the id is not present', () => {
      saveRecentStops([sampleEntry('a')]);
      const result = removeRecentStop('missing');
      expect(result.map((e) => e.stopId)).toEqual(['a']);
    });
  });
});
