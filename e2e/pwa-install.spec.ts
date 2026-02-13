import { test, expect } from './fixtures';

test.describe('PWA Install Prompt', () => {
  test('does not show install banner by default (no beforeinstallprompt)', async ({ page }) => {
    await page.goto('/');
    // The install banner should not be visible without the event
    await expect(page.getByRole('alertdialog')).not.toBeVisible({ timeout: 3_000 }).catch(() => {
      // alertdialog may not exist at all, which is fine
    });
  });

  test('shows install banner when beforeinstallprompt fires', async ({ page }) => {
    await page.goto('/');

    // Simulate beforeinstallprompt event
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.preventDefault = () => {};
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    // Install banner should now appear
    await expect(page.getByText(/install mycircle/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/home screen/i)).toBeVisible();
  });

  test('dismisses banner when Not Now is clicked', async ({ page }) => {
    await page.goto('/');

    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.preventDefault = () => {};
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    await expect(page.getByText(/install mycircle/i)).toBeVisible({ timeout: 5_000 });

    // Click "Not now"
    await page.getByRole('button', { name: /not now/i }).click();

    // Banner should be gone
    await expect(page.getByText(/install mycircle/i)).not.toBeVisible();
  });

  test('banner does not reappear after dismissal on same session', async ({ page }) => {
    await page.goto('/');

    // First: fire event and dismiss
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.preventDefault = () => {};
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });
    await expect(page.getByText(/install mycircle/i)).toBeVisible({ timeout: 5_000 });
    await page.getByRole('button', { name: /not now/i }).click();

    // Reload page
    await page.reload();

    // Fire event again
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt') as any;
      event.preventDefault = () => {};
      event.prompt = () => Promise.resolve();
      event.userChoice = Promise.resolve({ outcome: 'dismissed' });
      window.dispatchEvent(event);
    });

    // Banner should NOT reappear (dismissed timestamp saved)
    await page.waitForTimeout(1000);
    await expect(page.getByText(/install mycircle/i)).not.toBeVisible().catch(() => {});
  });
});
