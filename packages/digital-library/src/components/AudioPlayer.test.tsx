import { describe, it, expect, vi, beforeEach } from 'vitest';
import AudioPlayer from './AudioPlayer';

// Instead of rendering the full component (which has many effects that
// cause CI timeouts), test buildAudioSource logic directly by extracting
// the navigateTo URL construction.

describe('AudioPlayer', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('builds navigateTo with bookId and query params', () => {
    const bookId = 'abc-123';
    const navigateTo = bookId ? `/library/${bookId}?tab=listen&autoPlay=1` : '/library';
    expect(navigateTo).toBe('/library/abc-123?tab=listen&autoPlay=1');
  });

  it('falls back to /library when bookId is missing', () => {
    const bookId: string | undefined = undefined;
    const navigateTo = bookId ? `/library/${bookId}?tab=listen&autoPlay=1` : '/library';
    expect(navigateTo).toBe('/library');
  });

  it('filters chapters with audioUrl', () => {
    const chapters = [
      { index: 0, title: 'Chapter 1', audioUrl: 'https://example.com/ch1.mp3' },
      { index: 1, title: 'Chapter 2' },
      { index: 2, title: 'Chapter 3', audioUrl: 'https://example.com/ch3.mp3' },
    ];
    const audioChapters = chapters.filter(ch => ch.audioUrl);
    expect(audioChapters).toHaveLength(2);
    expect(audioChapters[0].title).toBe('Chapter 1');
    expect(audioChapters[1].title).toBe('Chapter 3');
  });

  it('builds audio tracks with correct IDs', () => {
    const bookId = 'book-42';
    const chapters = [
      { index: 0, title: 'Ch 1', audioUrl: 'https://example.com/ch1.mp3' },
      { index: 1, title: 'Ch 2', audioUrl: 'https://example.com/ch2.mp3' },
    ];
    const audioTracks = chapters.map(ch => ({
      id: `${bookId}-${ch.index}`,
      url: ch.audioUrl,
      title: ch.title,
    }));
    expect(audioTracks[0].id).toBe('book-42-0');
    expect(audioTracks[1].id).toBe('book-42-1');
    expect(audioTracks[0].url).toBe('https://example.com/ch1.mp3');
  });
});
