import axios from 'axios';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import type OpenAI from 'openai';
import { logAiChatInteraction } from '../aiChatLogger.js';
import type { AiToolCallTiming } from '../aiChatLogger.js';
import { fetchUscisStatus } from '../uscisApi.js';
import { searchCities, getCurrentWeather } from './weather.js';
import { getStockQuote } from './stocks.js';
import { getCryptoPrices } from './crypto.js';
import { searchPodcastsAPI } from './podcasts.js';
import { getYouVersionPassage, DEFAULT_YOUVERSION_BIBLE_ID } from './bible.js';

// ─── Zod validation schemas for GraphQL mutations ────────────────────
const runBenchmarkSchema = z.object({
  endpointId: z.string().min(1).max(200),
  model: z.string().min(1).max(100),
  prompt: z.string().min(1).max(10000),
});

const saveBenchmarkEndpointSchema = z.object({
  url: z.string().url().max(500),
  name: z.string().min(1).max(100),
  cfAccessClientId: z.string().max(200).optional().nullable(),
  cfAccessClientSecret: z.string().max(200).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
});

const idParamSchema = z.object({
  id: z.string().min(1).max(200),
});

const scoreBenchmarkResponseSchema = z.object({
  prompt: z.string().min(1).max(10000),
  response: z.string().min(1).max(50000),
  judgeProvider: z.enum(['gemini', 'ollama']),
  judgeEndpointId: z.string().max(200).optional().nullable(),
  judgeModel: z.string().max(100).optional().nullable(),
});

const aiChatSchema = z.object({
  message: z.string().min(1).max(5000),
  history: z.array(z.object({
    role: z.string(),
    content: z.string().max(10000),
  })).max(100).optional(),
  context: z.record(z.unknown()).optional(),
  model: z.string().max(100).optional(),
  endpointId: z.string().max(200).optional(),
});

// ─── Per-user Ollama endpoint helpers ──────────────────────
interface OllamaEndpoint {
  id: string;
  url: string;
  name: string;
  cfAccessClientId?: string;
  cfAccessClientSecret?: string;
}

async function getUserOllamaEndpoints(uid: string): Promise<OllamaEndpoint[]> {
  const db = getFirestore();
  const snap = await db.collection(`users/${uid}/benchmarkEndpoints`).orderBy('createdAt').get();
  return snap.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      url: d.url,
      name: d.name,
      cfAccessClientId: d.cfAccessClientId || undefined,
      cfAccessClientSecret: d.cfAccessClientSecret || undefined,
    };
  });
}

async function getUserOllamaEndpoint(uid: string, endpointId?: string): Promise<OllamaEndpoint | null> {
  const db = getFirestore();
  if (endpointId) {
    const doc = await db.doc(`users/${uid}/benchmarkEndpoints/${endpointId}`).get();
    if (!doc.exists) return null;
    const d = doc.data()!;
    return { id: doc.id, url: d.url, name: d.name, cfAccessClientId: d.cfAccessClientId || undefined, cfAccessClientSecret: d.cfAccessClientSecret || undefined };
  }
  const endpoints = await getUserOllamaEndpoints(uid);
  return endpoints[0] || null;
}

