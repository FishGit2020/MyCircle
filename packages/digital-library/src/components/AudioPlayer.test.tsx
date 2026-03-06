import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

// Capture the AudioSource passed to the global player
let capturedSource: any = null;

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BOOK_AUDIO_PROGRESS: 'bp', BOOK_NOW_PLAYING: 'bnp', BOOK_LAST_PLAYED: 'blp' },
  WindowEvents: { BOOK_LAST_PLAYED_CHANGED: 'blpc' },
  MFEvents: {
    AUDIO_PLAY: 'mf:audio-play',
    AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play',
    AUDIO_PLAYBACK_STATE: 'mf:audio-playback-state',
    AUDIO_SEEK: 'mf:audio-seek',
    AUDIO_CHANGE_SPEED: 'mf:audio-change-speed',
    AUDIO_SET_SLEEP_TIMER: 'mf:audio-set-sleep-timer',
  },
  eventBus: {
    publish: vi.fn((_event: string, source?: any) => {
      if (source?.navigateTo) capturedSource = source;
    }),
    subscribe: vi.fn(() => () => {}),
  },
  subscribeToMFEvent: vi.fn(() => () => {}),
}));

const chapters = [
  { index: 0, title: 'Chapter 1', audioUrl: 'https://example.com/ch1.mp3', audioDuration: 120 },
  { index: 1, title: 'Chapter 2', audioUrl: 'https://example.com/ch2.mp3', audioDuration: 180 },
];

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    capturedSource = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds navigateTo with bookId and query params', () => {
    act(() => {
      render(
        <AudioPlayer
          chapters={chapters}
          bookTitle="Test Book"
          bookId="abc-123"
          coverUrl="https://example.com/cover.jpg"
        />,
      );
    });

    // Flush any pending timers (e.g. auto-play setTimeout)
    act(() => { vi.runAllTimers(); });

    fireEvent.click(screen.getByRole('button', { name: 'library.play' }));

    expect(capturedSource).toBeTruthy();
    expect(capturedSource.navigateTo).toBe('/library/abc-123?tab=listen&autoPlay=1');
  });

  it('falls back to /library when bookId is missing', () => {
    act(() => {
      render(
        <AudioPlayer
          chapters={chapters}
          bookTitle="No ID Book"
        />,
      );
    });

    act(() => { vi.runAllTimers(); });

    fireEvent.click(screen.getByRole('button', { name: 'library.play' }));

    expect(capturedSource).toBeTruthy();
    expect(capturedSource.navigateTo).toBe('/library');
  });
});
