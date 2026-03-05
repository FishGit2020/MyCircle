import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import AudioPlayer from './AudioPlayer';

// Capture the AudioSource passed to the global player
let capturedSource: any = null;

vi.mock('@mycircle/shared', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
  StorageKeys: { BOOK_AUDIO_PROGRESS: 'bp', BOOK_NOW_PLAYING: 'bnp', BOOK_LAST_PLAYED: 'blp' },
  WindowEvents: { BOOK_LAST_PLAYED_CHANGED: 'blpc' },
  MFEvents: { AUDIO_PLAY: 'mf:audio-play', AUDIO_TOGGLE_PLAY: 'mf:audio-toggle-play' },
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
  it('builds navigateTo with bookId and query params', () => {
    render(
      <AudioPlayer
        chapters={chapters}
        bookTitle="Test Book"
        bookId="abc-123"
        coverUrl="https://example.com/cover.jpg"
      />,
    );

    // Click play to trigger buildAudioSource
    const playButton = screen.getByRole('button', { name: /library\.play/i });
    playButton.click();

    expect(capturedSource).toBeTruthy();
    expect(capturedSource.navigateTo).toBe('/library/abc-123?tab=listen&autoPlay=1');
  });

  it('falls back to /library when bookId is missing', () => {
    capturedSource = null;
    render(
      <AudioPlayer
        chapters={chapters}
        bookTitle="No ID Book"
      />,
    );

    const playButton = screen.getByRole('button', { name: /library\.play/i });
    playButton.click();

    expect(capturedSource).toBeTruthy();
    expect(capturedSource.navigateTo).toBe('/library');
  });
});
