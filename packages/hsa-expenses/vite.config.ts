import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'hsaExpenses',
      filename: 'remoteEntry.js',
      exposes: {
        './HsaExpenses': './src/components/HsaExpenses.tsx'
      },
      shared: {
        react:              { singleton: true, requiredVersion: '^18.2.0' },
        'react-dom':        { singleton: true, requiredVersion: '^18.2.0' },
        'react-router':     { singleton: true, requiredVersion: '^7' },
        '@mycircle/shared': { singleton: true },
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
    cssCodeSplit: false
  },
  server: {
    port: 3033,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3033,
    strictPort: true
  }
});
