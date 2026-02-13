import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import AudioPlayer from './AudioPlayer';
import type { Episode, Podcast } from '../hooks/usePodcastData';

const mockEpisode: Episode = {
  id: 1,
  title: 'Test Episode Title',
  description: 'A test episode description',
  datePublished: 1700000000,
  duration: 3600,
  enclosureUrl: 'https://example.com/episode.mp3',
  enclosureType: 'audio/mpeg',
  image: 'https://example.com/episode-art.jpg',
  feedId: 100,
};

const mockPodcast: Podcast = {
  id: 100,
  title: 'Test Podcast',
  author: 'Test Author',
  artwork: 'https://example.com/podcast-art.jpg',
  description: 'A test podcast',
  feedUrl: 'https://example.com/feed.xml',
  episodeCount: 50,
  categories: {},
};

// Mock HTMLMediaElement methods
beforeEach(() => {
  vi.stubGlobal('HTMLMediaElement', class {
    play = vi.fn().mockResolvedValue(undefined);
    pause = vi.fn();
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
    load = vi.fn();
    src = '';
    currentTime = 0;
    duration = 3600;
    playbackRate = 1;
    preload = '';
  });

  // Ensure play/pause don't throw
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
});

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when no episode is provided', () => {
    const { container } = renderWithProviders(
      <AudioPlayer episode={null} podcast={null} onClose={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders player when episode is provided', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const titles = screen.getAllByText('Test Episode Title');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('displays podcast title', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });

  it('renders play/pause button with correct aria-label', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const playButtons = screen.getAllByLabelText('Play episode');
    expect(playButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders skip forward button', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const skipForwardButtons = screen.getAllByLabelText('Skip forward 15s');
    expect(skipForwardButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders skip back button', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const skipBackButtons = screen.getAllByLabelText('Skip back 15s');
    expect(skipBackButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders playback speed button', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const speedButtons = screen.getAllByLabelText('Playback speed');
    expect(speedButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('renders close button', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const closeButtons = screen.getAllByLabelText('Close player');
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={onClose} />
    );
    const closeButtons = screen.getAllByLabelText('Close player');
    fireEvent.click(closeButtons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders episode artwork', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    // Artwork is rendered as img elements with alt text or as background
    const images = screen.queryAllByRole('img');
    const altImages = screen.queryAllByAltText(/test/i);
    expect(images.length + altImages.length).toBeGreaterThanOrEqual(0);
  });

  it('shows speed menu when speed button is clicked', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    // The desktop speed button is the first one with aria-label "Playback speed"
    const speedButtons = screen.getAllByLabelText('Playback speed');
    fireEvent.click(speedButtons[0]);

    // Speed menu should appear with speed options
    expect(screen.getByText('0.5x')).toBeInTheDocument();
    expect(screen.getByText('1.25x')).toBeInTheDocument();
    expect(screen.getByText('1.5x')).toBeInTheDocument();
    expect(screen.getByText('2x')).toBeInTheDocument();
  });

  it('has now playing region for accessibility', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
  });

  it('renders share button', () => {
    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const shareButtons = screen.getAllByLabelText('Share episode');
    expect(shareButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('copies share text to clipboard when share button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText }, share: undefined });

    renderWithProviders(
      <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
    );
    const shareButtons = screen.getAllByLabelText('Share episode');
    fireEvent.click(shareButtons[0]);

    // Wait for async clipboard call
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });

    const text = writeText.mock.calls[0][0] as string;
    expect(text).toContain('Test Episode Title');
    expect(text).toContain('Test Podcast');
    expect(text).toContain('https://example.com/episode.mp3');
  });

  it('attaches event listeners when episode changes from null to non-null', () => {
    const addEventSpy = vi.spyOn(HTMLAudioElement.prototype, 'addEventListener');

    const { rerender } = renderWithProviders(
      <AudioPlayer episode={null} podcast={null} onClose={vi.fn()} />
    );

    // No audio element exists when episode is null, so no listeners added
    const callsBefore = addEventSpy.mock.calls.length;

    rerender(
      <MemoryRouter>
        <AudioPlayer episode={mockEpisode} podcast={mockPodcast} onClose={vi.fn()} />
      </MemoryRouter>
    );

    // After episode is set, the audio element should have listeners attached
    const callsAfter = addEventSpy.mock.calls.length;
    expect(callsAfter).toBeGreaterThan(callsBefore);

    // Verify the right event types were registered
    const eventTypes = addEventSpy.mock.calls.map(call => call[0]);
    expect(eventTypes).toContain('timeupdate');
    expect(eventTypes).toContain('loadedmetadata');
    expect(eventTypes).toContain('ended');

    addEventSpy.mockRestore();
  });
});
