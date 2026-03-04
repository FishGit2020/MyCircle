import type { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';
import NodeCache from 'node-cache';
import { z } from 'zod';
import type { FunctionDeclaration } from '@google/genai';
import type OpenAI from 'openai';
import { verifyRecaptchaToken } from './recaptcha.js';

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';

// Shared cache for tool results
export const aiChatCache = new NodeCache();

// ─── Zod Schema ──────────────────────────────────────────────────────
export const aiChatBodySchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
  })).optional(),
  context: z.record(z.unknown()).optional(),
  model: z.string().max(100).optional(),
});

// ─── Auth helper ─────────────────────────────────────────────────────
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

// ─── Rate limiter ────────────────────────────────────────────────────
const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 30 });

export function checkRateLimit(ip: string, limit: number, windowSec: number): boolean {
  const key = `rate:${ip}:${windowSec}`;
  const current = rateLimitCache.get<number>(key) || 0;
  if (current >= limit) return true;
  rateLimitCache.set(key, current + 1, windowSec);
  return false;
}

// ─── Per-user Ollama endpoint ────────────────────────────────────────
export interface OllamaEndpoint {
  id: string;
  url: string;
  name: string;
  cfAccessClientId?: string;
  cfAccessClientSecret?: string;
}

export async function getUserOllamaEndpoint(uid: string, endpointId?: string): Promise<OllamaEndpoint | null> {
  const db = getFirestore();
  if (endpointId) {
    const doc = await db.doc(`users/${uid}/benchmarkEndpoints/${endpointId}`).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return { id: doc.id, url: d.url, name: d.name, cfAccessClientId: d.cfAccessClientId || undefined, cfAccessClientSecret: d.cfAccessClientSecret || undefined };
  }
  const snap = await db.collection(`users/${uid}/benchmarkEndpoints`).orderBy('createdAt').limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const d = doc.data();
  return { id: doc.id, url: d.url, name: d.name, cfAccessClientId: d.cfAccessClientId || undefined, cfAccessClientSecret: d.cfAccessClientSecret || undefined };
}

// ─── Request validation (auth + rate limit + recaptcha + zod) ────────
export interface ValidatedRequest {
  uid: string;
  message: string;
  history?: Array<{ role: string; content: string }>;
  context?: Record<string, unknown>;
  model?: string;
  endpointId?: string;
  toolMode?: string;
}

export async function validateAiChatRequest(req: Request, res: Response): Promise<ValidatedRequest | null> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return null;
  }

  const uid = await verifyAuthToken(req);
  if (!uid) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }

  const ip = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
  if (checkRateLimit(ip, 10, 60)) {
    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    return null;
  }

  const recaptchaToken = req.headers['x-recaptcha-token'] as string;
  if (recaptchaToken) {
    const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;
    if (recaptchaSecret) {
      const result = await verifyRecaptchaToken(recaptchaToken, recaptchaSecret);
      if (!result.valid) {
        res.status(403).json({ error: result.reason || 'reCAPTCHA verification failed' });
        return null;
      }
    }
  }

  const parseResult = aiChatBodySchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors });
    return null;
  }

  const { message, history, context, model } = parseResult.data;
  return {
    uid,
    message,
    history,
    context,
    model,
    endpointId: req.body.endpointId as string | undefined,
    toolMode: req.body.toolMode as string | undefined,
  };
}

// ─── System instruction builder ──────────────────────────────────────
export function buildSystemInstruction(context?: Record<string, unknown>): string {
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

  return systemInstruction;
}

