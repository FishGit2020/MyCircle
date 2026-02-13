import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'stockTracker',
      filename: 'remoteEntry.js',
      exposes: {
        './StockTracker': './src/components/StockTracker.tsx'
      },
      shared: ['react', 'react-dom', 'react-router', '@apollo/client', 'graphql', '@mycircle/shared']
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  },
  server: {
    port: 3005,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3005,
    strictPort: true
  }
});
