import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'worshipSongs',
      filename: 'remoteEntry.js',
      exposes: {
        './WorshipSongs': './src/components/WorshipSongs.tsx'
      },
      shared: ['react', 'react-dom', 'react-router', '@mycircle/shared']
    })
  ],
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false
  },
  server: {
    port: 3009,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3009,
    strictPort: true
  }
});
