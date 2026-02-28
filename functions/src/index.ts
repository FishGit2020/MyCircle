import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getStorage } from 'firebase-admin/storage';
import { getAppCheck } from 'firebase-admin/app-check';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { z } from 'zod';
import type { FunctionDeclaration } from '@google/genai';
import type OpenAI from 'openai';
import { verifyRecaptchaToken } from './recaptcha.js';

// Initialize Firebase Admin (idempotent)
if (getApps().length === 0) {
  initializeApp();
}

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';
const PODCASTINDEX_BASE = process.env.PODCASTINDEX_BASE_URL || 'https://api.podcastindex.org';

// Ollama (self-hosted AI) — when set, AI chat uses Ollama instead of Gemini
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || '';

// ─── CORS origins whitelist ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://mycircle-dash.web.app',
  'https://mycircle-dash.firebaseapp.com',
  'https://mycircledash.com',
  'http://localhost:3000',
];

// ─── Rate Limiter ───────────────────────────────────────────────────
const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

function checkRateLimit(ip: string, limit: number, windowSec: number): boolean {
  const key = `rate:${ip}:${windowSec}`;
  const current = rateLimitCache.get<number>(key) || 0;
  if (current >= limit) return true;
  rateLimitCache.set(key, current + 1, windowSec);
  return false;
}

// ─── Zod Schemas ────────────────────────────────────────────────────
const aiChatBodySchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  context: z.record(z.unknown()).optional(),
  model: z.string().max(100).optional(),
});

/** Verify Firebase Auth ID token from Authorization header. Returns uid or null. */
async function verifyAuthToken(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded = await getAuth().verifyIdToken(authHeader.substring(7));
    return decoded.uid;
  } catch {
    return null;
  }
}

// Cache the Apollo Server instance to avoid re-initialization on every request
let serverPromise: Promise<any> | null = null;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const { ApolloServer } = await import('@apollo/server');
      const { makeExecutableSchema } = await import('@graphql-tools/schema');
      const { typeDefs } = await import('./schema.js');
      const { createResolvers } = await import('./resolvers.js');

      const apiKey = process.env.OPENWEATHER_API_KEY || '';
      const finnhubKey = process.env.FINNHUB_API_KEY || '';
      const podcastApiKey = process.env.PODCASTINDEX_API_KEY || '';
      const podcastApiSecret = process.env.PODCASTINDEX_API_SECRET || '';
      const youversionKey = process.env.YOUVERSION_APP_KEY || '';

      const schema = makeExecutableSchema({
        typeDefs,
        resolvers: createResolvers(
          () => apiKey,
          () => finnhubKey,
          () => ({ apiKey: podcastApiKey, apiSecret: podcastApiSecret }),
          () => youversionKey
        )
      });

      const server = new ApolloServer({
        schema,
        introspection: true
      });

      await server.start();
      return server;
    })();
  }
  return serverPromise;
}

// Export the Cloud Function
export const graphql = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    maxInstances: 10,
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: ['OPENWEATHER_API_KEY', 'FINNHUB_API_KEY', 'PODCASTINDEX_API_KEY', 'PODCASTINDEX_API_SECRET', 'YOUVERSION_APP_KEY', 'GEMINI_API_KEY', 'OLLAMA_BASE_URL', 'CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET']
  },
  async (req: Request, res: Response) => {
    const server = await getServer();

    // App Check: verify request comes from our app (bot protection)
    // Non-blocking — log failures but allow request to proceed.
    // This avoids hard 403s when the custom domain (mycircledash.com)
    // isn't yet in the reCAPTCHA Enterprise key's domain list.
    const appCheckToken = req.headers['x-firebase-appcheck'] as string;
    if (appCheckToken) {
      try {
        await getAppCheck().verifyToken(appCheckToken);
      } catch (err) {
        logger.warn('App Check verification failed (non-blocking)', { error: String(err) });
      }
    }

    // Require auth for stock queries (expensive Finnhub API)
    const opName = (req.body.operationName || req.body.query?.match?.(/(?:query|mutation)\s+(\w+)/)?.[1] || '').toLowerCase();
    if (opName.includes('stock')) {
      const uid = await verifyAuthToken(req);
      if (!uid) {
        res.status(401).json({
          errors: [{ message: 'Authentication required for stock data', extensions: { code: 'UNAUTHENTICATED' } }]
        });
        return;
      }
    }

    // Handle the GraphQL request directly without Express
    // Firebase already parses the body, so we use it directly
    const { body, headers } = req;

    try {
      const result = await server.executeOperation(
        {
          query: body.query || undefined,
          variables: body.variables,
          operationName: body.operationName,
          extensions: body.extensions,
        },
        {
          contextValue: { headers }
        }
      );

      // Send the response
      if (result.body.kind === 'single') {
        res.status(200).json(result.body.singleResult);
      } else {
        // For incremental delivery (rare case)
        res.status(200).json({ data: null, errors: [{ message: 'Incremental delivery not supported' }] });
      }
    } catch (error: any) {
      logger.error('GraphQL execution error', { error: error.message });
      res.status(500).json({
        errors: [{ message: error.message || 'Internal server error' }]
      });
    }
  }
);

// ─── Weather Alert Subscriptions ────────────────────────────────────

/**
 * Firestore schema:
 *   alertSubscriptions/{docId}
 *     - token: string (FCM token)
 *     - uid: string (Firebase Auth user ID — enables cross-device unsubscribe)
 *     - cities: Array<{ lat: number, lon: number, name: string }>
 *     - createdAt: Timestamp
 *     - updatedAt: Timestamp
 */

/**
 * Callable function: subscribe an FCM token to weather alerts for given cities.
 */
