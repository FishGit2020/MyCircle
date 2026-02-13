import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import GlobalAudioPlayer from './GlobalAudioPlayer';
import { MFEvents } from '@weather/shared';

// Mock HTMLMediaElement methods
beforeEach(() => {
  Object.defineProperty(HTMLMediaElement.prototype, 'play', {
    configurable: true,
    value: vi.fn().mockResolvedValue(undefined),
  });
  Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
    configurable: true,
    value: vi.fn(),
  });
});

const mockEpisode = {
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

const mockPodcast = {
  id: 100,
  title: 'Test Podcast',
  author: 'Test Author',
  artwork: 'https://example.com/podcast-art.jpg',
  description: 'A test podcast',
  feedUrl: 'https://example.com/feed.xml',
  episodeCount: 50,
  categories: {},
};

function dispatchPlayEvent(episode = mockEpisode, podcast = mockPodcast) {
  window.dispatchEvent(
    new CustomEvent(MFEvents.PODCAST_PLAY_EPISODE, {
      detail: { episode, podcast },
    })
  );
}

function dispatchCloseEvent() {
  window.dispatchEvent(
    new CustomEvent(MFEvents.PODCAST_CLOSE_PLAYER)
  );
}

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('GlobalAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing initially', () => {
    const { container } = renderWithProviders(
      <GlobalAudioPlayer />
    );
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('renders player when PODCAST_PLAY_EPISODE event is received', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    const titles = screen.getAllByText('Test Episode Title');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('hides player when PODCAST_CLOSE_PLAYER event is received', () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();

    act(() => {
      dispatchCloseEvent();
    });

    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('calls onPlayerStateChange with true when episode plays', () => {
    const onStateChange = vi.fn();
    renderWithProviders(<GlobalAudioPlayer onPlayerStateChange={onStateChange} />);

    act(() => {
      dispatchPlayEvent();
    });

    expect(onStateChange).toHaveBeenCalledWith(true);
  });

  it('calls onPlayerStateChange with false when player closes', () => {
    const onStateChange = vi.fn();
    renderWithProviders(<GlobalAudioPlayer onPlayerStateChange={onStateChange} />);

    act(() => {
      dispatchPlayEvent();
    });

    act(() => {
      dispatchCloseEvent();
    });

    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it('renders close button and hides player when clicked', () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    const closeButtons = screen.getAllByLabelText('Close player');
    expect(closeButtons.length).toBeGreaterThanOrEqual(1);

    fireEvent.click(closeButtons[0]);

    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('closes player on Escape key', () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('renders seek bar with slider role', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    const slider = screen.getByRole('slider', { name: 'Seek position' });
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow');
    expect(slider).toHaveAttribute('aria-valuemin', '0');
    expect(slider).toHaveAttribute('aria-valuemax');
  });

  it('displays podcast title when provided', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });

  it('persists player state across re-renders', () => {
    const { rerender } = renderWithProviders(<GlobalAudioPlayer />);

    act(() => {
      dispatchPlayEvent();
    });

    // Re-render to simulate a state change elsewhere
    rerender(
      <MemoryRouter>
        <GlobalAudioPlayer />
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    const titles = screen.getAllByText('Test Episode Title');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });
});
