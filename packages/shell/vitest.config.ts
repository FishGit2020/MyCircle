import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@mycircle/shared': resolve(__dirname, '../shared/src'),
      // Mock remote modules for testing
      'citySearch/CitySearch': resolve(__dirname, './src/test/mocks/CitySearchMock.tsx'),
      'weatherDisplay/WeatherDisplay': resolve(__dirname, './src/test/mocks/WeatherDisplayMock.tsx'),
      'stockTracker/StockTracker': resolve(__dirname, './src/test/mocks/StockTrackerMock.tsx'),
      'podcastPlayer/PodcastPlayer': resolve(__dirname, './src/test/mocks/PodcastPlayerMock.tsx'),
      'aiAssistant/AiAssistant': resolve(__dirname, './src/test/mocks/AiAssistantMock.tsx'),
      'bibleReader/BibleReader': resolve(__dirname, './src/test/mocks/BibleReaderMock.tsx'),
      'worshipSongs/WorshipSongs': resolve(__dirname, './src/test/mocks/WorshipSongsMock.tsx'),
      'notebook/Notebook': resolve(__dirname, './src/test/mocks/NotebookMock.tsx'),
      'babyTracker/BabyTracker': resolve(__dirname, './src/test/mocks/BabyTrackerMock.tsx'),
      'childDevelopment/ChildDevelopment': resolve(__dirname, './src/test/mocks/ChildDevelopmentMock.tsx'),
      'chineseLearning/ChineseLearning': resolve(__dirname, './src/test/mocks/ChineseLearningMock.tsx'),
      'englishLearning/EnglishLearning': resolve(__dirname, './src/test/mocks/EnglishLearningMock.tsx'),
      'flashcards/FlashCards': resolve(__dirname, './src/test/mocks/FlashCardsMock.tsx'),
      'workTracker/WorkTracker': resolve(__dirname, './src/test/mocks/WorkTrackerMock.tsx'),
      'cloudFiles/CloudFiles': resolve(__dirname, './src/test/mocks/CloudFilesMock.tsx'),
      'virtual:pwa-register/react': resolve(__dirname, './src/test/mocks/pwaRegisterReactMock.ts')
    }
  }
});
