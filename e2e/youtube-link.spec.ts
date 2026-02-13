import { test, expect } from './fixtures';

const mockSongWithYoutube = {
  id: 'song-1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace, how [G]sweet the sound',
  notes: 'Play softly in intro',
  youtubeUrl: 'https://youtube.com/watch?v=abc123',
  tags: ['hymn', 'classic'],
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
};

const mockSongWithoutYoutube = {
  ...mockSongWithYoutube,
  id: 'song-2',
  title: 'How Great Thou Art',
  youtubeUrl: undefined,
};

function setupWorshipMocks(page: import('@playwright/test').Page, songs = [mockSongWithYoutube, mockSongWithoutYoutube]) {
  return page.addInitScript((data) => {
    (window as any).__worshipSongs = {
      getSongs: () => Promise.resolve(data),
      getSong: (id: string) => Promise.resolve(data.find((s: any) => s.id === id) ?? null),
      addSong: () => Promise.resolve('new-id'),
      updateSong: () => Promise.resolve(),
      deleteSong: () => Promise.resolve(),
      isAuthenticated: () => true,
    };
  }, songs);
}

test.describe('YouTube Link Integration', () => {
  test('shows YouTube button in song viewer when song has a URL', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('Amazing Grace').click();
    const youtubeLink = page.getByRole('link', { name: /youtube/i });
    await expect(youtubeLink).toBeVisible();
    await expect(youtubeLink).toHaveAttribute('href', 'https://youtube.com/watch?v=abc123');
    await expect(youtubeLink).toHaveAttribute('target', '_blank');
  });

  test('hides YouTube button when song has no URL', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('How Great Thou Art').click();
    await expect(page.getByRole('link', { name: /youtube/i })).not.toBeVisible();
  });

  test('YouTube URL input is present in song editor', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('Amazing Grace').click();
    // Click edit button
    await page.getByText(/edit/i).click();
    const youtubeInput = page.locator('#song-youtube');
    await expect(youtubeInput).toBeVisible();
    await expect(youtubeInput).toHaveValue('https://youtube.com/watch?v=abc123');
  });
});
