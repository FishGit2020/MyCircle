import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import InlinePlaybackControls from './InlinePlaybackControls';
import type { Episode, Podcast } from '@mycircle/shared';

// Track the subscribeToMFEvent callback so we can trigger playback state changes
let playbackStateCallback: ((data: any) => void) | null = null; // eslint-disable-line @typescript-eslint/no-explicit-any

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
      'player.closePlayer': 'Close player',
    };
    return map[key] ?? key;
  };
  return {
    useTranslation: () => ({ t, locale: 'en-US' }),
    subscribeToMFEvent: vi.fn((_event: string, callback: (data: any) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      playbackStateCallback = callback;
      return () => { playbackStateCallback = null; };
    }),
    eventBus: { publish: (...args: any[]) => mockEventBusPublish(...args) }, // eslint-disable-line @typescript-eslint/no-explicit-any
    MFEvents: {
      AUDIO_PLAYBACK_STATE: 'mf:audio-playback-state',
      AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play',
      AUDIO_SKIP_FORWARD: 'mf:audio-skip-forward',
      AUDIO_SKIP_BACK: 'mf:audio-skip-back',
      AUDIO_SEEK: 'mf:audio-seek',
      AUDIO_CHANGE_SPEED: 'mf:audio-change-speed',
      AUDIO_SET_SLEEP_TIMER: 'mf:audio-set-sleep-timer',
      AUDIO_CLOSE: 'mf:audio-close',
      AUDIO_REMOVE_FROM_QUEUE: 'mf:audio-remove-from-queue',
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

    expect(mockEventBusPublish).toHaveBeenCalledWith('mf:audio-toggle-play');
  });

  it('shows pause button when playback state is playing', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    act(() => {
      playbackStateCallback?.({
        type: 'podcast',
        isPlaying: true,
        currentTime: 60,
        duration: 1800,
        playbackSpeed: 1,
        sleepMinutes: 0,
        sleepRemaining: 0,
        trackIndex: 0,
        totalTracks: 1,
        trackTitle: 'Test Episode Title',
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
    expect(mockEventBusPublish).toHaveBeenCalledWith('mf:audio-skip-back');

    fireEvent.click(screen.getByLabelText('Skip forward'));
    expect(mockEventBusPublish).toHaveBeenCalledWith('mf:audio-skip-forward');
  });

  it('renders seek slider', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    expect(screen.getByRole('slider', { name: 'Seek position' })).toBeInTheDocument();
  });

  it('displays formatted time for current time and duration', () => {
    render(<InlinePlaybackControls episode={mockEpisode} podcast={mockPodcast} />);

    act(() => {
      playbackStateCallback?.({
        type: 'podcast',
        isPlaying: true,
        currentTime: 125,  // 2:05
        duration: 1800,    // 30:00
        playbackSpeed: 1,
        sleepMinutes: 0,
        sleepRemaining: 0,
        trackIndex: 0,
        totalTracks: 1,
        trackTitle: 'Test Episode Title',
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

    expect(mockEventBusPublish).toHaveBeenCalledWith('mf:audio-change-speed', { speed: 1.5 });
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

    expect(mockEventBusPublish).toHaveBeenCalledWith('mf:audio-close');
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
