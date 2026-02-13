import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'podcastPlayer',
      filename: 'remoteEntry.js',
      exposes: {
        './PodcastPlayer': './src/components/PodcastPlayer.tsx'
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
    port: 3006,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3006,
    strictPort: true
  }
});
