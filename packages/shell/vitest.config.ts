import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    testTimeout: 15_000,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'test/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@mycircle/shared': resolve(__dirname, '../shared/src'),
      // Mock remote modules for testing
      'citySearch/CitySearch': resolve(__dirname, './test/mocks/CitySearchMock.tsx'),
      'weatherDisplay/WeatherDisplay': resolve(__dirname, './test/mocks/WeatherDisplayMock.tsx'),
      'stockTracker/StockTracker': resolve(__dirname, './test/mocks/StockTrackerMock.tsx'),
      'podcastPlayer/PodcastPlayer': resolve(__dirname, './test/mocks/PodcastPlayerMock.tsx'),
      'aiAssistant/AiAssistant': resolve(__dirname, './test/mocks/AiAssistantMock.tsx'),
      'bibleReader/BibleReader': resolve(__dirname, './test/mocks/BibleReaderMock.tsx'),
      'worshipSongs/WorshipSongs': resolve(__dirname, './test/mocks/WorshipSongsMock.tsx'),
      'notebook/Notebook': resolve(__dirname, './test/mocks/NotebookMock.tsx'),
      'babyTracker/BabyTracker': resolve(__dirname, './test/mocks/BabyTrackerMock.tsx'),
      'childDevelopment/ChildDevelopment': resolve(__dirname, './test/mocks/ChildDevelopmentMock.tsx'),
      'chineseLearning/ChineseLearning': resolve(__dirname, './test/mocks/ChineseLearningMock.tsx'),
      'englishLearning/EnglishLearning': resolve(__dirname, './test/mocks/EnglishLearningMock.tsx'),
      'flashcards/FlashCards': resolve(__dirname, './test/mocks/FlashCardsMock.tsx'),
      'dailyLog/DailyLog': resolve(__dirname, './test/mocks/DailyLogMock.tsx'),
      'cloudFiles/CloudFiles': resolve(__dirname, './test/mocks/CloudFilesMock.tsx'),
      'modelBenchmark/ModelBenchmark': resolve(__dirname, './test/mocks/ModelBenchmarkMock.tsx'),
      'immigrationTracker/ImmigrationTracker': resolve(__dirname, './test/mocks/ImmigrationTrackerMock.tsx'),
      'digitalLibrary/DigitalLibrary': resolve(__dirname, './test/mocks/DigitalLibraryMock.tsx'),
      'familyGames/FamilyGames': resolve(__dirname, './test/mocks/FamilyGamesMock.tsx'),
      'docScanner/DocScanner': resolve(__dirname, './test/mocks/DocScannerMock.tsx'),
      'hikingMap/HikingMap': resolve(__dirname, './test/mocks/HikingMapMock.tsx'),
      'tripPlanner/TripPlanner': resolve(__dirname, './test/mocks/TripPlannerMock.tsx'),
      'youthTracker/YouthTracker': resolve(__dirname, './test/mocks/YouthTrackerMock.tsx'),
      'virtual:pwa-register/react': resolve(__dirname, './test/mocks/pwaRegisterReactMock.ts')
    }
  }
});
