import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CitySearchWrapper from './CitySearchWrapper';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
  StorageKeys: {
    THEME: 'theme', LOCALE: 'locale', WEATHER_ALERTS: 'weather-alerts',
    DISTANCE_UNIT: 'distance-unit', TEMP_UNIT: 'temp-unit', SPEED_UNIT: 'speed-unit',
    WIDGET_LAYOUT: 'widget-dashboard-layout', STOCK_WATCHLIST: 'stock-tracker-watchlist',
    PODCAST_SUBSCRIPTIONS: 'podcast-subscriptions', PODCAST_NOW_PLAYING: 'podcast-now-playing',
    PODCAST_LAST_PLAYED: 'podcast-last-played', PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
    WORSHIP_SONGS_CACHE: 'worship-songs-cache', WORSHIP_FAVORITES: 'worship-favorites',
    NOTEBOOK_CACHE: 'notebook-cache', BABY_DUE_DATE: 'baby-due-date',
    CHILD_NAME: 'child-name', CHILD_BIRTH_DATE: 'child-birth-date',
    BIBLE_BOOKMARKS: 'bible-bookmarks', FLASHCARD_PROGRESS: 'flashcard-progress',
    DAILY_LOG_CACHE: 'daily-log-cache', BOOK_LAST_PLAYED: 'book-last-played',
    BOOK_AUDIO_PROGRESS: 'book-audio-progress', BOOK_BOOKMARKS: 'book-bookmarks',
    ONBOARDING_COMPLETE: 'mycircle-onboarding-complete',
    KNOWN_ACCOUNTS: 'mycircle-known-accounts',
  },
  WindowEvents: {},
}));

describe('CitySearchWrapper', () => {
  it('renders the lazy-loaded CitySearch module', async () => {
    render(<CitySearchWrapper />);
    expect(await screen.findByTestId('city-search-mock')).toBeInTheDocument();
  });

  it('renders the search input from the mock', async () => {
    render(<CitySearchWrapper />);
    expect(await screen.findByPlaceholderText('Search for a city...')).toBeInTheDocument();
  });
});