// ─── Tool definitions (OpenAI format) ────────────────────────────────
export const ollamaTools: OpenAI.ChatCompletionTool[] = [
  { type: 'function', function: { name: 'getWeather', description: 'Get current weather for a city.', parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] } } },
  { type: 'function', function: { name: 'searchCities', description: 'Search for cities by name.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] } } },
  { type: 'function', function: { name: 'getStockQuote', description: 'Get stock price for a symbol.', parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Stock ticker' } }, required: ['symbol'] } } },
  { type: 'function', function: { name: 'getCryptoPrices', description: 'Get crypto prices.', parameters: { type: 'object', properties: {} } } },
  { type: 'function', function: { name: 'navigateTo', description: 'Navigate to a page.', parameters: { type: 'object', properties: { page: { type: 'string', description: 'Page name' } }, required: ['page'] } } },
];

// ─── Gemini tool declarations ────────────────────────────────────────
export function buildGeminiToolDeclarations(Type: any): { functionDeclarations: FunctionDeclaration[] }[] {
  const getWeatherDecl: FunctionDeclaration = {
    name: 'getWeather',
    description: 'Get current weather for a city. Returns temperature, conditions, humidity, and wind.',
    parameters: {
      type: Type.OBJECT,
      properties: { city: { type: Type.STRING, description: 'City name (e.g., "Tokyo", "New York")' } },
      required: ['city'],
    },
  };
  const searchCitiesDecl: FunctionDeclaration = {
    name: 'searchCities',
    description: 'Search for cities by name. Returns matching city names with coordinates.',
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING, description: 'Search query for city name' } },
      required: ['query'],
    },
  };
  const getStockQuoteDecl: FunctionDeclaration = {
    name: 'getStockQuote',
    description: 'Get the current stock price and daily change for a stock symbol.',
    parameters: {
      type: Type.OBJECT,
      properties: { symbol: { type: Type.STRING, description: 'Stock ticker symbol (e.g., "AAPL", "GOOGL")' } },
      required: ['symbol'],
    },
  };
  const navigateToDecl: FunctionDeclaration = {
    name: 'navigateTo',
    description: 'Navigate the user to a specific page in the MyCircle app. Available pages: weather (home), stocks, podcasts, weather/compare.',
    parameters: {
      type: Type.OBJECT,
      properties: { page: { type: Type.STRING, description: 'Page to navigate to: "weather", "stocks", "podcasts", "weather/compare"' } },
      required: ['page'],
    },
  };
  const getCryptoPricesDecl: FunctionDeclaration = {
    name: 'getCryptoPrices',
    description: 'Get current prices for major cryptocurrencies (Bitcoin, Ethereum, Solana, etc.) from CoinGecko.',
    parameters: { type: Type.OBJECT, properties: {} },
  };

  return [{ functionDeclarations: [getWeatherDecl, searchCitiesDecl, getStockQuoteDecl, navigateToDecl, getCryptoPricesDecl] }];
}

// ─── Tool execution ──────────────────────────────────────────────────
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  if (name === 'getWeather') return await executeGetWeather(args.city as string);
  if (name === 'searchCities') return await executeSearchCities(args.query as string);
  if (name === 'getStockQuote') return await executeGetStockQuote(args.symbol as string);
  if (name === 'getCryptoPrices') return await executeGetCryptoPrices();
  if (name === 'navigateTo') return JSON.stringify({ navigateTo: args.page });
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

async function executeGetWeather(city: string): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Weather API not configured' });

  const cacheKey = `ai:weather:${city.toLowerCase()}`;
  const cached = aiChatCache.get<string>(cacheKey);
  if (cached) return cached;

  const geoRes = await axios.get(
    `${OPENWEATHER_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`,
    { timeout: 5000 }
  );

  if (!geoRes.data || geoRes.data.length === 0) {
    return JSON.stringify({ error: `City "${city}" not found` });
  }

  const { lat, lon, name, country } = geoRes.data[0];

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

  aiChatCache.set(cacheKey, result, 300);
  return result;
}

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

  aiChatCache.set(cacheKey, result, 60);
  return result;
}

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

  aiChatCache.set(cacheKey, result, 120);
  return result;
}

// ─── Ollama client builder ───────────────────────────────────────────
export async function buildOllamaClient(endpoint: OllamaEndpoint) {
  const { default: OpenAI } = await import('openai');
  const cfHeaders: Record<string, string> = {};
  if (endpoint.cfAccessClientId) cfHeaders['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
  if (endpoint.cfAccessClientSecret) cfHeaders['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;
  return new OpenAI({
    baseURL: `${endpoint.url}/v1`,
    apiKey: 'ollama',
    defaultHeaders: cfHeaders,
  });
}