export const subscribeToAlerts = onCall(
  { maxInstances: 5, enforceAppCheck: true },
  async (request) => {
    const { token, cities } = request.data as {
      token: string;
      cities: Array<{ lat: number; lon: number; name: string }>;
    };

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'FCM token is required');
    }
    if (!Array.isArray(cities)) {
      throw new HttpsError('invalid-argument', 'cities must be an array');
    }

    const uid = request.auth?.uid;
    const db = getFirestore();
    const subsRef = db.collection('alertSubscriptions');
    const existing = await subsRef.where('token', '==', token).limit(1).get();

    // Empty cities array = unsubscribe for ALL devices owned by this user
    if (cities.length === 0) {
      if (uid) {
        // Delete all subscription docs for this user (cross-device unsubscribe)
        const userDocs = await subsRef.where('uid', '==', uid).get();
        if (!userDocs.empty) {
          const batch = db.batch();
          userDocs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
        }
      }
      // Also delete the current token's doc if it exists but has no uid (legacy doc)
      if (!existing.empty && !existing.docs[0].data().uid) {
        await existing.docs[0].ref.delete();
      }
      return { success: true, subscribed: false };
    }

    // Upsert: update existing or create new subscription
    if (!existing.empty) {
      // Lazy migration: add uid if missing (backward compat for pre-uid docs)
      const updateData: Record<string, unknown> = {
        cities,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (uid && !existing.docs[0].data().uid) {
        updateData.uid = uid;
      }
      await existing.docs[0].ref.update(updateData);
    } else {
      await subsRef.add({
        token,
        cities,
        ...(uid ? { uid } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true, subscribed: true };
  }
);

// ─── Topic Subscription Management ───────────────────────────────

const VALID_TOPICS = ['announcements'];

/**
 * Callable function: subscribe/unsubscribe an FCM token to/from a messaging topic.
 * Payload: { token: string, topic: string, subscribe: boolean }
 */
export const manageTopicSubscription = onCall(
  { maxInstances: 5, enforceAppCheck: true },
  async (request) => {
    const { token, topic, subscribe } = request.data as {
      token: string;
      topic: string;
      subscribe: boolean;
    };

    if (!token || typeof token !== 'string') {
      throw new HttpsError('invalid-argument', 'FCM token is required');
    }
    if (!topic || !VALID_TOPICS.includes(topic)) {
      throw new HttpsError('invalid-argument', `Invalid topic. Allowed: ${VALID_TOPICS.join(', ')}`);
    }

    const messaging = getMessaging();

    if (subscribe) {
      await messaging.subscribeToTopic(token, topic);
      logger.info('Subscribed token to topic', { topic, tokenPrefix: token.slice(0, 10) });
    } else {
      await messaging.unsubscribeFromTopic(token, topic);
      logger.info('Unsubscribed token from topic', { topic, tokenPrefix: token.slice(0, 10) });
    }

    return { success: true, subscribed: subscribe };
  }
);

// ─── Announcement Push Notifications ────────────────────────────

/**
 * Firestore trigger: sends a push notification to the 'announcements' topic
 * whenever a new announcement document is created.
 */
export const onAnnouncementCreated = onDocumentCreated(
  'announcements/{announcementId}',
  async (event) => {
    const data = event.data?.data();
    if (!data) {
      logger.warn('onAnnouncementCreated fired with no data');
      return;
    }

    const title = (data.title as string) || 'New Announcement';
    const body = (data.description as string) || '';
    const icon = (data.icon as string) || undefined;

    const messaging = getMessaging();

    try {
      await messaging.send({
        topic: 'announcements',
        notification: { title, body, ...(icon ? { imageUrl: icon } : {}) },
        webpush: {
          fcmOptions: {
            link: '/',
          },
        },
      });
      logger.info('Sent announcement push notification', { title });
    } catch (err: any) {
      logger.error('Failed to send announcement notification', { error: err.message });
    }
  }
);

// Severe weather condition IDs from OpenWeather API
// See: https://openweathermap.org/weather-conditions
const SEVERE_WEATHER_IDS = new Set([
  200, 201, 202, 210, 211, 212, 221, 230, 231, 232, // Thunderstorm
  502, 503, 504, 511,                                  // Heavy rain / freezing rain
  602, 611, 612, 613, 615, 616, 620, 621, 622,        // Heavy snow / sleet
  711, 731, 751, 761, 762,                             // Smoke, dust, volcanic ash
  771, 781,                                            // Squall, tornado
]);

/**
 * Scheduled function: runs every 30 minutes to check weather for subscribed cities.
 * Sends FCM push notification for severe weather alerts.
 */
export const checkWeatherAlerts = onSchedule(
  {
    schedule: 'every 30 minutes',
    memory: '256MiB',
    timeoutSeconds: 120,
    secrets: ['OPENWEATHER_API_KEY'],
  },
  async () => {
    const db = getFirestore();
    const messaging = getMessaging();
    const apiKey = process.env.OPENWEATHER_API_KEY || '';

    if (!apiKey) {
      logger.warn('OPENWEATHER_API_KEY not set — skipping weather alerts');
      return;
    }

    // Fetch all subscriptions
    const snapshot = await db.collection('alertSubscriptions').get();
    if (snapshot.empty) {
      logger.info('No alert subscriptions found');
      return;
    }

    // Deduplicate cities across all subscriptions
    const cityMap = new Map<string, { lat: number; lon: number; name: string; tokens: string[] }>();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const token = data.token as string;
      const cities = data.cities as Array<{ lat: number; lon: number; name: string }>;

      for (const city of cities) {
        const key = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.tokens.push(token);
        } else {
          cityMap.set(key, { ...city, tokens: [token] });
        }
      }
    }

    logger.info('Checking weather for subscribed cities', { cityCount: cityMap.size });

    // Check weather for each city
    const staleTokens: string[] = [];

    for (const [, city] of cityMap) {
      try {
        const response = await axios.get(
          `${OPENWEATHER_BASE}/data/2.5/weather`,
          { params: { lat: city.lat, lon: city.lon, appid: apiKey, units: 'metric' }, timeout: 5000 }
        );

        const weather = response.data.weather as Array<{ id: number; main: string; description: string }>;
        const hasSevere = weather.some(w => SEVERE_WEATHER_IDS.has(w.id));

        if (hasSevere) {
          const severity = weather.find(w => SEVERE_WEATHER_IDS.has(w.id))!;
          const temp = Math.round(response.data.main.temp);

          logger.info('Severe weather detected', { city: city.name, condition: severity.description });

          // Send FCM to all subscribed tokens for this city
          for (const token of city.tokens) {
            try {
              await messaging.send({
                token,
                notification: {
                  title: `⚠️ Weather Alert: ${city.name}`,
                  body: `${severity.main} — ${severity.description} (${temp}°C)`,
                },
                data: {
                  lat: String(city.lat),
                  lon: String(city.lon),
                  cityName: city.name,
                },
                webpush: {
                  fcmOptions: {
                    link: `/weather/${city.lat},${city.lon}?name=${encodeURIComponent(city.name)}`,
                  },
                },
              });
            } catch (err: any) {
              // Token is invalid/expired — mark for cleanup
              if (err.code === 'messaging/registration-token-not-registered' ||
                  err.code === 'messaging/invalid-registration-token') {
                staleTokens.push(token);
              }
              logger.error('Failed to send FCM notification', { tokenPrefix: token.slice(0, 10), error: err.message });
            }
          }
        }
      } catch (err: any) {
        logger.error('Failed to fetch weather for alert check', { city: city.name, error: err.message });
      }
    }

    // Clean up stale tokens
    if (staleTokens.length > 0) {
      logger.info('Cleaning up stale FCM tokens', { count: staleTokens.length });
      const batch = db.batch();
      for (const token of staleTokens) {
        const docs = await db.collection('alertSubscriptions').where('token', '==', token).get();
        docs.forEach(doc => batch.delete(doc.ref));
      }
      await batch.commit();
    }
  }
);

