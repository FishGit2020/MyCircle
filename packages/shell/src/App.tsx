import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router';
import { useTranslation } from '@mycircle/shared';
import { Layout } from './components/layout';
import { RequireAuth, MFEPageWrapper } from './components/common';
import { WeatherCompare } from './components/widgets';
import TransitWrapper from './components/widgets/TransitWrapper';
import DashboardPage from './pages/DashboardPage';
import WeatherLandingPage from './pages/WeatherLandingPage';
import WeatherPage from './pages/WeatherPage';
import WhatsNewPage from './pages/WhatsNewPage';
import RecycleBinPage from './pages/RecycleBinPage';
import QuotaPage from './pages/QuotaPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import { tracedLazy } from './lib/tracedLazy';
import { perf } from './lib/firebase';

const getPerf = () => perf;

// Lazy load remote micro frontends with Firebase Performance tracing
const StockTrackerMF = tracedLazy('mfe_stocks_load', () => import('stockTracker/StockTracker'), getPerf);
const PodcastPlayerMF = tracedLazy('mfe_podcasts_load', () => import('podcastPlayer/PodcastPlayer'), getPerf);
const AiAssistantMF = tracedLazy('mfe_ai_load', () => import('aiAssistant/AiAssistant'), getPerf);
const BibleReaderMF = tracedLazy('mfe_bible_load', () => import('bibleReader/BibleReader'), getPerf);
const WorshipSongsMF = tracedLazy('mfe_worship_load', () => import('worshipSongs/WorshipSongs'), getPerf);
const NotebookMF = tracedLazy('mfe_notebook_load', () => import('notebook/Notebook'), getPerf);
const BabyTrackerMF = tracedLazy('mfe_baby_load', () => import('babyTracker/BabyTracker'), getPerf);
const ChildDevelopmentMF = tracedLazy('mfe_childdev_load', () => import('childDevelopment/ChildDevelopment'), getPerf);
const FlashCardsMF = tracedLazy('mfe_flashcards_load', () => import('flashcards/FlashCards'), getPerf);
const DailyLogMF = tracedLazy('mfe_daily_log_load', () => import('dailyLog/DailyLog'), getPerf);
const CloudFilesMF = tracedLazy('mfe_cloud_files_load', () => import('cloudFiles/CloudFiles'), getPerf);
const ModelBenchmarkMF = tracedLazy('mfe_benchmark_load', () => import('modelBenchmark/ModelBenchmark'), getPerf);
const ImmigrationTrackerMF = tracedLazy('mfe_immigration_load', () => import('immigrationTracker/ImmigrationTracker'), getPerf);
const DigitalLibraryMF = tracedLazy('mfe_digital_library_load', () => import('digitalLibrary/DigitalLibrary'), getPerf);
const FamilyGamesMF = tracedLazy('mfe_family_games_load', () => import('familyGames/FamilyGames'), getPerf);
const DocScannerMF = tracedLazy('mfe_doc_scanner_load', () => import('docScanner/DocScanner'), getPerf);
const HikingMapMF = tracedLazy('mfe_hiking_map_load', () => import('hikingMap/HikingMap'), getPerf);
const TripPlannerMF = tracedLazy('mfe_trip_planner_load', () => import('tripPlanner/TripPlanner'), getPerf);
const PollSystemMF = tracedLazy('mfe_poll_system_load', () => import('pollSystem/PollSystem'), getPerf);
const RadioStationMF = tracedLazy('mfe_radio_station_load', () => import('radioStation/RadioStation'), getPerf);
const AiInterviewerMF = tracedLazy('mfe_ai_interviewer_load', () => import('aiInterviewer/AiInterviewer'), getPerf);
const TravelMapMF = tracedLazy('mfe_travel_map_load', () => import('travelMap/TravelMap'), getPerf);
const DealFinderMF = tracedLazy('mfe_deals_load', () => import('dealFinder/DealFinder'), getPerf);
const WebCrawlerMF = tracedLazy('mfe_web_crawler_load', () => import('webCrawler/WebCrawler'), getPerf);
const ResumeTailorMF = tracedLazy('mfe_resume_tailor_load', () => import('resumeTailor/ResumeTailor'), getPerf);
const SetupMF = tracedLazy('mfe_setup_load', () => import('setup/Setup'), getPerf);

