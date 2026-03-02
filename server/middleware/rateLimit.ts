import NodeCache from 'node-cache';
import type { Request } from 'express';

const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

/** Returns true if the caller has exceeded the limit within the window. */
export function checkRateLimit(ip: string, limit: number, windowSec: number): boolean {
  const key = `rate:${ip}:${windowSec}`;
  const current = rateLimitCache.get<number>(key) || 0;
  if (current >= limit) return true;
  rateLimitCache.set(key, current + 1, windowSec);
  return false;
}

/** Extract the real client IP from an Express request, respecting X-Forwarded-For. */
export function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
}
