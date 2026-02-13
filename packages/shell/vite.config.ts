import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

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

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        citySearch: citySearchRemote,
        weatherDisplay: weatherDisplayRemote,
        stockTracker: stockTrackerRemote,
        podcastPlayer: podcastPlayerRemote,
        aiAssistant: aiAssistantRemote,
        bibleReader: bibleReaderRemote,
        worshipSongs: worshipSongsRemote
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1' },
        graphql:            { singleton: true, requiredVersion: '^16.12.0' },
        '@mycircle/shared': { singleton: true },
      }
    }),
    ...(isAnalyze
      ? [visualizer({ open: true, filename: 'stats.html', gzipSize: true }) as PluginOption]
      : []),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icons/*.png'],
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
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/graphql/,
          /^\/stock\//,
          /^\/podcast\//,
          /^\/ai\//,
          /^\/api\//,
        ],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
            urlPattern: /^https:\/\/.*\.openweathermap\.org\/.*/i,
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
          }
        ]
      },
      devOptions: {
        enabled: true // Enable PWA in development for testing
      }
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
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
