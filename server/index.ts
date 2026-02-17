import 'dotenv/config';
import { createServer as createHttpServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';
import NodeCache from 'node-cache';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloExpressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { typeDefs } from './graphql/schema.js';
import { resolvers, cleanupSubscriptions } from './graphql/resolvers.js';
import { recaptchaMiddleware } from './middleware/recaptcha.js';
import type { FunctionDeclaration } from '@google/genai';

// Configurable base URLs — defaults to production, overridden in emulator via .env.emulator
const OPENWEATHER_BASE = process.env.OPENWEATHER_BASE_URL || 'https://api.openweathermap.org';
const FINNHUB_BASE = process.env.FINNHUB_BASE_URL || 'https://finnhub.io';
const COINGECKO_BASE = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com';

const port = process.env.PORT || 3003;

/**
 * Create and configure the Express app with Apollo Server, AI chat, and WebSocket subscriptions.
 * Returns the app and httpServer so callers (e.g., production.ts) can extend them before listening.
 */
export async function createApp() {
  const app = express();
  const httpServer = createHttpServer(app);

  // Create GraphQL schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers
  });

  // Create WebSocket server for GraphQL subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql'
  });

  // Set up WebSocket handling for subscriptions
  const serverCleanup = useServer(
    {
      schema,
      onConnect: () => {
        console.log('Client connected to WebSocket');
      },
      onDisconnect: () => {
        console.log('Client disconnected from WebSocket');
      }
    },
    wsServer
  );

  // Create Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
              cleanupSubscriptions();
            }
          };
        }
      }
    ],
    introspection: true
  });

  await apolloServer.start();

  // Middleware
  app.use(compression());
  app.use(express.json());

  // AI Chat endpoint (mirrors Firebase Cloud Function aiChat)
  const aiChatCache = new NodeCache();
  app.post('/ai/chat', cors(), async (req, res) => {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
      return;
    }

    const { message, history, context } = req.body as {
      message: string;
      history?: { role: string; content: string }[];
      context?: Record<string, unknown>;
    };

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'message is required' });
      return;
    }

    try {
      const { GoogleGenAI, Type } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: geminiKey });

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

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          tools,
          systemInstruction,
        },
      });

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
            if (fc.name === 'getWeather') {
              result = await executeGetWeather(aiChatCache, args.city as string);
            } else if (fc.name === 'searchCities') {
              result = await executeSearchCities(args.query as string);
            } else if (fc.name === 'getStockQuote') {
              result = await executeGetStockQuote(aiChatCache, args.symbol as string);
            } else if (fc.name === 'getCryptoPrices') {
              result = await executeGetCryptoPrices(aiChatCache);
            } else if (fc.name === 'navigateTo') {
              result = JSON.stringify({ navigateTo: args.page });
            }
          } catch (err: any) {
            result = JSON.stringify({ error: err.message });
          }

          toolCalls.push({ name: fc.name!, args, result });
        }
      }

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

      const text = response.text || 'Sorry, I could not generate a response.';
      res.status(200).json({ response: text });
    } catch (err: any) {
      console.error('AI Chat error:', err);
      if (err.status === 429) {
        res.status(429).json({ error: 'Rate limit exceeded. Please try again in a moment.' });
        return;
      }
      res.status(500).json({ error: err.message || 'Failed to generate response' });
    }
  });

  // Apollo GraphQL endpoint
  app.use(
    '/graphql',
    cors(),
    recaptchaMiddleware,
    apolloExpressMiddleware(apolloServer, {
      context: async ({ req }) => ({
        headers: req.headers
      })
    })
  );

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
  });

  return { app, httpServer, apolloServer };
}

/** Dev entry point — creates the app and starts listening. */
async function startServer() {
  const { app, httpServer, apolloServer } = await createApp();

  httpServer.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`GraphQL endpoint: http://localhost:${port}/graphql`);
    console.log(`WebSocket subscriptions: ws://localhost:${port}/graphql`);
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await apolloServer.stop();
    httpServer.close(() => {
      console.log('HTTP server closed');
    });
  });
}

// Only auto-start when this file is run directly (not imported by production.ts)
const isDirectRun = process.argv[1]?.includes('server/index');
if (isDirectRun) {
  startServer().catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
  });
}

// ─── AI Chat tool execution helpers ─────────────────────────

async function executeGetWeather(cache: NodeCache, city: string): Promise<string> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Weather API not configured' });

  const cacheKey = `ai:weather:${city.toLowerCase()}`;
  const cached = cache.get<string>(cacheKey);
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

  cache.set(cacheKey, result, 300);
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

async function executeGetStockQuote(cache: NodeCache, symbol: string): Promise<string> {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return JSON.stringify({ error: 'Stock API not configured' });

  const cacheKey = `ai:stock:${symbol.toUpperCase()}`;
  const cached = cache.get<string>(cacheKey);
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

  cache.set(cacheKey, result, 60);
  return result;
}

async function executeGetCryptoPrices(cache: NodeCache): Promise<string> {
  const cacheKey = 'ai:crypto';
  const cached = cache.get<string>(cacheKey);
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

  cache.set(cacheKey, result, 120);
  return result;
}
