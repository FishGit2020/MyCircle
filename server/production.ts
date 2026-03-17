/**
 * Production entry point for Docker self-hosted deployment.
 *
 * Extends the dev server (Apollo + AI chat) with:
 *   - /health endpoint
 *   - Static file serving (dist/firebase/)
 *   - SPA fallback for all MFE routes
 */
import 'dotenv/config';
import { resolve, join } from 'node:path';
import { existsSync, readdirSync, statSync } from 'node:fs';
import express from 'express';
import { createApp } from './index.js';

// ─── MFE prefixes (auto-discovered from dist/firebase/) ──────────────
// Any subdirectory containing assets/remoteEntry.js is treated as an MFE.
// This eliminates the need to maintain a hardcoded list when adding new packages.
function discoverMfePrefixes(staticRoot: string): string[] {
  try {
    return readdirSync(staticRoot)
      .filter(name => {
        const dir = join(staticRoot, name);
        return statSync(dir).isDirectory()
          && existsSync(join(dir, 'assets', 'remoteEntry.js'));
      });
  } catch {
    return [];
  }
}

async function startProduction() {
  const { app, httpServer, apolloServer } = await createApp();

  const STATIC_ROOT = resolve('dist/firebase');
  const MFE_PREFIXES = discoverMfePrefixes(STATIC_ROOT);
  console.log(`Discovered ${MFE_PREFIXES.length} MFE prefixes:`, MFE_PREFIXES);

  // ─── Health check ─────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ─── Static file serving ──────────────────────────────────────────
  app.use(express.static(STATIC_ROOT, {
    maxAge: '1y',
    immutable: true,
    setHeaders(res, filePath) {
      // JS modules need CORS for Module Federation
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      // Never cache service worker or remote entry points
      if (filePath.endsWith('sw.js') || filePath.endsWith('remoteEntry.js')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  }));

  // ─── SPA fallback ─────────────────────────────────────────────────
  app.get('*', (req, res) => {
    const prefix = req.path.split('/')[1];
    if (MFE_PREFIXES.includes(prefix)) {
      const mfeIndex = join(STATIC_ROOT, prefix, 'index.html');
      if (existsSync(mfeIndex)) {
        return res.sendFile(mfeIndex);
      }
    }
    res.sendFile(join(STATIC_ROOT, 'index.html'));
  });

  // ─── Start listening ──────────────────────────────────────────────
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`MyCircle production server running on port ${PORT}`);
    console.log(`  Health:    http://localhost:${PORT}/health`);
    console.log(`  GraphQL:   http://localhost:${PORT}/graphql`);
    console.log(`  Static:    ${STATIC_ROOT}`);
  });

  // ─── Graceful shutdown ────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down`);
    await apolloServer.stop();
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
    // Force exit after 10s if connections hang
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startProduction().catch((err) => {
  console.error('Failed to start production server:', err);
  process.exit(1);
});
