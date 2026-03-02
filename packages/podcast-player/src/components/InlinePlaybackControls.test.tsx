import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InlinePlaybackControls from './InlinePlaybackControls';
import type { Episode, Podcast } from '@mycircle/shared';

// Track the subscribeToMFEvent callback so we can trigger playback state changes
let playbackStateCallback: ((data: any) => void) | null = null;

const mockEventBusPublish = vi.fn();

vi.mock('@mycircle/shared', () => {
  const t = (key: string) => {
    const map: Record<string, string> = {
      'podcasts.nowPlaying': 'Now Playing',
      'podcasts.playEpisode': 'Play',
      'podcasts.pauseEpisode': 'Pause',
      'podcasts.skipBack': 'Skip back',
      'podcasts.skipForward': 'Skip forward',
      'podcasts.speed': 'Speed',
      'podcasts.sleepTimer': 'Sleep timer',
      'podcasts.sleepOff': 'Off',
      'podcasts.queue': 'Queue',
      'podcasts.queueEmpty': 'Queue is empty',
      'podcasts.removeFromQueue': 'Remove from queue',
      'podcasts.seekPosition': 'Seek position',
      'podcasts.shareEpisode': 'Share episode',
      'podcasts.shareCopied': 'Copied!',
      'podcasts.shareText': 'Listening to {episode} from {podcast} at {time}',
      'podcasts.closePlayer': 'Close player',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
    subscribeToMFEvent: vi.fn((_event: string, callback: (data: any) => void) => {
      playbackStateCallback = callback;
      return () => { playbackStateCallback = null; };
    }),
    eventBus: { publish: (...args: any[]) => mockEventBusPublish(...args) },
    MFEvents: {
      PODCAST_PLAYBACK_STATE: 'podcast:playback-state',
      PODCAST_TOGGLE_PLAY: 'podcast:toggle-play',
      PODCAST_SKIP_FORWARD: 'podcast:skip-forward',
      PODCAST_SKIP_BACK: 'podcast:skip-back',
      PODCAST_SEEK: 'podcast:seek',
      PODCAST_CHANGE_SPEED: 'podcast:change-speed',
      PODCAST_SET_SLEEP_TIMER: 'podcast:set-sleep-timer',
      PODCAST_CLOSE_PLAYER: 'podcast:close-player',
      PODCAST_REMOVE_FROM_QUEUE: 'podcast:remove-from-queue',
    },
  };
});

const mockEpisode: Episode = {
  id: 1,
  title: 'Test Episode Title',
  description: 'A test episode',
  datePublished: 1700000000,
  duration: 1800,
  enclosureUrl: 'https://example.com/episode.mp3',
  enclosureType: 'audio/mpeg',
  image: 'https://example.com/episode.jpg',
  feedId: 100,
};

const mockPodcast: Podcast = {
  id: 100,
  title: 'Test Podcast Show',
  author: 'Test Author',
  artwork: 'https://example.com/artwork.jpg',
  description: 'A test podcast',
  feedUrl: 'https://example.com/feed.xml',
  episodeCount: 50,
  categories: {},
};

describe('InlinePlaybackControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playbackStateCallback = null;
  });

  it('renders episode title', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByText('Test Episode Title')).toBeInTheDocument();
  });

  it('renders podcast title', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByText('Test Podcast Show')).toBeInTheDocument();
  });

  it('renders Now Playing region', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
  });

  it('renders episode artwork', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe('https://example.com/episode.jpg');
  });

  it('falls back to podcast artwork when episode has no image', () => {
    const noImageEpisode = { ...mockEpisode, image: '' };
    render(<InlinePlaybackControls episode={noImageEpisode} podcast={mockPodcast} />);

    const img = document.querySelector('img');
    expect(img).toBeInTheDocument();
    expect(img?.getAttribute('src')).toBe('https://example.com/artwork.jpg');
  });

  it('renders play button initially (not playing)', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('publishes toggle play event when play button is clicked', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    fireEvent.click(screen.getByLabelText('Play'));

    expect(mockEventBusPublish).toHaveBeenCalledWith('podcast:toggle-play');
  });

  it('shows pause button when playback state is playing', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    act(() => {
      playbackStateCallback?.({
        isPlaying: true,
        currentTime: 60,
        duration: 1800,
        playbackSpeed: 1,
        sleepMinutes: 0,
        sleepRemaining: 0,
        queueLength: 0,
        queue: [],
      });
    });

    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('renders skip back and skip forward buttons', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Skip back')).toBeInTheDocument();
    expect(screen.getByLabelText('Skip forward')).toBeInTheDocument();
  });

  it('publishes skip events when skip buttons are clicked', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    fireEvent.click(screen.getByLabelText('Skip back'));
    expect(mockEventBusPublish).toHaveBeenCalledWith('podcast:skip-back');

    fireEvent.click(screen.getByLabelText('Skip forward'));
    expect(mockEventBusPublish).toHaveBeenCalledWith('podcast:skip-forward');
  });

  it('renders seek slider', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByRole('slider', { name: 'Seek position' })).toBeInTheDocument();
  });

  it('displays formatted time for current time and duration', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    act(() => {
      playbackStateCallback?.({
        isPlaying: true,
        currentTime: 125,  // 2:05
        duration: 1800,    // 30:00
        playbackSpeed: 1,
        sleepMinutes: 0,
        sleepRemaining: 0,
        queueLength: 0,
        queue: [],
      });
    });

    expect(screen.getByText('2:05')).toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('renders speed control button showing current speed', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Speed')).toBeInTheDocument();
    expect(screen.getByText('1x')).toBeInTheDocument();
  });

  it('shows speed menu when speed button is clicked', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    fireEvent.click(screen.getByLabelText('Speed'));

    // Speed options should appear
    expect(screen.getByText('0.5x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('publishes speed change event when a speed option is selected', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    fireEvent.click(screen.getByLabelText('Speed'));
    fireEvent.click(screen.getByText('1.5x'));

    expect(mockEventBusPublish).toHaveBeenCalledWith('podcast:change-speed', { speed: 1.5 });
  });

  it('renders sleep timer button', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Sleep timer')).toBeInTheDocument();
  });

  it('renders close player button', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Close player')).toBeInTheDocument();
  });

  it('publishes close event when close button is clicked', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    fireEvent.click(screen.getByLabelText('Close player'));

    expect(mockEventBusPublish).toHaveBeenCalledWith('podcast:close-player');
  });

  it('renders share button', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Share episode')).toBeInTheDocument();
  });

  it('renders queue button', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByLabelText('Queue')).toBeInTheDocument();
  });

  it('handles null podcast gracefully', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={null} />);

    expect(screen.getByText('Test Episode Title')).toBeInTheDocument();
    // No podcast title should be rendered
    expect(screen.queryByText('Test Podcast Show')).not.toBeInTheDocument();
  });
});
