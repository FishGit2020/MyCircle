import axios from 'axios';
import NodeCache from 'node-cache';

const transitCache = new NodeCache();

const OBA_BASE_URL = 'https://api.pugetsound.onebusaway.org/api/where';
const OBA_API_KEY = 'TEST';

interface TransitArrival {
  routeId: string;
  routeShortName: string;
  tripHeadsign: string;
  scheduledArrival: number;
  predictedArrival: number;
  minutesUntilArrival: number;
  isRealTime: boolean;
  status: string;
  vehicleId: string;
}

interface TransitStop {
  id: string;
  name: string;
  direction: string;
  lat: number;
  lon: number;
  routeIds: string[];
}

export function createTransitQueryResolvers() {
  return {
    transitArrivals: async (_: unknown, { stopId }: { stopId: string }): Promise<TransitArrival[]> => {
      const cacheKey = `transit:arrivals:${stopId}`;
      const cached = transitCache.get<TransitArrival[]>(cacheKey);
      if (cached) return cached;

      const url = `${OBA_BASE_URL}/arrivals-and-departures-for-stop/${encodeURIComponent(stopId)}.json?key=${OBA_API_KEY}`;
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data?.data?.entry;
      const now = Date.now();

      const arrivals: TransitArrival[] = (data?.arrivalsAndDepartures || []).map((a: Record<string, unknown>) => {
        const predicted = Boolean(a.predicted);
        const scheduledArrival = Number(a.scheduledArrivalTime) || 0;
        const predictedArrival = Number(a.predictedArrivalTime) || 0;
        const arrivalTime = predicted ? predictedArrival : scheduledArrival;
        const minutesUntilArrival = Math.max(0, Math.round((arrivalTime - now) / 60000));

        return {
          routeId: String(a.routeId || ''),
          routeShortName: String(a.routeShortName || ''),
          tripHeadsign: String(a.tripHeadsign || ''),
          scheduledArrival,
          predictedArrival,
          minutesUntilArrival,
          isRealTime: predicted,
          status: String(a.status || ''),
          vehicleId: String(a.vehicleId || ''),
        };
      });

      transitCache.set(cacheKey, arrivals, 30);
      return arrivals;
    },

    transitStop: async (_: unknown, { stopId }: { stopId: string }): Promise<TransitStop | null> => {
      const cacheKey = `transit:stop:${stopId}`;
      const cached = transitCache.get<TransitStop>(cacheKey);
      if (cached) return cached;

      const url = `${OBA_BASE_URL}/stop/${encodeURIComponent(stopId)}.json?key=${OBA_API_KEY}`;
      const response = await axios.get(url, { timeout: 10000 });
      const data = response.data?.data?.entry;
      if (!data) return null;

      const stop: TransitStop = {
        id: data.id || stopId,
        name: data.name || '',
        direction: data.direction || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        routeIds: data.routeIds || [],
      };

      transitCache.set(cacheKey, stop, 300);
      return stop;
    },

    transitNearbyStops: async (_: unknown, { lat, lon, radius }: { lat: number; lon: number; radius?: number }): Promise<TransitStop[]> => {
      const r = radius || 500;
      const cacheKey = `transit:nearby:${lat}:${lon}:${r}`;
      const cached = transitCache.get<TransitStop[]>(cacheKey);
      if (cached) return cached;

      const url = `${OBA_BASE_URL}/stops-for-location.json?key=${OBA_API_KEY}&lat=${lat}&lon=${lon}&radius=${r}`;
      const response = await axios.get(url, { timeout: 10000 });
      const stops: TransitStop[] = (response.data?.data?.list || []).map((s: Record<string, unknown>) => ({
        id: String(s.id || ''),
        name: String(s.name || ''),
        direction: String(s.direction || ''),
        lat: Number(s.lat) || 0,
        lon: Number(s.lon) || 0,
        routeIds: (s.routeIds as string[]) || [],
      }));

      transitCache.set(cacheKey, stops, 30);
      return stops;
    },
  };
}
