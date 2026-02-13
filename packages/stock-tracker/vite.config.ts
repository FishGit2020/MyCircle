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
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1' },
        graphql:            { singleton: true, requiredVersion: '^16.12.0' },
        '@mycircle/shared': { singleton: true },
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
    port: 3005,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3005,
    strictPort: true
  }
});
