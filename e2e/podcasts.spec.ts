import { test, expect } from './fixtures';

test.describe('Podcast Player', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/podcasts');
  });

  test('renders podcast page with title', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /podcasts/i })).toBeVisible({ timeout: 15_000 });
  });

  test('has a podcast search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search podcasts/i)).toBeVisible({ timeout: 15_000 });
  });

  test('shows discover and subscribed tabs', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /podcasts/i })).toBeVisible({ timeout: 15_000 });

    // Tab bar should have Trending (discover) and My Subscriptions tabs
    await expect(page.getByRole('button', { name: 'Trending', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /My Subscriptions/i })).toBeVisible();
  });

  test('shows trending section with podcast cards', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 2, name: 'Trending' })).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Host 1').first()).toBeVisible();
  });

  test('shows multiple trending podcasts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Trending Show 2', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trending Show 3', exact: true })).toBeVisible();
  });

  test('trending cards have subscribe buttons', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible({ timeout: 15_000 });

    const subscribeButtons = page.getByRole('button', { name: /^Subscribe /i });
    await expect(subscribeButtons.first()).toBeVisible();
  });

  test('typing in search shows podcast results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search podcasts/i);
    await expect(searchInput).toBeVisible({ timeout: 15_000 });
    await searchInput.fill('Tech');

    await expect(page.getByText('Tech Talk Daily').first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a trending podcast shows episodes', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByRole('heading', { name: /episodes/i })).toBeVisible({ timeout: 10_000 });
  });

  test('podcast detail shows episode list', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByText(/Episode 1: Great Content/)).toBeVisible({ timeout: 10_000 });
  });

  test('can navigate back from podcast detail', async ({ page }) => {
    const firstCard = page.getByRole('button', { name: /^Trending Show 1 /i });
    await expect(firstCard).toBeVisible({ timeout: 15_000 });
    await firstCard.click();

    await expect(page.getByRole('heading', { name: /episodes/i })).toBeVisible({ timeout: 10_000 });

    // Click breadcrumb link to navigate back
    await page.getByRole('link', { name: /podcasts/i }).click();

    await expect(page.getByRole('heading', { level: 2, name: 'Trending' })).toBeVisible({ timeout: 10_000 });
  });

  test('switching to subscribed tab shows empty state', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: /podcasts/i })).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: /My Subscriptions/i }).click();

    await expect(page.getByText(/No subscriptions yet/i)).toBeVisible({ timeout: 5_000 });
  });

  test('subscribe to podcast then check subscribed tab', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Trending Show 1', exact: true })).toBeVisible({ timeout: 15_000 });

    // Click subscribe on first podcast
    const subscribeButtons = page.getByRole('button', { name: /^Subscribe /i });
    await subscribeButtons.first().click();

    // Switch to subscribed tab — should show a badge count
    const subscribedTab = page.getByRole('button', { name: /My Subscriptions/i });
    await subscribedTab.click();

    // Should no longer show empty state
    await expect(page.getByText(/No subscriptions yet/i)).not.toBeVisible({ timeout: 5_000 });
  });
});
