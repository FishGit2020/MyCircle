import { test, expect } from './fixtures';

const mockSongWithBpm = {
  id: 'song-1',
  title: 'Amazing Grace',
  artist: 'John Newton',
  originalKey: 'G',
  format: 'chordpro',
  content: '[G]Amazing [C]grace, how [G]sweet the sound',
  notes: '',
  bpm: 95,
  tags: ['hymn'],
  createdAt: { seconds: 1700000000, nanoseconds: 0 },
  updatedAt: { seconds: 1700000000, nanoseconds: 0 },
};

const mockSongWithoutBpm = {
  ...mockSongWithBpm,
  id: 'song-2',
  title: 'How Great Thou Art',
  bpm: undefined,
};

function setupWorshipMocks(page: import('@playwright/test').Page, songs = [mockSongWithBpm, mockSongWithoutBpm]) {
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

test.describe('Metronome', () => {
  test('shows metronome in song viewer with song BPM', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('Amazing Grace').click();

    const metronome = page.getByRole('group', { name: /metronome/i });
    await expect(metronome).toBeVisible();

    // BPM should match song metadata
    const bpmInput = page.getByRole('spinbutton', { name: /bpm/i });
    await expect(bpmInput).toHaveValue('95');
  });

  test('defaults to 120 BPM when song has no BPM', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('How Great Thou Art').click();

    const bpmInput = page.getByRole('spinbutton', { name: /bpm/i });
    await expect(bpmInput).toHaveValue('120');
  });

  test('BPM input is present in song editor', async ({ page }) => {
    await setupWorshipMocks(page);
    await page.goto('/worship');
    await page.getByText('Amazing Grace').click();
    await page.getByText(/edit/i).click();

    const bpmInput = page.locator('#song-bpm');
    await expect(bpmInput).toBeVisible();
    await expect(bpmInput).toHaveValue('95');
  });
});
