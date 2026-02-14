/**
 * Lightweight static file server for CI E2E tests.
 * Serves the assembled production build (dist/firebase/) on port 3000.
 * Mirrors Firebase Hosting rewrite behavior: serves actual files when they
 * exist, falls back to the appropriate index.html for SPA routes.
 */
import express from 'express';
import { existsSync } from 'fs';
import { join, resolve } from 'path';

const app = express();
const ROOT = resolve('dist/firebase');

// MFE sub-apps that have their own index.html
const MFE_PREFIXES = [
  'city-search', 'weather-display', 'stock-tracker', 'podcast-player',
  'ai-assistant', 'bible-reader', 'worship-songs', 'notebook', 'baby-tracker',
];

// Serve static files with correct MIME types
app.use(express.static(ROOT, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  },
}));

// SPA fallback: MFE sub-routes → their index.html, everything else → root index.html
app.get('*', (req, res) => {
  const prefix = req.path.split('/')[1];
  if (MFE_PREFIXES.includes(prefix)) {
    const mfeIndex = join(ROOT, prefix, 'index.html');
    if (existsSync(mfeIndex)) {
      return res.sendFile(mfeIndex);
    }
  }
  res.sendFile(join(ROOT, 'index.html'));
});

app.listen(3000, () => {
  console.log('Static server on http://localhost:3000');
});
