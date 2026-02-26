import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { useTranslation, WindowEvents, StorageKeys, eventBus, MFEvents } from '@mycircle/shared';
import { usePodcastEpisodes } from '../hooks/usePodcastData';
import type { Podcast, Episode } from '../hooks/usePodcastData';
import PodcastSearch from './PodcastSearch';
import TrendingPodcasts from './TrendingPodcasts';
import SubscribedPodcasts from './SubscribedPodcasts';
import EpisodeList from './EpisodeList';
import './PodcastPlayer.css';

/** Strip dangerous HTML elements/attributes, keep safe formatting tags */
function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,iframe,style,object,embed,form,input,textarea,select').forEach(el => el.remove());
  doc.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.startsWith('on') || attr.name === 'style') {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'A') {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });
  return doc.body.innerHTML;
}

function loadSubscriptions(): Set<string> {
  try {
    const stored = localStorage.getItem(StorageKeys.PODCAST_SUBSCRIPTIONS);
    if (stored) {
      return new Set(JSON.parse(stored).map(String));
    }
  } catch { /* ignore */ }
  return new Set();
}

function saveSubscriptions(ids: Set<string>) {
  try {
    localStorage.setItem(StorageKeys.PODCAST_SUBSCRIPTIONS, JSON.stringify([...ids]));
  } catch { /* ignore */ }
}

export default function PodcastPlayer() {
  const { t } = useTranslation();
  const { podcastId } = useParams<{ podcastId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(loadSubscriptions);
  const [activeTab, setActiveTab] = useState<'discover' | 'subscribed'>('discover');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth state to conditionally show Subscriptions tab
  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const getToken = (window as any).__getFirebaseIdToken;
        const token = getToken ? await getToken() : null;
        if (mounted) setIsAuthenticated(!!token);
      } catch {
        if (mounted) setIsAuthenticated(false);
      }
    };
    checkAuth();
    const interval = setInterval(checkAuth, 5000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  // Sync URL params → selectedPodcast state
  useEffect(() => {
    if (!podcastId) {
      setSelectedPodcast(null);
    } else if ((location.state as any)?.podcast) {
      setSelectedPodcast((location.state as any).podcast);
    } else {
      // Direct URL without state — redirect to browse
      navigate('/podcasts', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastId]);

  const feedId = selectedPodcast?.id ?? (podcastId ? Number(podcastId) : null);
  const {
    data: episodes,
    loading: episodesLoading,
    error: episodesError,
  } = usePodcastEpisodes(feedId);

  const handleSelectPodcast = useCallback((podcast: Podcast) => {
    navigate(`/podcasts/${podcast.id}`, { state: { podcast } });
  }, [navigate]);

  const handlePlayEpisode = useCallback((episode: Episode) => {
    if (currentEpisode?.id === episode.id) {
      setIsPlaying(prev => !prev);
    } else {
      setCurrentEpisode(episode);
      setIsPlaying(true);
    }
    window.__logAnalyticsEvent?.('episode_play', { podcast_title: selectedPodcast?.title ?? '' });
    eventBus.publish(MFEvents.PODCAST_PLAY_EPISODE, { episode, podcast: selectedPodcast });
  }, [currentEpisode?.id, selectedPodcast]);

  const handleClosePlayer = useCallback(() => {
    setCurrentEpisode(null);
    setIsPlaying(false);
    eventBus.publish(MFEvents.PODCAST_CLOSE_PLAYER);
  }, []);

  const handleToggleSubscribe = useCallback((podcast: Podcast) => {
    setSubscribedIds(prev => {
      const next = new Set(prev);
      const id = String(podcast.id);
      if (next.has(id)) {
        next.delete(id);
        window.__logAnalyticsEvent?.('podcast_subscribe', { podcast_title: podcast.title, action: 'unsubscribe' });
      } else {
        next.add(id);
        window.__logAnalyticsEvent?.('podcast_subscribe', { podcast_title: podcast.title, action: 'subscribe' });
      }
      saveSubscriptions(next);
      // Notify shell for Firestore sync
      window.dispatchEvent(new Event(WindowEvents.SUBSCRIPTIONS_CHANGED));
      return next;
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('podcasts.title')}
        </h1>
        <PodcastSearch onSelectPodcast={handleSelectPodcast} />
      </div>

      {/* Tab bar */}
      {!selectedPodcast && (
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'discover'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t('podcasts.trending')}
          </button>
          {isAuthenticated && (
            <button
              onClick={() => setActiveTab('subscribed')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subscribed'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('podcasts.subscriptions')}
              {subscribedIds.size > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                  {subscribedIds.size}
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Content area */}
      {selectedPodcast ? (
        <div className="podcast-player-fade-in">
          {/* Selected podcast header */}
          <div className="mb-6">
            <div className="flex items-start gap-4">
              {selectedPodcast.artwork ? (
                <img
                  src={selectedPodcast.artwork}
                  alt={selectedPodcast.title}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl object-cover shadow-md flex-shrink-0"
                  loading="lazy"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-12 h-12 text-gray-400 dark:text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedPodcast.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedPodcast.author}
                </p>
                {selectedPodcast.description && (
                  <div
                    className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-3 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_a]:text-blue-500 [&_a]:underline dark:[&_a]:text-blue-400"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedPodcast.description) }}
                  />
                )}
                <div className="mt-3">
                  <button
                    onClick={() => handleToggleSubscribe(selectedPodcast)}
                    className={`text-sm font-medium px-4 py-2 rounded-full transition ${
                      subscribedIds.has(String(selectedPodcast.id))
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50'
                        : 'bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-500'
                    }`}
                    aria-label={
                      subscribedIds.has(String(selectedPodcast.id))
                        ? `${t('podcasts.unsubscribe')} ${selectedPodcast.title}`
                        : `${t('podcasts.subscribe')} ${selectedPodcast.title}`
                    }
                  >
                    {subscribedIds.has(String(selectedPodcast.id))
                      ? t('podcasts.unsubscribe')
                      : t('podcasts.subscribe')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {t('podcasts.episodes')}
            </h3>
            <EpisodeList
              episodes={episodes ?? []}
              loading={episodesLoading}
              error={episodesError}
              currentEpisodeId={currentEpisode?.id ?? null}
              isPlaying={isPlaying}
              onPlayEpisode={handlePlayEpisode}
              podcast={selectedPodcast}
            />
          </div>
        </div>
      ) : activeTab === 'discover' ? (
        <TrendingPodcasts
          onSelectPodcast={handleSelectPodcast}
          subscribedIds={subscribedIds}
          onToggleSubscribe={handleToggleSubscribe}
        />
      ) : (
        <SubscribedPodcasts
          subscribedIds={subscribedIds}
          onSelectPodcast={handleSelectPodcast}
          onUnsubscribe={handleToggleSubscribe}
        />
      )}

    </div>
  );
}