// 404 Not Found
function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="text-center py-16">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">404</h2>
      <p className="text-gray-600 dark:text-gray-400">{t('app.pageNotFound')}</p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    if (import.meta.env.PROD) {
      const prefetchPaths = [
        '/weather-display/assets/remoteEntry.js',
        '/stock-tracker/assets/remoteEntry.js',
        '/podcast-player/assets/remoteEntry.js',
        '/bible-reader/assets/remoteEntry.js',
        '/ai-assistant/assets/remoteEntry.js',
      ];
      prefetchPaths.forEach(path => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = path;
        link.as = 'script';
        document.head.appendChild(link);
      });
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="weather" element={<WeatherLandingPage />} />
        <Route path="weather/:coords" element={<WeatherPage />} />
        <Route path="stocks" element={<MFEPageWrapper component={StockTrackerMF} name="Stock Tracker" />} />
        <Route path="stocks/:symbol" element={<MFEPageWrapper component={StockTrackerMF} name="Stock Tracker" />} />
        <Route path="podcasts" element={<MFEPageWrapper component={PodcastPlayerMF} name="Podcast Player" />} />
        <Route path="podcasts/:podcastId" element={<MFEPageWrapper component={PodcastPlayerMF} name="Podcast Player" />} />
        <Route path="ai" element={<RequireAuth><MFEPageWrapper component={AiAssistantMF} name="AI Assistant" /></RequireAuth>} />
        <Route path="bible" element={<MFEPageWrapper component={BibleReaderMF} name="Bible Reader" />} />
        <Route path="worship" element={<RequireAuth><MFEPageWrapper component={WorshipSongsMF} name="Worship Songs" /></RequireAuth>} />
        <Route path="worship/new" element={<RequireAuth><MFEPageWrapper component={WorshipSongsMF} name="Worship Songs" /></RequireAuth>} />
        <Route path="worship/:songId" element={<RequireAuth><MFEPageWrapper component={WorshipSongsMF} name="Worship Songs" /></RequireAuth>} />
        <Route path="worship/:songId/edit" element={<RequireAuth><MFEPageWrapper component={WorshipSongsMF} name="Worship Songs" /></RequireAuth>} />
        <Route path="notebook" element={<RequireAuth><MFEPageWrapper component={NotebookMF} name="Notebook" /></RequireAuth>} />
        <Route path="notebook/new" element={<RequireAuth><MFEPageWrapper component={NotebookMF} name="Notebook" /></RequireAuth>} />
        <Route path="notebook/:noteId" element={<RequireAuth><MFEPageWrapper component={NotebookMF} name="Notebook" /></RequireAuth>} />
        <Route path="baby" element={<RequireAuth><MFEPageWrapper component={BabyTrackerMF} name="Baby Tracker" /></RequireAuth>} />
        <Route path="child-dev" element={<RequireAuth><MFEPageWrapper component={ChildDevelopmentMF} name="Child Development" /></RequireAuth>} />
        <Route path="flashcards" element={<RequireAuth><MFEPageWrapper component={FlashCardsMF} name="Flash Cards" /></RequireAuth>} />
        <Route path="daily-log" element={<RequireAuth><MFEPageWrapper component={DailyLogMF} name="Daily Log" /></RequireAuth>} />
        <Route path="files" element={<RequireAuth><MFEPageWrapper component={CloudFilesMF} name="Cloud Files" /></RequireAuth>} />
        <Route path="benchmark" element={<RequireAuth><MFEPageWrapper component={ModelBenchmarkMF} name="Model Benchmark" /></RequireAuth>} />
        <Route path="immigration" element={<RequireAuth><MFEPageWrapper component={ImmigrationTrackerMF} name="Immigration Tracker" /></RequireAuth>} />
        <Route path="library" element={<RequireAuth><MFEPageWrapper component={DigitalLibraryMF} name="Digital Library" /></RequireAuth>} />
        <Route path="library/:bookId" element={<RequireAuth><MFEPageWrapper component={DigitalLibraryMF} name="Digital Library" /></RequireAuth>} />
        <Route path="family-games" element={<RequireAuth><MFEPageWrapper component={FamilyGamesMF} name="Family Games" /></RequireAuth>} />
        <Route path="family-games/:gameType" element={<RequireAuth><MFEPageWrapper component={FamilyGamesMF} name="Family Games" /></RequireAuth>} />
        <Route path="doc-scanner" element={<RequireAuth><MFEPageWrapper component={DocScannerMF} name="Doc Scanner" /></RequireAuth>} />
        <Route path="hiking" element={<MFEPageWrapper component={HikingMapMF} name="Hiking Map" />} />
        <Route path="hiking/*" element={<MFEPageWrapper component={HikingMapMF} name="Hiking Map" />} />
        <Route path="trips" element={<RequireAuth><MFEPageWrapper component={TripPlannerMF} name="Trip Planner" /></RequireAuth>} />
        <Route path="polls" element={<RequireAuth><MFEPageWrapper component={PollSystemMF} name="Poll System" /></RequireAuth>} />
        <Route path="radio" element={<MFEPageWrapper component={RadioStationMF} name="Radio Station" />} />
        <Route path="interview" element={<RequireAuth><MFEPageWrapper component={AiInterviewerMF} name="AI Interviewer" /></RequireAuth>} />
        <Route path="transit" element={<TransitWrapper />} />
        <Route path="transit/:stopId" element={<TransitWrapper />} />
        <Route path="travel-map" element={<RequireAuth><MFEPageWrapper component={TravelMapMF} name="Travel Map" /></RequireAuth>} />
        <Route path="deals" element={<MFEPageWrapper component={DealFinderMF} name="Deal Finder" />} />
        <Route path="web-crawler" element={<RequireAuth><MFEPageWrapper component={WebCrawlerMF} name="Web Crawler" /></RequireAuth>} />
        <Route path="resume" element={<RequireAuth><MFEPageWrapper component={ResumeTailorMF} name="Resume Tailor" /></RequireAuth>} />
        <Route path="setup" element={<RequireAuth><MFEPageWrapper component={SetupMF} name="Setup" /></RequireAuth>} />
        <Route path="trash" element={<RequireAuth><RecycleBinPage /></RequireAuth>} />
        <Route path="quota" element={<RequireAuth><QuotaPage /></RequireAuth>} />
        <Route path="whats-new" element={<WhatsNewPage />} />
        <Route path="privacy" element={<PrivacyPolicyPage />} />
        <Route path="terms" element={<TermsOfServicePage />} />
        <Route path="weather/compare" element={<WeatherCompare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
