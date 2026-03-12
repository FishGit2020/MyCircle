import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { ALLOWED_ORIGINS, checkRateLimit } from './shared.js';

const transitCache = new NodeCache();

const OBA_BASE_URL = 'https://api.pugetsound.onebusaway.org/api/where';
const OBA_API_KEY = 'TEST';

/**
 * Proxy for OneBusAway transit API.
 * Routes:
 *   GET /transit-api/arrivals/:stopId  - real-time arrivals for a stop
 *   GET /transit-api/stop/:stopId      - stop details
 *   GET /transit-api/stops-nearby?lat=X&lon=Y&radius=500 - nearby stops
 */
export const transitProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    // Rate limit: 60 req/min per IP
    const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(ip, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const path = req.path.replace(/^\/transit-api\//, '');

    // Route: arrivals/:stopId
    if (path.startsWith('arrivals/')) {
      const stopId = path.replace('arrivals/', '');
      if (!stopId) {
        res.status(400).json({ error: 'stopId is required' });
        return;
      }

      const cacheKey = `transit:arrivals:${stopId}`;
      const cached = transitCache.get<unknown>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      try {
        const url = `${OBA_BASE_URL}/arrivals-and-departures-for-stop/${encodeURIComponent(stopId)}.json?key=${OBA_API_KEY}`;
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data?.data?.entry;
        const result = {
          stop: data ? {
            id: data.stopId,
            name: data.stop?.name || '',
            direction: data.stop?.direction || '',
            lat: data.stop?.lat || 0,
            lon: data.stop?.lon || 0,
            routeIds: data.stop?.routeIds || [],
          } : null,
          arrivalsAndDepartures: (data?.arrivalsAndDepartures || []).map((a: Record<string, unknown>) => ({
            routeId: a.routeId,
            routeShortName: a.routeShortName,
            routeLongName: a.routeLongName,
            tripHeadsign: a.tripHeadsign,
            predictedArrivalTime: a.predictedArrivalTime,
            scheduledArrivalTime: a.scheduledArrivalTime,
            predicted: Boolean(a.predicted),
            status: a.status || '',
            vehicleId: a.vehicleId || '',
            distanceFromStop: a.distanceFromStop || 0,
          })),
        };
        transitCache.set(cacheKey, result, 30);
        res.status(200).json(result);
      } catch (err: unknown) {
        const error = err as { message?: string; response?: { status?: number; data?: { text?: string } } };
        logger.error('Transit arrivals proxy error', { stopId, error: error.message });
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.text || error.message || 'Failed to fetch arrivals',
        });
      }
      return;
    }

    // Route: stop/:stopId
    if (path.startsWith('stop/')) {
      const stopId = path.replace('stop/', '');
      if (!stopId) {
        res.status(400).json({ error: 'stopId is required' });
        return;
      }

      const cacheKey = `transit:stop:${stopId}`;
      const cached = transitCache.get<unknown>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      try {
        const url = `${OBA_BASE_URL}/stop/${encodeURIComponent(stopId)}.json?key=${OBA_API_KEY}`;
        const response = await axios.get(url, { timeout: 10000 });
        const data = response.data?.data?.entry;
        const result = {
          id: data?.id || stopId,
          name: data?.name || '',
          direction: data?.direction || '',
          lat: data?.lat || 0,
          lon: data?.lon || 0,
          routeIds: data?.routeIds || [],
        };
        transitCache.set(cacheKey, result, 300);
        res.status(200).json(result);
      } catch (err: unknown) {
        const error = err as { message?: string; response?: { status?: number; data?: { text?: string } } };
        logger.error('Transit stop proxy error', { stopId, error: error.message });
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.text || error.message || 'Failed to fetch stop details',
        });
      }
      return;
    }

    // Route: stops-nearby?lat=X&lon=Y&radius=500
    if (path === 'stops-nearby') {
      const lat = req.query.lat as string;
      const lon = req.query.lon as string;
      const radius = (req.query.radius as string) || '500';

      if (!lat || !lon) {
        res.status(400).json({ error: 'lat and lon parameters are required' });
        return;
      }

      const cacheKey = `transit:nearby:${lat}:${lon}:${radius}`;
      const cached = transitCache.get<unknown>(cacheKey);
      if (cached) {
        res.status(200).json(cached);
        return;
      }

      try {
        const url = `${OBA_BASE_URL}/stops-for-location.json?key=${OBA_API_KEY}&lat=${lat}&lon=${lon}&radius=${radius}`;
        const response = await axios.get(url, { timeout: 10000 });
        const stops = (response.data?.data?.list || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          name: s.name,
          direction: s.direction || '',
          lat: s.lat,
          lon: s.lon,
          distance: 0, // OBA doesn't return distance; client can compute
        }));
        const result = { stops };
        transitCache.set(cacheKey, result, 30);
        res.status(200).json(result);
      } catch (err: unknown) {
        const error = err as { message?: string; response?: { status?: number; data?: { text?: string } } };
        logger.error('Transit nearby stops proxy error', { lat, lon, error: error.message });
        res.status(error.response?.status || 500).json({
          error: error.response?.data?.text || error.message || 'Failed to fetch nearby stops',
        });
      }
      return;
    }

    res.status(404).json({ error: `Unknown transit route: ${path}` });
  }
);
