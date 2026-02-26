import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EpisodeList from './EpisodeList';
import type { Episode } from '../hooks/usePodcastData';

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  StorageKeys: {
    PODCAST_PROGRESS: 'podcast-progress',
    PODCAST_PLAYED_EPISODES: 'podcast-played-episodes',
  },
  WindowEvents: {
    PODCAST_PLAYED_CHANGED: 'podcast-played-changed',
  },
  eventBus: { publish: vi.fn() },
  MFEvents: {
    PODCAST_QUEUE_EPISODE: 'mf:podcast-queue-episode',
  },
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}));

const baseEpisode: Episode = {
  id: 101,
  title: 'Episode One',
  description: 'A test episode',
  enclosureUrl: 'https://example.com/ep1.mp3',
  datePublished: 1700000000,
  duration: 3600,
  image: '',
};

const episode2: Episode = {
  id: 202,
  title: 'Episode Two',
  description: '',
  enclosureUrl: 'https://example.com/ep2.mp3',
  datePublished: 1700100000,
  duration: 1800,
  image: '',
};

describe('EpisodeList', () => {
  const onPlayEpisode = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders episodes', () => {
    render(
      <EpisodeList
        episodes={[baseEpisode]}
        loading={false}
        error={null}
        currentEpisodeId={null}
        isPlaying={false}
        onPlayEpisode={onPlayEpisode}
      />,
    );
    expect(screen.getByText('Episode One')).toBeInTheDocument();
  });

  it('shows mark as played button and toggles on click', () => {
    render(
      <EpisodeList
        episodes={[baseEpisode]}
        loading={false}
        error={null}
        currentEpisodeId={null}
        isPlaying={false}
        onPlayEpisode={onPlayEpisode}
      />,
    );

    const markBtn = screen.getByLabelText('podcasts.markPlayed');
    expect(markBtn).toBeInTheDocument();

    // Click to mark as played
    fireEvent.click(markBtn);

    // Now should show "completed" badge and the button label should change
    expect(screen.getByText('podcasts.completed')).toBeInTheDocument();
    expect(screen.getByLabelText('podcasts.markUnplayed')).toBeInTheDocument();

    // Should have persisted to localStorage
    const stored = JSON.parse(localStorage.getItem('podcast-played-episodes')!);
    expect(stored).toContain('101');
  });

  it('toggles back to unplayed on second click', () => {
    // Pre-set played episodes in localStorage
    localStorage.setItem('podcast-played-episodes', JSON.stringify(['101']));

    render(
      <EpisodeList
        episodes={[baseEpisode]}
        loading={false}
        error={null}
        currentEpisodeId={null}
        isPlaying={false}
        onPlayEpisode={onPlayEpisode}
      />,
    );

    // Should show as played
    expect(screen.getByText('podcasts.completed')).toBeInTheDocument();

    // Click to unmark
    fireEvent.click(screen.getByLabelText('podcasts.markUnplayed'));

    // Should no longer show completed
    expect(screen.queryByText('podcasts.completed')).not.toBeInTheDocument();
    expect(screen.getByLabelText('podcasts.markPlayed')).toBeInTheDocument();

    const stored = JSON.parse(localStorage.getItem('podcast-played-episodes')!);
    expect(stored).not.toContain('101');
  });

  it('merges auto-complete and manual-complete', () => {
    // Episode has progress that marks it as auto-complete
    localStorage.setItem('podcast-progress', JSON.stringify({
      '101': { position: 3598, duration: 3600 },
    }));

    render(
      <EpisodeList
        episodes={[baseEpisode]}
        loading={false}
        error={null}
        currentEpisodeId={101}
        isPlaying={false}
        onPlayEpisode={onPlayEpisode}
      />,
    );

    // Should show completed badge from auto-complete
    expect(screen.getByText('podcasts.completed')).toBeInTheDocument();
  });

  it('dispatches PODCAST_PLAYED_CHANGED event on toggle', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <EpisodeList
        episodes={[baseEpisode]}
        loading={false}
        error={null}
        currentEpisodeId={null}
        isPlaying={false}
        onPlayEpisode={onPlayEpisode}
      />,
    );

    fireEvent.click(screen.getByLabelText('podcasts.markPlayed'));

    const playedEvents = dispatchSpy.mock.calls.filter(
      ([e]) => (e as Event).type === 'podcast-played-changed',
    );
    expect(playedEvents.length).toBeGreaterThan(0);

    dispatchSpy.mockRestore();
  });
});
