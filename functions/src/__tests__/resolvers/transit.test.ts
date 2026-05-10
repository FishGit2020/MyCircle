import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { createTransitQueryResolvers, transitCache } from '../../resolvers/transit.js';

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

describe('transit resolvers — credential handling', () => {
  const originalKey = process.env.ONEBUSAWAY_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    transitCache.flushAll();
  });

  afterEach(() => {
    process.env.ONEBUSAWAY_API_KEY = originalKey;
  });

  describe('when ONEBUSAWAY_API_KEY is provided', () => {
    beforeEach(() => {
      process.env.ONEBUSAWAY_API_KEY = 'real-key';
    });

    it('transitArrivals calls axios with the configured key', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          data: {
            entry: {
              arrivalsAndDepartures: [
                {
                  routeId: '1_44',
                  routeShortName: '44',
                  tripHeadsign: 'University District',
                  scheduledArrivalTime: 1_700_000_000_000,
                  predictedArrivalTime: 1_700_000_120_000,
                  predicted: true,
                  status: 'default',
                  vehicleId: '1_4567',
                },
              ],
            },
          },
        },
      });

      const resolvers = createTransitQueryResolvers();
      const result = await resolvers.transitArrivals(null, { stopId: '1_29248' });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('key=real-key'),
        expect.objectContaining({ timeout: 10000 }),
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        routeId: '1_44',
        routeShortName: '44',
        isRealTime: true,
        predictedArrival: 1_700_000_120_000,
      });
    });

    it('transitStop calls axios and returns mapped stop', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          data: {
            entry: {
              id: '1_29248',
              name: 'Pine St & 5th Ave',
              direction: 'E',
              lat: 47.611,
              lon: -122.333,
              routeIds: ['1_44'],
            },
          },
        },
      });

      const resolvers = createTransitQueryResolvers();
      const result = await resolvers.transitStop(null, { stopId: '1_29248' });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        id: '1_29248',
        name: 'Pine St & 5th Ave',
        direction: 'E',
        lat: 47.611,
        lon: -122.333,
        routeIds: ['1_44'],
      });
    });

    it('transitNearbyStops calls axios and returns mapped stops', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: {
          data: {
            list: [
              { id: '1_29248', name: 'A', direction: 'N', lat: 47.6, lon: -122.3, routeIds: [] },
              { id: '1_29249', name: 'B', direction: 'S', lat: 47.61, lon: -122.31, routeIds: ['1_44'] },
            ],
          },
        },
      });

      const resolvers = createTransitQueryResolvers();
      const result = await resolvers.transitNearbyStops(null, { lat: 47.6, lon: -122.3 });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1_29248');
    });
  });

  describe('when ONEBUSAWAY_API_KEY is missing', () => {
    beforeEach(() => {
      delete process.env.ONEBUSAWAY_API_KEY;
    });

    it('transitArrivals falls back to the OBA demo key (TEST)', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { entry: { arrivalsAndDepartures: [] } } },
      });

      const resolvers = createTransitQueryResolvers();
      await resolvers.transitArrivals(null, { stopId: '1_29248' });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('key=TEST'),
        expect.objectContaining({ timeout: 10000 }),
      );
    });

    it('transitStop falls back to the OBA demo key (TEST)', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { entry: { id: '1_29248', name: 'A', direction: '', lat: 0, lon: 0, routeIds: [] } } },
      });

      const resolvers = createTransitQueryResolvers();
      await resolvers.transitStop(null, { stopId: '1_29248' });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('key=TEST'),
        expect.anything(),
      );
    });

    it('transitNearbyStops falls back to the OBA demo key (TEST)', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({
        data: { data: { list: [] } },
      });

      const resolvers = createTransitQueryResolvers();
      await resolvers.transitNearbyStops(null, { lat: 47.6, lon: -122.3 });

      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('key=TEST'),
        expect.anything(),
      );
    });
  });
});