function buildEndpointHeaders(endpoint: OllamaEndpoint): Record<string, string> {
  const headers: Record<string, string> = {};
  if (endpoint.cfAccessClientId) headers['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
  if (endpoint.cfAccessClientSecret) headers['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;
  return headers;
}

// ─── AI Mutation Resolvers ────────────────────────────────────

export function createAiMutationResolvers(
  getApiKey: () => string,
  getFinnhubKey?: () => string,
  getPodcastKeys?: () => { apiKey: string; apiSecret: string },
  getYouVersionKey?: () => string,
) {
  return {
    runBenchmark: async (_: any, args: { endpointId: string; model: string; prompt: string }, ctx: any) => {
      const { endpointId, model, prompt } = runBenchmarkSchema.parse(args);
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      const endpointDoc = await db.doc(`users/${uid}/benchmarkEndpoints/${endpointId}`).get();
      if (!endpointDoc.exists) throw new Error('Endpoint not found');
      const endpoint = endpointDoc.data()!;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (endpoint.cfAccessClientId) headers['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
      if (endpoint.cfAccessClientSecret) headers['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;

      try {
        const response = await axios.post(`${endpoint.url}/api/generate`, {
          model, prompt, stream: false,
        }, { headers, timeout: 300000 });

        const d = response.data;
        const evalDurationSec = (d.eval_duration || 1) / 1e9;
        const promptEvalDurationSec = (d.prompt_eval_duration || 1) / 1e9;
        const timing = {
          totalDuration: (d.total_duration || 0) / 1e9,
          loadDuration: (d.load_duration || 0) / 1e9,
          promptEvalCount: d.prompt_eval_count || 0,
          promptEvalDuration: promptEvalDurationSec,
          evalCount: d.eval_count || 0,
          evalDuration: evalDurationSec,
          tokensPerSecond: (d.eval_count || 0) / evalDurationSec,
          promptTokensPerSecond: (d.prompt_eval_count || 0) / promptEvalDurationSec,
          timeToFirstToken: ((d.prompt_eval_duration || 0) + (d.load_duration || 0)) / 1e9,
        };

        return {
          endpointId, endpointName: endpoint.name, model, prompt,
          response: d.response || '', timing, error: null,
          timestamp: new Date().toISOString(),
        };
      } catch (err: any) {
        return {
          endpointId, endpointName: endpoint.name, model, prompt,
          response: '', timing: null, error: err.message || 'Benchmark failed',
          timestamp: new Date().toISOString(),
        };
      }
    },

    saveBenchmarkEndpoint: async (_: any, { input }: { input: { url: string; name: string; cfAccessClientId?: string; cfAccessClientSecret?: string; source?: string } }, ctx: any) => {
      const validated = saveBenchmarkEndpointSchema.parse(input);
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      const ref = db.collection(`users/${uid}/benchmarkEndpoints`).doc();
      const data = {
        url: validated.url, name: validated.name,
        cfAccessClientId: validated.cfAccessClientId || null,
        cfAccessClientSecret: validated.cfAccessClientSecret || null,
        source: validated.source || 'benchmark',
        createdAt: new Date().toISOString(),
      };
      await ref.set(data);
      return { id: ref.id, url: validated.url, name: validated.name, hasCfAccess: !!(validated.cfAccessClientId && validated.cfAccessClientSecret), source: data.source };
    },

    deleteBenchmarkEndpoint: async (_: any, args: { id: string }, ctx: any) => {
      const { id } = idParamSchema.parse(args);
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      await db.doc(`users/${uid}/benchmarkEndpoints/${id}`).delete();
      return true;
    },

    scoreBenchmarkResponse: async (_: any, args: { prompt: string; response: string; judgeProvider: string; judgeEndpointId?: string; judgeModel?: string }, ctx: any) => {
      const { prompt, response, judgeProvider, judgeEndpointId, judgeModel } = scoreBenchmarkResponseSchema.parse(args);
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');

      const scoringPrompt = `Rate the following AI response on a scale of 1-10 for accuracy, relevance, completeness, and clarity.

Question: ${prompt}

Response: ${response}

Return ONLY valid JSON with no other text: {"score": <number 1-10>, "feedback": "<brief explanation>"}`;

      try {
        if (judgeProvider === 'gemini') {
          const geminiKey = process.env.GEMINI_API_KEY;
          if (!geminiKey) throw new Error('Gemini API key not configured');
          const { GoogleGenAI } = await import('@google/genai');
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: scoringPrompt }] }],
          });
          const text = result.text ?? '';
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (!jsonMatch) return { score: 0, feedback: 'Failed to parse judge response', judge: 'gemini-2.5-flash' };
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            score: Math.max(1, Math.min(10, Number(parsed.score) || 0)),
            feedback: String(parsed.feedback || '').slice(0, 500),
            judge: 'gemini-2.5-flash',
          };
        }

        // Ollama judge path
        if (!judgeEndpointId || !judgeModel) throw new Error('Ollama judge requires endpointId and model');
        const db = getFirestore();
        const endpointDoc = await db.doc(`users/${uid}/benchmarkEndpoints/${judgeEndpointId}`).get();
        if (!endpointDoc.exists) throw new Error('Judge endpoint not found');
        const endpoint = endpointDoc.data()!;

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (endpoint.cfAccessClientId) headers['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
        if (endpoint.cfAccessClientSecret) headers['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;

        const ollamaRes = await axios.post(`${endpoint.url}/api/generate`, {
          model: judgeModel, prompt: scoringPrompt, stream: false,
        }, { headers, timeout: 120000 });

        const text = ollamaRes.data?.response || '';
        const jsonMatch = text.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) return { score: 0, feedback: 'Failed to parse judge response', judge: judgeModel };
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.max(1, Math.min(10, Number(parsed.score) || 0)),
          feedback: String(parsed.feedback || '').slice(0, 500),
          judge: `${endpoint.name}/${judgeModel}`,
        };
      } catch (err: any) {
        return { score: 0, feedback: `Scoring failed: ${err.message}`, judge: judgeProvider === 'gemini' ? 'gemini-2.5-flash' : (judgeModel || 'unknown') };
      }
    },

    saveBenchmarkRun: async (_: any, { results }: { results: any }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      const ref = db.collection(`users/${uid}/benchmarkRuns`).doc();
      const data = { userId: uid, results, createdAt: new Date().toISOString() };
      await ref.set(data);
      return { id: ref.id, ...data };
    },

    deleteBenchmarkRun: async (_: any, args: { id: string }, ctx: any) => {
      const { id } = idParamSchema.parse(args);
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      await db.doc(`users/${uid}/benchmarkRuns/${id}`).delete();
      return true;
    },

    aiChat: async (_: any, args: {
      message: string;
      history?: { role: string; content: string }[];
      context?: Record<string, unknown>;
      model?: string;
      endpointId?: string;
      toolMode?: string;
      systemPrompt?: string;
    }, ctx: any) => {
      const { message, history, context, model, endpointId } = aiChatSchema.parse(args);
      const useMcp = args.toolMode === 'mcp';
      const customSystemPrompt = typeof args.systemPrompt === 'string' ? args.systemPrompt : null;
      const uid = ctx?.uid;
      const startTime = Date.now();
      let inputTokens = 0;
      let outputTokens = 0;
      const toolCallTimings: AiToolCallTiming[] = [];
      let trackedProvider = '';
      let trackedModel = '';

      const endpoint = uid ? await getUserOllamaEndpoint(uid, endpointId || undefined) : null;
      const ollamaBaseUrl = endpoint?.url || '';
      const ollamaModel = model || '';
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!ollamaBaseUrl && !geminiKey) throw new Error('No AI provider configured — add an Ollama endpoint in Settings or contact admin for Gemini');
      if (ollamaBaseUrl && !ollamaModel) throw new Error('Model is required — select a model before chatting');

      const apiKey = getApiKey();
      const finnhubKey = getFinnhubKey?.() || '';

      // Build context-aware system instruction
      let systemInstruction = customSystemPrompt || 'You are MyCircle AI, a helpful assistant for the MyCircle personal dashboard app. You can look up weather, stock quotes, crypto prices, search for cities, search podcasts, look up Bible verses, manage flashcards, check USCIS case status, create notes, log work entries, set baby due dates, record child milestones, add immigration cases, and navigate users to any page. Be concise and helpful. When users ask about weather, stocks, crypto, or immigration cases, use the tools to get real data. For notes, work entries, baby info, milestones, and immigration tracking, use the frontend action tools.';

      if (!customSystemPrompt && context && typeof context === 'object') {
        const ctxParts: string[] = [];
        if (Array.isArray(context.favoriteCities) && context.favoriteCities.length > 0) ctxParts.push(`Favorite cities: ${(context.favoriteCities as string[]).join(', ')}`);
        if (Array.isArray(context.recentCities) && context.recentCities.length > 0) ctxParts.push(`Recently searched cities: ${(context.recentCities as string[]).join(', ')}`);
        if (Array.isArray(context.stockWatchlist) && context.stockWatchlist.length > 0) ctxParts.push(`Stock watchlist: ${(context.stockWatchlist as string[]).join(', ')}`);
        if (typeof context.podcastSubscriptions === 'number' && context.podcastSubscriptions > 0) ctxParts.push(`Subscribed to ${context.podcastSubscriptions} podcasts`);
        if (context.babyDueDate) ctxParts.push(`Baby due date: ${context.babyDueDate}`);
        if (context.childName) {
          let childInfo = `Child's name: ${context.childName}`;
          if (context.childBirthDate) childInfo += ` (born ${context.childBirthDate})`;
          ctxParts.push(childInfo);
        }
        if (typeof context.childMilestonesCount === 'number' && context.childMilestonesCount > 0) ctxParts.push(`${context.childMilestonesCount} child milestones recorded`);
        if (typeof context.worshipFavoritesCount === 'number' && context.worshipFavoritesCount > 0) ctxParts.push(`${context.worshipFavoritesCount} favorite worship songs`);
        if (typeof context.cloudFilesCount === 'number' && context.cloudFilesCount > 0) ctxParts.push(`${context.cloudFilesCount} cloud files uploaded`);
        if (typeof context.immigrationCasesCount === 'number' && context.immigrationCasesCount > 0) ctxParts.push(`Tracking ${context.immigrationCasesCount} immigration cases`);
        if (typeof context.workEntriesCount === 'number' && context.workEntriesCount > 0) ctxParts.push(`${context.workEntriesCount} work entries logged`);
        if (context.tempUnit) ctxParts.push(`Preferred temperature unit: ${context.tempUnit === 'F' ? 'Fahrenheit' : 'Celsius'}`);
        if (context.locale) ctxParts.push(`Language: ${context.locale === 'es' ? 'Spanish' : context.locale === 'zh' ? 'Chinese' : 'English'}`);
        if (context.currentPage) ctxParts.push(`Currently on: ${context.currentPage}`);
        if (ctxParts.length > 0) {
          systemInstruction += '\n\nUser context:\n' + ctxParts.join('\n');
          systemInstruction += '\n\nUse this context to personalize responses.';
        }
      }

      /** Frontend action tools — their args become actions dispatched to the client */
      const FRONTEND_ACTIONS = new Set([
        'navigateTo', 'addFlashcard', 'addBookmark', 'listFlashcards',
        'addNote', 'addDailyLogEntry', 'setBabyDueDate', 'addChildMilestone', 'addImmigrationCase',
      ]);

      function extractActions(toolCalls: Array<{ name: string; args: Record<string, unknown> }>) {
        const actions = toolCalls
          .filter(tc => FRONTEND_ACTIONS.has(tc.name))
          .map(tc => ({ type: tc.name, payload: tc.args }));
        return actions.length > 0 ? actions : null;
      }

      /** Execute a tool by name — reuses existing cached helpers instead of raw HTTP calls */
      async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
        if (name === 'getWeather') {
          const city = args.city as string;
          const cities = await searchCities(apiKey, city, 1);
          if (!cities.length) return JSON.stringify({ error: `City not found: ${city}` });
          const { lat, lon } = cities[0];
          const w = await getCurrentWeather(apiKey, lat, lon);
          return JSON.stringify({ city, temp: w.temp, feels_like: w.feels_like, humidity: w.humidity, description: w.weather?.[0]?.description, wind: w.wind?.speed });
        }
        if (name === 'searchCities') {
          const cities = await searchCities(apiKey, args.query as string, 5);
          return JSON.stringify(cities.map(c => ({ name: c.name, country: c.country, state: c.state, lat: c.lat, lon: c.lon })));
        }
        if (name === 'getStockQuote') {
          const q = await getStockQuote(finnhubKey, args.symbol as string);
          return JSON.stringify({ symbol: args.symbol, price: q.c, change: q.d, changePercent: q.dp, high: q.h, low: q.l });
        }
        if (name === 'getCryptoPrices') {
          const prices = await getCryptoPrices(['bitcoin', 'ethereum', 'solana'], 'usd');
          return JSON.stringify(prices.map((c: any) => ({ id: c.id, name: c.name, price: c.current_price, change24h: c.price_change_percentage_24h })));
        }
        if (name === 'navigateTo') return JSON.stringify({ navigateTo: args.page });
        if (name === 'checkCaseStatus') {
          const rn = (args.receiptNumber as string || '').trim().toUpperCase();
          if (!/^[A-Z]{3}\d{10}$/.test(rn)) return JSON.stringify({ error: 'Invalid receipt number format. Expected 3 letters + 10 digits (e.g., MSC2190012345).' });
          const result = await fetchUscisStatus(rn);
          return JSON.stringify(result);
        }
        if (name === 'addNote') return JSON.stringify({ action: 'addNote', title: args.title, content: args.content });
        if (name === 'addDailyLogEntry') return JSON.stringify({ action: 'addDailyLogEntry', date: args.date, content: args.content });
        if (name === 'setBabyDueDate') return JSON.stringify({ action: 'setBabyDueDate', dueDate: args.dueDate });
        if (name === 'addChildMilestone') return JSON.stringify({ action: 'addChildMilestone', milestone: args.milestone, date: args.date });
        if (name === 'addImmigrationCase') return JSON.stringify({ action: 'addImmigrationCase', receiptNumber: args.receiptNumber, formType: args.formType, nickname: args.nickname });
        if (name === 'addFlashcard') return JSON.stringify({ success: true, message: 'Flashcard will be added' });
        if (name === 'getBibleVerse') {
          try {
            const yvKey = getYouVersionKey?.();
            if (!yvKey) return JSON.stringify({ error: 'YOUVERSION_APP_KEY not configured' });
            const parsed = args.translation ? parseInt(args.translation as string, 10) : NaN;
            const bibleId = isNaN(parsed) ? DEFAULT_YOUVERSION_BIBLE_ID : parsed;
            const passage = await getYouVersionPassage(bibleId, args.reference as string, yvKey);
            return JSON.stringify(passage);
          } catch (err: any) {
            return JSON.stringify({ error: err.message || 'Failed to look up Bible verse' });
          }
        }
        if (name === 'searchPodcasts') {
          try {
            const podKeys = getPodcastKeys?.();
            if (!podKeys) return JSON.stringify({ error: 'PodcastIndex API credentials not configured' });
            const data = await searchPodcastsAPI(podKeys.apiKey, podKeys.apiSecret, args.query as string);
            const feeds = (data.feeds ?? []).slice(0, 5);
            return JSON.stringify({ feeds, count: feeds.length });
          } catch (err: any) {
            return JSON.stringify({ error: err.message || 'Failed to search podcasts' });
          }
        }
        if (name === 'addBookmark') return JSON.stringify({ success: true, message: 'Bookmark will be added' });
        if (name === 'listFlashcards') return JSON.stringify({ message: 'Flashcard list will be retrieved from frontend' });
        return JSON.stringify({ error: `Unknown tool: ${name}` });
      }

      // ─── MCP wrapper (optional) ─────────────────────────
      let mcpClient: Awaited<ReturnType<typeof import('../mcpToolServer.js').createMcpToolClient>> | null = null;

      /** Execute tool — routes through MCP protocol or direct call */
      async function executeToolCall(name: string, args: Record<string, unknown>): Promise<string> {
        if (useMcp) {
          if (!mcpClient) {
            const { createMcpToolClient } = await import('../mcpToolServer.js');
            mcpClient = await createMcpToolClient({ executeTool, tools: ollamaToolDefs });
          }
          return mcpClient.callTool(name, args);
        }
        return executeTool(name, args);
      }

      // Shared tool definitions in OpenAI format (used by Ollama, Gemini, and MCP)
      const ollamaToolDefs = [
          { type: 'function', function: { name: 'getWeather', description: 'Get current weather for a city.', parameters: { type: 'object', properties: { city: { type: 'string', description: 'City name' } }, required: ['city'] } } },
          { type: 'function', function: { name: 'searchCities', description: 'Search for cities by name.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query' } }, required: ['query'] } } },
          { type: 'function', function: { name: 'getStockQuote', description: 'Get stock price for a symbol.', parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Stock ticker' } }, required: ['symbol'] } } },
          { type: 'function', function: { name: 'getCryptoPrices', description: 'Get crypto prices.', parameters: { type: 'object', properties: {} } } },
          { type: 'function', function: { name: 'navigateTo', description: 'Navigate to a page. Pages: weather, stocks, podcasts, compare, bible, worship, notebook, flashcards, baby, child-dev, daily-log, files, benchmark, immigration, ai.', parameters: { type: 'object', properties: { page: { type: 'string', description: 'Page name' } }, required: ['page'] } } },
          { type: 'function', function: { name: 'checkCaseStatus', description: 'Check USCIS immigration case status by receipt number.', parameters: { type: 'object', properties: { receiptNumber: { type: 'string', description: 'USCIS receipt number (e.g., MSC2190012345)' } }, required: ['receiptNumber'] } } },
          { type: 'function', function: { name: 'addNote', description: 'Create a note in the notebook.', parameters: { type: 'object', properties: { title: { type: 'string', description: 'Note title' }, content: { type: 'string', description: 'Note content' } }, required: ['title', 'content'] } } },
          { type: 'function', function: { name: 'addDailyLogEntry', description: 'Add a daily log entry.', parameters: { type: 'object', properties: { date: { type: 'string', description: 'Date (YYYY-MM-DD)' }, content: { type: 'string', description: 'Work description' } }, required: ['date', 'content'] } } },
          { type: 'function', function: { name: 'setBabyDueDate', description: 'Set the baby due date.', parameters: { type: 'object', properties: { dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' } }, required: ['dueDate'] } } },
          { type: 'function', function: { name: 'addChildMilestone', description: 'Record a child development milestone.', parameters: { type: 'object', properties: { milestone: { type: 'string', description: 'Milestone description' }, date: { type: 'string', description: 'Date achieved (YYYY-MM-DD)' } }, required: ['milestone'] } } },
          { type: 'function', function: { name: 'addImmigrationCase', description: 'Add a USCIS case to track.', parameters: { type: 'object', properties: { receiptNumber: { type: 'string', description: 'Receipt number' }, formType: { type: 'string', description: 'Form type (e.g., I-485)' }, nickname: { type: 'string', description: 'Friendly name' } }, required: ['receiptNumber'] } } },
          { type: 'function', function: { name: 'addFlashcard', description: 'Create a new flashcard for the user to study.', parameters: { type: 'object', properties: { front: { type: 'string', description: 'Question or prompt side' }, back: { type: 'string', description: 'Answer side' }, category: { type: 'string', description: 'Category (e.g., custom, bible, chinese)' }, type: { type: 'string', description: 'Card type: custom, bible, chinese, english' } }, required: ['front', 'back'] } } },
          { type: 'function', function: { name: 'getBibleVerse', description: 'Look up a Bible verse or passage. Returns the verse text and reference.', parameters: { type: 'object', properties: { reference: { type: 'string', description: 'Bible reference (e.g., "John 3:16", "Psalm 23:1-6")' }, translation: { type: 'string', description: 'Bible translation/version ID (defaults to NIV)' } }, required: ['reference'] } } },
          { type: 'function', function: { name: 'searchPodcasts', description: 'Search for podcasts by keyword. Returns matching podcast feeds.', parameters: { type: 'object', properties: { query: { type: 'string', description: 'Search query for podcast name or topic' } }, required: ['query'] } } },
          { type: 'function', function: { name: 'addBookmark', description: 'Bookmark a Bible passage for the user.', parameters: { type: 'object', properties: { reference: { type: 'string', description: 'Bible reference to bookmark (e.g., "John 3:16")' } }, required: ['reference'] } } },
          { type: 'function', function: { name: 'listFlashcards', description: "List the user's flashcards, optionally filtered by type.", parameters: { type: 'object', properties: { type: { type: 'string', description: 'Filter by card type: custom, bible, chinese, english' } } } } },
      ] as any[];

      // ─── Ollama path ──────────────────────────────────────
      if (ollamaBaseUrl && endpoint) {
        trackedProvider = 'ollama';
        trackedModel = ollamaModel;
        const { default: OpenAI } = await import('openai');
        const client = new OpenAI({
          baseURL: `${ollamaBaseUrl}/v1`, apiKey: 'ollama',
          defaultHeaders: buildEndpointHeaders(endpoint),
        });

        const ollamaTools = ollamaToolDefs as OpenAI.ChatCompletionTool[];

        const messages: OpenAI.ChatCompletionMessageParam[] = [
          { role: 'system', content: systemInstruction },
        ];
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
          }
        }
        messages.push({ role: 'user', content: message });

        const toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }> = [];

        let completion: OpenAI.ChatCompletion;
        let usedFallback = false;
        try {
          completion = await client.chat.completions.create({ model: ollamaModel, messages, tools: ollamaTools });
          inputTokens += completion.usage?.prompt_tokens || 0;
          outputTokens += completion.usage?.completion_tokens || 0;
        } catch {
          usedFallback = true;
          const toolPrompt = ollamaTools.map(t => {
            const params = (t.function.parameters as Record<string, any>)?.properties || {};
            return `- ${t.function.name}(${Object.keys(params).join(', ')}): ${t.function.description}`;
          }).join('\n');
          const fallbackSystemPrompt = systemInstruction + '\n\nYou have access to these tools:\n' + toolPrompt + '\n\nIf the user\'s request needs a tool, respond with ONLY a JSON object in this exact format (no other text):\n{"name":"toolName","args":{"param":"value"}}\n\nOtherwise, respond normally to the user.';
          const fallbackMessages: OpenAI.ChatCompletionMessageParam[] = [
            { role: 'system', content: fallbackSystemPrompt },
            ...messages.slice(1),
          ];
          completion = await client.chat.completions.create({ model: ollamaModel, messages: fallbackMessages });
          inputTokens += completion.usage?.prompt_tokens || 0;
          outputTokens += completion.usage?.completion_tokens || 0;
        }

        const choice = completion.choices[0];

        if (usedFallback) {
          const text = choice.message.content || '';
          const match = text.match(/<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/)
            || text.match(/```(?:tool_call|json)?\s*(\{[\s\S]*?\})\s*```/)
            || text.match(/(\{"name"\s*:\s*"(?:getWeather|searchCities|getStockQuote|getCryptoPrices|navigateTo|checkCaseStatus|addNote|addDailyLogEntry|setBabyDueDate|addChildMilestone|addImmigrationCase|addFlashcard|getBibleVerse|searchPodcasts|addBookmark|listFlashcards)"[\s\S]*?\})/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]) as { name: string; args: Record<string, unknown> };
              let result = '';
              const toolStart = Date.now();
              try { result = await executeToolCall(parsed.name, parsed.args); }
              catch (err: any) { result = JSON.stringify({ error: err.message }); }
              toolCallTimings.push({ name: parsed.name, durationMs: Date.now() - toolStart });
              toolCalls.push({ name: parsed.name, args: parsed.args, result });
              const followup = await client.chat.completions.create({
                model: ollamaModel,
                messages: [...messages, { role: 'assistant', content: text }, { role: 'user', content: `Tool result for ${parsed.name}: ${result}\n\nPlease provide a helpful response based on this data.` }],
              });
              inputTokens += followup.usage?.prompt_tokens || 0;
              outputTokens += followup.usage?.completion_tokens || 0;
              const answerText = followup.choices[0].message.content || '';
              logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: answerText, status: 'success', usedFallback: true, fullQuestion: message, fullAnswer: answerText, endpointId: endpointId || undefined });
              return { response: answerText, toolCalls, actions: extractActions(toolCalls), toolMode: useMcp ? 'mcp' : 'native' };
            } catch { /* JSON parse failed */ }
          }
          logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: text, status: 'success', usedFallback: true, fullQuestion: message, fullAnswer: text, endpointId: endpointId || undefined });
          return { response: text || 'Sorry, I could not generate a response.', toolCalls: null, actions: null, toolMode: useMcp ? 'mcp' : 'native' };
        }

        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            const args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
            let result = '';
            const toolStart = Date.now();
            try { result = await executeToolCall(tc.function.name, args); }
            catch (err: any) { result = JSON.stringify({ error: err.message }); }
            toolCallTimings.push({ name: tc.function.name, durationMs: Date.now() - toolStart });
            toolCalls.push({ name: tc.function.name, args, result });
          }
          const followupMessages: OpenAI.ChatCompletionMessageParam[] = [
            ...messages, choice.message,
            ...choice.message.tool_calls.map((tc, i) => ({ role: 'tool' as const, tool_call_id: tc.id, content: toolCalls[i].result || '' })),
          ];
          const followup = await client.chat.completions.create({ model: ollamaModel, messages: followupMessages });
          inputTokens += followup.usage?.prompt_tokens || 0;
          outputTokens += followup.usage?.completion_tokens || 0;
          const answerText = followup.choices[0].message.content || 'I found some information but had trouble formatting it.';
          logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: answerText, status: 'success', usedFallback: false, fullQuestion: message, fullAnswer: answerText, endpointId: endpointId || undefined });
          return { response: answerText, toolCalls, actions: extractActions(toolCalls), toolMode: useMcp ? 'mcp' : 'native' };
        }

        const ollamaText = choice.message.content || 'Sorry, I could not generate a response.';
        logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: ollamaText, status: 'success', usedFallback: false, fullQuestion: message, fullAnswer: ollamaText, endpointId: endpointId || undefined });
        return { response: ollamaText, toolCalls: null, actions: null, toolMode: useMcp ? 'mcp' : 'native' };
      }

      // ─── Gemini path ──────────────────────────────────────
      trackedProvider = 'gemini';
      trackedModel = 'gemini-2.5-flash';
      const { GoogleGenAI, Type } = await import('@google/genai');
      type FD = import('@google/genai').FunctionDeclaration;
      const ai = new GoogleGenAI({ apiKey: geminiKey! });
      const functionDeclarations: FD[] = [
        { name: 'getWeather', description: 'Get current weather for a city.', parameters: { type: Type.OBJECT, properties: { city: { type: Type.STRING, description: 'City name' } }, required: ['city'] } },
        { name: 'searchCities', description: 'Search for cities by name.', parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'Search query' } }, required: ['query'] } },
        { name: 'getStockQuote', description: 'Get stock price for a symbol.', parameters: { type: Type.OBJECT, properties: { symbol: { type: Type.STRING, description: 'Stock ticker' } }, required: ['symbol'] } },
        { name: 'getCryptoPrices', description: 'Get crypto prices.', parameters: { type: Type.OBJECT, properties: {} } },
        { name: 'navigateTo', description: 'Navigate to a page. Pages: weather, stocks, podcasts, compare, bible, worship, notebook, flashcards, baby, child-dev, daily-log, files, benchmark, immigration, ai.', parameters: { type: Type.OBJECT, properties: { page: { type: Type.STRING, description: 'Page name' } }, required: ['page'] } },
        { name: 'checkCaseStatus', description: 'Check USCIS immigration case status by receipt number.', parameters: { type: Type.OBJECT, properties: { receiptNumber: { type: Type.STRING, description: 'USCIS receipt number (e.g., MSC2190012345)' } }, required: ['receiptNumber'] } },
        { name: 'addNote', description: 'Create a note in the notebook.', parameters: { type: Type.OBJECT, properties: { title: { type: Type.STRING, description: 'Note title' }, content: { type: Type.STRING, description: 'Note content' } }, required: ['title', 'content'] } },
        { name: 'addDailyLogEntry', description: 'Add a daily log entry.', parameters: { type: Type.OBJECT, properties: { date: { type: Type.STRING, description: 'Date (YYYY-MM-DD)' }, content: { type: Type.STRING, description: 'Work description' } }, required: ['date', 'content'] } },
        { name: 'setBabyDueDate', description: 'Set the baby due date.', parameters: { type: Type.OBJECT, properties: { dueDate: { type: Type.STRING, description: 'Due date (YYYY-MM-DD)' } }, required: ['dueDate'] } },
        { name: 'addChildMilestone', description: 'Record a child development milestone.', parameters: { type: Type.OBJECT, properties: { milestone: { type: Type.STRING, description: 'Milestone description' }, date: { type: Type.STRING, description: 'Date achieved (YYYY-MM-DD)' } }, required: ['milestone'] } },
        { name: 'addImmigrationCase', description: 'Add a USCIS case to track.', parameters: { type: Type.OBJECT, properties: { receiptNumber: { type: Type.STRING, description: 'Receipt number' }, formType: { type: Type.STRING, description: 'Form type (e.g., I-485)' }, nickname: { type: Type.STRING, description: 'Friendly name' } }, required: ['receiptNumber'] } },
        { name: 'addFlashcard', description: 'Create a new flashcard for the user to study.', parameters: { type: Type.OBJECT, properties: { front: { type: Type.STRING, description: 'Question or prompt side' }, back: { type: Type.STRING, description: 'Answer side' }, category: { type: Type.STRING, description: 'Category (e.g., custom, bible, chinese)' }, type: { type: Type.STRING, description: 'Card type: custom, bible, chinese, english' } }, required: ['front', 'back'] } },
        { name: 'getBibleVerse', description: 'Look up a Bible verse or passage. Returns the verse text and reference.', parameters: { type: Type.OBJECT, properties: { reference: { type: Type.STRING, description: 'Bible reference (e.g., "John 3:16", "Psalm 23:1-6")' }, translation: { type: Type.STRING, description: 'Bible translation/version ID (defaults to NIV)' } }, required: ['reference'] } },
        { name: 'searchPodcasts', description: 'Search for podcasts by keyword. Returns matching podcast feeds.', parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING, description: 'Search query for podcast name or topic' } }, required: ['query'] } },
        { name: 'addBookmark', description: 'Bookmark a Bible passage for the user.', parameters: { type: Type.OBJECT, properties: { reference: { type: Type.STRING, description: 'Bible reference to bookmark (e.g., "John 3:16")' } }, required: ['reference'] } },
        { name: 'listFlashcards', description: "List the user's flashcards, optionally filtered by type.", parameters: { type: Type.OBJECT, properties: { type: { type: Type.STRING, description: 'Filter by card type: custom, bible, chinese, english' } } } },
      ];
      const tools = [{ functionDeclarations }];

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents, config: { tools, systemInstruction } });
      inputTokens += (response as any).usageMetadata?.promptTokenCount || 0;
      outputTokens += (response as any).usageMetadata?.candidatesTokenCount || 0;
      const toolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }> = [];
      const parts = response.candidates?.[0]?.content?.parts || [];
      let hasToolCalls = false;
      for (const part of parts) {
        if (part.functionCall) {
          hasToolCalls = true;
          const args = (part.functionCall.args || {}) as Record<string, unknown>;
          let result = '';
          const toolStart = Date.now();
          try { result = await executeToolCall(part.functionCall.name!, args); }
          catch (err: any) { result = JSON.stringify({ error: err.message }); }
          toolCallTimings.push({ name: part.functionCall.name!, durationMs: Date.now() - toolStart });
          toolCalls.push({ name: part.functionCall.name!, args, result });
        }
      }
      if (hasToolCalls && toolCalls.length > 0) {
        const toolResponseParts = toolCalls.map(tc => ({ functionResponse: { name: tc.name, response: { result: tc.result } } }));
        const followup = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [...contents, { role: 'model', parts }, { role: 'user', parts: toolResponseParts }],
          config: { systemInstruction },
        });
        inputTokens += (followup as any).usageMetadata?.promptTokenCount || 0;
        outputTokens += (followup as any).usageMetadata?.candidatesTokenCount || 0;
        const finalText = followup.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('') || 'I found some information but had trouble formatting it.';
        logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: finalText, status: 'success', usedFallback: false, fullQuestion: message, fullAnswer: finalText, endpointId: endpointId || undefined });
        return { response: finalText, toolCalls, actions: extractActions(toolCalls), toolMode: useMcp ? 'mcp' : 'native' };
      }
      const textResponse = parts.map((p: any) => p.text).filter(Boolean).join('') || 'Sorry, I could not generate a response.';
      logAiChatInteraction({ userId: 'graphql', provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: textResponse, status: 'success', usedFallback: false, fullQuestion: message, fullAnswer: textResponse, endpointId: endpointId || undefined });
      return { response: textResponse, toolCalls: null, actions: null, toolMode: useMcp ? 'mcp' : 'native' };
    },
  };
}

