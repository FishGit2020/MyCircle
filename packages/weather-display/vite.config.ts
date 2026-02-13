import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'weatherDisplay',
      filename: 'remoteEntry.js',
      exposes: {
        './WeatherDisplay': './src/components/WeatherDisplay.tsx',
        './CurrentWeather': './src/components/CurrentWeatherV1.tsx',
        './Forecast': './src/components/Forecast.tsx'
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
    port: 3002,
    strictPort: true,
    cors: true
  },
  preview: {
    port: 3002,
    strictPort: true
  }
});