// ─── Stock Proxy (Finnhub) ──────────────────────────────────────────

const stockCache = new NodeCache();

/**
 * Proxy for Finnhub stock API.
 * Routes:
 *   GET /stock/search?q=...
 *   GET /stock/quote?symbol=...
 *   GET /stock/profile?symbol=...
 *   GET /stock/candles?symbol=...&resolution=D&from=...&to=...
 */
export const stockProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['FINNHUB_API_KEY'],
  },
  async (req: Request, res: Response) => {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'FINNHUB_API_KEY not configured' });
      return;
    }

    // Require auth — stock proxy uses Finnhub quota
    const stockUid = await verifyAuthToken(req);
    if (!stockUid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 60 req/min per IP
    const stockIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(stockIp, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const path = req.path.replace(/^\/stock\//, '');
    const baseUrl = `${FINNHUB_BASE}/api/v1`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (path) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search?q=${encodeURIComponent(q)}`;
        cacheKey = `stock:search:${q}`;
        cacheTTL = 300; // 5 min
        break;
      }
      case 'quote': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/quote?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:quote:${symbol}`;
        cacheTTL = 30; // 30 sec
        break;
      }
      case 'profile': {
        const symbol = req.query.symbol as string;
        if (!symbol) { res.status(400).json({ error: 'symbol parameter required' }); return; }
        url = `${baseUrl}/stock/profile2?symbol=${encodeURIComponent(symbol)}`;
        cacheKey = `stock:profile:${symbol}`;
        cacheTTL = 3600; // 1 hr
        break;
      }
      case 'candles': {
        const symbol = req.query.symbol as string;
        const resolution = (req.query.resolution as string) || 'D';
        const from = req.query.from as string;
        const to = req.query.to as string;
        if (!symbol || !from || !to) { res.status(400).json({ error: 'symbol, from, to parameters required' }); return; }
        url = `${baseUrl}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}`;
        cacheKey = `stock:candles:${symbol}:${resolution}:${from}:${to}`;
        cacheTTL = 300; // 5 min
        break;
      }
      default:
        res.status(404).json({ error: `Unknown stock route: ${path}` });
        return;
    }

    // Check cache
    const cached = stockCache.get<any>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    try {
      const response = await axios.get(url, {
        headers: { 'X-Finnhub-Token': apiKey },
        timeout: 10000,
      });
      stockCache.set(cacheKey, response.data, cacheTTL);
      res.status(200).json(response.data);
    } catch (err: any) {
      logger.error('Stock proxy error', { path, error: err.message });
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.error || err.message || 'Failed to fetch stock data',
      });
    }
  }
);

// ─── Podcast Proxy (PodcastIndex) ──────────────────────────────────

const podcastCache = new NodeCache();

/**
 * Generate PodcastIndex API auth headers.
 * Auth requires: X-Auth-Key, X-Auth-Date, Authorization (SHA-1 of key+secret+timestamp)
 */
function getPodcastIndexHeaders(apiKey: string, apiSecret: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000);
  // CodeQL [js/weak-cryptographic-algorithm]: SHA-1 is required by PodcastIndex API auth spec — not used for password hashing
  const hash = crypto.createHash('sha1').update(`${apiKey}${apiSecret}${ts}`).digest('hex');
  return {
    'X-Auth-Key': apiKey,
    'X-Auth-Date': String(ts),
    'Authorization': hash,
    'User-Agent': 'MyCircle/1.0',
  };
}

