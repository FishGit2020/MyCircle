import { test, expect } from './fixtures';

test.describe('Cloud Files (Emulator)', () => {
  test('cloud files page loads', async ({ page }) => {
    await page.goto('/files');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});
