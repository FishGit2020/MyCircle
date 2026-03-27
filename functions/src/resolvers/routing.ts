import { logger } from 'firebase-functions';

const OSRM_API = 'https://routing.openstreetmap.de/routed-foot';

type OsrmResponse = {
  routes?: Array<{
    geometry: { coordinates: [number, number][] };
    distance: number;
    duration: number;
  }>;
};

async function fetchOsrmRoute(waypointStr: string) {
  const url = `${OSRM_API}/route/v1/foot/${waypointStr}?overview=full&geometries=geojson`;
  const res = await fetch(url, { headers: { 'User-Agent': 'MyCircle/1.0' } });
  if (!res.ok) throw new Error(`OSRM error: HTTP ${res.status}`);
  const data = await res.json() as OsrmResponse;
  const route = data.routes?.[0];
  if (!route) return null;
  return {
    coordinates: route.geometry.coordinates,
    distance: route.distance,
    duration: route.duration,
  };
}

export function createRoutingResolvers() {
  return {
    Query: {
      calcRoute: async (
        _: unknown,
        { startLon, startLat, endLon, endLat }: { startLon: number; startLat: number; endLon: number; endLat: number },
      ) => {
        try {
          return await fetchOsrmRoute(`${startLon},${startLat};${endLon},${endLat}`);
        } catch (err) {
          logger.error('calcRoute failed', { err });
          return null;
        }
      },

      calcRouteMulti: async (
        _: unknown,
        { waypoints }: { waypoints: { lon: number; lat: number }[] },
      ) => {
        if (!waypoints || waypoints.length < 2) return null;
        try {
          const waypointStr = waypoints.map(w => `${w.lon},${w.lat}`).join(';');
          return await fetchOsrmRoute(waypointStr);
        } catch (err) {
          logger.error('calcRouteMulti failed', { err });
          return null;
        }
      },
    },
  };
}