/**
 * Proxy for PodcastIndex API.
 * Routes:
 *   GET /podcast/search?q=...
 *   GET /podcast/trending
 *   GET /podcast/episodes?feedId=...
 */
// ─── AI Chat (Gemini) ──────────────────────────────────────────────

const aiChatCache = new NodeCache();

/**
 * AI Chat endpoint using Google Gemini with function calling.
 * POST /ai/chat — Body: { message: string, history: { role: string, content: string }[] }
 * Returns: { response: string, toolCalls?: { name: string, args: object, result?: string }[] }
 */
export const aiChat = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 60,
    secrets: ['GEMINI_API_KEY', 'OPENWEATHER_API_KEY', 'FINNHUB_API_KEY', 'RECAPTCHA_SECRET_KEY', 'OLLAMA_BASE_URL', 'CF_ACCESS_CLIENT_ID', 'CF_ACCESS_CLIENT_SECRET'],
  },
  async (req: Request, res: Response) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    // Require auth — AI chat uses Gemini quota
    const aiUid = await verifyAuthToken(req);
    if (!aiUid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 10 req/min per IP
    const aiIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(aiIp, 10, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    // reCAPTCHA verification (graceful — skip if token missing for backward compat)
    const recaptchaToken = req.headers['x-recaptcha-token'] as string;
    if (recaptchaToken) {
      const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
      if (recaptchaSecret) {
        const result = await verifyRecaptchaToken(recaptchaToken, recaptchaSecret);
        if (!result.valid) {
          res.status(403).json({ error: result.reason || 'reCAPTCHA verification failed' });
          return;
        }
      }
    }

    const ollamaBaseUrl = OLLAMA_BASE_URL;
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!ollamaBaseUrl && !geminiKey) {
      res.status(500).json({ error: 'No AI provider configured (set GEMINI_API_KEY or OLLAMA_BASE_URL)' });
      return;
    }

    // Validate request body with Zod
    const parseResult = aiChatBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors });
      return;
    }

    const { message, history, context, model } = parseResult.data;
    const ollamaModel = model || 'gemma2:2b';

    // Build context-aware system instruction (shared by both providers)
    let systemInstruction = 'You are MyCircle AI, a helpful assistant for the MyCircle personal dashboard app. You can look up weather, stock quotes, crypto prices, search for cities, and navigate users around the app. Be concise and helpful. When users ask about weather, stocks, or crypto, use the tools to get real data.';

    if (context && typeof context === 'object') {
      const ctxParts: string[] = [];
      if (Array.isArray(context.favoriteCities) && context.favoriteCities.length > 0) {
        ctxParts.push(`Favorite cities: ${(context.favoriteCities as string[]).join(', ')}`);
      }
      if (Array.isArray(context.recentCities) && context.recentCities.length > 0) {
        ctxParts.push(`Recently searched cities: ${(context.recentCities as string[]).join(', ')}`);
      }
      if (Array.isArray(context.stockWatchlist) && context.stockWatchlist.length > 0) {
        ctxParts.push(`Stock watchlist: ${(context.stockWatchlist as string[]).join(', ')}`);
      }
      if (typeof context.podcastSubscriptions === 'number' && context.podcastSubscriptions > 0) {
        ctxParts.push(`Subscribed to ${context.podcastSubscriptions} podcasts`);
      }
      if (context.tempUnit) ctxParts.push(`Preferred temperature unit: ${context.tempUnit === 'F' ? 'Fahrenheit' : 'Celsius'}`);
      if (context.locale) ctxParts.push(`Language: ${context.locale === 'es' ? 'Spanish' : 'English'}`);
      if (context.currentPage) ctxParts.push(`Currently on: ${context.currentPage}`);

      if (ctxParts.length > 0) {
        systemInstruction += '\n\nUser context:\n' + ctxParts.join('\n');
        systemInstruction += '\n\nUse this context to personalize responses. For example, if the user asks "how is the weather?" you can check their favorite or recent cities. If they ask about stocks, reference their watchlist.';
      }
    }

    /** Execute a tool by name (inline version for Cloud Functions) */
    async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
      if (name === 'getWeather') return await executeGetWeather(args.city as string);
      if (name === 'searchCities') return await executeSearchCities(args.query as string);
      if (name === 'getStockQuote') return await executeGetStockQuote(args.symbol as string);
      if (name === 'getCryptoPrices') return await executeGetCryptoPrices();
      if (name === 'navigateTo') return JSON.stringify({ navigateTo: args.page });
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    try {
      // ─── Ollama path (OpenAI-compatible API) ───────────────────
      if (ollamaBaseUrl) {
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({
          baseURL: `${ollamaBaseUrl}/v1`, apiKey: 'ollama',
          defaultHeaders: {
            ...(process.env.CF_ACCESS_CLIENT_ID ? { 'CF-Access-Client-Id': process.env.CF_ACCESS_CLIENT_ID } : {}),
            ...(process.env.CF_ACCESS_CLIENT_SECRET ? { 'CF-Access-Client-Secret': process.env.CF_ACCESS_CLIENT_SECRET } : {}),
          },
        });

        // Define tools in OpenAI format
        const ollamaTools: OpenAI.ChatCompletionTool[] = [
          { type: 'function', function: { name: 'getWeather', description: 'Get current weather for a city.', parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] } } },
          { type: 'function', function: { name: 'searchCities', description: 'Search for cities by name.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] } } },
          { type: 'function', function: { name: 'getStockQuote', description: 'Get stock price for a symbol.', parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Stock ticker' } }, required: ['symbol'] } } },
          { type: 'function', function: { name: 'getCryptoPrices', description: 'Get crypto prices.', parameters: { type: 'object', properties: {} } } },
          { type: 'function', function: { name: 'navigateTo', description: 'Navigate to a page.', parameters: { type: 'object', properties: { page: { type: 'string', description: 'Page name' } }, required: ['page'] } } },
        ];

        // Build OpenAI message array
        const messages: OpenAI.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemInstruction },
        ];
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            messages.push({
              role: msg.role === 'assistant' ? 'assistant' : 'user',
              content: msg.content,
            });
          }
        }
        messages.push({ role: 'user', content: message });

        const toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }> = [];

        // Try native tool calling first (works with qwen2.5, llama3.1+)
        let completion: OpenAI.ChatCompletion;
        let usedFallback = false;
        try {
          completion = await client.chat.completions.create({
            model: ollamaModel,
            messages,
            tools: ollamaTools,
          });
        } catch {
          // Model doesn't support native tools (e.g., gemma2:2b) — prompt-based fallback
          usedFallback = true;
          const toolPrompt = ollamaTools.map(t => {
            const params = (t.function.parameters as Record<string, any>)?.properties || {};
            return `- ${t.function.name}(${Object.keys(params).join(', ')}): ${t.function.description}`;
          }).join('\n');
          const fallbackSystemPrompt = systemInstruction + '\n\n' +
            'You have access to these tools:\n' + toolPrompt + '\n\n' +
            'If the user\'s request needs a tool, respond with ONLY a JSON object in this exact format (no other text):\n' +
            '{"name":"toolName","args":{"param":"value"}}\n\n' +
            'Otherwise, respond normally to the user.';
          const fallbackMessages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: fallbackSystemPrompt },
            ...messages.slice(1), // skip original system message
          ];
          completion = await client.chat.completions.create({
            model: ollamaModel,
            messages: fallbackMessages,
          });
        }

        const choice = completion.choices[0];

        // Handle prompt-based fallback: parse <tool_call> from text
        if (usedFallback) {
          const text = choice.message.content || '';
          const match = text.match(/<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/)
            || text.match(/```(?:tool_call|json)?\s*(\{[\s\S]*?\})\s*```/)
            || text.match(/(\{"name"\s*:\s*"(?:getWeather|searchCities|getStockQuote|getCryptoPrices|navigateTo)"[\s\S]*?\})/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]) as { name: string; args: Record<string, unknown> };
              let result = '';
              try { result = await executeTool(parsed.name, parsed.args); }
              catch (err: any) { result = JSON.stringify({ error: err.message }); }
              toolCalls.push({ name: parsed.name, args: parsed.args, result });

              // Send tool result back for final answer
              const followup = await client.chat.completions.create({
                model: ollamaModel,
                messages: [
                  ...messages,
                  { role: 'assistant', content: text },
                  { role: 'user', content: `Tool result for ${parsed.name}: ${result}\n\nPlease provide a helpful response based on this data.` },
                ],
              });
              res.status(200).json({ response: followup.choices[0].message.content, toolCalls });
              return;
            } catch { /* JSON parse failed — treat as plain text */ }
          }
          // No tool call parsed — return as plain text
          res.status(200).json({ response: text || 'Sorry, I could not generate a response.' });
          return;
        }

        // Native tool calls path
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            const args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
            let result = '';
            try {
              result = await executeTool(tc.function.name, args);
            } catch (err: any) {
              result = JSON.stringify({ error: err.message });
            }
            toolCalls.push({ name: tc.function.name, args, result });
          }

          // Send tool results back for final response
          const followupMessages: OpenAI.ChatCompletionMessageParam[] = [
            ...messages,
            choice.message,
            ...choice.message.tool_calls.map((tc, i) => ({
              role: 'tool' as const,
              tool_call_id: tc.id,
              content: toolCalls[i].result || '',
            })),
          ];

          const followup = await client.chat.completions.create({
            model: ollamaModel,
            messages: followupMessages,
          });

          const finalText = followup.choices[0].message.content || 'I found some information but had trouble formatting it.';
          res.status(200).json({ response: finalText, toolCalls });
          return;
        }

        // No tool calls — return direct text response
        const text = choice.message.content || 'Sorry, I could not generate a response.';
        res.status(200).json({ response: text });
        return;
      }

      // ─── Gemini path (existing behavior) ───────────────────────
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey! });

      // Define tools for function calling
      const getWeatherDecl: FunctionDeclaration = {
        name: 'getWeather',
        description: 'Get current weather for a city. Returns temperature, conditions, humidity, and wind.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING, description: 'City name (e.g., "Tokyo", "New York")' },
          },
          required: ['city'],
        },
      };

      const searchCitiesDecl: FunctionDeclaration = {
        name: 'searchCities',
        description: 'Search for cities by name. Returns matching city names with coordinates.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING, description: 'Search query for city name' },
          },
          required: ['query'],
        },
      };

      const getStockQuoteDecl: FunctionDeclaration = {
        name: 'getStockQuote',
        description: 'Get the current stock price and daily change for a stock symbol.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING, description: 'Stock ticker symbol (e.g., "AAPL", "GOOGL")' },
          },
          required: ['symbol'],
        },
      };

      const navigateToDecl: FunctionDeclaration = {
        name: 'navigateTo',
        description: 'Navigate the user to a specific page in the MyCircle app. Available pages: weather (home), stocks, podcasts, compare.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.STRING, description: 'Page to navigate to: "weather", "stocks", "podcasts", "compare"' },
          },
          required: ['page'],
        },
      };

      const getCryptoPricesDecl: FunctionDeclaration = {
        name: 'getCryptoPrices',
        description: 'Get current prices for major cryptocurrencies (Bitcoin, Ethereum, Solana, etc.) from CoinGecko.',
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      };

      const tools = [
        { functionDeclarations: [getWeatherDecl, searchCitiesDecl, getStockQuoteDecl, navigateToDecl, getCryptoPricesDecl] },
      ];

      // Build conversation history
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }],
          });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      // Call Gemini
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          tools,
          systemInstruction,
        },
      });

      // Process function calls if any
      const toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }> = [];
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      let hasToolCalls = false;
      for (const part of parts) {
        if (part.functionCall) {
          hasToolCalls = true;
          const fc = part.functionCall;
          const args = (fc.args || {}) as Record<string, unknown>;
          let result = '';

          try {
            result = await executeTool(fc.name!, args);
          } catch (err: any) {
            result = JSON.stringify({ error: err.message });
          }

          toolCalls.push({ name: fc.name!, args, result });
        }
      }

      // If we had tool calls, send results back to Gemini for a final response
      if (hasToolCalls && toolCalls.length > 0) {
        const toolResponseParts = toolCalls.map(tc => ({
          functionResponse: {
            name: tc.name,
            response: { result: tc.result },
          },
        }));

        const followupContents = [
          ...contents,
          { role: 'model', parts },
          { role: 'user', parts: toolResponseParts },
        ];

        const followup = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: followupContents,
          config: {
            systemInstruction: 'You are MyCircle AI, a helpful assistant for the MyCircle personal dashboard app. Summarize the tool results in a natural, helpful way. Be concise.',
          },
        });

        const finalText = followup.text || 'I found some information but had trouble formatting it.';
        res.status(200).json({ response: finalText, toolCalls });
        return;
      }

      // No tool calls — return direct text response
      const text = response.text || 'Sorry, I could not generate a response.';
      res.status(200).json({ response: text });
    } catch (err: any) {
      logger.error('AI Chat error', { error: err.message || String(err), status: err.status });
      if (err.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
        return;
      }
      res.status(500).json({ error: err.message || 'Failed to generate response' });
    }
  }
);

