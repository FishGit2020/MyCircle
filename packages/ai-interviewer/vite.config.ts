import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'aiInterviewer',
      filename: 'remoteEntry.js',
      exposes: {
        './AiInterviewer': './src/components/AiInterviewer.tsx',
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@mycircle/shared': { singleton: true },
      },
    }),
  ],
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: 'esbuild',
    cssCodeSplit: false,
  },
  server: {
    port: 3027,
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 3027,
    strictPort: true,
  },
});
