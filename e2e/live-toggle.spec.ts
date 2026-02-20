import { test, expect } from './fixtures';

test.describe('Live Toggle Visibility', () => {
  test('weather live toggle has visible border styling', async ({ page }) => {
    await page.goto('/weather/51.5074,-0.1278?name=London');

    // Wait for weather data to load
    await expect(page.getByRole('heading', { name: 'London' })).toBeVisible({ timeout: 15_000 });

    // Find the live/paused toggle button
    const toggleButton = page.getByRole('button', { name: /Live|Paused/i });
    await expect(toggleButton).toBeVisible();

    // Verify the button has border styling (not just text)
    const classes = await toggleButton.getAttribute('class');
    expect(classes).toContain('border');
    expect(classes).toContain('rounded-lg');
  });

  test('weather toggle switches between live and paused', async ({ page }) => {
    await page.goto('/weather/51.5074,-0.1278?name=London');

    await expect(page.getByRole('heading', { name: 'London' })).toBeVisible({ timeout: 15_000 });

    const toggleButton = page.getByRole('button', { name: /Paused/i });
    await expect(toggleButton).toBeVisible();

    // Click to enable live mode
    await toggleButton.click();

    // Should show Live text (isLive becomes true once enableRealtime + effectivePollInterval > 0)
    await expect(page.getByRole('button', { name: /Live/i })).toBeVisible({ timeout: 10_000 });
  });
});