/**
 * Execute getWeather tool: fetch current weather from OpenWeather API
 */
async function executeGetWeather(city: string): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Weather API not configured' });

  // Check cache
  const cacheKey = `ai:weather:${city.toLowerCase()}`;
  const cached = aiChatCache.get<string>(cacheKey);
  if (cached) return cached;

  // First geocode the city
  const geoRes = await axios.get(
    `${OPENWEATHER_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`,
    { timeout: 5000 }
  );

  if (!geoRes.data || geoRes.data.length === 0) {
    return JSON.stringify({ error: `City "${city}" not found` });
  }

  const { lat, lon, name, country } = geoRes.data[0];

  // Get weather
  const weatherRes = await axios.get(
    `${OPENWEATHER_BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`,
    { timeout: 5000 }
  );

  const w = weatherRes.data;
  const result = JSON.stringify({
    city: name,
    country,
    temp: Math.round(w.main.temp),
    feelsLike: Math.round(w.main.feels_like),
    description: w.weather[0].description,
    humidity: w.main.humidity,
    windSpeed: w.wind.speed,
    icon: w.weather[0].icon,
  });

  aiChatCache.set(cacheKey, result, 300); // cache 5 min
  return result;
}

/**
 * Execute searchCities tool: geocode search via OpenWeather API
 */
