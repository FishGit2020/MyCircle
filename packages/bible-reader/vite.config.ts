import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'bibleReader',
      filename: 'remoteEntry.js',
      exposes: {
        './BibleReader': './src/components/BibleReader.tsx'
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
    port: 3008,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3008,
    strictPort: true
  }
});
