import NodeCache from 'node-cache';

const weatherCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

export function getCacheKey(lat: number, lon: number, type: string): string {
  return `${type}:${lat.toFixed(2)}:${lon.toFixed(2)}`;
}

export function getCachedData<T>(key: string): T | undefined {
  return weatherCache.get<T>(key);
}

export function setCachedData<T>(key: string, data: T): void {
  weatherCache.set(key, data);
}

export function clearCache(): void {
  weatherCache.flushAll();
}