async function executeSearchCities(query: string): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Weather API not configured' });

  const res = await axios.get(
    `${OPENWEATHER_BASE}/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`,
    { timeout: 5000 }
  );

  return JSON.stringify(
    res.data.map((c: any) => ({
      name: c.name,
      country: c.country,
      state: c.state || '',
      lat: c.lat,
      lon: c.lon,
    }))
  );
}

/**
 * Execute getStockQuote tool: fetch stock price from Finnhub API
 */
async function executeGetStockQuote(symbol: string): Promise<string> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Stock API not configured' });

  const cacheKey = `ai:stock:${symbol.toUpperCase()}`;
  const cached = aiChatCache.get<string>(cacheKey);
  if (cached) return cached;

  const res = await axios.get(
    `${FINNHUB_BASE}/api/v1/quote?symbol=${encodeURIComponent(symbol.toUpperCase())}`,
    { headers: { 'X-Finnhub-Token': apiKey }, timeout: 5000 }
  );

  const result = JSON.stringify({
    symbol: symbol.toUpperCase(),
    price: res.data.c,
    change: res.data.d,
    changePercent: res.data.dp,
    high: res.data.h,
    low: res.data.l,
    open: res.data.o,
    previousClose: res.data.pc,
  });

  aiChatCache.set(cacheKey, result, 60); // cache 1 min
  return result;
}

/**
 * Execute getCryptoPrices tool: fetch top crypto prices from CoinGecko
 */
async function executeGetCryptoPrices(): Promise<string> {
  const cacheKey = 'ai:crypto';
  const cached = aiChatCache.get<string>(cacheKey);
  if (cached) return cached;

  const ids = 'bitcoin,ethereum,solana,cardano,dogecoin';
  const res = await axios.get(
    `${COINGECKO_BASE}/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`,
    { timeout: 5000 }
  );

  const result = JSON.stringify(
    res.data.map((c: any) => ({
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      change24h: c.price_change_percentage_24h?.toFixed(2) + '%',
      marketCap: c.market_cap,
    }))
  );

  aiChatCache.set(cacheKey, result, 120); // cache 2 min
  return result;
}

