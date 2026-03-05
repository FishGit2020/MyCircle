import { test, expect } from './fixtures';

test.describe('Widget Dashboard', () => {
  test('widget dashboard is hidden when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Widgets are auth-gated — should NOT be visible for unauthenticated users
    const section = page.getByRole('region', { name: /widgets|my widgets/i });
    await expect(section).not.toBeVisible();
  });
});
