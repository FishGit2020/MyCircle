import axios from 'axios';
import NodeCache from 'node-cache';

const locationCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

interface LocationSearchResult {
  displayName: string;
  lat: number;
  lon: number;
}

interface NominatimItem {
  display_name: string;
  lat: string;
  lon: string;
}

export function createLocationSearchQueryResolvers() {
  return {
    locationSearch: async (
      _: unknown,
      { query, limit = 5 }: { query: string; limit?: number },
    ): Promise<LocationSearchResult[]> => {
      const trimmed = query.trim();
      if (!trimmed) return [];

      const cacheKey = `loc:${trimmed}:${limit}`;
      const cached = locationCache.get<LocationSearchResult[]>(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: { q: trimmed, format: 'json', limit },
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'MyCircle/1.0',
          },
          timeout: 5000,
        },
      );

      const results: LocationSearchResult[] = (response.data as NominatimItem[]).map(
        (item) => ({
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }),
      );

      locationCache.set(cacheKey, results);
      return results;
    },
  };
}
