import { test as base, Page, expect } from '@playwright/test';

/**
 * Smoke-test fixtures for the live production site.
 *
 * Unlike the main e2e fixtures, these do NOT mock API responses.
 * Requests flow to the real Firebase backend. We only dismiss
 * onboarding and provide helpers for Firebase email/password auth.
 */

/** Set localStorage flag so the onboarding modal doesn't appear. */
async function dismissOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('mycircle-onboarding-complete', 'true');
  });
}

/**
 * Inject an App Check debug token so headless Chromium can pass
 * reCAPTCHA Enterprise verification on the live site.
 * The token must be registered in Firebase Console → App Check → Debug tokens.
 */
async function injectAppCheckDebugToken(page: Page) {
  const token = process.env.E2E_APPCHECK_DEBUG_TOKEN;
  if (!token) return;
  await page.addInitScript((t) => {
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = t;
  }, token);
}

/**
 * Sign in via the UI using Firebase email/password auth.
 * Clicks the header "Sign In" button, fills the auth dialog, and
 * waits for the user avatar to confirm successful authentication.
 */
export async function signInViaUI(page: Page, email: string, password: string) {
  // Click the Sign In button in the header
  await page.getByRole('button', { name: /sign in/i }).click();

  // Wait for auth dialog
  const dialog = page.getByRole('dialog');
  await dialog.waitFor({ state: 'visible' });

  // Fill credentials
  await dialog.locator('#auth-email').fill(email);
  await dialog.locator('#auth-password').fill(password);

  // Submit — click the form's Sign In button (not the tab selector)
  await dialog.locator('form').getByRole('button', { name: /sign in/i }).click();

  // Wait for user avatar to appear (confirms auth succeeded)
  await page.getByRole('button', { name: /user menu/i }).waitFor({
    state: 'visible',
    timeout: 15_000,
  });
}

/**
 * Sign out via the UI.
 * Opens the user menu and clicks Sign Out.
 */
export async function signOutViaUI(page: Page) {
  await page.getByRole('button', { name: /user menu/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();

  // Wait for Sign In button to reappear (confirms sign-out)
  await page.getByRole('button', { name: /sign in/i }).waitFor({
    state: 'visible',
    timeout: 10_000,
  });
}

/** Extended test fixture that auto-dismisses onboarding. */
export const test = base.extend<{ smokeSetup: void }>({
  smokeSetup: [async ({ page }, use) => {
    await dismissOnboarding(page);
    await injectAppCheckDebugToken(page);
    await use();
  }, { auto: true }],
});

export { expect };
