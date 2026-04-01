import { logger } from 'firebase-functions';
import NodeCache from 'node-cache';

const RADIO_API = 'https://de1.api.radio-browser.info/json';
const cache = new NodeCache({ stdTTL: 300 }); // 5-minute cache

interface RadioStationRaw {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved: string;
  favicon: string;
  tags: string;
  country: string;
  language: string;
  codec: string;
  bitrate: number;
  votes: number;
}

interface RadioTagRaw {
  name: string;
  stationcount: number;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'User-Agent': 'MyCircle/1.0', ...(options?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`Radio Browser API error: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export function createRadioStationResolvers() {
  return {
    Query: {
      radioStations: async (
        _: unknown,
        { query, limit = 50, tag, country }: { query?: string; limit?: number; tag?: string; country?: string },
      ) => {
        const cacheKey = `search:${query ?? ''}:${tag ?? ''}:${country ?? ''}:${limit}`;
        const cached = cache.get<RadioStationRaw[]>(cacheKey);
        if (cached) return cached;

        try {
          const params = new URLSearchParams({
            limit: String(limit),
            hidebroken: 'true',
            order: 'votes',
            reverse: 'true',
            ...(query ? { name: query } : {}),
            ...(tag ? { tag } : {}),
            ...(country ? { country } : {}),
          });
          const data = await fetchJson<RadioStationRaw[]>(
            `${RADIO_API}/stations/search?${params.toString()}`,
          );
          cache.set(cacheKey, data);
          return data;
        } catch (err) {
          logger.error('radioStations fetch failed', { err });
          return [];
        }
      },

      radioStationsByUuids: async (_: unknown, { uuids }: { uuids: string[] }) => {
        if (uuids.length === 0) return [];
        const results = await Promise.all(
          uuids.map(async (uuid) => {
            const cacheKey = `uuid:${uuid}`;
            const cached = cache.get<RadioStationRaw>(cacheKey);
            if (cached) return cached;
            try {
              const data = await fetchJson<RadioStationRaw[]>(`${RADIO_API}/stations/byuuid/${uuid}`);
              const station = data[0] ?? null;
              if (station) cache.set(cacheKey, station);
              return station;
            } catch (err) {
              logger.warn('radioStationsByUuids fetch failed', { uuid, err });
              return null;
            }
          }),
        );
        return results.filter((s): s is RadioStationRaw => s !== null);
      },

      radioTags: async (_: unknown, { limit = 50 }: { limit?: number }) => {
        const cacheKey = `tags:${limit}`;
        const cached = cache.get<{ name: string; stationCount: number }[]>(cacheKey);
        if (cached) return cached;

        try {
          const data = await fetchJson<RadioTagRaw[]>(
            `${RADIO_API}/tags?order=stationcount&reverse=true&hidebroken=true&limit=${limit}`,
          );
          const tags = data.map((t) => ({ name: t.name, stationCount: t.stationcount }));
          cache.set(cacheKey, tags);
          return tags;
        } catch (err) {
          logger.error('radioTags fetch failed', { err });
          return [];
        }
      },
    },

    Mutation: {
      voteRadioStation: async (_: unknown, { uuid }: { uuid: string }, ctx: { uid?: string }) => {
        if (!ctx.uid) throw new Error('Authentication required');
        try {
          const res = await fetch(`${RADIO_API}/vote/${uuid}`, {
            headers: { 'User-Agent': 'MyCircle/1.0' },
          });
          if (!res.ok) return false;
          const data = await res.json() as { ok: boolean; message?: string };
          return data.ok === true;
        } catch (err) {
          logger.error('voteRadioStation failed', { uuid, err });
          throw new Error('Vote failed due to network error');
        }
      },
    },
  };
}
