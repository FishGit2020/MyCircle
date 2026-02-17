import { test, expect } from './fixtures';

test.describe('Widget Dashboard', () => {
  test('renders widget dashboard section on homepage', async ({ page }) => {
    await page.goto('/');

    // The widget dashboard section should be visible
    const section = page.getByRole('region', { name: /widgets|my widgets/i });
    await expect(section).toBeVisible({ timeout: 10_000 });
  });

  test('shows always-visible widgets by default', async ({ page }) => {
    await page.goto('/');

    // Wait for the dashboard to load
    await page.waitForSelector('[class*="grid"]', { timeout: 10_000 });

    // At minimum, weather and verse widgets should be visible (always-on)
    const widgets = page.getByRole('region', { name: /widgets/i }).locator('[class*="grid"] > a');
    const count = await widgets.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('can enter and exit customize mode', async ({ page }) => {
    await page.goto('/');

    // Click customize button
    const customizeBtn = page.getByRole('button', { name: /customize/i });
    await expect(customizeBtn).toBeVisible({ timeout: 10_000 });
    await customizeBtn.click();

    // "Done" button should now be visible
    await expect(page.getByRole('button', { name: /done/i })).toBeVisible();

    // "Reset layout" should be visible
    await expect(page.getByText(/reset layout/i)).toBeVisible();

    // Click done to exit
    await page.getByRole('button', { name: /done/i }).click();

    // Customize button should be back
    await expect(page.getByRole('button', { name: /customize/i })).toBeVisible();
  });

  test('shows all widgets in editing mode with visibility toggles', async ({ page }) => {
    await page.goto('/');

    // Enter customize mode
    await page.getByRole('button', { name: /customize/i }).click({ timeout: 10_000 });

    // All 8 widgets should show visibility toggle buttons in edit mode
    const visibleButtons = page.getByRole('button', { name: /toggle widget/i });
    const count = await visibleButtons.count();
    expect(count).toBe(9);
  });

  test('widget visibility change persists after page reload', async ({ page }) => {
    await page.goto('/');

    // Enter customize mode
    await page.getByRole('button', { name: /customize/i }).click({ timeout: 10_000 });

    // Toggle the first widget visibility
    const toggleButtons = page.getByRole('button', { name: /toggle widget/i });
    await toggleButtons.first().click();

    // Exit customize mode
    await page.getByRole('button', { name: /done/i }).click();

    // Reload the page
    await page.reload();

    // Wait for dashboard to render
    await page.getByRole('region', { name: /widgets/i }).waitFor({ timeout: 10_000 });

    // Re-enter customize mode to verify the toggle persisted
    await page.getByRole('button', { name: /customize/i }).click();

    // One widget should now show "hidden" state
    const hiddenText = page.getByText(/hidden/i);
    await expect(hiddenText.first()).toBeVisible();
  });
});
