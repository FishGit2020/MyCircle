import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'citySearch/CitySearch': resolve(__dirname, './packages/shell/src/test/mocks/CitySearchMock.tsx'),
      'weatherDisplay/WeatherDisplay': resolve(__dirname, './packages/shell/src/test/mocks/WeatherDisplayMock.tsx'),
      'stockTracker/StockTracker': resolve(__dirname, './packages/shell/src/test/mocks/StockTrackerMock.tsx'),
      'podcastPlayer/PodcastPlayer': resolve(__dirname, './packages/shell/src/test/mocks/PodcastPlayerMock.tsx'),
      'aiAssistant/AiAssistant': resolve(__dirname, './packages/shell/src/test/mocks/AiAssistantMock.tsx'),
      'bibleReader/BibleReader': resolve(__dirname, './packages/shell/src/test/mocks/BibleReaderMock.tsx'),
      'worshipSongs/WorshipSongs': resolve(__dirname, './packages/shell/src/test/mocks/WorshipSongsMock.tsx'),
      'notebook/Notebook': resolve(__dirname, './packages/shell/src/test/mocks/NotebookMock.tsx'),
      'babyTracker/BabyTracker': resolve(__dirname, './packages/shell/src/test/mocks/BabyTrackerMock.tsx'),
      'childDevelopment/ChildDevelopment': resolve(__dirname, './packages/shell/src/test/mocks/ChildDevelopmentMock.tsx'),
      'chineseLearning/ChineseLearning': resolve(__dirname, './packages/shell/src/test/mocks/ChineseLearningMock.tsx'),
      'englishLearning/EnglishLearning': resolve(__dirname, './packages/shell/src/test/mocks/EnglishLearningMock.tsx'),
      'flashcards/FlashCards': resolve(__dirname, './packages/shell/src/test/mocks/FlashCardsMock.tsx'),
      'workTracker/WorkTracker': resolve(__dirname, './packages/shell/src/test/mocks/WorkTrackerMock.tsx'),
      'cloudFiles/CloudFiles': resolve(__dirname, './packages/shell/src/test/mocks/CloudFilesMock.tsx'),
      'modelBenchmark/ModelBenchmark': resolve(__dirname, './packages/shell/src/test/mocks/ModelBenchmarkMock.tsx'),
      'virtual:pwa-register/react': resolve(__dirname, './packages/shell/src/test/mocks/pwaRegisterReactMock.ts'),
      '@weather/shared': resolve(__dirname, './packages/shared/src'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      'functions/**',
      'packages/cloud-files/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/'
      ]
    }
  }
})
