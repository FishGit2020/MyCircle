import React, { Suspense, lazy, useState, useRef } from 'react';
import { Routes, Route, useParams, useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from '@weather/shared';
import { toPng } from 'html-to-image';
import Layout from './components/Layout';
import Loading from './components/Loading';
import ErrorBoundary from './components/ErrorBoundary';
import WeatherCompare from './components/WeatherCompare';
import DashboardPage from './pages/DashboardPage';
import { useAuth } from './context/AuthContext';

// Lazy load remote micro frontends
const WeatherDisplayMF = lazy(() => import('weatherDisplay/WeatherDisplay'));
const StockTrackerMF = lazy(() => import('stockTracker/StockTracker'));
const PodcastPlayerMF = lazy(() => import('podcastPlayer/PodcastPlayer'));
const AiAssistantMF = lazy(() => import('aiAssistant/AiAssistant'));

// Fallback components for when remote modules fail to load
const WeatherDisplayFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">Weather Display module is loading...</p>
  </div>
);

// Favorite star button for weather page
function FavoriteButton() {
  const { t } = useTranslation();
  const { coords } = useParams<{ coords: string }>();
  const [searchParams] = useSearchParams();
  const { user, favoriteCities, toggleFavorite } = useAuth();

  if (!user || !coords) return null;

  const [lat, lon] = coords.split(',').map(Number);
  if (isNaN(lat) || isNaN(lon)) return null;

  const cityName = searchParams.get('name') || 'Unknown';
  const cityId = `${lat},${lon}`;
  const isFavorite = favoriteCities.some(c => c.id === cityId);

  const handleToggle = async () => {
    await toggleFavorite({
      id: cityId,
      name: cityName,
      country: '',
      lat,
      lon,
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        isFavorite
          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
      }`}
      title={isFavorite ? t('favorites.removeFromFavorites') : t('favorites.addToFavorites')}
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      {isFavorite ? t('favorites.favorited') : t('favorites.favorite')}
    </button>
  );
}

// Share button for weather page — supports link sharing and image download
function ShareButton({ weatherRef }: { weatherRef: React.RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [searchParams] = useSearchParams();
  const cityName = searchParams.get('name') || 'Weather';

  const handleShareLink = async () => {
    const url = window.location.href;
    const text = `Check out the weather in ${cityName}!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `${cityName} Weather`, text, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
    }
  };

  const handleShareImage = async () => {
    if (!weatherRef.current || capturing) return;
    setCapturing(true);
    try {
      const dataUrl = await toPng(weatherRef.current, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
        pixelRatio: 2,
      });

      // Try native share with file if supported
      if (navigator.share && navigator.canShare) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${cityName}-weather.png`, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: `${cityName} Weather` });
            return;
          } catch { /* fall through to download */ }
        }
      }

      // Download as fallback
      const link = document.createElement('a');
      link.download = `${cityName}-weather.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to capture weather image:', err);
    } finally {
      setCapturing(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleShareLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
        title={t('share.shareLink')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        {copied ? t('share.copied') : t('share.share')}
      </button>
      <button
        onClick={handleShareImage}
        disabled={capturing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition disabled:opacity-50"
        title={t('share.saveAsImage')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {capturing ? t('share.saving') : t('share.image')}
      </button>
    </div>
  );
}

// Weather page with full weather display
function WeatherPage() {
  const weatherRef = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <ShareButton weatherRef={weatherRef} />
        <FavoriteButton />
      </div>
      <div ref={weatherRef}>
        <ErrorBoundary fallback={<WeatherDisplayFallback />}>
          <Suspense fallback={<Loading />}>
            <WeatherDisplayMF />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}

// Fallback for stock tracker MFE
const StockTrackerFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">Stock Tracker module is loading...</p>
  </div>
);

function StocksPage() {
  return (
    <ErrorBoundary fallback={<StockTrackerFallback />}>
      <Suspense fallback={<Loading />}>
        <StockTrackerMF />
      </Suspense>
    </ErrorBoundary>
  );
}

// Fallback for podcast player MFE
const PodcastPlayerFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">Podcast Player module is loading...</p>
  </div>
);

function PodcastsPage() {
  return (
    <ErrorBoundary fallback={<PodcastPlayerFallback />}>
      <Suspense fallback={<Loading />}>
        <PodcastPlayerMF />
      </Suspense>
    </ErrorBoundary>
  );
}

// Fallback for AI assistant MFE
const AiAssistantFallback = () => (
  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
    <p className="text-yellow-700 dark:text-yellow-300">AI Assistant module is loading...</p>
  </div>
);

function AiPage() {
  return (
    <ErrorBoundary fallback={<AiAssistantFallback />}>
      <Suspense fallback={<Loading />}>
        <AiAssistantMF />
      </Suspense>
    </ErrorBoundary>
  );
}

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
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="weather/:coords" element={<WeatherPage />} />
        <Route path="stocks" element={<StocksPage />} />
        <Route path="podcasts" element={<PodcastsPage />} />
        <Route path="ai" element={<AiPage />} />
        <Route path="compare" element={<WeatherCompare />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
