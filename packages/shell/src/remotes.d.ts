/// <reference types="vite-plugin-pwa/react" />

// Type declarations for remote micro frontend modules
declare module 'citySearch/CitySearch' {
  import type { FavoriteCity, RecentCity } from './lib/firebase';
  import type { City } from '@mycircle/shared';
  interface CitySearchProps {
    onCitySelect?: (city: City) => void;
    recentCities?: RecentCity[];
    onRemoveCity?: (cityId: string) => void;
    onClearRecents?: () => void;
    favoriteCities?: FavoriteCity[];
    onToggleFavorite?: (city: FavoriteCity) => Promise<boolean>;
  }
  const CitySearch: React.ComponentType<CitySearchProps>;
  export default CitySearch;
}

declare module 'weatherDisplay/WeatherDisplay' {
  interface WeatherDisplayProps {
    favoriteCities?: Array<{ id: string; name: string; country: string; state?: string; lat: number; lon: number }>;
    currentCityId?: string;
  }
  const WeatherDisplay: React.ComponentType<WeatherDisplayProps>;
  export default WeatherDisplay;
}

declare module 'stockTracker/StockTracker' {
  const StockTracker: React.ComponentType;
  export default StockTracker;
}

declare module 'podcastPlayer/PodcastPlayer' {
  const PodcastPlayer: React.ComponentType;
  export default PodcastPlayer;
}

declare module 'aiAssistant/AiAssistant' {
  const AiAssistant: React.ComponentType;
  export default AiAssistant;
}

declare module 'bibleReader/BibleReader' {
  const BibleReader: React.ComponentType;
  export default BibleReader;
}

declare module 'worshipSongs/WorshipSongs' {
  const WorshipSongs: React.ComponentType;
  export default WorshipSongs;
}

declare module 'notebook/Notebook' {
  const Notebook: React.ComponentType;
  export default Notebook;
}

declare module 'babyTracker/BabyTracker' {
  const BabyTracker: React.ComponentType;
  export default BabyTracker;
}

declare module 'childDevelopment/ChildDevelopment' {
  const ChildDevelopment: React.ComponentType;
  export default ChildDevelopment;
}

declare module 'chineseLearning/ChineseLearning' {
  const ChineseLearning: React.ComponentType;
  export default ChineseLearning;
}

declare module 'englishLearning/EnglishLearning' {
  const EnglishLearning: React.ComponentType;
  export default EnglishLearning;
}

declare module 'flashcards/FlashCards' {
  const FlashCards: React.ComponentType;
  export default FlashCards;
}

declare module 'dailyLog/DailyLog' {
  const DailyLog: React.ComponentType;
  export default DailyLog;
}

declare module 'cloudFiles/CloudFiles' {
  const CloudFiles: React.ComponentType;
  export default CloudFiles;
}

declare module 'modelBenchmark/ModelBenchmark' {
  const ModelBenchmark: React.ComponentType;
  export default ModelBenchmark;
}

declare module 'immigrationTracker/ImmigrationTracker' {
  const ImmigrationTracker: React.ComponentType;
  export default ImmigrationTracker;
}

declare module 'digitalLibrary/DigitalLibrary' {
  const DigitalLibrary: React.ComponentType;
  export default DigitalLibrary;
}

declare module 'familyGames/FamilyGames' {
  const FamilyGames: React.ComponentType;
  export default FamilyGames;
}

interface LeaderboardEntry {
  uid: string;
  displayName: string;
  gameType: string;
  score: number;
  timeMs: number;
  difficulty: string;
  playedAt: string;
}

declare module 'docScanner/DocScanner' {
  const DocScanner: React.ComponentType;
  export default DocScanner;
}

declare module 'hikingMap/HikingMap' {
  const HikingMap: React.ComponentType;
  export default HikingMap;
}

declare module 'tripPlanner/TripPlanner' {
  const TripPlanner: React.ComponentType;
  export default TripPlanner;
}

declare module 'pollSystem/PollSystem' {
  const PollSystem: React.ComponentType;
  export default PollSystem;
}

declare module 'radioStation/RadioStation' {
  const RadioStation: React.ComponentType;
  export default RadioStation;
}

declare module 'aiInterviewer/AiInterviewer' {
  const AiInterviewer: React.ComponentType;
  export default AiInterviewer;
}

declare module 'transitTracker/TransitTracker' {
  interface TransitTrackerProps {
    favoriteCities?: Array<{ id: string; name: string; lat: number; lon: number }>;
  }
  const TransitTracker: React.ComponentType<TransitTrackerProps>;
  export default TransitTracker;
}

declare module 'travelMap/TravelMap' {
  const TravelMap: React.ComponentType;
  export default TravelMap;
}

declare module 'dealFinder/DealFinder' {
  const DealFinder: React.ComponentType;
  export default DealFinder;
}

declare module 'webCrawler/WebCrawler' {
  const WebCrawler: React.ComponentType;
  export default WebCrawler;
}

declare module 'resumeTailor/ResumeTailor' {
  const ResumeTailor: React.ComponentType;
  export default ResumeTailor;
}

declare module 'setup/Setup' {
  const Setup: React.ComponentType;
  export default Setup;
}

declare module 'hsaExpenses/HsaExpenses' {
  const HsaExpenses: React.ComponentType;
  export default HsaExpenses;
}

declare module 'anniversary/Anniversary' {
  const Anniversary: React.ComponentType;
  export default Anniversary;
}
