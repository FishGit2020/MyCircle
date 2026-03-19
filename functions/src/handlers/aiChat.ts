import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import type { Request, Response } from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import type { FunctionDeclaration } from '@google/genai';
import type OpenAI from 'openai';
import { verifyRecaptchaToken } from '../recaptcha.js';
import { logAiChatInteraction } from '../aiChatLogger.js';
import type { AiToolCallTiming } from '../aiChatLogger.js';
import {
  validateAiChatRequest,
  buildSystemInstruction,
  buildOllamaClient,
  buildGeminiToolDeclarations,
  ollamaTools,
  executeTool as executeToolHelper,
  getUserOllamaEndpoint as getUserOllamaEndpointHelper,
} from '../aiChatHelpers.js';
import {
  expandApiKeys,
  ALLOWED_ORIGINS,
  checkRateLimit,
  aiChatBodySchema,
  verifyAuthToken,
  OPENWEATHER_BASE,
  FINNHUB_BASE,
  COINGECKO_BASE,
} from './shared.js';

const aiChatCache = new NodeCache();

// ─── Per-user Ollama endpoint helpers (REST handler) ──────
interface OllamaEndpoint {
  id: string;
  url: string;
  name: string;
  cfAccessClientId?: string;
  cfAccessClientSecret?: string;
}

