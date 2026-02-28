import { test, expect } from './fixtures';

/**
 * Post-deploy unauthenticated smoke tests.
 *
 * Verifies that auth-gated routes show sign-in prompts and
 * public routes load correctly — without signing in.
 */
test.describe('Unauthenticated routes', () => {
  test('/ loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/MyCircle/i);
  });

  test('/notebook shows sign-in prompt', async ({ page }) => {
    await page.goto('/notebook', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).toContain('sign in');
  });

  test('/files shows sign-in prompt', async ({ page }) => {
    await page.goto('/files', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.toLowerCase()).toContain('sign in');
  });

  test('/podcasts loads without auth', async ({ page }) => {
    await page.goto('/podcasts', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3_000);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText.length).toBeGreaterThan(50);
  });
});
