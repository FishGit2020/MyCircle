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

async function dispatchPlayEvent(episode = mockEpisode, podcast = mockPodcast) {
  await act(async () => {
    window.dispatchEvent(
      new CustomEvent(MFEvents.PODCAST_PLAY_EPISODE, {
        detail: { episode, podcast },
      })
    );
    // Flush the play() promise
    await Promise.resolve();
  });
}

async function dispatchCloseEvent() {
  await act(async () => {
    window.dispatchEvent(new CustomEvent(MFEvents.AUDIO_CLOSE));
  });
}

async function dispatchAudioPlay(detail: any) {
  await act(async () => {
    window.dispatchEvent(new CustomEvent(MFEvents.AUDIO_PLAY, { detail }));
    await Promise.resolve();
  });
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

  it('renders player on PODCAST_PLAY_EPISODE and hides on AUDIO_CLOSE', async () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    expect(container.querySelector('[role="region"]')).toBeNull();

    await dispatchPlayEvent();
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();

    await dispatchCloseEvent();
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('calls onPlayerStateChange on play and close', async () => {
    const onStateChange = vi.fn();
    renderWithProviders(<GlobalAudioPlayer onPlayerStateChange={onStateChange} />);

    await dispatchPlayEvent();
    expect(onStateChange).toHaveBeenCalledWith(true);

    await dispatchCloseEvent();
    expect(onStateChange).toHaveBeenLastCalledWith(false);
  });

  it('closes player on close button click and Escape key', async () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();
    const closeButtons = screen.getAllByLabelText('Close player');
    fireEvent.click(closeButtons[0]);
    expect(container.querySelector('[role="region"]')).toBeNull();

    await dispatchPlayEvent();
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(container.querySelector('[role="region"]')).toBeNull();
  });

  it('persists player state across re-renders', async () => {
    const { rerender } = renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

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

  it('displays podcast title when provided', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();
    expect(screen.getByText('Test Podcast')).toBeInTheDocument();
  });

  it('positions player above bottom nav with safe-area padding and z-50', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

    const region = screen.getByRole('region', { name: 'Now Playing' });
    expect(region.className).toContain('bottom-[calc(3.5rem+env(safe-area-inset-bottom,0px))]');
    expect(region.className).toContain('md:bottom-0');
    expect(region.className).toContain('z-50');
  });

  it('persists now-playing state to localStorage on play', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

    expect(setItemSpy).toHaveBeenCalledWith(
      StorageKeys.PODCAST_NOW_PLAYING,
      expect.stringContaining('Test Episode Title')
    );
  });

  it('clears now-playing state from localStorage on close', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();
    const closeButtons = screen.getAllByLabelText('Close player');
    fireEvent.click(closeButtons[0]);

    expect(removeItemSpy).toHaveBeenCalledWith(StorageKeys.PODCAST_NOW_PLAYING);
  });

  it('clears now-playing state on AUDIO_CLOSE event', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();
    await dispatchCloseEvent();

    expect(removeItemSpy).toHaveBeenCalledWith(StorageKeys.PODCAST_NOW_PLAYING);
  });

  it('saves last-played data to localStorage on play', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

    expect(setItemSpy).toHaveBeenCalledWith(
      StorageKeys.PODCAST_LAST_PLAYED,
      expect.stringContaining('Test Episode Title')
    );
  });

  it('renders "View podcast" buttons for info area navigation', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

    const viewButtons = screen.getAllByLabelText('View podcast');
    expect(viewButtons.length).toBe(2);
  });

  it('hides visual bar on matching podcast route (only hidden audio remains)', async () => {
    const { container } = renderWithProviders(
      <GlobalAudioPlayer />,
      { initialEntries: [`/podcasts/${mockPodcast.id}`] },
    );

    await dispatchPlayEvent();

    expect(container.querySelector('[role="region"]')).toBeNull();
    expect(container.querySelector('audio')).toBeInTheDocument();
  });

  it('shows visual bar on non-matching podcast route', async () => {
    renderWithProviders(
      <GlobalAudioPlayer />,
      { initialEntries: ['/podcasts/999'] },
    );

    await dispatchPlayEvent();
    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
  });

  it('calls onPlayerVisibilityChange correctly based on route', async () => {
    const onVisibilityChange = vi.fn();

    renderWithProviders(
      <GlobalAudioPlayer onPlayerVisibilityChange={onVisibilityChange} />,
      { initialEntries: ['/'] },
    );

    await dispatchPlayEvent();
    expect(onVisibilityChange).toHaveBeenCalledWith(true);
  });

  it('calls onPlayerVisibilityChange(false) when on matching route', async () => {
    const onVisibilityChange = vi.fn();

    renderWithProviders(
      <GlobalAudioPlayer onPlayerVisibilityChange={onVisibilityChange} />,
      { initialEntries: [`/podcasts/${mockPodcast.id}`] },
    );

    await dispatchPlayEvent();
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('renders player on generic AUDIO_PLAY event (book source)', async () => {
    const { container } = renderWithProviders(<GlobalAudioPlayer />);

    await dispatchAudioPlay({
      type: 'book',
      track: { id: 'book1-0', url: 'https://example.com/ch1.mp3', title: 'Chapter 1' },
      collection: { id: 'book1', title: 'Test Book', artwork: '', tracks: [
        { id: 'book1-0', url: 'https://example.com/ch1.mp3', title: 'Chapter 1' },
        { id: 'book1-1', url: 'https://example.com/ch2.mp3', title: 'Chapter 2' },
      ]},
      trackIndex: 0,
      navigateTo: '/library',
      progressKey: StorageKeys.BOOK_AUDIO_PROGRESS,
      nowPlayingKey: StorageKeys.BOOK_NOW_PLAYING,
      lastPlayedKey: StorageKeys.BOOK_LAST_PLAYED,
      lastPlayedEvent: 'book-last-played-changed',
      canQueue: false,
      canShare: false,
      skipSeconds: 10,
    });

    expect(screen.getByRole('region', { name: 'Now Playing' })).toBeInTheDocument();
    expect(screen.getAllByText('Chapter 1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Test Book/).length).toBeGreaterThanOrEqual(1);

    expect(container.querySelector('[aria-label="Queue"]')).toBeNull();
    expect(container.querySelector('[aria-label="Share episode"]')).toBeNull();
  });

  it('responds to generic AUDIO_TOGGLE_PLAY command', async () => {
    renderWithProviders(<GlobalAudioPlayer />);

    await dispatchPlayEvent();

    act(() => {
      window.dispatchEvent(new CustomEvent(MFEvents.AUDIO_TOGGLE_PLAY));
    });

    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
  });
});