export const podcastProxy = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 10,
    memory: '256MiB',
    timeoutSeconds: 30,
    secrets: ['PODCASTINDEX_API_KEY', 'PODCASTINDEX_API_SECRET'],
  },
  async (req: Request, res: Response) => {
    const apiKey = process.env.PODCASTINDEX_API_KEY;
    const apiSecret = process.env.PODCASTINDEX_API_SECRET;
    if (!apiKey || !apiSecret) {
      res.status(500).json({ error: 'PodcastIndex API credentials not configured' });
      return;
    }

    // Rate limit: 60 req/min per IP
    const podcastIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(podcastIp, 60, 60)) {
      res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
      return;
    }

    const path = req.path.replace(/^\/podcast\//, '');
    const baseUrl = `${PODCASTINDEX_BASE}/api/1.0`;
    let url: string;
    let cacheKey: string;
    let cacheTTL: number;

    switch (path) {
      case 'search': {
        const q = req.query.q as string;
        if (!q) { res.status(400).json({ error: 'q parameter required' }); return; }
        url = `${baseUrl}/search/byterm?q=${encodeURIComponent(q)}`;
        cacheKey = `podcast:search:${q}`;
        cacheTTL = 300; // 5 min
        break;
      }
      case 'trending': {
        url = `${baseUrl}/podcasts/trending?max=20`;
        cacheKey = 'podcast:trending';
        cacheTTL = 3600; // 1 hr
        break;
      }
      case 'episodes': {
        const feedId = req.query.feedId as string;
        if (!feedId) { res.status(400).json({ error: 'feedId parameter required' }); return; }
        url = `${baseUrl}/episodes/byfeedid?id=${encodeURIComponent(feedId)}&max=20`;
        cacheKey = `podcast:episodes:${feedId}`;
        cacheTTL = 600; // 10 min
        break;
      }
      default:
        res.status(404).json({ error: `Unknown podcast route: ${path}` });
        return;
    }

    // Check cache
    const cached = podcastCache.get<any>(cacheKey);
    if (cached) {
      res.status(200).json(cached);
      return;
    }

    try {
      const headers = getPodcastIndexHeaders(apiKey, apiSecret);
      const response = await axios.get(url, { headers, timeout: 10000 });
      // Normalize categories from object to string (PodcastIndex returns { 55: "News" })
      const data = response.data;
      if (data?.feeds) {
        data.feeds = data.feeds.map((feed: any) => ({
          ...feed,
          categories: feed.categories && typeof feed.categories === 'object'
            ? Object.values(feed.categories).join(', ')
            : feed.categories ?? null,
        }));
      }
      podcastCache.set(cacheKey, data, cacheTTL);
      res.status(200).json(data);
    } catch (err: any) {
      logger.error('Podcast proxy error', { path, error: err.message });
      res.status(err.response?.status || 500).json({
        error: err.response?.data?.description || err.message || 'Failed to fetch podcast data',
      });
    }
  }
);

// ─── Baby Photos — Firebase Storage upload/delete via Cloud Function ───
const babyPhotoUploadSchema = z.object({
  stageId: z.number().int().min(1).max(10),
  imageBase64: z.string().min(1),
  caption: z.string().max(500).optional(),
});

const babyPhotoDeleteSchema = z.object({
  stageId: z.number().int().min(1).max(10),
});

// ─── Cloud Files — Upload, Share & Delete via Cloud Function ───────

const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf', 'text/plain', 'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const cloudFileUploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  fileBase64: z.string().min(1),
  contentType: z.string().min(1),
});

const cloudFileShareSchema = z.object({
  fileId: z.string().min(1),
});

const cloudFileDeleteSchema = z.object({
  fileId: z.string().min(1),
});