async function getUserOllamaEndpoint(uid: string, endpointId?: string): Promise<OllamaEndpoint | null> {
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
    timeoutSeconds: 300,
    secrets: ['API_KEYS', 'RECAPTCHA_SECRET_KEY'],
  },
  async (req: Request, res: Response) => {
    expandApiKeys();
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

    // Validate request body with Zod
    const parseResult = aiChatBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid request body', details: parseResult.error.flatten().fieldErrors });
      return;
    }

    const { message, history, context, model } = parseResult.data;
    const reqEndpointId = req.body.endpointId as string | undefined;

    const endpoint = await getUserOllamaEndpoint(aiUid!, reqEndpointId || undefined);
    const ollamaBaseUrl = endpoint?.url || '';
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!ollamaBaseUrl && !geminiKey) {
      res.status(500).json({ error: 'No AI provider configured — add an Ollama endpoint in Settings or contact admin for Gemini' });
      return;
    }
    const ollamaModel = model || '';
    if (ollamaBaseUrl && !ollamaModel) {
      res.status(400).json({ error: 'Model is required — select a model before chatting' });
      return;
    }

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
      if (name === 'listFavoriteCities') {
        const cities = Array.isArray(context?.favoriteCities) ? context!.favoriteCities : [];
        return JSON.stringify({ favoriteCities: cities, count: cities.length });
      }
      if (name === 'listStockWatchlist') {
        const symbols = Array.isArray(context?.stockWatchlist) ? context!.stockWatchlist : [];
        return JSON.stringify({ watchlist: symbols, count: symbols.length });
      }
      return JSON.stringify({ error: `Unknown tool: ${name}` });
    }

    // ─── Metrics tracking ──────────────────────────────────────
    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    const toolCallTimings: AiToolCallTiming[] = [];
    let trackedProvider = '';
    let trackedModel = '';
    let answerText = '';

    try {
      // ─── Ollama path (OpenAI-compatible API) ───────────────────
      if (ollamaBaseUrl && endpoint) {
        trackedProvider = 'ollama';
        trackedModel = ollamaModel;
        const { default: OpenAI } = await import('openai');
        const cfHeaders: Record<string, string> = {};
        if (endpoint.cfAccessClientId) cfHeaders['CF-Access-Client-Id'] = endpoint.cfAccessClientId;
        if (endpoint.cfAccessClientSecret) cfHeaders['CF-Access-Client-Secret'] = endpoint.cfAccessClientSecret;
        const client = new OpenAI({
          baseURL: `${ollamaBaseUrl}/v1`, apiKey: 'ollama',
          defaultHeaders: cfHeaders,
        });

        // Define tools in OpenAI format
        const ollamaToolDefs: OpenAI.ChatCompletionTool[] = [
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
            tools: ollamaToolDefs,
          });
          inputTokens += completion.usage?.prompt_tokens || 0;
          outputTokens += completion.usage?.completion_tokens || 0;
        } catch {
          // Model doesn't support native tools (e.g., gemma2:2b) — prompt-based fallback
          usedFallback = true;
          const toolPrompt = ollamaToolDefs.map(t => {
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
          inputTokens += completion.usage?.prompt_tokens || 0;
          outputTokens += completion.usage?.completion_tokens || 0;
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
              const toolStart = Date.now();
              try { result = await executeTool(parsed.name, parsed.args); }
              catch (err: any) { result = JSON.stringify({ error: err.message }); }
              toolCallTimings.push({ name: parsed.name, durationMs: Date.now() - toolStart });
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
              inputTokens += followup.usage?.prompt_tokens || 0;
              outputTokens += followup.usage?.completion_tokens || 0;
              answerText = followup.choices[0].message.content || '';
              logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: answerText, status: 'success', usedFallback: true });
              logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
              res.status(200).json({ response: answerText, toolCalls });
              return;
            } catch { /* JSON parse failed — treat as plain text */ }
          }
          // No tool call parsed — return as plain text
          answerText = text || 'Sorry, I could not generate a response.';
          logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: answerText, status: 'success', usedFallback: true });
          logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
          res.status(200).json({ response: answerText });
          return;
        }

        // Native tool calls path
        if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
          for (const tc of choice.message.tool_calls) {
            const args = JSON.parse(tc.function.arguments || '{}') as Record<string, unknown>;
            let result = '';
            const toolStart = Date.now();
            try {
              result = await executeTool(tc.function.name, args);
            } catch (err: any) {
              result = JSON.stringify({ error: err.message });
            }
            toolCallTimings.push({ name: tc.function.name, durationMs: Date.now() - toolStart });
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
          inputTokens += followup.usage?.prompt_tokens || 0;
          outputTokens += followup.usage?.completion_tokens || 0;

          const finalText = followup.choices[0].message.content || 'I found some information but had trouble formatting it.';
          logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: finalText, status: 'success', usedFallback: false });
          logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
          res.status(200).json({ response: finalText, toolCalls });
          return;
        }

        // No tool calls — return direct text response
        const text = choice.message.content || 'Sorry, I could not generate a response.';
        logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: text, status: 'success', usedFallback: false });
        logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
        res.status(200).json({ response: text });
        return;
      }

      // ─── Gemini path (existing behavior) ───────────────────────
      trackedProvider = 'gemini';
      trackedModel = 'gemini-2.5-flash';
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
        description: 'Navigate the user to a specific page in the MyCircle app. Available pages: weather (home), stocks, podcasts, weather/compare.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            page: { type: Type.STRING, description: 'Page to navigate to: "weather", "stocks", "podcasts", "weather/compare"' },
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
      inputTokens += (response as any).usageMetadata?.promptTokenCount || 0;
      outputTokens += (response as any).usageMetadata?.candidatesTokenCount || 0;

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

          const toolStart = Date.now();
          try {
            result = await executeTool(fc.name!, args);
          } catch (err: any) {
            result = JSON.stringify({ error: err.message });
          }
          toolCallTimings.push({ name: fc.name!, durationMs: Date.now() - toolStart });

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
        inputTokens += (followup as any).usageMetadata?.promptTokenCount || 0;
        outputTokens += (followup as any).usageMetadata?.candidatesTokenCount || 0;

        const finalText = followup.text || 'I found some information but had trouble formatting it.';
        logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: finalText, status: 'success', usedFallback: false });
        logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
        res.status(200).json({ response: finalText, toolCalls });
        return;
      }

      // No tool calls — return direct text response
      const text = response.text || 'Sorry, I could not generate a response.';
      logAiChatInteraction({ userId: aiUid!, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: text, status: 'success', usedFallback: false });
      logger.info('AI Chat completed', { provider: trackedProvider, model: trackedModel, latencyMs: Date.now() - startTime, inputTokens, outputTokens });
      res.status(200).json({ response: text });
    } catch (err: any) {
      logger.error('AI Chat error', { error: err.message || String(err), status: err.status });
      logAiChatInteraction({ userId: aiUid!, provider: trackedProvider || 'unknown', model: trackedModel || 'unknown', inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: '', status: 'error', error: err.message || String(err), usedFallback: false });
      if (err.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
        return;
      }
      res.status(500).json({ error: err.message || 'Failed to generate response' });
    }
  }
);