// ─── AI Query Resolvers ───────────────────────────────────────

export function createAiQueryResolvers() {
  return {
    ollamaModels: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return [];
      const endpoint = await getUserOllamaEndpoint(uid);
      if (!endpoint) return [];
      const headers = buildEndpointHeaders(endpoint);
      // Try Ollama /api/tags first, then OpenAI-compatible /v1/models
      try {
        const { data } = await axios.get(`${endpoint.url}/api/tags`, { headers, timeout: 5000 });
        const models = (data.models || []).map((m: any) => m.name as string);
        if (models.length > 0) return models;
      } catch { /* fall through */ }
      try {
        const { data } = await axios.get(`${endpoint.url}/v1/models`, { headers, timeout: 5000 });
        return (data.data || []).map((m: any) => m.id as string);
      } catch {
        return [];
      }
    },

    benchmarkEndpointModels: async (_: any, { endpointId }: { endpointId: string }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const endpoint = await getUserOllamaEndpoint(uid, endpointId);
      if (!endpoint) return [];
      const headers = buildEndpointHeaders(endpoint);
      // Try Ollama /api/tags first, then OpenAI-compatible /v1/models
      try {
        const { data } = await axios.get(`${endpoint.url}/api/tags`, { headers, timeout: 5000 });
        const models = (data.models || []).map((m: any) => m.name as string);
        if (models.length > 0) return models;
      } catch { /* fall through */ }
      try {
        const { data } = await axios.get(`${endpoint.url}/v1/models`, { headers, timeout: 5000 });
        return (data.data || []).map((m: any) => m.id as string);
      } catch {
        return [];
      }
    },

    aiUsageSummary: async (_: any, { days = 7 }: { days?: number }) => {
      const db = getFirestore();
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const snap = await db.collection('aiChatLogs')
        .where('timestamp', '>=', since)
        .orderBy('timestamp', 'desc')
        .get();

      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let ollamaCalls = 0;
      let geminiCalls = 0;
      let totalLatency = 0;
      let errorCount = 0;
      const dailyMap: Record<string, { calls: number; latencySum: number; tokens: number; errors: number }> = {};

      for (const doc of snap.docs) {
        const d = doc.data();
        totalInputTokens += d.inputTokens || 0;
        totalOutputTokens += d.outputTokens || 0;
        totalLatency += d.latencyMs || 0;
        if (d.provider === 'ollama') ollamaCalls++;
        else geminiCalls++;
        if (d.status === 'error') errorCount++;

        const dateKey = d.timestamp?.toDate?.()
          ? d.timestamp.toDate().toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10);
        if (!dailyMap[dateKey]) dailyMap[dateKey] = { calls: 0, latencySum: 0, tokens: 0, errors: 0 };
        dailyMap[dateKey].calls++;
        dailyMap[dateKey].latencySum += d.latencyMs || 0;
        dailyMap[dateKey].tokens += (d.inputTokens || 0) + (d.outputTokens || 0);
        if (d.status === 'error') dailyMap[dateKey].errors++;
      }

      const totalCalls = snap.size;
      const dailyBreakdown = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, stats]) => ({
          date,
          calls: stats.calls,
          avgLatencyMs: stats.calls > 0 ? Math.round(stats.latencySum / stats.calls) : 0,
          tokens: stats.tokens,
          errors: stats.errors,
        }));

      return {
        totalCalls,
        totalInputTokens,
        totalOutputTokens,
        ollamaCalls,
        geminiCalls,
        avgLatencyMs: totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0,
        errorCount,
        errorRate: totalCalls > 0 ? errorCount / totalCalls : 0,
        dailyBreakdown,
        since: since.toISOString(),
      };
    },

    ollamaStatus: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) return { models: [], reachable: false, latencyMs: null };
      try {
        const endpoint = await getUserOllamaEndpoint(uid);
        if (!endpoint) return { models: [], reachable: false, latencyMs: null };
        const headers = buildEndpointHeaders(endpoint);
        const start = Date.now();
        const { data } = await axios.get(`${endpoint.url}/api/ps`, { headers, timeout: 5000 });
        const latencyMs = Date.now() - start;
        const models = (data.models || []).map((m: any) => ({
          name: m.name || '',
          size: (m.size || 0) / 1e9,
          sizeVram: (m.size_vram || 0) / 1e9,
          expiresAt: m.expires_at || '',
        }));
        return { models, reachable: true, latencyMs };
      } catch {
        return { models: [], reachable: false, latencyMs: null };
      }
    },

    aiRecentLogs: async (_: any, { limit = 20 }: { limit?: number }) => {
      const db = getFirestore();
      const cap = Math.min(limit, 50);
      const snap = await db.collection('aiChatLogs')
        .orderBy('timestamp', 'desc')
        .limit(cap)
        .get();

      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          timestamp: d.timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
          provider: d.provider || 'unknown',
          model: d.model || 'unknown',
          inputTokens: d.inputTokens || 0,
          outputTokens: d.outputTokens || 0,
          latencyMs: d.latencyMs || 0,
          toolCalls: (d.toolCalls || []).map((tc: any) => ({
            name: tc.name || '',
            durationMs: tc.durationMs ?? null,
            error: tc.error ?? null,
          })),
          questionPreview: d.questionPreview || '',
          answerPreview: d.answerPreview || '',
          fullQuestion: d.fullQuestion ?? null,
          fullAnswer: d.fullAnswer ?? null,
          endpointId: d.endpointId ?? null,
          status: d.status || 'unknown',
          error: d.error ?? null,
        };
      });
    },

    benchmarkEndpoints: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      const snap = await db.collection(`users/${uid}/benchmarkEndpoints`).get();
      return snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id, url: d.url, name: d.name,
          hasCfAccess: !!(d.cfAccessClientId && d.cfAccessClientSecret),
          source: d.source || 'benchmark',
        };
      });
    },

    benchmarkHistory: async (_: any, { limit = 10 }: { limit?: number }, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();
      const cap = Math.min(limit, 50);
      const snap = await db.collection(`users/${uid}/benchmarkRuns`)
        .orderBy('createdAt', 'desc').limit(cap).get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    benchmarkSummary: async (_: any, __: any, ctx: any) => {
      const uid = ctx?.uid;
      if (!uid) throw new Error('Authentication required');
      const db = getFirestore();

      const endpointSnap = await db.collection(`users/${uid}/benchmarkEndpoints`).get();
      const endpointCount = endpointSnap.size;

      const runSnap = await db.collection(`users/${uid}/benchmarkRuns`)
        .orderBy('createdAt', 'desc').limit(1).get();

      if (runSnap.empty) {
        return { lastRunId: null, lastRunAt: null, endpointCount, fastestEndpoint: null, fastestTps: null };
      }

      const lastDoc = runSnap.docs[0];
      const lastRun = lastDoc.data();
      const results = lastRun.results || [];
      let fastestEndpoint: string | null = null;
      let fastestTps: number | null = null;
      for (const r of results) {
        const tps = r.timing?.tokensPerSecond || 0;
        if (tps > (fastestTps || 0)) {
          fastestTps = tps;
          fastestEndpoint = r.endpointName;
        }
      }

      return { lastRunId: lastDoc.id, lastRunAt: lastRun.createdAt, endpointCount, fastestEndpoint, fastestTps };
    },
  };
}
