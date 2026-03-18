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
      radioStations: async (_: unknown, { query, limit = 50 }: { query?: string; limit?: number }) => {
        const cacheKey = `search:${query ?? ''}:${limit}`;
        const cached = cache.get<RadioStationRaw[]>(cacheKey);
        if (cached) return cached;

        try {
          const params = new URLSearchParams({
            limit: String(limit),
            hidebroken: 'true',
            order: 'votes',
            reverse: 'true',
            ...(query ? { name: query } : {}),
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
    },
  };
}