export const cloudFiles = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    // Require auth
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 20 req/min per IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(clientIp, 20, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const path = req.path.replace(/^\/cloud-files\/?/, '').replace(/^\/+/, '');

    if (path === 'upload' && req.method === 'POST') {
      const parsed = cloudFileUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileName, fileBase64, contentType } = parsed.data;

      if (!ALLOWED_FILE_TYPES.has(contentType)) {
        res.status(400).json({ error: 'Unsupported file type' });
        return;
      }

      const buffer = Buffer.from(fileBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'File too large (max 5MB)' });
        return;
      }

      try {
        const bucket = getStorage().bucket();
        const fileId = crypto.randomUUID();
        const filePath = `users/${uid}/files/${fileId}/${fileName}`;
        const file = bucket.file(filePath);

        const downloadToken = crypto.randomUUID();
        await file.save(buffer, {
          contentType,
          metadata: {
            cacheControl: 'public, max-age=31536000',
            metadata: { firebaseStorageDownloadTokens: downloadToken },
          },
        });

        const bucketName = bucket.name;
        const encodedPath = encodeURIComponent(filePath);
        const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        const dbAdmin = getFirestore();
        await dbAdmin.doc(`users/${uid}/files/${fileId}`).set({
          fileName,
          contentType,
          size: buffer.length,
          downloadUrl,
          storagePath: filePath,
          uploadedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Cloud file uploaded', { uid, fileId, fileName });
        res.status(200).json({ fileId, downloadUrl });
      } catch (err: any) {
        logger.error('Cloud file upload error', { uid, error: err.message });
        res.status(500).json({ error: 'Upload failed' });
      }

    } else if (path === 'share' && req.method === 'POST') {
      const parsed = cloudFileShareSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const fileDoc = await dbAdmin.doc(`users/${uid}/files/${fileId}`).get();
        if (!fileDoc.exists) {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        const fileData = fileDoc.data()!;

        // Copy storage object to shared-files path
        const bucket = getStorage().bucket();
        const srcFile = bucket.file(fileData.storagePath);
        const destPath = `shared-files/${fileId}/${fileData.fileName}`;
        const downloadToken = crypto.randomUUID();

        await srcFile.copy(bucket.file(destPath));
        // Set download token on the copied file
        const destFile = bucket.file(destPath);
        await destFile.setMetadata({
          metadata: { firebaseStorageDownloadTokens: downloadToken },
        });

        const bucketName = bucket.name;
        const encodedPath = encodeURIComponent(destPath);
        const sharedDownloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        // Get user display name
        const userRecord = await getAuth().getUser(uid);
        const displayName = userRecord.displayName || userRecord.email || 'Anonymous';

        await dbAdmin.doc(`sharedFiles/${fileId}`).set({
          fileName: fileData.fileName,
          contentType: fileData.contentType,
          size: fileData.size,
          downloadUrl: sharedDownloadUrl,
          storagePath: destPath,
          sharedBy: { uid, displayName },
          sharedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Cloud file shared', { uid, fileId });
        res.status(200).json({ ok: true, downloadUrl: sharedDownloadUrl });
      } catch (err: any) {
        logger.error('Cloud file share error', { uid, error: err.message });
        res.status(500).json({ error: 'Share failed' });
      }

    } else if (path === 'delete' && req.method === 'POST') {
      const parsed = cloudFileDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const fileDoc = await dbAdmin.doc(`users/${uid}/files/${fileId}`).get();
        if (!fileDoc.exists) {
          res.status(404).json({ error: 'File not found' });
          return;
        }
        const fileData = fileDoc.data()!;

        const bucket = getStorage().bucket();
        try {
          await bucket.file(fileData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        await dbAdmin.doc(`users/${uid}/files/${fileId}`).delete();

        logger.info('Cloud file deleted', { uid, fileId });
        res.status(200).json({ ok: true });
      } catch (err: any) {
        logger.error('Cloud file delete error', { uid, error: err.message });
        res.status(500).json({ error: 'Delete failed' });
      }

    } else if (path === 'delete-shared' && req.method === 'POST') {
      const parsed = cloudFileDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { fileId } = parsed.data;

      try {
        const dbAdmin = getFirestore();
        const sharedDoc = await dbAdmin.doc(`sharedFiles/${fileId}`).get();
        if (!sharedDoc.exists) {
          res.status(404).json({ error: 'Shared file not found' });
          return;
        }
        const sharedData = sharedDoc.data()!;

        // Only the original sharer can delete
        if (sharedData.sharedBy?.uid !== uid) {
          res.status(403).json({ error: 'Only the original sharer can delete this file' });
          return;
        }

        const bucket = getStorage().bucket();
        try {
          await bucket.file(sharedData.storagePath).delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        await dbAdmin.doc(`sharedFiles/${fileId}`).delete();

        logger.info('Shared file deleted', { uid, fileId });
        res.status(200).json({ ok: true });
      } catch (err: any) {
        logger.error('Shared file delete error', { uid, error: err.message });
        res.status(500).json({ error: 'Delete failed' });
      }

    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
);

// ─── Baby Photos — Firebase Storage upload/delete via Cloud Function ───
export const babyPhotos = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (req: Request, res: Response) => {
    // Require auth
    const uid = await verifyAuthToken(req);
    if (!uid) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Rate limit: 10 req/min per IP
    const clientIp = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
    if (checkRateLimit(clientIp, 10, 60)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const path = req.path.replace(/^\/baby-photos\/?/, '').replace(/^\/+/, '');

    if (path === 'upload' && req.method === 'POST') {
      const parsed = babyPhotoUploadSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { stageId, imageBase64, caption } = parsed.data;

      // Decode base64 to buffer
      const buffer = Buffer.from(imageBase64, 'base64');
      if (buffer.length > 5 * 1024 * 1024) {
        res.status(400).json({ error: 'Image too large (max 5MB)' });
        return;
      }

      try {
        const bucket = getStorage().bucket();
        const filePath = `users/${uid}/baby-photos/${stageId}.jpg`;
        const file = bucket.file(filePath);

        const downloadToken = crypto.randomUUID();
        await file.save(buffer, {
          contentType: 'image/jpeg',
          metadata: {
            cacheControl: 'public, max-age=31536000',
            metadata: { firebaseStorageDownloadTokens: downloadToken },
          },
        });

        // Build Firebase Storage download URL (no IAM signBlob permission needed)
        const bucketName = bucket.name;
        const encodedPath = encodeURIComponent(filePath);
        const photoUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`;

        // Write metadata to Firestore
        const db = getFirestore();
        await db.doc(`users/${uid}/babyMilestones/${stageId}`).set({
          photoUrl,
          caption: caption || null,
          uploadedAt: FieldValue.serverTimestamp(),
        });

        logger.info('Baby photo uploaded', { uid, stageId });
        res.status(200).json({ photoUrl });
      } catch (err: any) {
        logger.error('Baby photo upload error', { uid, stageId, error: err.message });
        res.status(500).json({ error: 'Upload failed' });
      }

    } else if (path === 'delete' && req.method === 'POST') {
      const parsed = babyPhotoDeleteSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }
      const { stageId } = parsed.data;

      try {
        const bucket = getStorage().bucket();
        const file = bucket.file(`users/${uid}/baby-photos/${stageId}.jpg`);
        try {
          await file.delete();
        } catch (e: any) {
          if (e.code !== 404) throw e;
        }

        const db = getFirestore();
        await db.doc(`users/${uid}/babyMilestones/${stageId}`).delete();

        logger.info('Baby photo deleted', { uid, stageId });
        res.status(200).json({ ok: true });
      } catch (err: any) {
        logger.error('Baby photo delete error', { uid, stageId, error: err.message });
        res.status(500).json({ error: 'Delete failed' });
      }

    } else {
      res.status(404).json({ error: 'Not found' });
    }
  }
);
