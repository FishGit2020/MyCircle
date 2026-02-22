import 'dotenv/config';
import { createServer as createHttpServer } from 'node:http';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware as apolloExpressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { typeDefs } from './graphql/schema.js';
import { resolvers, cleanupSubscriptions } from './graphql/resolvers.js';
import { recaptchaMiddleware } from './middleware/recaptcha.js';

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

  // Apollo GraphQL endpoint (AI chat is now handled via Mutation.aiChat)
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

