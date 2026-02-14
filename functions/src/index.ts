import { onRequest, onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAppCheck } from 'firebase-admin/app-check';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { z } from 'zod';
import type { FunctionDeclaration } from '@google/genai';
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

// ─── CORS origins whitelist ─────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://mycircle-app.web.app',
  'https://mycircle-app.firebaseapp.com',
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
    secrets: ['OPENWEATHER_API_KEY', 'FINNHUB_API_KEY', 'PODCASTINDEX_API_KEY', 'PODCASTINDEX_API_SECRET', 'YOUVERSION_APP_KEY']
  },
  async (req: Request, res: Response) => {
    const server = await getServer();

    // App Check: verify request comes from our app (bot protection)
    const appCheckToken = req.headers['x-firebase-appcheck'] as string;
    if (appCheckToken) {
      try {
        await getAppCheck().verifyToken(appCheckToken);
      } catch (err) {
        logger.warn('App Check verification failed', { error: String(err) });
        res.status(403).json({
          errors: [{
            message: 'App Check verification failed',
            extensions: { code: 'UNAUTHENTICATED' }
          }]
        });
        return;
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

    const db = getFirestore();
    const subsRef = db.collection('alertSubscriptions');
    const existing = await subsRef.where('token', '==', token).limit(1).get();

    // Empty cities array = unsubscribe (delete the doc)
    if (cities.length === 0) {
      if (!existing.empty) {
        await existing.docs[0].ref.delete();
      }
      return { success: true, subscribed: false };
    }

    // Upsert: update existing or create new subscription
    if (!existing.empty) {
      await existing.docs[0].ref.update({
        cities,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await subsRef.add({
        token,
        cities,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return { success: true, subscribed: true };
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
    secrets: ['GEMINI_API_KEY', 'OPENWEATHER_API_KEY', 'FINNHUB_API_KEY', 'RECAPTCHA_SECRET_KEY'],
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

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }

    // Validate request body with Zod
    const parseResult = aiChatBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors });
      return;
    }

    const { message, history, context } = parseResult.data;

    try {
      // Dynamically import the Google Gen AI SDK
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });

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

      // Build context-aware system instruction
      let systemInstruction = 'You are MyCircle AI, a helpful assistant for the MyCircle personal dashboard app. You can look up weather, stock quotes, crypto prices, search for cities, and navigate users around the app. Be concise and helpful. When users ask about weather, stocks, or crypto, use the tools to get real data.';

      if (context && typeof context === 'object') {
        const parts: string[] = [];
        if (Array.isArray(context.favoriteCities) && context.favoriteCities.length > 0) {
          parts.push(`Favorite cities: ${(context.favoriteCities as string[]).join(', ')}`);
        }
        if (Array.isArray(context.recentCities) && context.recentCities.length > 0) {
          parts.push(`Recently searched cities: ${(context.recentCities as string[]).join(', ')}`);
        }
        if (Array.isArray(context.stockWatchlist) && context.stockWatchlist.length > 0) {
          parts.push(`Stock watchlist: ${(context.stockWatchlist as string[]).join(', ')}`);
        }
        if (typeof context.podcastSubscriptions === 'number' && context.podcastSubscriptions > 0) {
          parts.push(`Subscribed to ${context.podcastSubscriptions} podcasts`);
        }
        if (context.tempUnit) parts.push(`Preferred temperature unit: ${context.tempUnit === 'F' ? 'Fahrenheit' : 'Celsius'}`);
        if (context.locale) parts.push(`Language: ${context.locale === 'es' ? 'Spanish' : 'English'}`);
        if (context.currentPage) parts.push(`Currently on: ${context.currentPage}`);

        if (parts.length > 0) {
          systemInstruction += '\n\nUser context:\n' + parts.join('\n');
          systemInstruction += '\n\nUse this context to personalize responses. For example, if the user asks "how is the weather?" you can check their favorite or recent cities. If they ask about stocks, reference their watchlist.';
        }
      }

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

          // Execute tool
          try {
            if (fc.name === 'getWeather') {
              result = await executeGetWeather(args.city as string);
            } else if (fc.name === 'searchCities') {
              result = await executeSearchCities(args.query as string);
            } else if (fc.name === 'getStockQuote') {
              result = await executeGetStockQuote(args.symbol as string);
            } else if (fc.name === 'getCryptoPrices') {
              result = await executeGetCryptoPrices();
            } else if (fc.name === 'navigateTo') {
              result = JSON.stringify({ navigateTo: args.page });
            }
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

        // Add the assistant's function call parts and our tool responses
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
