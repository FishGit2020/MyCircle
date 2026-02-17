import { defineConfig, type PluginOption, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

// ---------------------------------------------------------------------------
// Vite plugin: generate firebase-messaging-sw.js with env vars at build time
// so we never commit the Firebase API key as a plain string in public/.
// ---------------------------------------------------------------------------
function firebaseMessagingSW(): PluginOption {
  let env: Record<string, string> = {};

  function generate(): string {
    return [
      '/* eslint-disable no-undef */',
      '// Firebase Cloud Messaging service worker',
      '// Generated at build time — config injected from VITE_FIREBASE_* env vars',
      "importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-app-compat.js');",
      "importScripts('https://www.gstatic.com/firebasejs/11.9.0/firebase-messaging-compat.js');",
      '',
      'firebase.initializeApp({',
      `  apiKey: ${JSON.stringify(env.VITE_FIREBASE_API_KEY || '')},`,
      `  authDomain: ${JSON.stringify(env.VITE_FIREBASE_AUTH_DOMAIN || '')},`,
      `  projectId: ${JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || '')},`,
      `  storageBucket: ${JSON.stringify(env.VITE_FIREBASE_STORAGE_BUCKET || '')},`,
      `  messagingSenderId: ${JSON.stringify(env.VITE_FIREBASE_MESSAGING_SENDER_ID || '')},`,
      `  appId: ${JSON.stringify(env.VITE_FIREBASE_APP_ID || '')},`,
      '});',
      '',
      'const messaging = firebase.messaging();',
      '',
      '// Handle background messages (when the app is not in the foreground)',
      'messaging.onBackgroundMessage((payload) => {',
      "  const { title, body, icon } = payload.notification || {};",
      "  self.registration.showNotification(title || 'MyCircle', {",
      "    body: body || 'You have a new notification.',",
      "    icon: icon || '/favicon.ico',",
      '  });',
      '});',
      '',
    ].join('\n');
  }

  return {
    name: 'firebase-messaging-sw',
    configResolved(config: ResolvedConfig) {
      env = config.env;
    },
    configureServer(server) {
      // Serve the generated SW during local development
      server.middlewares.use('/firebase-messaging-sw.js', (_req, res) => {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(generate());
      });
    },
    generateBundle() {
      // Emit the SW file into the build output
      this.emitFile({
        type: 'asset',
        fileName: 'firebase-messaging-sw.js',
        source: generate(),
      });
    },
  };
}

// ---------------------------------------------------------------------------
// Vite plugin: listen for remote MFE rebuild notifications and trigger a
// full browser reload via Vite's HMR WebSocket.  Only active in dev mode.
// Usage: GET http://localhost:3000/__mfe-rebuilt?app=baby-tracker
// ---------------------------------------------------------------------------
function mfeReloadListener(): PluginOption {
  return {
    name: 'mfe-reload-listener',
    configureServer(server) {
      server.middlewares.use('/__mfe-rebuilt', (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const app = url.searchParams.get('app') || 'unknown';
        console.log(`[mfe-reload] Remote "${app}" rebuilt — sending full-reload`);
        server.ws.send({ type: 'full-reload' });
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('ok');
      });
    },
  };
}

const isProduction = process.env.NODE_ENV === 'production';
const isAnalyze = process.env.ANALYZE === 'true';

// In production (Firebase), all MFs are served from the same origin
// In development, each MF runs on its own port
const citySearchRemote = isProduction
  ? '/city-search/assets/remoteEntry.js'
  : 'http://localhost:3001/assets/remoteEntry.js';

const weatherDisplayRemote = isProduction
  ? '/weather-display/assets/remoteEntry.js'
  : 'http://localhost:3002/assets/remoteEntry.js';

const stockTrackerRemote = isProduction
  ? '/stock-tracker/assets/remoteEntry.js'
  : 'http://localhost:3005/assets/remoteEntry.js';

const podcastPlayerRemote = isProduction
  ? '/podcast-player/assets/remoteEntry.js'
  : 'http://localhost:3006/assets/remoteEntry.js';

const aiAssistantRemote = isProduction
  ? '/ai-assistant/assets/remoteEntry.js'
  : 'http://localhost:3007/assets/remoteEntry.js';

const bibleReaderRemote = isProduction
  ? '/bible-reader/assets/remoteEntry.js'
  : 'http://localhost:3008/assets/remoteEntry.js';

const worshipSongsRemote = isProduction
  ? '/worship-songs/assets/remoteEntry.js'
  : 'http://localhost:3009/assets/remoteEntry.js';

const notebookRemote = isProduction
  ? '/notebook/assets/remoteEntry.js'
  : 'http://localhost:3010/assets/remoteEntry.js';

const babyTrackerRemote = isProduction
  ? '/baby-tracker/assets/remoteEntry.js'
  : 'http://localhost:3011/assets/remoteEntry.js';

const childDevelopmentRemote = isProduction
  ? '/child-development/assets/remoteEntry.js'
  : 'http://localhost:3012/assets/remoteEntry.js';

const chineseLearningRemote = isProduction
  ? '/chinese-learning/assets/remoteEntry.js'
  : 'http://localhost:3013/assets/remoteEntry.js';

const englishLearningRemote = isProduction
  ? '/english-learning/assets/remoteEntry.js'
  : 'http://localhost:3014/assets/remoteEntry.js';

export default defineConfig({
  plugins: [
    react(),
    firebaseMessagingSW(),
    mfeReloadListener(),
    federation({
      name: 'shell',
      remotes: {
        citySearch: citySearchRemote,
        weatherDisplay: weatherDisplayRemote,
        stockTracker: stockTrackerRemote,
        podcastPlayer: podcastPlayerRemote,
        aiAssistant: aiAssistantRemote,
        bibleReader: bibleReaderRemote,
        worshipSongs: worshipSongsRemote,
        notebook: notebookRemote,
        babyTracker: babyTrackerRemote,
        childDevelopment: childDevelopmentRemote,
        chineseLearning: chineseLearningRemote,
        englishLearning: englishLearningRemote
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1', eager: false },
        graphql:            { singleton: true, requiredVersion: '^16.12.0', eager: false },
        '@mycircle/shared': { singleton: true },
      }
    }),
    ...(isAnalyze
      ? [visualizer({ open: true, filename: 'stats.html', gzipSize: true }) as PluginOption]
      : []),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MyCircle',
        short_name: 'MyCircle',
        description: 'Your personal dashboard for weather, stocks, podcasts, and more',
        theme_color: '#3b82f6',
        background_color: '#1e293b',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          { name: 'Weather', short_name: 'Weather', url: '/weather', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Bible Reader', short_name: 'Bible', url: '/bible', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Podcasts', short_name: 'Podcasts', url: '/podcasts', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Stocks', short_name: 'Stocks', url: '/stocks', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Notebook', short_name: 'Notes', url: '/notebook', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Worship Songs', short_name: 'Worship', url: '/worship', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'AI Assistant', short_name: 'AI', url: '/ai', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'English Learning', short_name: 'English', url: '/english', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Chinese Learning', short_name: 'Chinese', url: '/chinese', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
          { name: 'Child Development', short_name: 'ChildDev', url: '/child-dev', icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }] },
        ]
      },
      workbox: {
        // skipWaiting: true,    — removed: conflicts with registerType:'prompt'
        // clientsClaim: true,   — the ReloadPrompt banner handles the update flow

        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/graphql/,
          /^\/stock\//,
          /^\/podcast\//,
          /^\/ai\//,
          /^\/api\//,
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/firebase-messaging-sw.js'],
        runtimeCaching: [
          {
            urlPattern: /\/remoteEntry\.js$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mfe-remote-entries',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/[\w-]+\.openweathermap\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/graphql/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'graphql-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache external images (podcast artwork, weather icons, etc.)
            urlPattern: /^https:\/\/.+\.(?:png|jpe?g|gif|webp|svg)(?:\?.*)?$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'external-images-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in development for testing
      }
    })
  ],
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: 'hidden', // Generate source maps for Sentry but don't expose to browser
  },
  server: {
    port: 3000,
    strictPort: true,
    cors: true,
    proxy: {
      '/ai/': {
        target: 'http://localhost:3003',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 3000,
    strictPort: true
  }
});
