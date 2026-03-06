import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'hikingMap',
      filename: 'remoteEntry.js',
      exposes: {
        './HikingMap': './src/components/HikingMap.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.2.0' },
        'react-router': { singleton: true, requiredVersion: '^7' },
        '@mycircle/shared': { singleton: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: true,
  },
  server: { port: 3022, strictPort: true },
  preview: { port: 3022, strictPort: true },
});
