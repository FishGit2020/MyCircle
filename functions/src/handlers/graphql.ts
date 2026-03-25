import { onRequest } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getAppCheck } from 'firebase-admin/app-check';
import type { Request, Response } from 'express';
import { expandApiKeys, ALLOWED_ORIGINS, checkRateLimit, verifyAuthToken, verifyApiKey } from './shared.js';

// Cache the Apollo Server instance to avoid re-initialization on every request
let serverPromise: Promise<any> | null = null;

async function getServer() {
  if (!serverPromise) {
    serverPromise = (async () => {
      const { ApolloServer } = await import('@apollo/server');
      const { makeExecutableSchema } = await import('@graphql-tools/schema');
      const { typeDefs } = await import('../schema.js');
      const { createResolvers } = await import('../resolvers/index.js');

      const apiKey = process.env.OPENWEATHER_API_KEY || '';
      const finnhubKey = process.env.FINNHUB_API_KEY || '';
      const piCreds = JSON.parse(process.env.PODCASTINDEX_CREDS || '{}');
      const podcastApiKey = piCreds.apiKey || '';
      const podcastApiSecret = piCreds.apiSecret || '';
      const youversionKey = process.env.YOUVERSION_APP_KEY || '';
      const openAiKey = process.env.OPENAI_API_KEY || '';

      const depthLimit = (await import('graphql-depth-limit')).default;

      const schema = makeExecutableSchema({
        typeDefs,
        resolvers: createResolvers(
          () => apiKey,
          () => finnhubKey,
          () => ({ apiKey: podcastApiKey, apiSecret: podcastApiSecret }),
          () => youversionKey,
          () => openAiKey
        )
      });

      const server = new ApolloServer({
        schema,
        introspection: process.env.NODE_ENV !== 'production',
        validationRules: [depthLimit(10)],
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
    timeoutSeconds: 300,
    secrets: ['API_KEYS', 'PODCASTINDEX_CREDS', 'USCIS_CREDS', 'OPENAI_API_KEY']
  },
  async (req: Request, res: Response) => {
    expandApiKeys();
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

    // Extract uid for resolvers that need authenticated Firestore access
    // Try Firebase ID token first, then fall back to API key (for OpenClaw/server-to-server)
    let uid = await verifyAuthToken(req);
    if (!uid) {
      uid = await verifyApiKey(req);
    }

    // Rate-limit API key requests (30 req/min per uid)
    if (uid && req.headers['x-api-key']) {
      if (checkRateLimit(`apikey:${uid}`, 30, 60)) {
        res.status(429).json({ errors: [{ message: 'API rate limit exceeded. Please wait a moment.' }] });
        return;
      }
    }

    // Rate-limit expensive benchmark mutations (5 req/min per user)
    const BENCHMARK_RATE_LIMITED_OPS = ['RunBenchmark', 'SaveBenchmarkRun'];
    if (uid && BENCHMARK_RATE_LIMITED_OPS.includes(opName)) {
      if (checkRateLimit(`benchmark:${uid}`, 5, 60)) {
        res.status(429).json({ errors: [{ message: 'Benchmark rate limit exceeded. Please wait a moment.' }] });
        return;
      }
    }

    try {
      const result = await server.executeOperation(
        {
          query: body.query || undefined,
          variables: body.variables,
          operationName: body.operationName,
          extensions: body.extensions,
        },
        {
          contextValue: { headers, uid }
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
