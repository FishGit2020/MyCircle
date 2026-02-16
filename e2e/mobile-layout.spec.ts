import { test, expect } from './fixtures';

test.describe('Mobile layout', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone X dimensions

  test('header does not overflow viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    // Header should not extend beyond viewport width
    expect(headerBox!.x).toBeGreaterThanOrEqual(0);
    expect(headerBox!.x + headerBox!.width).toBeLessThanOrEqual(375 + 1); // 1px tolerance
  });

  test('bottom nav does not overflow viewport width', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav[aria-label="Bottom navigation"]');
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    expect(navBox!.x).toBeGreaterThanOrEqual(0);
    expect(navBox!.x + navBox!.width).toBeLessThanOrEqual(375 + 1);
  });

  test('page has no horizontal scrollbar', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalScroll).toBe(false);
  });

  test('header is fully visible without scrolling', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const header = page.locator('header');
    await expect(header).toBeVisible();
    const headerBox = await header.boundingBox();
    expect(headerBox).not.toBeNull();
    // Header top should be at or near 0 (visible)
    expect(headerBox!.y).toBeGreaterThanOrEqual(0);
  });

  test('bottom nav is visible at bottom of viewport', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav[aria-label="Bottom navigation"]');
    await expect(nav).toBeVisible();
    const navBox = await nav.boundingBox();
    expect(navBox).not.toBeNull();
    // Bottom nav should be within viewport
    expect(navBox!.y + navBox!.height).toBeLessThanOrEqual(812 + 1);
  });
});
