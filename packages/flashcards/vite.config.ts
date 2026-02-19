import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'flashcards',
      filename: 'remoteEntry.js',
      exposes: {
        './FlashCards': './src/components/FlashCards.tsx'
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@apollo/client':   { singleton: true, requiredVersion: '^4.1.1', eager: false },
        graphql:            { singleton: true, requiredVersion: '^16.12.0', eager: false },
        '@mycircle/shared': { singleton: true },
      }
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false
  },
  server: {
    port: 3015,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3015,
    strictPort: true
  }
});
