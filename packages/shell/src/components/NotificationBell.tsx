import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation, StorageKeys } from '@mycircle/shared';
import { requestNotificationPermission, onForegroundMessage, subscribeToWeatherAlerts, unsubscribeFromWeatherAlerts, subscribeToTopic, unsubscribeFromTopic } from '../lib/messaging';
import { firebaseEnabled } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'weather-alerts-enabled';
const STOCK_ALERTS_KEY = 'stock-alerts-enabled';
const PODCAST_ALERTS_KEY = 'podcast-alerts-enabled';
const ANNOUNCEMENT_ALERTS_KEY = 'announcement-alerts-enabled';

export default function NotificationBell() {
  const { t } = useTranslation();
  const { favoriteCities } = useAuth();
  const [weatherEnabled, setWeatherEnabled] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
  const [stockEnabled, setStockEnabled] = useState(() => localStorage.getItem(STOCK_ALERTS_KEY) === 'true');
  const [podcastEnabled, setPodcastEnabled] = useState(() => localStorage.getItem(PODCAST_ALERTS_KEY) === 'true');
  const [announcementEnabled, setAnnouncementEnabled] = useState(() => localStorage.getItem(ANNOUNCEMENT_ALERTS_KEY) === 'true');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title?: string; body?: string } | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const anyEnabled = weatherEnabled || stockEnabled || podcastEnabled || announcementEnabled;

  // Don't render if Firebase or Notification API isn't available
  if (!firebaseEnabled || typeof Notification === 'undefined') return null;

  const showFeedback = (message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 4000);
  };

  // Close panel on outside click
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showPanel]);

  // Close panel on Escape
  useEffect(() => {
    if (!showPanel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPanel(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showPanel]);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (fcmToken) return fcmToken;
    if (Notification.permission === 'denied') {
      showFeedback(t('notifications.blocked'));
      return null;
    }
    setLoading(true);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setFcmToken(token);
        return token;
      }
      showFeedback(t('notifications.notConfigured'));
      return null;
    } catch {
      showFeedback(t('notifications.failedToEnable'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [fcmToken]);

  const handleToggleWeather = useCallback(async () => {
    if (loading) return;

    if (weatherEnabled && fcmToken) {
      setLoading(true);
      try {
        await unsubscribeFromWeatherAlerts(fcmToken);
        setWeatherEnabled(false);
        localStorage.setItem(STORAGE_KEY, 'false');
        showFeedback(t('notifications.disabled'));
      } catch {
        showFeedback(t('notifications.failedToDisable'));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!favoriteCities || favoriteCities.length === 0) {
      showFeedback(t('notifications.addFavoritesFirst'));
      return;
    }

    const token = await ensureToken();
    if (!token) return;

    setLoading(true);
    try {
      const cities = favoriteCities.map(c => ({ lat: c.lat, lon: c.lon, name: c.name }));
      const ok = await subscribeToWeatherAlerts(token, cities);
      if (ok) {
        setWeatherEnabled(true);
        localStorage.setItem(STORAGE_KEY, 'true');
        showFeedback(t('notifications.enabled'));
      } else {
        showFeedback(t('notifications.subscriptionFailed'));
      }
    } catch {
      showFeedback(t('notifications.failedToEnable'));
    } finally {
      setLoading(false);
    }
  }, [weatherEnabled, loading, fcmToken, favoriteCities, ensureToken]);

  const handleToggleStocks = useCallback(async () => {
    if (loading) return;

    const watchlist = getWatchlist();
    if (!stockEnabled && watchlist.length === 0) {
      showFeedback(t('notifications.noWatchlistForAlerts'));
      return;
    }

    if (stockEnabled) {
      setStockEnabled(false);
      localStorage.setItem(STOCK_ALERTS_KEY, 'false');
      showFeedback(t('notifications.disabled'));
      return;
    }

    const token = await ensureToken();
    if (!token) return;

    setStockEnabled(true);
    localStorage.setItem(STOCK_ALERTS_KEY, 'true');
    showFeedback(t('notifications.enabled'));
  }, [stockEnabled, loading, ensureToken]);

  const handleTogglePodcasts = useCallback(async () => {
    if (loading) return;

    const subs = getSubscribedIds();
    if (!podcastEnabled && subs.length === 0) {
      showFeedback(t('notifications.noSubscriptionsForAlerts'));
      return;
    }

    if (podcastEnabled) {
      setPodcastEnabled(false);
      localStorage.setItem(PODCAST_ALERTS_KEY, 'false');
      showFeedback(t('notifications.disabled'));
      return;
    }

    const token = await ensureToken();
    if (!token) return;

    setPodcastEnabled(true);
    localStorage.setItem(PODCAST_ALERTS_KEY, 'true');
    showFeedback(t('notifications.enabled'));
  }, [podcastEnabled, loading, ensureToken]);

  const handleToggleAnnouncements = useCallback(async () => {
    if (loading) return;

    if (announcementEnabled && fcmToken) {
      setLoading(true);
      try {
        await unsubscribeFromTopic(fcmToken, 'announcements');
        setAnnouncementEnabled(false);
        localStorage.setItem(ANNOUNCEMENT_ALERTS_KEY, 'false');
        showFeedback(t('notifications.disabled'));
      } catch {
        showFeedback(t('notifications.failedToDisable'));
      } finally {
        setLoading(false);
      }
      return;
    }

    const token = await ensureToken();
    if (!token) return;

    setLoading(true);
    try {
      const ok = await subscribeToTopic(token, 'announcements');
      if (ok) {
        setAnnouncementEnabled(true);
        localStorage.setItem(ANNOUNCEMENT_ALERTS_KEY, 'true');
        showFeedback(t('notifications.enabled'));
      } else {
        showFeedback(t('notifications.subscriptionFailed'));
      }
    } catch {
      showFeedback(t('notifications.failedToEnable'));
    } finally {
      setLoading(false);
    }
  }, [announcementEnabled, loading, fcmToken, ensureToken]);

  // Re-acquire FCM token on mount if any alerts were previously enabled
  useEffect(() => {
    if (!anyEnabled || fcmToken) return;
    requestNotificationPermission().then(token => {
      if (token) setFcmToken(token);
    });
  }, [anyEnabled, fcmToken]);

  // Re-subscribe weather when favorites change
  useEffect(() => {
    if (!weatherEnabled || !fcmToken || !favoriteCities || favoriteCities.length === 0) return;
    const cities = favoriteCities.map(c => ({ lat: c.lat, lon: c.lon, name: c.name }));
    subscribeToWeatherAlerts(fcmToken, cities);
  }, [favoriteCities, weatherEnabled, fcmToken]);

  // Re-subscribe announcements topic on token refresh
  useEffect(() => {
    if (!announcementEnabled || !fcmToken) return;
    subscribeToTopic(fcmToken, 'announcements');
  }, [announcementEnabled, fcmToken]);

  // Listen for foreground messages when any alert is enabled
  useEffect(() => {
    if (!anyEnabled) return;
    return onForegroundMessage((payload) => {
      setToast(payload);
      setTimeout(() => setToast(null), 5000);
    });
  }, [anyEnabled]);

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          onClick={() => setShowPanel(p => !p)}
          className={`relative p-2 rounded-lg transition-colors ${
            anyEnabled
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          aria-label={t('notifications.preferences')}
          aria-expanded={showPanel}
          aria-haspopup="true"
        >
          {loading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )}
          {anyEnabled && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </button>

        {/* Notification preferences panel */}
        {showPanel && (
          <div
            role="dialog"
            aria-label={t('notifications.preferences')}
            className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t('notifications.preferences')}
              </h3>
            </div>
            <div className="p-2 space-y-1">
              {/* Weather alerts */}
              <NotificationToggle
                label={t('notifications.weatherAlerts')}
                description={t('notifications.weatherAlertsDesc')}
                enabled={weatherEnabled}
                onToggle={handleToggleWeather}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                }
                color="blue"
              />
              {/* Stock alerts */}
              <NotificationToggle
                label={t('notifications.stockAlerts')}
                description={t('notifications.stockAlertsDesc')}
                enabled={stockEnabled}
                onToggle={handleToggleStocks}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color="green"
              />
              {/* Podcast alerts */}
              <NotificationToggle
                label={t('notifications.podcastAlerts')}
                description={t('notifications.podcastAlertsDesc')}
                enabled={podcastEnabled}
                onToggle={handleTogglePodcasts}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                }
                color="purple"
              />
              {/* Announcement alerts */}
              <NotificationToggle
                label={t('notifications.announcementAlerts')}
                description={t('notifications.announcementAlertsDesc')}
                enabled={announcementEnabled}
                onToggle={handleToggleAnnouncements}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                }
                color="amber"
              />
            </div>
          </div>
        )}

        {/* Inline feedback tooltip */}
        {feedback && (
          <div
            role="status"
            className="absolute top-full right-0 mt-1 whitespace-nowrap bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg z-50"
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Foreground toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in">
          {toast.title && <p className="font-semibold dark:text-white">{toast.title}</p>}
          {toast.body && <p className="text-sm text-gray-600 dark:text-gray-300">{toast.body}</p>}
        </div>
      )}
    </>
  );
}

// ─── Toggle Row Component ──────────────────────────────────────────────────

function NotificationToggle({
  label,
  description,
  enabled,
  onToggle,
  icon,
  color,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-500',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-500',
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500',
  };

  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
      role="switch"
      aria-checked={enabled}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{description}</p>
      </div>
      <div
        className={`w-9 h-5 rounded-full flex-shrink-0 transition-colors relative ${
          enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${
            enabled ? 'translate-x-4' : 'translate-x-0.5'
          }`}
        />
      </div>
    </button>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWatchlist(): Array<{ symbol: string }> {
  try {
    const stored = localStorage.getItem(StorageKeys.STOCK_WATCHLIST);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return [];
}

function getSubscribedIds(): string[] {
  try {
    const stored = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
    if (stored) return JSON.parse(stored).map(String);
  } catch { /* ignore */ }
  return [];
}
