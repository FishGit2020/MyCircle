import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import GlobalAudioPlayer from './GlobalAudioPlayer';
import { MFEvents, StorageKeys } from '@mycircle/shared';

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

const renderWithProviders = (ui: React.ReactElement, { initialEntries = ['/'] } = {}) => {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="*" element={ui} />
      </Routes>
    </MemoryRouter>
  );
};

const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');

describe('GlobalAudioPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders player on PODCAST_PLAY_EPISODE and hides on PODCAST_CLOSE_PLAYER', () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    // Initially empty
    expect(container.querySelector('[role="region"]')).toBeNull();

    act(() => { dispatchPlayEvent(); });
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();

    act(() => { dispatchCloseEvent(); });
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('calls onPlayerStateChange on play and close', () => {
    const onStateChange = vi.fn();
    renderWithProviders(<GlobalAudioPlayer onPlayerStateChange={onStateChange} />);

    act(() => { dispatchPlayEvent(); });
    expect(onStateChange).toHaveBeenCalledWith(true);

    act(() => { dispatchCloseEvent(); });
    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it('closes player on close button click and Escape key', () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    // Test close button
    act(() => { dispatchPlayEvent(); });
    const closeButtons = screen.getAllByLabelText('Close player');
    fireEvent.click(closeButtons[0]);
    expect(container.querySelector('[role="region"]')).toBeNull();

    // Test Escape key
    act(() => { dispatchPlayEvent(); });
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('persists player state across re-renders', () => {
    const { rerender } = renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    rerender(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<GlobalAudioPlayer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    const titles = screen.getAllByText('Test Episode Title');
    expect(titles.length).toBeGreaterThanOrEqual(1);
  });

  it('displays podcast title when provided', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });

  it('positions player above bottom nav with safe-area padding and z-50', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    const region = screen.getByRole('region', { name: 'Now Playing' });
    expect(region.className).toContain('bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))]');
    expect(region.className).toContain('md:bottom-0');
    expect(region.className).toContain('z-50');
  });

  it('persists now-playing state to localStorage on play', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    expect(setItemSpy).toHaveBeenCalledWith(
      StorageKeys.PODCAST_NOW_PLAYING,
      expect.stringContaining('Test Episode Title')
    );
  });

  it('clears now-playing state from localStorage on close', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });
    // Close via button
    const closeButtons = screen.getAllByLabelText('Close player');
    fireEvent.click(closeButtons[0]);

    expect(removeItemSpy).toHaveBeenCalledWith(StorageKeys.PODCAST_NOW_PLAYING);
  });

  it('clears now-playing state on PODCAST_CLOSE_PLAYER event', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });
    act(() => { dispatchCloseEvent(); });

    expect(removeItemSpy).toHaveBeenCalledWith(StorageKeys.PODCAST_NOW_PLAYING);
  });

  it('saves last-played data to localStorage on play', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    expect(setItemSpy).toHaveBeenCalledWith(
      StorageKeys.PODCAST_LAST_PLAYED,
      expect.stringContaining('Test Episode Title')
    );
  });

  it('renders "View podcast" buttons for info area navigation', () => {
    renderWithProviders(<GlobalAudioPlayer />);

    act(() => { dispatchPlayEvent(); });

    // Desktop + mobile each get a "View podcast" button
    const viewButtons = screen.getAllByLabelText('View podcast');
    expect(viewButtons.length).toBe(2);
  });

  it('hides visual bar on matching podcast route (only hidden audio remains)', () => {
    const { container } = renderWithProviders(
      <GlobalAudioPlayer />,
      { initialEntries: [`/podcasts/${mockPodcast.id}`] },
    );

    act(() => { dispatchPlayEvent(); });

    // No visible region — player bar is hidden
    expect(container.querySelector('[role="region"]')).toBeNull();
    // But audio element is still in the DOM
    expect(container.querySelector('audio')).toBeInTheDocument();
  });

  it('shows visual bar on non-matching podcast route', () => {
    renderWithProviders(
      <GlobalAudioPlayer />,
      { initialEntries: ['/podcasts/999'] },
    );

    act(() => { dispatchPlayEvent(); });

    // Player bar should be visible since podcast ID 999 != 100
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
  });

  it('calls onPlayerVisibilityChange correctly based on route', () => {
    const onVisibilityChange = vi.fn();

    // On a non-matching route → player visible
    renderWithProviders(
      <GlobalAudioPlayer onPlayerVisibilityChange={onVisibilityChange} />,
      { initialEntries: ['/'] },
    );

    act(() => { dispatchPlayEvent(); });

    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('calls onPlayerVisibilityChange(false) when on matching route', () => {
    const onVisibilityChange = vi.fn();

    renderWithProviders(
      <GlobalAudioPlayer onPlayerVisibilityChange={onVisibilityChange} />,
      { initialEntries: [`/podcasts/${mockPodcast.id}`] },
    );

    act(() => { dispatchPlayEvent(); });

    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });
});
