import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import type { Request } from 'express';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { z } from 'zod';

// Initialize Firebase Admin (idempotent)
if (getApps().length === 0) {
  initializeApp();
}

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
export const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
export const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
export const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';
export const PODCASTINDEX_BASE = process.env.PODCASTINDEX_BASE_URL || 'https://api.podcastindex.org';

// Ollama endpoints are now per-user (stored in Firestore), not env vars

// ─── Expand API_KEYS JSON secret into individual env vars ───────────
export function expandApiKeys() {
  if (process.env.API_KEYS) {
    const ak = JSON.parse(process.env.API_KEYS);
    process.env.OPENWEATHER_API_KEY = ak.openweather || '';
    process.env.FINNHUB_API_KEY = ak.finnhub || '';
    process.env.GEMINI_API_KEY = ak.gemini || '';
    process.env.YOUVERSION_APP_KEY = ak.youversion || '';
  }
}

// ─── CORS origins whitelist ─────────────────────────────────────────
export const ALLOWED_ORIGINS = [
  'https://mycircle-dash.web.app',
  'https://mycircle-dash.firebaseapp.com',
  'http://localhost:3000',
];

// ─── Rate Limiter ───────────────────────────────────────────────────
const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export function checkRateLimit(ip: string, limit: number, windowSec: number): boolean {
  const key = `rate:${ip}:${windowSec}`;
  const current = rateLimitCache.get<number>(key) || 0;
  if (current >= limit) return true;
  rateLimitCache.set(key, current + 1, windowSec);
  return false;
}

// ─── Zod Schemas ────────────────────────────────────────────────────
export const aiChatBodySchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  context: z.record(z.unknown()).optional(),
  model: z.string().max(100).optional(),
});

/** Verify Firebase Auth ID token from Authorization header. Returns uid or null. */
export async function verifyAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.substring(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

// ─── API Key Auth (for server-to-server / OpenClaw) ─────────────────
const apiKeyCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

/** Verify X-API-Key header: SHA-256 hash → Firestore apiKeys/{hash} → uid. */
export async function verifyApiKey(req: Request): Promise<string | null> {
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (!apiKey) return null;

  const hash = crypto.createHash('sha256').update(apiKey).digest('hex');

  // Check cache first
  const cached = apiKeyCache.get<string>(hash);
  if (cached) return cached;

  try {
    const { getFirestore } = await import('firebase-admin/firestore');
    const doc = await getFirestore().collection('apiKeys').doc(hash).get();
    if (!doc.exists) return null;
    const uid = doc.data()?.uid as string | undefined;
    if (!uid) return null;
    apiKeyCache.set(hash, uid);
    return uid;
  } catch {
    return null;
  }
}

// ─── Storage Upload Helpers ─────────────────────────────────────────
/** Upload a buffer to Firebase Storage with a download token, return the public URL. */
export async function uploadToStorage(
  bucket: ReturnType<ReturnType<typeof getStorage>['bucket']>,
  storagePath: string,
  data: Buffer,
  contentType: string,
  options?: { cacheControl?: string; customMetadata?: Record<string, string> },
): Promise<{ downloadUrl: string; downloadToken: string }> {
  const file = bucket.file(storagePath);
  const downloadToken = crypto.randomUUID();
  await file.save(data, {
    contentType,
    metadata: {
      ...(options?.cacheControl ? { cacheControl: options.cacheControl } : {}),
      metadata: { firebaseStorageDownloadTokens: downloadToken, ...options?.customMetadata },
    },
  });
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
  return { downloadUrl, downloadToken };
}

/** Set a download token on an existing file (e.g. after copy) and return the public URL. */
export async function getStorageDownloadUrl(
  bucket: ReturnType<ReturnType<typeof getStorage>['bucket']>,
  storagePath: string,
): Promise<{ downloadUrl: string; downloadToken: string }> {
  const downloadToken = crypto.randomUUID();
  await bucket.file(storagePath).setMetadata({
    metadata: { firebaseStorageDownloadTokens: downloadToken },
  });
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadToken}`;
  return { downloadUrl, downloadToken };
}
