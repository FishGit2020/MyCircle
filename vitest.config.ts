import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'citySearch/CitySearch': resolve(__dirname, './packages/shell/test/mocks/CitySearchMock.tsx'),
      'weatherDisplay/WeatherDisplay': resolve(__dirname, './packages/shell/test/mocks/WeatherDisplayMock.tsx'),
      'stockTracker/StockTracker': resolve(__dirname, './packages/shell/test/mocks/StockTrackerMock.tsx'),
      'podcastPlayer/PodcastPlayer': resolve(__dirname, './packages/shell/test/mocks/PodcastPlayerMock.tsx'),
      'aiAssistant/AiAssistant': resolve(__dirname, './packages/shell/test/mocks/AiAssistantMock.tsx'),
      'bibleReader/BibleReader': resolve(__dirname, './packages/shell/test/mocks/BibleReaderMock.tsx'),
      'worshipSongs/WorshipSongs': resolve(__dirname, './packages/shell/test/mocks/WorshipSongsMock.tsx'),
      'notebook/Notebook': resolve(__dirname, './packages/shell/test/mocks/NotebookMock.tsx'),
      'babyTracker/BabyTracker': resolve(__dirname, './packages/shell/test/mocks/BabyTrackerMock.tsx'),
      'childDevelopment/ChildDevelopment': resolve(__dirname, './packages/shell/test/mocks/ChildDevelopmentMock.tsx'),
      'chineseLearning/ChineseLearning': resolve(__dirname, './packages/shell/test/mocks/ChineseLearningMock.tsx'),
      'englishLearning/EnglishLearning': resolve(__dirname, './packages/shell/test/mocks/EnglishLearningMock.tsx'),
      'flashcards/FlashCards': resolve(__dirname, './packages/shell/test/mocks/FlashCardsMock.tsx'),
      'dailyLog/DailyLog': resolve(__dirname, './packages/shell/test/mocks/DailyLogMock.tsx'),
      'cloudFiles/CloudFiles': resolve(__dirname, './packages/shell/test/mocks/CloudFilesMock.tsx'),
      'modelBenchmark/ModelBenchmark': resolve(__dirname, './packages/shell/test/mocks/ModelBenchmarkMock.tsx'),
      'immigrationTracker/ImmigrationTracker': resolve(__dirname, './packages/shell/test/mocks/ImmigrationTrackerMock.tsx'),
      'digitalLibrary/DigitalLibrary': resolve(__dirname, './packages/shell/test/mocks/DigitalLibraryMock.tsx'),
      'familyGames/FamilyGames': resolve(__dirname, './packages/shell/test/mocks/FamilyGamesMock.tsx'),
      'docScanner/DocScanner': resolve(__dirname, './packages/shell/test/mocks/DocScannerMock.tsx'),
      'hikingMap/HikingMap': resolve(__dirname, './packages/shell/test/mocks/HikingMapMock.tsx'),
      'tripPlanner/TripPlanner': resolve(__dirname, './packages/shell/test/mocks/TripPlannerMock.tsx'),
      'pollSystem/PollSystem': resolve(__dirname, './packages/shell/test/mocks/PollSystemMock.tsx'),
      'radioStation/RadioStation': resolve(__dirname, './packages/shell/test/mocks/RadioStationMock.tsx'),
      'aiInterviewer/AiInterviewer': resolve(__dirname, './packages/shell/test/mocks/AiInterviewerMock.tsx'),
      'transitTracker/TransitTracker': resolve(__dirname, './packages/shell/test/mocks/TransitTrackerMock.tsx'),
      'travelMap/TravelMap': resolve(__dirname, './packages/shell/test/mocks/TravelMapMock.tsx'),
      'dealFinder/DealFinder': resolve(__dirname, './packages/shell/test/mocks/DealFinderMock.tsx'),
      'webCrawler/WebCrawler': resolve(__dirname, './packages/shell/test/mocks/WebCrawlerMock.tsx'),
      'resumeTailor/ResumeTailor': resolve(__dirname, './packages/shell/test/mocks/ResumeTailorMock.tsx'),
      'setup/Setup': resolve(__dirname, './packages/shell/test/mocks/SetupMock.tsx'),
      'hsaExpenses/HsaExpenses': resolve(__dirname, './packages/shell/test/mocks/HsaExpensesMock.tsx'),
      'virtual:pwa-register/react': resolve(__dirname, './packages/shell/test/mocks/pwaRegisterReactMock.ts'),
      'epubjs': resolve(__dirname, './test/mocks/epubjsMock.ts'),
      '@mycircle/shared': resolve(__dirname, './packages/shared/src'),
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: process.env.CI ? 4 : undefined,
      },
    },
    setupFiles: ['./test/setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'e2e/**',
      'functions/**',
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
