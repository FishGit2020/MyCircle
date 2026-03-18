import { logger } from 'firebase-functions';

const OSRM_API = 'https://routing.openstreetmap.de/routed-foot';

export function createRoutingResolvers() {
  return {
    Query: {
      calcRoute: async (
        _: unknown,
        { startLon, startLat, endLon, endLat }: { startLon: number; startLat: number; endLon: number; endLat: number },
      ) => {
        try {
          const url = `${OSRM_API}/route/v1/foot/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;
          const res = await fetch(url, { headers: { 'User-Agent': 'MyCircle/1.0' } });
          if (!res.ok) throw new Error(`OSRM error: HTTP ${res.status}`);
          const data = await res.json() as {
            routes?: Array<{
              geometry: { coordinates: [number, number][] };
              distance: number;
              duration: number;
            }>;
          };
          const route = data.routes?.[0];
          if (!route) return null;
          return {
            coordinates: route.geometry.coordinates,
            distance: route.distance,
            duration: route.duration,
          };
        } catch (err) {
          logger.error('calcRoute failed', { err });
          return null;
        }
      },
    },
  };
}
