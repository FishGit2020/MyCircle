import { test, expect, signInViaUI } from './fixtures';

/**
 * Post-deploy authenticated smoke tests.
 *
 * Signs in once with a dedicated test account, then navigates every
 * MFE route to verify none are broken on the live site. Uses serial
 * mode so all tests share a single browser context (one sign-in).
 */
test.describe('Authenticated MFE routes', () => {
  test.describe.configure({ mode: 'serial' });

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  test.beforeAll(() => {
    if (!email || !password) {
      throw new Error(
        'Missing E2E_TEST_EMAIL or E2E_TEST_PASSWORD environment variables. ' +
        'Set them before running smoke tests.'
      );
    }
  });

  test('sign in', async ({ page }) => {
    await page.goto('/');
    await signInViaUI(page, email!, password!);
  });

  const routes = [
    '/notebook',
    '/podcasts',
    '/weather',
    '/stocks',
    '/bible',
    '/worship',
    '/flashcards',
    '/work-tracker',
    '/files',
    '/baby',
    '/child-dev',
    '/ai',
  ];

  for (const route of routes) {
    test(`${route} loads without error`, async ({ page }) => {
      await page.goto(route, { waitUntil: 'domcontentloaded' });

      // Give lazy MFE chunks time to load over the network
      await page.waitForTimeout(3_000);

      const bodyText = await page.locator('body').innerText();

      // Should NOT show the ErrorBoundary loading fallback
      expect(bodyText).not.toContain('module is loading...');

      // Should NOT show the ErrorBoundary crash fallback
      expect(bodyText).not.toContain('Something went wrong');

      // Should have meaningful content (not a blank page)
      expect(bodyText.length).toBeGreaterThan(50);
    });
  }

  // No sign-out test needed — each test() gets a fresh page, and the
  // browser context is destroyed after the suite. The test account has
  // no side effects that require cleanup.
});