/**
 * AI Chat SSE streaming endpoint.
 * POST /ai/chat/stream — same body as /ai/chat but returns Server-Sent Events.
 *
 * Event types:
 *   { type: 'text', content: '...' }         — incremental token
 *   { type: 'tool_start', name, args }       — tool execution begins
 *   { type: 'tool_result', name, result }    — tool execution done
 *   { type: 'done', metadata: {...} }        — stream complete
 *   { type: 'error', message: '...' }        — error
 */
export const aiChatStream = onRequest(
  {
    cors: ALLOWED_ORIGINS,
    invoker: 'public',
    maxInstances: 5,
    memory: '256MiB',
    timeoutSeconds: 300,
    secrets: ['API_KEYS', 'RECAPTCHA_SECRET_KEY'],
  },
  async (req: Request, res: Response) => {
    expandApiKeys();
    // Validate request (auth, rate limit, recaptcha, zod)
    const validated = await validateAiChatRequest(req, res);
    if (!validated) return; // response already sent

    const { uid, message, history, context, model: reqModel, endpointId: reqEndpointId } = validated;

    // SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let aborted = false;
    req.on('close', () => { aborted = true; });

    function sendEvent(type: string, data: Record<string, unknown>) {
      if (aborted) return;
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
    }

    /** Emit a thinking event with a human-readable description of what the AI is doing. */
    function sendThinking(toolName: string, args: Record<string, unknown>) {
      const messages: Record<string, string> = {
        getWeather: `Checking weather for ${args.city || 'a city'}...`,
        searchCities: `Searching for cities matching "${args.query || ''}"...`,
        getStockQuote: `Looking up stock price for ${args.symbol || ''}...`,
        getCryptoPrices: 'Fetching cryptocurrency prices...',
        navigateTo: `Navigating to ${args.page || ''}...`,
        listFavoriteCities: 'Looking up your favorite cities...',
        listStockWatchlist: 'Checking your stock watchlist...',
        getBibleVerse: `Looking up ${args.reference || 'a verse'}...`,
        searchPodcasts: `Searching podcasts for "${args.query || ''}"...`,
        checkCaseStatus: `Checking case status for ${args.receiptNumber || ''}...`,
      };
      sendEvent('thinking', { content: messages[toolName] || `Running ${toolName}...` });
    }

    const endpoint = await getUserOllamaEndpointHelper(uid, reqEndpointId || undefined);
    const ollamaBaseUrl = endpoint?.url || '';
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!ollamaBaseUrl && !geminiKey) {
      sendEvent('error', { message: 'No AI provider configured' });
      res.end();
      return;
    }
    const ollamaModel = reqModel || '';
    if (ollamaBaseUrl && !ollamaModel) {
      sendEvent('error', { message: 'Model is required — select a model before chatting' });
      res.end();
      return;
    }

    const systemInstruction = buildSystemInstruction(context);

    // Metrics
    const startTime = Date.now();
    let inputTokens = 0;
    let outputTokens = 0;
    const toolCallTimings: AiToolCallTiming[] = [];
    let trackedProvider = '';
    let trackedModel = '';
    let fullText = '';

    try {
      // ─── Ollama streaming path ────────────────────────────────
      if (ollamaBaseUrl && endpoint) {
        trackedProvider = 'ollama';
        trackedModel = ollamaModel;
        const client = await buildOllamaClient(endpoint);

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: systemInstruction },
        ];
        if (history && Array.isArray(history)) {
          for (const msg of history) {
            messages.push({ role: msg.role === 'assistant' ? 'assistant' : 'user', content: msg.content });
          }
        }
        messages.push({ role: 'user', content: message });

        // Try streaming with native tool calling
        let usedFallback = false;
        try {
          const stream = await client.chat.completions.create({
            model: ollamaModel,
            messages,
            tools: ollamaTools,
            stream: true,
          });

          // Buffer tool calls from deltas
          const toolCallBuffers: Map<number, { id: string; name: string; arguments: string }> = new Map();
          let streamText = '';
          // T004: thinkBuffer intercepts <think>...</think> blocks from reasoning models
          let thinkBuffer = '';

          for await (const chunk of stream) {
            if (aborted) break;
            const delta = chunk.choices[0]?.delta;
            if (!delta) continue;

            if (delta.content) {
              streamText += delta.content;
              fullText += delta.content;
              // T004: Accumulate in thinkBuffer instead of emitting directly
              thinkBuffer += delta.content;

              // T005: Extract complete <think>...</think> blocks → emit as thinking events
              const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
              let thinkMatch: RegExpExecArray | null;
              while ((thinkMatch = thinkRegex.exec(thinkBuffer)) !== null) {
                sendEvent('thinking', { content: thinkMatch[1] });
                thinkBuffer = thinkBuffer.slice(0, thinkMatch.index) + thinkBuffer.slice(thinkMatch.index + thinkMatch[0].length);
                thinkRegex.lastIndex = 0;
              }

              // T006: Flush pre-think text; hold partial <think> prefix for next chunk
              const thinkStart = thinkBuffer.indexOf('<think>');
              if (thinkStart === -1) {
                if (thinkBuffer) { sendEvent('text', { content: thinkBuffer }); thinkBuffer = ''; }
              } else if (thinkStart > 0) {
                sendEvent('text', { content: thinkBuffer.slice(0, thinkStart) });
                thinkBuffer = thinkBuffer.slice(thinkStart);
              }
              // else: buffer starts with <think> — partial open tag, wait for closing
            }

            // Buffer incremental tool call deltas
            if (delta.tool_calls) {
              for (const tc of delta.tool_calls) {
                const idx = tc.index ?? 0;
                if (!toolCallBuffers.has(idx)) {
                  toolCallBuffers.set(idx, { id: tc.id || '', name: tc.function?.name || '', arguments: '' });
                }
                const buf = toolCallBuffers.get(idx)!;
                if (tc.function?.name) buf.name = tc.function.name;
                if (tc.function?.arguments) buf.arguments += tc.function.arguments;
              }
            }

            if (chunk.usage) {
              inputTokens += chunk.usage.prompt_tokens || 0;
              outputTokens += chunk.usage.completion_tokens || 0;
            }
          }

          // T007: Flush any remaining thinkBuffer after main stream ends (handles unclosed <think>)
          if (thinkBuffer) { sendEvent('text', { content: thinkBuffer }); thinkBuffer = ''; }

          // Execute buffered tool calls
          if (toolCallBuffers.size > 0 && !aborted) {
            const toolCalls: Array<{ name: string; args: Record<string, unknown>; result: string }> = [];
            const toolMessages: Array<{ role: 'tool'; tool_call_id: string; content: string }> = [];

            for (const [, buf] of toolCallBuffers) {
              const args = JSON.parse(buf.arguments || '{}') as Record<string, unknown>;
              sendThinking(buf.name, args);
              sendEvent('tool_start', { name: buf.name, args });

              const toolStart = Date.now();
              let result = '';
              try { result = await executeToolHelper(buf.name, args, context); }
              catch (err: any) { result = JSON.stringify({ error: err.message }); }
              toolCallTimings.push({ name: buf.name, durationMs: Date.now() - toolStart });

              sendEvent('tool_result', { name: buf.name, result });
              toolCalls.push({ name: buf.name, args, result });
              toolMessages.push({ role: 'tool', tool_call_id: buf.id, content: result });
            }

            // Follow-up streaming call with tool results
            const followupMessages: any[] = [
              ...messages,
              { role: 'assistant', content: streamText || null, tool_calls: Array.from(toolCallBuffers.values()).map(b => ({ id: b.id, type: 'function' as const, function: { name: b.name, arguments: b.arguments } })) },
              ...toolMessages,
            ];

            const followupStream = await client.chat.completions.create({
              model: ollamaModel,
              messages: followupMessages,
              stream: true,
            });

            for await (const chunk of followupStream) {
              if (aborted) break;
              const delta = chunk.choices[0]?.delta;
              if (delta?.content) {
                fullText += delta.content;
                // Route follow-up stream through thinkBuffer as well
                thinkBuffer += delta.content;
                const followThinkRegex = /<think>([\s\S]*?)<\/think>/g;
                let followThinkMatch: RegExpExecArray | null;
                while ((followThinkMatch = followThinkRegex.exec(thinkBuffer)) !== null) {
                  sendEvent('thinking', { content: followThinkMatch[1] });
                  thinkBuffer = thinkBuffer.slice(0, followThinkMatch.index) + thinkBuffer.slice(followThinkMatch.index + followThinkMatch[0].length);
                  followThinkRegex.lastIndex = 0;
                }
                const followThinkStart = thinkBuffer.indexOf('<think>');
                if (followThinkStart === -1) {
                  if (thinkBuffer) { sendEvent('text', { content: thinkBuffer }); thinkBuffer = ''; }
                } else if (followThinkStart > 0) {
                  sendEvent('text', { content: thinkBuffer.slice(0, followThinkStart) });
                  thinkBuffer = thinkBuffer.slice(followThinkStart);
                }
              }
              if (chunk.usage) {
                inputTokens += chunk.usage.prompt_tokens || 0;
                outputTokens += chunk.usage.completion_tokens || 0;
              }
            }
            // T007: Flush any remaining thinkBuffer after follow-up stream
            if (thinkBuffer) { sendEvent('text', { content: thinkBuffer }); thinkBuffer = ''; }
          }
        } catch {
          // Model doesn't support native tools — prompt-based fallback (non-streaming for simplicity)
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

          const fallbackMessages: any[] = [
            { role: 'system', content: fallbackSystemPrompt },
            ...messages.slice(1),
          ];

          const completion = await client.chat.completions.create({
            model: ollamaModel,
            messages: fallbackMessages,
          });
          inputTokens += completion.usage?.prompt_tokens || 0;
          outputTokens += completion.usage?.completion_tokens || 0;

          const text = completion.choices[0].message.content || '';

          // Check for tool call in response
          const match = text.match(/<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/)
            || text.match(/```(?:tool_call|json)?\s*(\{[\s\S]*?\})\s*```/)
            || text.match(/(\{"name"\s*:\s*"(?:getWeather|searchCities|getStockQuote|getCryptoPrices|navigateTo)"[\s\S]*?\})/);

          if (match) {
            try {
              const parsed = JSON.parse(match[1]) as { name: string; args: Record<string, unknown> };
              sendThinking(parsed.name, parsed.args);
              sendEvent('tool_start', { name: parsed.name, args: parsed.args });

              const toolStart = Date.now();
              let result = '';
              try { result = await executeToolHelper(parsed.name, parsed.args, context); }
              catch (err: any) { result = JSON.stringify({ error: err.message }); }
              toolCallTimings.push({ name: parsed.name, durationMs: Date.now() - toolStart });
              sendEvent('tool_result', { name: parsed.name, result });

              // Follow-up for final answer
              const followup = await client.chat.completions.create({
                model: ollamaModel,
                messages: [
                  ...messages,
                  { role: 'assistant', content: text },
                  { role: 'user', content: `Tool result for ${parsed.name}: ${result}\n\nPlease provide a helpful response based on this data.` },
                ],
              });
              inputTokens += followup.usage?.prompt_tokens || 0;
              outputTokens += followup.usage?.completion_tokens || 0;

              fullText = followup.choices[0].message.content || '';
              // Stream the full text word by word for typewriter effect
              const words = fullText.split(' ');
              for (const word of words) {
                if (aborted) break;
                sendEvent('text', { content: word + ' ' });
              }
            } catch {
              // JSON parse failed — send as plain text
              fullText = text;
              sendEvent('text', { content: text });
            }
          } else {
            fullText = text || 'Sorry, I could not generate a response.';
            sendEvent('text', { content: fullText });
          }
        }

        if (!aborted) {
          logAiChatInteraction({ userId: uid, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: fullText.slice(0, 200), status: 'success', usedFallback });
          sendEvent('done', { metadata: { provider: trackedProvider, model: trackedModel, tokens: { input: inputTokens, output: outputTokens }, latencyMs: Date.now() - startTime } });
        }
        res.end();
        return;
      }

      // ─── Gemini streaming path ────────────────────────────────
      trackedProvider = 'gemini';
      trackedModel = 'gemini-2.5-flash';
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey! });

      const tools = buildGeminiToolDeclarations(Type);

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      if (history && Array.isArray(history)) {
        for (const msg of history) {
          contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
        }
      }
      contents.push({ role: 'user', parts: [{ text: message }] });

      // Use generateContentStream for real streaming
      const stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents,
        config: { tools, systemInstruction },
      });

      let hasToolCalls = false;
      const geminiToolCalls: Array<{ name: string; args: Record<string, unknown>; result?: string }> = [];
      const geminiParts: any[] = [];

      for await (const chunk of stream) {
        if (aborted) break;

        // Track usage from chunks
        if ((chunk as any).usageMetadata) {
          inputTokens = (chunk as any).usageMetadata.promptTokenCount || inputTokens;
          outputTokens = (chunk as any).usageMetadata.candidatesTokenCount || outputTokens;
        }

        // Check for text content
        if (chunk.text) {
          fullText += chunk.text;
          sendEvent('text', { content: chunk.text });
        }

        // Check for function calls in parts
        const parts = chunk.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          geminiParts.push(part);
          if (part.functionCall) {
            hasToolCalls = true;
            const fc = part.functionCall;
            const args = (fc.args || {}) as Record<string, unknown>;
            sendThinking(fc.name!, args);
            sendEvent('tool_start', { name: fc.name!, args });

            const toolStart = Date.now();
            let result = '';
            try { result = await executeToolHelper(fc.name!, args, context); }
            catch (err: any) { result = JSON.stringify({ error: err.message }); }
            toolCallTimings.push({ name: fc.name!, durationMs: Date.now() - toolStart });

            sendEvent('tool_result', { name: fc.name!, result });
            geminiToolCalls.push({ name: fc.name!, args, result });
          }
        }
      }

      // If we had tool calls, send results back to Gemini for a follow-up streamed response
      if (hasToolCalls && geminiToolCalls.length > 0 && !aborted) {
        const toolResponseParts = geminiToolCalls.map(tc => ({
          functionResponse: { name: tc.name, response: { result: tc.result } },
        }));

        const followupContents = [
          ...contents,
          { role: 'model', parts: geminiParts },
          { role: 'user', parts: toolResponseParts },
        ];

        const followupStream = await ai.models.generateContentStream({
          model: 'gemini-2.5-flash',
          contents: followupContents,
          config: {
            systemInstruction: 'You are MyCircle AI, a helpful assistant for the MyCircle personal dashboard app. Summarize the tool results in a natural, helpful way. Be concise.',
          },
        });

        for await (const chunk of followupStream) {
          if (aborted) break;
          if ((chunk as any).usageMetadata) {
            inputTokens = (chunk as any).usageMetadata.promptTokenCount || inputTokens;
            outputTokens = (chunk as any).usageMetadata.candidatesTokenCount || outputTokens;
          }
          if (chunk.text) {
            fullText += chunk.text;
            sendEvent('text', { content: chunk.text });
          }
        }
      }

      if (!aborted) {
        logAiChatInteraction({ userId: uid, provider: trackedProvider, model: trackedModel, inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: fullText.slice(0, 200), status: 'success', usedFallback: false });
        sendEvent('done', { metadata: { provider: trackedProvider, model: trackedModel, tokens: { input: inputTokens, output: outputTokens }, latencyMs: Date.now() - startTime } });
      }
      res.end();
    } catch (err: any) {
      logger.error('AI Chat Stream error', { error: err.message || String(err) });
      logAiChatInteraction({ userId: uid, provider: trackedProvider || 'unknown', model: trackedModel || 'unknown', inputTokens, outputTokens, totalTokens: inputTokens + outputTokens, latencyMs: Date.now() - startTime, toolCalls: toolCallTimings, questionPreview: message, answerPreview: '', status: 'error', error: err.message || String(err), usedFallback: false });
      sendEvent('error', { message: err.message || 'Failed to generate response' });
      res.end();
    }
  }
);
